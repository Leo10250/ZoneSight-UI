import type { Zone } from "../types/zone";

export default function ZonesEditor({
  zones, setZones, width, height, activeId,
}: {
  zones: Zone[];
  setZones: (z: Zone[]) => void;
  width: number;
  height: number;
  activeId: string | null;
}) {
  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!activeId || !width || !height) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;
    setZones(zones.map(z =>
      z.id === activeId ? { ...z, points: [...z.points, [x, y] as [number, number]] } : z
    ));
  }

  return (
    <>
      <svg
        width={width}
        height={height}
        onClick={handleClick}
        style={{ position: "absolute", left: 0, top: 0, cursor: "crosshair" }}
      >
        {zones.map((z) => {
          const pts = z.points.map(([x, y]) => `${x * width},${y * height}`).join(" ");
          return (
            <polygon
              key={z.id}
              points={pts}
              fill="rgba(0,0,255,0.08)"
              stroke={z.id === activeId ? "deepskyblue" : "#66f"}
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {!activeId && (
        <div style={{
          position: "absolute", left: 8, bottom: 8, background: "#fff",
          padding: 6, border: "1px solid #ddd"
        }}>
          Choose an <b>Active zone</b> (or click <b>Add Zone</b>), then click on the video to add points.
        </div>
      )}
    </>
  );
}
