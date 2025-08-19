import type { Zone } from "../types/zone";

function labelPos(points: [number, number][], w: number, h: number): [number, number] {
  if (points.length === 0) return [8, 14]; // fallback top-left
  if (points.length < 3) {
    // average of points if we don't have a full polygon yet
    const [sx, sy] = points.reduce<[number, number]>(
      (acc, [x, y]) => [acc[0] + x, acc[1] + y],
      [0, 0]
    );
    return [(sx / points.length) * w, (sy / points.length) * h];
  }
  // polygon centroid (simple area-weighted)
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  a = a * 0.5 || 1; // avoid 0
  return [(cx / (6 * a)) * w, (cy / (6 * a)) * h];
}

export default function ZonesOverlay({
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
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
    >
      {zones.map((z) => {
        const pts = z.points;
        // If zone has no points yet, skip polygon; still show a label so users know it exists
        const svgPoints =
          pts.length > 0
            ? pts.map(([x, y]) => `${x * width},${y * height}`).join(" ")
            : "";
        const [lx, ly] = labelPos(pts, width, height);

        return (
          <g key={z.id}>
            {pts.length > 0 && (
              <polygon
                points={svgPoints}
                fill="rgba(255,165,0,0.15)"
                stroke="orange"
                strokeWidth={2}
              />
            )}
            <text x={lx} y={ly - 6} fill="orange" fontSize="12">
              {z.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
