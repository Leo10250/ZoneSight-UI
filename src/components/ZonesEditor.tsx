import type { Zone } from "../types/zone";

export default function ZonesEditor({
  zones, setZones, width, height, activeId, maxPoints,
}: {
  zones: Zone[];
  setZones: (z: Zone[]) => void;
  width: number;
  height: number;
  activeId: string | null;
  maxPoints: number;           // NEW
}) {
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!activeId || !width || !height) return;
    const active = zones.find((z) => z.id === activeId);
    if (!active) return;
    if (active.points.length >= maxPoints) return; // cap reached

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;

    const next = zones.map((z) =>
      z.id === activeId ? { ...z, points: [...z.points, [x, y] as [number, number]] } : z
    );
    setZones(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<SVGSVGElement>) {
    if (!activeId) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      setZones(zones.map((z) =>
        z.id === activeId ? { ...z, points: z.points.slice(0, -1) } : z
      ));
    }
  }

  const active = zones.find((z) => z.id === activeId);

  return (
    <>
      <style>{`
        @keyframes pulse { 0%{transform:scale(1);opacity:1} 70%{transform:scale(1.5);opacity:.3} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <svg
        width={width}
        height={height}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ position: "absolute", left: 0, top: 0, cursor: "crosshair", outline: "none" }}
      >
        {zones.map((z) => {
          const pts = z.points.map(([x,y]) => `${x*width},${y*height}`).join(" ");
          return (
            <g key={z.id}>
              <polygon
                points={pts}
                fill="rgba(0,120,255,0.08)"
                stroke={z.id === activeId ? "deepskyblue" : "#66f"}
                strokeWidth={2}
              />
            </g>
          );
        })}

        {active && (
          <g>
            {active.points.length > 1 && (
              <polyline
                points={active.points.map(([x,y]) => `${x*width},${y*height}`).join(" ")}
                fill="none"
                stroke="deepskyblue"
                strokeWidth={2}
                strokeDasharray="6 6"
              />
            )}
            {active.points.map(([x,y], i) => {
              const cx = x*width, cy = y*height;
              return (
                <g key={i} transform={`translate(${cx},${cy})`}>
                  <circle r={6} fill="#00bfff" style={{ animation: "pulse 1.6s infinite" }} />
                  <circle r={3} fill="#fff" />
                  <text x={8} y={-8} fill="#00bfff" fontSize={12} style={{ userSelect:"none" }}>
                    {i+1}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </>
  );
}
