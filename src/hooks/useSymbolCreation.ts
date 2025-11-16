import { Circle, Line, Path, Group, FabricObject, FabricText, IText, FabricImage } from "fabric";
import heatPumpImage from "@/assets/heat-pump.png";

export const useSymbolCreation = (
  color: string = "#000000",
  thickness: number = 2,
  transparency: number = 1,
  scale: number = 1, // symbol visual scale multiplier
  pxPerMm: number = 1 // canvas scale: pixels per millimeter
) => {
  const createSymbol = (type: string, x: number, y: number, isPreview: boolean = false): FabricObject | null => {
    const baseSize = 12 * scale; // Doubled from 6 to 12
    const halfSize = baseSize / 2;
    
    switch (type) {
      case "downlight": {
        // Circle with X inside it (matching icon)
        const xExtent = halfSize * 0.7; // X stays inside the circle
        const circle = new Circle({
          radius: halfSize,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: "transparent",
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const xLine1 = new Line([-xExtent, -xExtent, xExtent, xExtent], {
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const xLine2 = new Line([xExtent, -xExtent, -xExtent, xExtent], {
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([circle, xLine1, xLine2, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 3; // Index of label in group
        return group;
      }
        
      case "power-point": {
        // Half circle with vertical line
        const arc = new Path(
          `M ${-halfSize},0 A ${halfSize},${halfSize} 0 0,1 ${halfSize},0`,
          {
            fill: "transparent",
            stroke: color,
            strokeWidth: 0.4 * thickness,
            opacity: transparency,
          }
        );
        const line = new Line([0, 0, 0, halfSize], {
          stroke: color,
          strokeWidth: 0.4 * thickness,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([arc, line, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 2;
        return group;
      }
        
      case "single-switch": {
        // Circle with single diagonal line
        const circle = new Circle({
          radius: halfSize * 0.7,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          opacity: transparency,
        });
        const line = new Line([-halfSize * 0.5, halfSize * 0.3, halfSize * 0.5, -halfSize * 0.5], {
          stroke: color,
          strokeWidth: 0.5 * thickness,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([circle, line, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 2;
        return group;
      }
        
      case "double-switch": {
        // Similar to single but with two elements
        const circle1 = new Circle({
          radius: halfSize * 0.5,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: -halfSize * 0.5,
          top: halfSize * 0.2,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const circle2 = new Circle({
          radius: halfSize * 0.5,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: halfSize * 0.5,
          top: -halfSize * 0.2,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const line = new Line([-halfSize * 0.8, halfSize * 0.4, halfSize * 0.8, -halfSize * 0.6], {
          stroke: color,
          strokeWidth: 0.5 * thickness,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([circle1, circle2, line, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 3;
        return group;
      }
        
      case "triple-switch": {
        // Three elements in a row
        const switch1 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: -halfSize * 0.9,
          top: 0,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const switch2 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: 0,
          top: -halfSize * 0.1,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const switch3 = new Circle({
          radius: halfSize * 0.4,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          left: halfSize * 0.9,
          top: 0,
          originX: "center",
          originY: "center",
          opacity: transparency,
        });
        const line = new Line([-halfSize * 1.1, halfSize * 0.1, halfSize * 1.1, -halfSize * 0.3], {
          stroke: color,
          strokeWidth: 0.5 * thickness,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([switch1, switch2, switch3, line, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 4;
        return group;
      }
        
      case "fan": {
        // Capital F in a circle
        const circle = new Circle({
          radius: halfSize,
          fill: "transparent",
          stroke: color,
          strokeWidth: 0.4 * thickness,
          opacity: transparency,
        });
        const fPath = new Path(
          `M ${-halfSize * 0.4},${-halfSize * 0.5} L ${-halfSize * 0.4},${halfSize * 0.5} M ${-halfSize * 0.4},${-halfSize * 0.5} L ${halfSize * 0.3},${-halfSize * 0.5} M ${-halfSize * 0.4},0 L ${halfSize * 0.1},0`,
          {
            fill: "transparent",
            stroke: color,
            strokeWidth: 0.4 * thickness,
            opacity: transparency,
          }
        );
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([circle, fPath, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 2;
        return group;
      }
        
      case "text-label": {
        const text = new IText("Label", {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          fill: color,
          opacity: transparency,
          fontSize: 16 * scale,
          selectable: true,
          editable: true,
          fontFamily: "Arial",
        } as any);
        (text as any).symbolType = type;
        return text as unknown as FabricObject;
      }

      case "heat-pump": {
        // Create heat pump at 1000mm (1m) width using canvas scale (pxPerMm)
        const targetWidthMm = 1000;
        const width = targetWidthMm * (pxPerMm || 1);

        const placeholder = new Path(
          `M ${-width/2} ${-width/2} L ${width/2} ${-width/2} L ${width/2} ${width/2} L ${-width/2} ${width/2} Z`,
          {
            fill: "rgba(200, 200, 200, 0.2)",
            stroke: color,
            strokeWidth: thickness,
            opacity: transparency * 0.5,
            originX: "center",
            originY: "center",
          }
        );

        const group = new Group([placeholder], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;

        // Only load actual image for final placement, not for previews
        if (!isPreview) {
          FabricImage.fromURL(heatPumpImage, { crossOrigin: 'anonymous' }).then((img) => {
            // Store the group's center before modifying
            const center = group.getCenterPoint();
            
            const imageScale = width / (img.width || 1);
            
            img.set({
              scaleX: imageScale,
              scaleY: imageScale,
              left: 0,
              top: 0,
              originX: "center",
              originY: "center",
              opacity: transparency,
            });

            group.remove(placeholder);
            group.add(img);

            // Recalculate bounds and restore the group's center position
            (group as any)._calcBounds?.();
            (group as any)._updateObjectsCoords?.();
            group.set({
              left: center.x,
              top: center.y,
              originX: "center",
              originY: "center",
            });
            group.setCoords();

            const canvas = group.canvas;
            if (canvas) canvas.requestRenderAll();
          }).catch((err) => {
            console.error("Failed to load heat pump image:", err);
          });
        }

        return group;
      }
      
      default: {
        // Generic placeholder: circle with a question mark for unimplemented symbols
        const circle = new Circle({
          radius: halfSize,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: "transparent",
          stroke: color,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const qText = new FabricText("?", {
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: color,
          opacity: transparency,
          fontSize: 14 * scale,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: color,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([circle, qText, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 2;
        return group;
      }
    }
  };

  return { createSymbol };
};
