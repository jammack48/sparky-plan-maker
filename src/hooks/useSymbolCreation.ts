import { Circle, Line, Rect, Group, Path, FabricObject } from "fabric";

export const useSymbolCreation = () => {
  const createSymbol = (type: string, x: number, y: number): FabricObject | null => {
    const size = 6;
    const halfSize = size / 2;
    
    switch (type) {
      case "downlight": {
        // NZ Standard: Circle with X (downlight)
        const circle = new Circle({
          radius: halfSize,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const xLine1 = new Line([-halfSize * 0.7, -halfSize * 0.7, halfSize * 0.7, halfSize * 0.7], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const xLine2 = new Line([-halfSize * 0.7, halfSize * 0.7, halfSize * 0.7, -halfSize * 0.7], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const group = new Group([circle, xLine1, xLine2], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "socket": {
        // NZ Standard: Single socket outlet (half circle with vertical line)
        const arc = new Path(
          `M ${-halfSize},0 A ${halfSize},${halfSize} 0 0,1 ${halfSize},0`,
          {
            fill: "transparent",
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const line = new Line([0, 0, 0, halfSize], {
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const group = new Group([arc, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "single-switch": {
        // NZ Standard: One way switch (circle with diagonal line)
        const circle = new Circle({
          radius: halfSize * 0.6,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
        });
        const line = new Line([-halfSize * 0.8, 0, halfSize * 0.4, -halfSize * 0.8], {
          stroke: "#000",
          strokeWidth: 0.5,
        });
        const group = new Group([circle, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "double-switch": {
        // NZ Standard: Two way switch (two circles with diagonal line)
        const circle1 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: -halfSize * 0.6,
          top: halfSize * 0.3,
          originX: "center",
          originY: "center",
        });
        const circle2 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: halfSize * 0.6,
          top: -halfSize * 0.3,
          originX: "center",
          originY: "center",
        });
        const line = new Line([-halfSize * 0.6, halfSize * 0.3, halfSize * 0.6, -halfSize * 0.3], {
          stroke: "#000",
          strokeWidth: 0.5,
        });
        const group = new Group([circle1, circle2, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "triple-switch": {
        // NZ Standard: Three switches in a row
        const switch1 = new Circle({
          radius: halfSize * 0.35,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: -halfSize,
          top: 0,
          originX: "center",
          originY: "center",
        });
        const switch2 = new Circle({
          radius: halfSize * 0.35,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
        });
        const switch3 = new Circle({
          radius: halfSize * 0.35,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          left: halfSize,
          top: 0,
          originX: "center",
          originY: "center",
        });
        const line = new Line([-halfSize * 0.8, 0, halfSize * 0.8, 0], {
          stroke: "#000",
          strokeWidth: 0.5,
        });
        const group = new Group([switch1, switch2, switch3, line], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      case "smoke": {
        // NZ Standard: Smoke detector (triangle with dot)
        const smokePath = new Path(
          `M 0,${-halfSize} L ${halfSize},${halfSize} L ${-halfSize},${halfSize} Z`,
          {
            fill: "transparent",
            stroke: "#000",
            strokeWidth: 0.4,
          }
        );
        const smokeDot = new Circle({
          radius: 0.5,
          fill: "#000",
          top: halfSize * 0.2,
          originX: "center",
          originY: "center",
        });
        const smokeGroup = new Group([smokePath, smokeDot], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (smokeGroup as any).symbolType = type;
        return smokeGroup;
      }
        
      case "fluoro": {
        // NZ Standard: Fluorescent lamp (rectangle)
        const rect = new Rect({
          width: size * 1.2,
          height: size * 0.4,
          fill: "transparent",
          stroke: "#000",
          strokeWidth: 0.4,
          originX: "center",
          originY: "center",
        });
        const group = new Group([rect], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
        });
        (group as any).symbolType = type;
        return group;
      }
        
      default:
        return null;
    }
  };

  return { createSymbol };
};
