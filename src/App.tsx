import { useEffect, useMemo, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

type Metrics = {
    ts: number;
    fps: number;
    img_shape: [number, number];
    counts: Record<string, number>;
};

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

    return (
        <div className="min-h-screen p-6 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Real-Time Object Detection</h1>

            <div className="flex gap-6">
                <img
                    src="http://localhost:8000/video"
                    alt="live"
                    className="rounded-xl shadow"
                    style={{ maxWidth: 720, border: "1px solid #eee" }}
                />

                <div className="flex flex-col gap-3">
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
                        <div className="font-semibold mb-1">Counts</div>
                        <div>{countsStr}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
