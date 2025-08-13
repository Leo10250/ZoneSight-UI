import type { Detection } from "./detection";

export interface Metrics {
    ts: number;
    fps: number;
    img_shape: [number, number];
    counts: Record<string, number>;
    detections: Detection[];
}