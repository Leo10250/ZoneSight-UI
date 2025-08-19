export interface Zone {
  id: string;
  name: string;
  points: [number, number][]; // normalized [x,y]
}