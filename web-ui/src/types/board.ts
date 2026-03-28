export type Kind =
  | "yard_red"
  | "yard_green"
  | "yard_yellow"
  | "yard_blue"
  | "lane_red"
  | "lane_green"
  | "lane_yellow"
  | "lane_blue"
  | "center"
  | "path";

export type Flag =
  | "start_red"
  | "start_green"
  | "start_blue"
  | "start_yellow"
  | "safe"
  | null;

export interface TokenData {
  id: string;
  row: number;
  col: number;
  color: string;
  emissive: string;
}
