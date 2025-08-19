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
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch(`${API}/zones`)
      .then((r) => r.json())
      .then((z: Zone[]) => {
        setZones(z);
        setActiveId((z && z[0]?.id) || null);
      })
      .catch(() => {
        setZones([]);
        setActiveId(null);
      });

    const ws = new WebSocket(`${API.replace(/^http/, "ws")}/ws`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try { setMetrics(JSON.parse(ev.data)); } catch {}
    };
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
    // FIX: ensure we have an active zone when editing starts
    if (!activeId && draft.length) setActiveId(draft[0].id);
  }

  async function handleSave() {
    const bad = draftZones.filter((z) => z.points.length < 3);
    if (bad.length) {
      alert(`Each zone needs ≥3 points: ${bad.map((z) => z.name || z.id).join(", ")}`);
      return;
    }
    await saveZones(draftZones);
    setEditing(false);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleAddZone() {
    const base = `zone-${zones.length + draftZones.length + 1}`;
    const id = prompt("New zone id:", base) || base;
    console.log("id = " + id);
    const name = prompt("New zone name:", id + "-name") || id;
    console.log("name = " + name);
    const target = editing ? draftZones : zones;
    console.log("1");
    const setter = editing ? setDraftZones : setZones;
    console.log("2");
    if (target.find((z) => z.id === id)) {
        console.log("2.1");
      alert(`Zone id "${id}" already exists`);
      console.log("2.2");
      return;
    }
    console.log("3");
    const next = [...target, { id, name, points: [] as [number, number][] }];
    console.log("4");
    setter(next);
    console.log("5");
    setActiveId(id); // FIX: select the new zone so clicks add points
    console.log("6");
  }

  const shownZones = editing ? draftZones : zones;

  const countsStr = useMemo(() => {
    if (!metrics) return "—";
    const parts = Object.entries(metrics.counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}: ${v}`);
    return parts.length ? parts.join("  •  ") : "none";
  }, [metrics]);

  const dets = metrics?.detections ?? [];

  return (
    <>
      <div style={{ position: "absolute", inset: 0 }}>
        {/* Overlay layer (no pointer events) */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
          <ZonesOverlay zones={shownZones} width={width} height={height} />
        </div>

        {/* Editor layer (clickable) */}
        {editing && (
          <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "auto" }}>
            <ZonesEditor
              zones={draftZones}
              setZones={setDraftZones}
              width={width}
              height={height}
              activeId={activeId}
            />
          </div>
        )}

        {/* Controls layer (must be on top) */}
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            background: "#fff",
            padding: 8,
            border: "1px solid #ddd",
            zIndex: 3,                 // FIX: keep above editor SVG
            pointerEvents: "auto",     // FIX: ensure clickable
          }}
        >
          {!editing ? (
            <>
              <button onClick={startEditing} style={{ marginRight: 8 }}>
                Edit Zones
              </button>
              <button onClick={handleAddZone}>Add Zone</button>
            </>
          ) : (
            <>
              <button onClick={handleSave} style={{ marginRight: 8 }}>
                Save
              </button>
              <button onClick={handleCancel} style={{ marginRight: 8 }}>
                Cancel
              </button>
              <button onClick={handleAddZone}>Add Zone</button>
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <label>Active zone:&nbsp;</label>
            <select
              value={activeId ?? ""}
              onChange={(e) => setActiveId(e.target.value || null)}
            >
              <option value="">(none)</option>
              {shownZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status panel */}
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
