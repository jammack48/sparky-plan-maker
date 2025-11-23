import { Line, Triangle, Group, FabricText } from "fabric";

interface ArrowOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
  distanceText: string;
}

export function createArrowLine(options: ArrowOptions): Group {
  const { x1, y1, x2, y2, color, strokeWidth, distanceText } = options;

  // Main line
  const line = new Line([x1, y1, x2, y2], {
    stroke: color,
    strokeWidth: strokeWidth,
    selectable: false,
    evented: false,
  });

  // Calculate angle
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  const arrowSize = 10 + strokeWidth;
  
  // Calculate offset to position arrow tip at endpoint
  const arrowOffset = arrowSize / 2;
  const radians = Math.atan2(y2 - y1, x2 - x1);
  
  // Offset start point inward along the line
  const startX = x1 + Math.cos(radians) * arrowOffset;
  const startY = y1 + Math.sin(radians) * arrowOffset;
  
  // Offset end point inward along the line
  const endX = x2 - Math.cos(radians) * arrowOffset;
  const endY = y2 - Math.sin(radians) * arrowOffset;

  // Start arrowhead (tip points toward line)
  const startArrow = new Triangle({
    left: startX,
    top: startY,
    width: arrowSize,
    height: arrowSize,
    fill: color,
    angle: angle + 90,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // End arrowhead (tip points toward line)
  const endArrow = new Triangle({
    left: endX,
    top: endY,
    width: arrowSize,
    height: arrowSize,
    fill: color,
    angle: angle - 90,
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // Distance label at midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const label = new FabricText(distanceText, {
    left: midX,
    top: midY - 20,
    fontSize: 16,
    fill: '#000000',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
    selectable: false,
    evented: false,
  });

  // Group all elements
  const group = new Group([line, startArrow, endArrow, label], {
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
  });

  // Mark as distance measurement for identification
  (group as any).measurementType = 'distance';

  return group;
}

// Calculate distance and format as text
export function formatDistance(pixelDistance: number, scale: number): string {
  // scale is px/mm
  const mmPerPx = 1 / scale;
  const distanceMm = pixelDistance * mmPerPx;
  const distanceM = distanceMm / 1000;

  if (distanceM >= 1) {
    return `${distanceM.toFixed(2)} m`;
  } else {
    return `${distanceMm.toFixed(0)} mm`;
  }
}
