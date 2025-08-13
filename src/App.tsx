import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import type { Metrics } from "./types/metrics";

function App() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (ev) => {
            try {
                setMetrics(JSON.parse(ev.data));
            } catch {}
        };
        return () => {
            ws.close();
        };
    }, []);

    const countsStr = useMemo(() => {
        if (!metrics) return "—";
        const parts = Object.entries(metrics.counts)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k}: ${v}`);
        return parts.length ? parts.join("  •  ") : "none";
    }, [metrics]);

    const dets = metrics?.detections ?? [];

    return (
        <div>
            <h1>Real-Time Object Detection</h1>

            <div>
                <img
                    src="http://localhost:8000/video"
                    alt="live"
                    style={{ maxWidth: 720, border: "1px solid #eee" }}
                />

                <div>
                    <div>
                        <div>
                            Status:{" "}
                            <b>
                                {connected ? "WebSocket ✅" : "Disconnected ❌"}
                            </b>
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
                                <li
                                    key={`${d.tracking_id}-${d.xyxy.join(",")}`}
                                >
                                    <b>ID</b>: {d.tracking_id ?? "—"} - <b>Object</b>: {d.cls}{" "}
                                    - <b>Confidence Level</b>: {(d.conf * 100).toFixed(0)}%
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
