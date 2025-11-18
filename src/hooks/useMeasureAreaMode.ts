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

    const handleMouseDown = (opt: any) => {
      const e = opt.e;
      if (typeof e?.button === "number" && e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(e);
      const newPoint = { x: pointer.x, y: pointer.y };

      // Check if clicking near first point (close polygon)
      if (points.length >= 3 && isPointNear(newPoint, points[0], 30)) {
        completePolygon();
        return;
      }

      // Add new point
      const circle = new Circle({
        left: pointer.x - 5,
        top: pointer.y - 5,
        radius: 5,
        fill: areaColor,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });

      fabricCanvas.add(circle);
      setPreviewCircles(prev => [...prev, circle]);
      setPoints(prev => [...prev, newPoint]);
    };

    const handleMouseMove = (opt: any) => {
      if (points.length === 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      
      // Update preview line
      if (previewLine) {
        fabricCanvas.remove(previewLine);
      }

      const linePoints = [...points, { x: pointer.x, y: pointer.y }];

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

      // Create polygon with semi-transparent fill
      const fillColor = areaColor.includes('rgba') 
        ? areaColor 
        : areaColor + '80'; // Add transparency

      const polygon = new Polygon(points, {
        fill: fillColor,
        stroke: areaColor.replace('rgba', 'rgb').replace(/,\s*[\d.]+\)/, ')'),
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
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, points, scale, areaColor, heightValue, previewLine, previewCircles]);

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
