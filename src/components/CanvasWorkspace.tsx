import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Line, Image as FabricImage, FabricObject, Point } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Crop, Ruler, Grid3x3, Download, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: (canvas: FabricCanvas) => void;
}

interface Position {
  x: number;
  y: number;
}

export const CanvasWorkspace = ({ imageUrl, pageNumber, onExport, onExtract }: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure">("select");
  const [scale, setScale] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<string>("400");
  const [showGrid, setShowGrid] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Crop state
  const [cropStart, setCropStart] = useState<Position | null>(null);
  const [cropRect, setCropRect] = useState<Rect | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  
  // Measure state
  const [measureStart, setMeasureStart] = useState<Position | null>(null);
  const [measureLine, setMeasureLine] = useState<Line | null>(null);
  const [measureDistance, setMeasureDistance] = useState<number | null>(null);
  const [showMeasureDialog, setShowMeasureDialog] = useState(false);
  
  // Grid state
  const [gridLines, setGridLines] = useState<Line[]>([]);
  // Right-click panning
  const isPanningRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    FabricImage.fromURL(imageUrl).then((img) => {
      const scale = Math.min(800 / img.width!, 600 / img.height!);
      img.scale(scale);
      canvas.backgroundImage = img;
      canvas.renderAll();
    });

    // Mouse wheel zoom
    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;
      canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
      setZoomLevel(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    };

    canvas.on("mouse:wheel", handleWheel);

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  // Prevent context menu on right-click over canvas
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("contextmenu", handler as any);
    return () => el.removeEventListener("contextmenu", handler as any);
  }, []);

  // Right mouse button panning
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2) {
        isPanningRef.current = true;
        fabricCanvas.setCursor("grabbing");
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isPanningRef.current) return;
      const e = opt.e as MouseEvent;
      const vpt = fabricCanvas.viewportTransform;
      if (!vpt) return;
      vpt[4] += e.movementX;
      vpt[5] += e.movementY;
      fabricCanvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        fabricCanvas.setCursor("default");
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
    };
  }, [fabricCanvas]);

  // Handle crop mode
  useEffect(() => {
    if (!fabricCanvas || mode !== "crop") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

      const handleMouseDown = (opt: any) => {
        // Only respond to left-clicks for crop
        if (opt.e.button !== 0) return;

        const pointer = fabricCanvas.getPointer(opt.e);
        
        if (!cropStart) {
          // First click
          setCropStart({ x: pointer.x, y: pointer.y });
          
          const rect = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: "rgba(0, 123, 255, 0.1)",
            stroke: "blue",
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            excludeFromExport: true,
          });
          
          fabricCanvas.add(rect);
          setCropRect(rect);
        } else {
          // Second click - finalize crop
          setShowCropDialog(true);
        }
      };

    const handleMouseMove = (opt: any) => {
      if (!cropStart || !cropRect) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = pointer.x - cropStart.x;
      const height = pointer.y - cropStart.y;
      
      cropRect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : cropStart.x,
        top: height < 0 ? pointer.y : cropStart.y,
      });
      
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, cropStart, cropRect]);

  // Handle measure mode
  useEffect(() => {
    if (!fabricCanvas || mode !== "measure") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      // Only respond to left-clicks for measure
      if (opt.e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      
      if (!measureStart) {
        // First click
        setMeasureStart({ x: pointer.x, y: pointer.y });
        
        const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: "red",
          strokeWidth: 2,
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        
        fabricCanvas.add(line);
        setMeasureLine(line);
      } else {
        // Second click - calculate distance
        const distance = Math.sqrt(
          Math.pow(pointer.x - measureStart.x, 2) + 
          Math.pow(pointer.y - measureStart.y, 2)
        );
        setMeasureDistance(distance);
        setShowMeasureDialog(true);
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!measureStart || !measureLine) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      measureLine.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      
      fabricCanvas.renderAll();
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
    };
  }, [fabricCanvas, mode, measureStart, measureLine]);

  // Reset mode to select
  useEffect(() => {
    if (!fabricCanvas || mode === "crop" || mode === "measure") return;
    
    fabricCanvas.selection = true;
    fabricCanvas.defaultCursor = "default";
  }, [fabricCanvas, mode]);

  // Handle grid rendering
  useEffect(() => {
    if (!fabricCanvas || !showGrid || !scale) return;

    // Remove old grid lines
    gridLines.forEach(line => fabricCanvas.remove(line));
    setGridLines([]);

    const gridSizePx = parseFloat(gridSize) * scale;
    const newGridLines: Line[] = [];

    // Vertical lines
    for (let x = 0; x < fabricCanvas.width!; x += gridSizePx) {
      const line = new Line([x, 0, x, fabricCanvas.height!], {
        stroke: "#888888",
        strokeWidth: 1,
        opacity: 0.3,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(line);
      newGridLines.push(line);
    }

    // Horizontal lines
    for (let y = 0; y < fabricCanvas.height!; y += gridSizePx) {
      const line = new Line([0, y, fabricCanvas.width!, y], {
        stroke: "#888888",
        strokeWidth: 1,
        opacity: 0.3,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      fabricCanvas.add(line);
      newGridLines.push(line);
    }

    setGridLines(newGridLines);
    fabricCanvas.renderAll();

    return () => {
      newGridLines.forEach(line => fabricCanvas.remove(line));
    };
  }, [fabricCanvas, showGrid, scale, gridSize]);

  const handleCrop = () => {
    if (mode === "crop") {
      cancelCrop();
    } else {
      setMode("crop");
      toast.info("Click first corner, then second corner to select crop area");
    }
  };

  const cancelCrop = () => {
    if (cropRect && fabricCanvas) {
      fabricCanvas.remove(cropRect);
    }
    setCropStart(null);
    setCropRect(null);
    setMode("select");
  };

  const handleCropExtract = () => {
    if (!fabricCanvas || !cropRect) return;
    
    // Compute crop bounds
    const left = cropRect.left ?? 0;
    const top = cropRect.top ?? 0;
    const width = (cropRect.width ?? 0) * (cropRect.scaleX ?? 1);
    const height = (cropRect.height ?? 0) * (cropRect.scaleY ?? 1);
    if (width <= 0 || height <= 0) {
      toast.error("Invalid crop area");
      return;
    }

    // Export cropped region as image (grid/crop handles are excluded from export)
    const dataUrl = fabricCanvas.toDataURL({
      left,
      top,
      width,
      height,
      format: "png",
      multiplier: 1,
    });

    // Send to parent to open as new sheet
    onExtract?.(dataUrl);
    toast.success("Extracted to new sheet");
    
    // Clean up
    fabricCanvas.remove(cropRect);
    setCropStart(null);
    setCropRect(null);
    setShowCropDialog(false);
    setMode("select");
  };

  const handleMeasure = () => {
    if (mode === "measure") {
      cancelMeasure();
    } else {
      setMode("measure");
      toast.info("Click first point, then second point to measure distance");
    }
  };

  const cancelMeasure = () => {
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    setMeasureStart(null);
    setMeasureLine(null);
    setMeasureDistance(null);
    setMode("select");
  };

  const handleMeasureSubmit = (realWorldMm: number) => {
    if (!measureDistance) return;
    
    const pixelsPerMm = measureDistance / realWorldMm;
    setScale(pixelsPerMm);
    toast.success(`Scale set: ${pixelsPerMm.toFixed(2)} pixels per mm`);
    
    // Remove the red measurement line
    if (measureLine && fabricCanvas) {
      fabricCanvas.remove(measureLine);
    }
    
    setShowMeasureDialog(false);
    setMeasureStart(null);
    setMeasureLine(null);
    setMeasureDistance(null);
    setMode("select");
  };

  const toggleGrid = () => {
    if (!scale) {
      toast.warning("Please set scale using Measure tool first");
      return;
    }
    setShowGrid(!showGrid);
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col">
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={mode === "crop" ? "default" : "outline"}
              size="sm"
              onClick={handleCrop}
            >
              {mode === "crop" ? <X className="w-4 h-4 mr-2" /> : <Crop className="w-4 h-4 mr-2" />}
              {mode === "crop" ? "Cancel" : "Crop"}
            </Button>
            <Button
              variant={mode === "measure" ? "default" : "outline"}
              size="sm"
              onClick={handleMeasure}
            >
              {mode === "measure" ? <X className="w-4 h-4 mr-2" /> : <Ruler className="w-4 h-4 mr-2" />}
              {mode === "measure" ? "Cancel" : "Measure"}
            </Button>
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={toggleGrid}
              disabled={!scale}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid
            </Button>
            {showGrid && (
              <div className="flex items-center gap-2 ml-4">
                <Label htmlFor="gridSize" className="text-sm whitespace-nowrap">
                  Grid (mm):
                </Label>
                <Input
                  id="gridSize"
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(e.target.value)}
                  className="w-20"
                />
              </div>
            )}
            <div className="flex items-center gap-4 ml-4">
              {scale && (
                <span className="text-sm text-muted-foreground">
                  Scale: {scale.toFixed(2)} px/mm
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Zoom: {(zoomLevel * 100).toFixed(0)}%
              </span>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => fabricCanvas && onExport(fabricCanvas)}
              className="ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </Card>

        <div className="flex-1 border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Crop Dialog */}
      <AlertDialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extract to New Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to extract the selected area to a new sheet?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelCrop}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleCropExtract}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Measure Dialog */}
      <AlertDialog open={showMeasureDialog} onOpenChange={setShowMeasureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Scale</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the real-world distance in millimeters for the measured line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4">
            <Label htmlFor="realDistance">Distance (mm):</Label>
            <Input
              id="realDistance"
              type="number"
              placeholder="e.g., 1000"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  if (value > 0) handleMeasureSubmit(value);
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelMeasure}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const input = document.getElementById("realDistance") as HTMLInputElement;
                const value = parseFloat(input.value);
                if (value > 0) handleMeasureSubmit(value);
              }}
            >
              Set Scale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
