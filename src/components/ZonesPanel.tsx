import { useEffect, useMemo, useRef, useState } from "react";
import type { Metrics } from "../types/metrics";
import type { Zone } from "../types/zone";
import ZonesOverlay from "./ZonesOverlay";
import ZonesEditor from "./ZonesEditor";

type Props = { width: number; height: number };

function ZonesPanel({ width, height }: Props) {
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [editing, setEditing] = useState(false);
  const [draftZones, setDraftZones] = useState<Zone[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // NEW: show coachmark until first point is placed
  const [showCoach, setShowCoach] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch(`${API}/zones`)
      .then((r) => r.json())
      .then((z: Zone[]) => {
        setZones(z);
        setActiveId(z[0]?.id ?? null);
      })
      .catch(() => { setZones([]); setActiveId(null); });

    const ws = new WebSocket(`${API.replace(/^http/, "ws")}/ws`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => { try { setMetrics(JSON.parse(ev.data)); } catch {} };
    return () => ws.close();
  }, [API]);

  async function saveZones(next: Zone[]) {
    const res = await fetch(`${API}/zones`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      const text = await res.text();
      alert(`Failed to save zones (${res.status}).\n${text}`);
      return;
    }
    const saved = await res.json();
    setZones(saved);
    setActiveId(saved[0]?.id ?? null);
  }

  function startEditing() {
    const draft = zones.map((z) => ({
      ...z,
      points: z.points.map((p) => [p[0], p[1]] as [number, number]),
    }));
    setDraftZones(draft);
    setEditing(true);
    if (!activeId && draft.length) setActiveId(draft[0].id);
    setShowCoach(false);
  }

  async function handleSave() {
    const bad = draftZones.filter((z) => z.points.length < 3);
    if (bad.length) {
      alert(`Each zone needs ≥3 points: ${bad.map((z) => z.name || z.id).join(", ")}`);
      return;
    }
    await saveZones(draftZones);
    setEditing(false);
    setShowCoach(false);
  }

  function handleCancel() {
    setEditing(false);
    setShowCoach(false);
  }

  // Always add a zone in *editing* mode so the user can place points right away
  function handleAddZone() {
    const base = `zone-${zones.length + draftZones.length + 1}`;
    const id = prompt("New zone id:", base) || base;
    const name = prompt("New zone name:", id + "-name") || id;

    // build a draft baseline if we weren't editing yet
    let draft = draftZones;
    if (!editing) {
      draft = zones.map((z) => ({
        ...z,
        points: z.points.map((p) => [p[0], p[1]] as [number, number]),
      }));
    }

    if (draft.find((z) => z.id === id)) {
      alert(`Zone id "${id}" already exists`);
      return;
    }

    const next = [...draft, { id, name, points: [] as [number, number][] }];
    setDraftZones(next);
    setEditing(true);
    setActiveId(id);
    setShowCoach(true);       // show banner until first click
  }

  const shownZones = editing ? draftZones : zones;

  // Disable Save until all polygons have >= 3 points
  const saveDisabled = editing && draftZones.some((z) => z.points.length < 3);

  const countsStr = useMemo(() => {
    if (!metrics) return "—";
    const parts = Object.entries(metrics.counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}: ${v}`);
    return parts.length ? parts.join("  •  ") : "none";
  }, [metrics]);

  const dets = metrics?.detections ?? [];

  return (
    <>
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Overlay layer */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
          <ZonesOverlay zones={shownZones} width={width} height={height} />
        </div>

        {/* Editor layer */}
        {editing && (
          <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
            <ZonesEditor
              zones={draftZones}
              setZones={setDraftZones}
              width={width}
              height={height}
              activeId={activeId}
              // Hides the coachmark after the first point is added
              onFirstPoint={() => setShowCoach(false)}
            />
          </div>
        )}

        {/* Coachmark */}
        {editing && showCoach && activeId && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none",
            display: "flex", justifyContent: "center", alignItems: "flex-start"
          }}>
            <div style={{
              marginTop: 16, background: "rgba(255,255,255,0.95)",
              border: "1px solid #ddd", boxShadow: "0 8px 24px rgba(0,0,0,.12)",
              borderRadius: 12, padding: "10px 14px", fontSize: 14
            }}>
              <b>Click on the video</b> to add points for <code>{activeId}</code>.
              Need at least <b>3 points</b>. Press <kbd>Backspace</kbd> to undo.
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            background: "#fff",
            padding: 8,
            border: "1px solid #ddd",
            zIndex: 5,
          }}
        >
          {!editing ? (
            <>
              <button onClick={startEditing} style={{ marginRight: 8 }}>Edit Zones</button>
              <button onClick={handleAddZone}>Add Zone</button>
            </>
          ) : (
            <>
              <button onClick={handleSave} style={{ marginRight: 8 }} disabled={saveDisabled}>
                Save
              </button>
              <button onClick={handleCancel} style={{ marginRight: 8 }}>Cancel</button>
              <button onClick={handleAddZone}>Add Zone</button>
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <label>Active zone:&nbsp;</label>
            <select value={activeId ?? ""} onChange={(e) => setActiveId(e.target.value || null)}>
              <option value="">(none)</option>
              {shownZones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status panel (unchanged) */}
      <div style={{ marginTop: 12 }}>
        <div>Status: <b>{connected ? "WebSocket ✅" : "Disconnected ❌"}</b></div>
        <div>FPS: <b>{metrics?.fps ?? "—"}</b></div>
        <div>Image: <b>{metrics?.img_shape?.join("×") ?? "—"}</b></div>
        <div>Counts: {countsStr}</div>
        <div style={{ marginTop: 8 }}>
          <div>Detections (first 5)</div>
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {dets.slice(0, 5).map((d) => (
              <li key={`${d.tracking_id}-${d.xyxy.join(",")}`}>
                #{d.tracking_id ?? "—"} {d.cls} {(d.conf * 100).toFixed(0)}% {d.zone ? `· ${d.zone}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default ZonesPanel;
