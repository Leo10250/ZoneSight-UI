export type BBox = [number, number, number, number];

export interface Detection {
    tracking_id: number | null;
    cls: string;
    conf: number;
    xyxy: BBox;
    zone?: string | null;
    dwell_s?: number;
}