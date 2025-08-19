import type { Zone } from "../types/zone";

export function ZonesOverlay({
    zones,
    width,
    height,
}: {
    zones: Zone[];
    width: number;
    height: number;
}) {
    return (
        <svg
            width={width}
            height={height}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                pointerEvents: "none",
            }}
        >
            {zones.map((z) => {
                const pts = z.points
                    .map(([x, y]) => `${x * width},${y * height}`)
                    .join(" ");
                return (
                    <g key={z.id}>
                        <polygon
                            points={pts}
                            fill="rgba(255,165,0,0.15)"
                            stroke="orange"
                            strokeWidth={2}
                        />
                        <text
                            x={z.points[0][0] * width}
                            y={z.points[0][1] * height - 6}
                            fill="orange"
                            fontSize="12"
                        >
                            {z.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default ZonesOverlay;
