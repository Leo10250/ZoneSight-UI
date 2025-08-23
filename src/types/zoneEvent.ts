export interface ZoneEvent {
  ts: number; // epoch seconds
  type: "entry" | "exit" | "transfer";
  track_id: number;
  zone?: string | null;
  from?: string | null;
  dwell_s?: number | null;
}