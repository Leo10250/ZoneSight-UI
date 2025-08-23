import type { Detection } from "./detection";
import type { ZoneEvent } from "./zoneEvent";

export interface Metrics {
  ts: number;
  fps: number;
  img_shape: [number, number];
  counts: Record<string, number>;
  detections: Detection[];
  occupancy?: Record<string, number>;
  recent_events?: ZoneEvent[];   // NEW
}
