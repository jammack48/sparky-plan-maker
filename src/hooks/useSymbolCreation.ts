import { Circle, Line, Path, Group, FabricObject, FabricText, IText, FabricImage } from "fabric";
import heatPumpImage from "@/assets/heat-pump.png";
import downlightImage from "@/assets/downlight.png";

// Cache for the heat pump image element to avoid re-loading
let HEAT_PUMP_IMG_EL: HTMLImageElement | null = null;
let HEAT_PUMP_IMG_PROMISE: Promise<HTMLImageElement> | null = null;

function loadHeatPumpEl(): Promise<HTMLImageElement> {
  if (HEAT_PUMP_IMG_EL) {
    return Promise.resolve(HEAT_PUMP_IMG_EL);
  }
  if (!HEAT_PUMP_IMG_PROMISE) {
    HEAT_PUMP_IMG_PROMISE = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        HEAT_PUMP_IMG_EL = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = heatPumpImage;
    });
  }
  return HEAT_PUMP_IMG_PROMISE;
}

// Cache for the downlight image element to avoid re-loading
let DOWNLIGHT_IMG_EL: HTMLImageElement | null = null;
let DOWNLIGHT_IMG_PROMISE: Promise<HTMLImageElement> | null = null;

function loadDownlightEl(): Promise<HTMLImageElement> {
  if (DOWNLIGHT_IMG_EL) {
    return Promise.resolve(DOWNLIGHT_IMG_EL);
  }
  if (!DOWNLIGHT_IMG_PROMISE) {
    DOWNLIGHT_IMG_PROMISE = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        DOWNLIGHT_IMG_EL = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = downlightImage;
    });
  }
  return DOWNLIGHT_IMG_PROMISE;
}

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

        const group = new Group([], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        
        // Only set symbolType for final placement, not preview
        if (!isPreview) {
          (group as any).symbolType = type;
          console.log(`[Heat Pump] Created FINAL symbol at (${x}, ${y})`);
        } else {
          (group as any).isPreview = true;
          console.log(`[Heat Pump] Created PREVIEW symbol at (${x}, ${y})`);
        }

        // Store the original position to maintain it after image loads
        const originalX = x;
        const originalY = y;

        // Prepare the image load and attach a readiness promise so callers can await
        const readyPromise = loadHeatPumpEl().then((imgEl) => {
          const img = new FabricImage(imgEl);
          
          const naturalW = img.width || imgEl.naturalWidth || 1;
          const imageScale = width / naturalW;
          
          img.set({
            scaleX: imageScale,
            scaleY: imageScale,
            left: 0,
            top: 0,
            originX: "center",
            originY: "center",
            opacity: transparency,
          });

          group.add(img);
          
          // Restore the original position after adding the image
          group.set({
            left: originalX,
            top: originalY,
            originX: "center",
            originY: "center",
          });
          
          // Update group coordinates
          (group as any)._calcBounds?.();
          (group as any)._updateObjectsCoords?.();
          group.setCoords();

          const canvas = group.canvas;
          if (canvas) {
            canvas.requestRenderAll();
            console.log(`[Heat Pump] Image loaded for ${isPreview ? 'PREVIEW' : 'FINAL'} at (${originalX}, ${originalY})`);
          }
        }).catch((err) => {
          console.error("Failed to load heat pump image:", err);
        });
        
        // Expose readiness to callers (used to avoid top-left jump on add)
        (group as any).__readyPromise = readyPromise;

        return group;
      }

      case "downlight-real": {
        // Create downlight at 150mm width using canvas scale (pxPerMm)
        const targetWidthMm = 150;
        const width = targetWidthMm * (pxPerMm || 1);

        const group = new Group([], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        
        // Only set symbolType for final placement, not preview
        if (!isPreview) {
          (group as any).symbolType = type;
          console.log(`[Downlight] Created FINAL symbol at (${x}, ${y})`);
        } else {
          (group as any).isPreview = true;
          console.log(`[Downlight] Created PREVIEW symbol at (${x}, ${y})`);
        }

        // Store the original position to maintain it after image loads
        const originalX = x;
        const originalY = y;

        // Prepare the image load and attach a readiness promise so callers can await
        const readyPromise = loadDownlightEl().then((imgEl) => {
          const img = new FabricImage(imgEl);
          
          const naturalW = img.width || imgEl.naturalWidth || 1;
          const imageScale = width / naturalW;
          
          img.set({
            scaleX: imageScale,
            scaleY: imageScale,
            left: 0,
            top: 0,
            originX: "center",
            originY: "center",
            opacity: transparency,
          });

          group.add(img);
          
          // Restore the original position after adding the image
          group.set({
            left: originalX,
            top: originalY,
            originX: "center",
            originY: "center",
          });
          
          // Update group coordinates
          (group as any)._calcBounds?.();
          (group as any)._updateObjectsCoords?.();
          group.setCoords();

          const canvas = group.canvas;
          if (canvas) {
            canvas.requestRenderAll();
            console.log(`[Downlight] Image loaded for ${isPreview ? 'PREVIEW' : 'FINAL'} at (${originalX}, ${originalY})`);
          }
        }).catch((err) => {
          console.error("Failed to load downlight image:", err);
        });
        
        // Expose readiness to callers (used to avoid top-left jump on add)
        (group as any).__readyPromise = readyPromise;

        return group;
      }

      case "indoor-unit": {
        // Indoor unit rectangle 800x1200mm, blue
        const hvacBlue = "#2563eb";
        const widthMm = 800;
        const heightMm = 1200;
        const width = widthMm * (pxPerMm || 1);
        const height = heightMm * (pxPerMm || 1);
        
        const rect = new Path(
          `M ${-width/2},${-height/2} L ${width/2},${-height/2} L ${width/2},${height/2} L ${-width/2},${height/2} Z`,
          {
            fill: "transparent",
            stroke: hvacBlue,
            strokeWidth: thickness,
            opacity: transparency,
          }
        );
        const label = new IText("", {
          left: 0,
          top: height/2 + 8,
          originX: "center",
          originY: "top",
          fill: hvacBlue,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([rect, label], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hoverCursor: "default",
          moveCursor: "default",
        });
        (group as any).symbolType = type;
        (group as any).labelIndex = 1;
        return group;
      }

      case "supply-grill": {
        // Round supply grill/diffuser 200mm diameter, blue
        const hvacBlue = "#2563eb";
        const diameterMm = 200;
        const radius = (diameterMm * (pxPerMm || 1)) / 2;
        
        const outerCircle = new Circle({
          radius: radius,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: "transparent",
          stroke: hvacBlue,
          strokeWidth: thickness,
          opacity: transparency,
        });
        const innerCircle = new Circle({
          radius: radius * 0.6,
          left: 0,
          top: 0,
          originX: "center",
          originY: "center",
          fill: "transparent",
          stroke: hvacBlue,
          strokeWidth: thickness * 0.5,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: radius + 8,
          originX: "center",
          originY: "top",
          fill: hvacBlue,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([outerCircle, innerCircle, label], {
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

      case "return-grill": {
        // Square return grill 400mm, blue
        const hvacBlue = "#2563eb";
        const sizeMm = 400;
        const size = sizeMm * (pxPerMm || 1);
        const halfSize = size / 2;
        
        const rect = new Path(
          `M ${-halfSize},${-halfSize} L ${halfSize},${-halfSize} L ${halfSize},${halfSize} L ${-halfSize},${halfSize} Z`,
          {
            fill: "transparent",
            stroke: hvacBlue,
            strokeWidth: thickness,
            opacity: transparency,
          }
        );
        // Cross lines for grill pattern
        const hLine = new Line([-halfSize * 0.8, 0, halfSize * 0.8, 0], {
          stroke: hvacBlue,
          strokeWidth: thickness * 0.5,
          opacity: transparency,
        });
        const vLine = new Line([0, -halfSize * 0.8, 0, halfSize * 0.8], {
          stroke: hvacBlue,
          strokeWidth: thickness * 0.5,
          opacity: transparency,
        });
        const label = new IText("", {
          left: 0,
          top: halfSize + 8,
          originX: "center",
          originY: "top",
          fill: hvacBlue,
          opacity: transparency,
          fontSize: 10 * scale,
          fontFamily: "Arial",
        });
        const group = new Group([rect, hLine, vLine, label], {
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
