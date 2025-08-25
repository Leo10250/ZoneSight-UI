import type { Detection } from "./detection";
import type { ZoneEvent } from "./zoneEvent";

export interface Metrics {
    timestamp: number;
    fps: number;
    img_shape: [number, number];
    object_counts: Record<string, number>;
    detections: Detection[];
    occupancy?: Record<string, number>;
    recent_events?: ZoneEvent[];
}
