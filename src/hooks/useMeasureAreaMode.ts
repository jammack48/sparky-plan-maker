import { useEffect, useState } from "react";
import { Canvas as FabricCanvas, Polygon, FabricText, Circle, Polyline } from "fabric";
import { calculatePolygonArea, pixelAreaToMeters, calculateVolume, getPolygonCenter, isPointNear } from "@/lib/areaCalculations";

interface Point {
  x: number;
  y: number;
}

interface AreaMeasurement {
  id: string;
  polygon: Polygon;
  label: FabricText;
  area: number;
  volume?: number;
  color: string;
}

export const useMeasureAreaMode = (
  fabricCanvas: FabricCanvas | null,
  mode: string,
  scale: number | null,
  areaColor: string,
  areaOpacity: number,
  heightValue: number | null
) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [previewLine, setPreviewLine] = useState<Polyline | null>(null);
  const [previewCircles, setPreviewCircles] = useState<Circle[]>([]);
  const [measurements, setMeasurements] = useState<AreaMeasurement[]>([]);

  useEffect(() => {
    if (!fabricCanvas || (mode !== "measure-area" && mode !== "measure-volume")) {
      // Clean up preview elements when not in area mode
      if (previewLine && fabricCanvas) {
        fabricCanvas.remove(previewLine);
        setPreviewLine(null);
      }
      previewCircles.forEach(circle => fabricCanvas?.remove(circle));
      setPreviewCircles([]);
      setPoints([]);
      return;
    }

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    // Lock background to prevent movement during measurement
    const objects = fabricCanvas.getObjects();
    const background = objects.find((obj: any) => obj.isBackgroundImage || obj.name === 'backgroundImage');
    if (background) {
      background.selectable = false;
      background.evented = false;
    }

    // Track dragging point preview
    let dragPoint: { x: number; y: number } | null = null;
    let dragCircle: Circle | null = null;

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      if (typeof e?.button === "number" && e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(e);
      dragPoint = { x: pointer.x, y: pointer.y };

      // Create preview circle at drag start
      dragCircle = new Circle({
        left: pointer.x - 5,
        top: pointer.y - 5,
        radius: 5,
        fill: areaColor,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(dragCircle);
      fabricCanvas.renderAll();
    };

    const handleMouseUp = (opt: any) => {
      if (!dragPoint || !dragCircle) return;

      const e = opt.e;
      const pointer = fabricCanvas.getPointer(e);
      const finalPoint = { x: pointer.x, y: pointer.y };

      // Check if clicking near first point (close polygon)
      if (points.length >= 3 && isPointNear(finalPoint, points[0], 30)) {
        fabricCanvas.remove(dragCircle);
        completePolygon();
        dragPoint = null;
        dragCircle = null;
        return;
      }

      // Commit the point
      setPreviewCircles(prev => [...prev, dragCircle!]);
      setPoints(prev => [...prev, finalPoint]);
      
      dragPoint = null;
      dragCircle = null;
    };

    const handleMouseMove = (opt: any) => {
      const pointer = fabricCanvas.getPointer(opt.e);

      // Update dragging point position
      if (dragPoint && dragCircle) {
        dragCircle.set({
          left: pointer.x - 5,
          top: pointer.y - 5,
        });
      }

      // Update preview line only if we have committed points
      if (points.length === 0 && !dragPoint) return;

      if (previewLine) {
        fabricCanvas.remove(previewLine);
      }

      const linePoints = dragPoint 
        ? [...points, { x: pointer.x, y: pointer.y }]
        : [...points, { x: pointer.x, y: pointer.y }];

      const line = new Polyline(linePoints, {
        stroke: areaColor,
        strokeWidth: 2,
        fill: 'transparent',
        selectable: false,
        evented: false,
        excludeFromExport: true,
        strokeDashArray: [5, 5],
      });

      fabricCanvas.add(line);
      setPreviewLine(line);
      fabricCanvas.renderAll();
    };

    const completePolygon = () => {
      if (points.length < 3 || !scale) return;

      // Calculate area
      const pixelArea = calculatePolygonArea(points);
      const areaM2 = pixelAreaToMeters(pixelArea, scale);
      const volume = heightValue ? calculateVolume(areaM2, heightValue) : null;

      // Create polygon with opacity
      const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const fillColor = hexToRgba(areaColor, areaOpacity);
      const strokeColor = areaColor;

      const polygon = new Polygon(points, {
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 2,
        selectable: true,
        hasControls: false,
        hasBorders: true,
        objectCaching: false,
      });

      // Create label
      const center = getPolygonCenter(points);
      const labelText = volume 
        ? `${areaM2.toFixed(1)} m²\n${volume.toFixed(1)} m³`
        : `${areaM2.toFixed(1)} m²`;

      const label = new FabricText(labelText, {
        left: center.x,
        top: center.y,
        fontSize: 16,
        fill: '#000000',
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      // Add to canvas
      fabricCanvas.add(polygon);
      fabricCanvas.add(label);

      // Store measurement
      const measurement: AreaMeasurement = {
        id: `area-${Date.now()}`,
        polygon,
        label,
        area: areaM2,
        volume,
        color: areaColor,
      };

      setMeasurements(prev => [...prev, measurement]);

      // Clean up preview
      previewCircles.forEach(circle => fabricCanvas.remove(circle));
      if (previewLine) fabricCanvas.remove(previewLine);
      
      setPoints([]);
      setPreviewCircles([]);
      setPreviewLine(null);
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:up", handleMouseUp);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:up", handleMouseUp);
      fabricCanvas.off("mouse:move", handleMouseMove);
      
      // Restore background selectability when exiting mode
      if (background) {
        const shouldBeLocked = (background as any).backgroundLocked !== false;
        background.selectable = !shouldBeLocked;
        background.evented = !shouldBeLocked;
      }
    };
  }, [fabricCanvas, mode, points, scale, areaColor, areaOpacity, heightValue, previewLine, previewCircles]);

  const deleteMeasurement = (id: string) => {
    const measurement = measurements.find(m => m.id === id);
    if (measurement && fabricCanvas) {
      fabricCanvas.remove(measurement.polygon);
      fabricCanvas.remove(measurement.label);
      setMeasurements(prev => prev.filter(m => m.id !== id));
      fabricCanvas.renderAll();
    }
  };

  return {
    measurements,
    deleteMeasurement,
    isDrawing: points.length > 0,
  };
};
