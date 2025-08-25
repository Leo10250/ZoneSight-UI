import { useEffect, useMemo, useRef, useState } from "react";
import type { Metrics } from "../types/metrics";
import type { Zone } from "../types/zone";
import ZonesOverlay from "./ZonesOverlay";
import ZonesEditor from "./ZonesEditor";

type Props = { width: number; height: number };

export default function ZonesPanel({ width, height }: Props) {
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const MAX_POINTS = Number(import.meta.env.VITE_MAX_ZONE_POINTS ?? 20);

    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [connected, setConnected] = useState(false);

    const [zones, setZones] = useState<Zone[]>([]);
    const [editing, setEditing] = useState(false);
    const [draftZones, setDraftZones] = useState<Zone[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [zonesError, setZonesError] = useState<string | null>(null);

    // Show after Add Zone; hide on Save/Cancel
    const [showCoach, setShowCoach] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);

    // Bootstrap
    useEffect(() => {
        fetch(`${API}/zones`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((z: Zone[]) => {
                setZones(z);
                setActiveId(z[0]?.id ?? null);
                setZonesError(null);
            })
            .catch((err) => {
                console.error("[zones] load failed:", err);
                setZones([]); // safe fallback
                setActiveId(null);
                setShowCoach(false);
                setZonesError("Could not load zones from the server.");
            });

        const ws = new WebSocket(`${API.replace(/^http/, "ws")}/ws`);
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (ev) => {
            try {
                setMetrics(JSON.parse(ev.data));
            } catch {
                setZonesError("Websocket onMessage Error!");
            }
        };
        return () => ws.close();
    }, [API]);

    const occStr = useMemo(() => {
        const occ = metrics?.occupancy || {};
        const parts = Object.entries(occ).map(([z, n]) => `${z}: ${n}`);
        return parts.length ? parts.join("  •  ") : "none";
    }, [metrics]);

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
        setShowCoach(false); // not for generic “Edit Zones”
    }

    async function handleSave() {
        const bad = draftZones.filter((z) => z.points.length < 3);
        if (bad.length) {
            alert(
                `Each zone needs ≥3 points: ${bad
                    .map((z) => z.name || z.id)
                    .join(", ")}`
            );
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

    // Add zone then immediately allow point placement
    function handleAddZone() {
        const base = `zone-${zones.length + draftZones.length + 1}`;
        const id = prompt("New zone id:", base) || base;
        const name = prompt("New zone name:", id + "-name") || id;

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
        setShowCoach(true);
    }

    const shownZones = editing ? draftZones : zones;
    const saveDisabled = editing && draftZones.some((z) => z.points.length < 3);

    const countsStr = useMemo(() => {
        if (!metrics) return "—";
        const parts = Object.entries(metrics.object_counts)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k}: ${v}`);
        return parts.length ? parts.join("  •  ") : "none";
    }, [metrics]);

    const dets = metrics?.detections ?? [];

    return (
        <>
            {/* Overlay/editor pinned to the video area only */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width,
                    height, // limit overlay to the image, not the banner area
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                >
                    <ZonesOverlay
                        zones={shownZones}
                        width={width}
                        height={height}
                    />
                </div>

                {editing && (
                    <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
                        <ZonesEditor
                            zones={draftZones}
                            setZones={setDraftZones}
                            width={width}
                            height={height}
                            activeId={activeId}
                            maxPoints={MAX_POINTS}
                        />
                    </div>
                )}

                {/* Controls over the video */}
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
                            <button
                                onClick={startEditing}
                                style={{ marginRight: 8 }}
                            >
                                Edit Zones
                            </button>
                            <button onClick={handleAddZone}>Add Zone</button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                style={{ marginRight: 8 }}
                                disabled={saveDisabled}
                                title={
                                    saveDisabled
                                        ? "Each zone needs at least 3 points"
                                        : ""
                                }
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancel}
                                style={{ marginRight: 8 }}
                            >
                                Cancel
                            </button>
                            <button onClick={handleAddZone}>Add Zone</button>
                        </>
                    )}

                    <div style={{ marginTop: 8 }}>
                        <label>Active zone:&nbsp;</label>
                        <select
                            value={activeId ?? ""}
                            onChange={(e) =>
                                setActiveId(e.target.value || null)
                            }
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

            {/* Coach banner — BELOW the video (best UX), normal flow */}
            {editing && showCoach && activeId && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        width,
                        maxWidth: "100%",
                        marginTop: 8,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "rgba(255,255,255,0.98)",
                            border: "1px solid #ddd",
                            boxShadow: "0 8px 24px rgba(0,0,0,.08)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            fontSize: 14,
                        }}
                    >
                        <b>Click on the video</b> to add points for{" "}
                        <code>{activeId}</code>. Place up to <b>{MAX_POINTS}</b>{" "}
                        points (min 3 to save). Press <kbd>Backspace</kbd> to
                        undo.
                    </div>
                </div>
            )}

            {zonesError && (
                <div
                    role="alert"
                    style={{
                        marginTop: 8,
                        padding: 8,
                        border: "1px solid #f3c",
                        background: "#fff0f6",
                        borderRadius: 8,
                    }}
                >
                    ⚠️ {zonesError}{" "}
                    <button
                        onClick={() => {
                            setZonesError(null);
                            // re-run the same fetch
                            fetch(`${API}/zones`)
                                .then((r) => {
                                    if (!r.ok)
                                        throw new Error(`HTTP ${r.status}`);
                                    return r.json();
                                })
                                .then((z: Zone[]) => {
                                    setZones(z);
                                    setActiveId(z[0]?.id ?? null);
                                })
                                .catch((err) => {
                                    console.error("[zones] retry failed:", err);
                                    setZonesError(
                                        "Retry failed. Is the API running?"
                                    );
                                });
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Status panel */}
            <div style={{ marginTop: 12 }}>
                <div>
                    Status:{" "}
                    <b>{connected ? "WebSocket ✅" : "Disconnected ❌"}</b>
                </div>
                <div>
                    FPS: <b>{metrics?.fps ?? "—"}</b>
                </div>
                <div>
                    Image: <b>{metrics?.img_shape?.join("×") ?? "—"}</b>
                </div>
                <div>Counts: {countsStr}</div>
                <div>
                    Human Occupancy: <b>{occStr}</b>
                </div>
                {metrics?.recent_events?.length ? (
                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontWeight: "bolder" }}>
                            Recent zone events
                        </div>
                        <ul
                            style={{
                                listStyle: "none",
                                paddingLeft: 0,
                                margin: 0,
                            }}
                        >
                            {metrics.recent_events.slice(0, 5).map((e, i) => (
                                <li key={i}>
                                    [
                                    {new Date(e.timestamp * 1000).toLocaleTimeString()}
                                    ] {e.type.toUpperCase()} #{e.track_id}{" "}
                                    {e.type === "transfer"
                                        ? `${e.from ?? "—"} → ${e.zone ?? "—"}`
                                        : `${e.zone ?? "—"}`}
                                    {typeof e.dwell_s === "number"
                                        ? ` · ${e.dwell_s.toFixed(1)}s`
                                        : ""}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: "bolder" }}>
                        Detections (first 5)
                    </div>
                    <ul
                        style={{
                            listStyle: "none",
                            paddingLeft: 0,
                            marginTop: 0,
                        }}
                    >
                        {dets.slice(0, 5).map((d) => (
                            <li key={`${d.tracking_id}-${d.xyxy.join(",")}`}>
                                #{d.tracking_id ?? "—"} {d.cls}{" "}
                                {(d.conf * 100).toFixed(0)}%{" "}
                                {d.zone ? `· ${d.zone}` : ""}
                                {typeof d.dwell_s === "number"
                                    ? ` · ${d.dwell_s.toFixed(1)}s`
                                    : ""}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
