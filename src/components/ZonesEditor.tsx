import type { Zone } from "../types/zone";

export function ZonesEditor({
    zones,
    setZones,
    width,
    height,
    onSave,
    onCancel,
}: {
    zones: Zone[];
    setZones: (z: Zone[]) => void;
    width: number;
    height: number;
    onSave: () => void;
    onCancel: () => void;
}) {
    const activeId = zones[0]?.id ?? null;

    function handleClick(e: React.MouseEvent<SVGSVGElement>) {
        if (!activeId || !width || !height) return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) / width;
        const y = (e.clientY - rect.top) / height;
        setZones(
            zones.map((z) =>
                z.id === activeId
                    ? {
                          ...z,
                          points: [...z.points, [x, y] as [number, number]],
                      }
                    : z
            )
        );
    }

    return (
        <>
            <svg
                width={width}
                height={height}
                onClick={handleClick}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    cursor: "crosshair",
                }}
            >
                {zones.map((z) => {
                    const pts = z.points
                        .map(([x, y]) => `${x * width},${y * height}`)
                        .join(" ");
                    return (
                        <polygon
                            key={z.id}
                            points={pts}
                            fill="rgba(0,0,255,0.08)"
                            stroke="deepskyblue"
                            strokeWidth={2}
                        />
                    );
                })}
            </svg>
            <div
                style={{
                    position: "absolute",
                    left: 8,
                    top: 48,
                    background: "#fff",
                    padding: 8,
                    border: "1px solid #ddd",
                }}
            >
                <button onClick={onSave} style={{ marginRight: 8 }}>
                    Save zones
                </button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </>
    );
}

export default ZonesEditor;
