import { useEffect, useMemo, useRef, useState } from "react";
import type { Metrics } from "../types/metrics";
import type { Zone } from "../types/zone";
import ZonesOverlay from "./ZonesOverlay";
import ZonesEditor from "./ZonesEditor";

type Props = { width: number; height: number };

function ZonesPanel({ width, height }: Props) {
    const API = "http://localhost:8000";
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [connected, setConnected] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [editing, setEditing] = useState(false);
    const [draftZones, setDraftZones] = useState<Zone[]>([]);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetch(`${API}/zones`)
            .then((r) => r.json())
            .then(setZones)
            .catch(() => setZones([]));
        const ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (ev) => {
            try {
                setMetrics(JSON.parse(ev.data));
            } catch {
                /* empty */
            }
        };
        return () => {
            ws.close();
        };
    }, []);

    async function saveZones(next: Zone[]) {
        const res = await fetch(`${API}/zones`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
        });
        setZones(await res.json());
    }

    const countsStr = useMemo(() => {
        if (!metrics) return "—";
        const parts = Object.entries(metrics.counts)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k}: ${v}`);
        return parts.length ? parts.join("  •  ") : "none";
    }, [metrics]);

    const dets = metrics?.detections ?? [];

    function startEditing() {
        setDraftZones(
            zones.map((z) => ({
                ...z,
                points: z.points.map((p) => [p[0], p[1]] as [number, number]),
            }))
        );
        setEditing(true);
    }

    async function handleSave() {
        await saveZones(draftZones);
        setEditing(false);
    }

    function handleCancel() {
        setEditing(false);
    }

    const shownZones = editing ? draftZones : zones;

    return (
        <>
            <h1>Real-Time Object Detection</h1>
            <div style={{ position: "absolute", inset: 0 }}>
                {/* Always draw current zones */}
                <ZonesOverlay
                    zones={shownZones}
                    width={width}
                    height={height}
                />

                {/* Controls */}
                <div
                    style={{
                        position: "absolute",
                        left: 8,
                        top: 8,
                        background: "#fff",
                        padding: 8,
                        border: "1px solid #ddd",
                    }}
                >
                    {!editing ? (
                        <button onClick={startEditing}>Edit Zones</button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                style={{ marginRight: 8 }}
                            >
                                Save
                            </button>
                            <button onClick={handleCancel}>Cancel</button>
                        </>
                    )}
                </div>

                {/* Editor only when editing */}
                {editing && (
                    <ZonesEditor
                        zones={draftZones}
                        setZones={setDraftZones}
                        width={width}
                        height={height}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                )}
            </div>

            <div>
                <div>
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
                </div>
                <div>
                    <div>Counts</div>
                    <div>{countsStr}</div>
                </div>

                {/* quick proof that tracking works */}
                <div style={{ marginTop: 8 }}>
                    <div>Detections (first 5)</div>
                    <ul style={{ listStyle: "none" }}>
                        {dets.slice(0, 5).map((d) => (
                            <li key={`${d.tracking_id}-${d.xyxy.join(",")}`}>
                                <b>ID</b>: {d.tracking_id ?? "—"} -{" "}
                                <b>Object</b>: {d.cls} - <b>Confidence Level</b>
                                : {(d.conf * 100).toFixed(0)}%
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}

export default ZonesPanel;
