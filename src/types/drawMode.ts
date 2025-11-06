export type DrawTool = "freehand" | "line" | "rectangle" | "circle" | "arrow";

export interface DrawState {
  tool: DrawTool;
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  tempObject: any | null;
}
