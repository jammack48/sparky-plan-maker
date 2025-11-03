import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Line, Image as FabricImage, FabricObject, Point } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Crop, Ruler, Grid3x3, Download, X, Eraser, Undo2, Redo2 } from "lucide-react";
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
  onExtract?: (dataUrl: string) => void;
}

interface Position {
  x: number;
  y: number;
}

export const CanvasWorkspace = ({ imageUrl, pageNumber, onExport, onExtract }: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure" | "erase">("select");
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
  
  // Eraser state
  const [eraseStart, setEraseStart] = useState<Position | null>(null);
  const [eraseRect, setEraseRect] = useState<Rect | null>(null);
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  
  // Right-click panning
  const isPanningRef = useRef(false);
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
      
      // Save initial state after background loads
      saveCanvasState(canvas);
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

  // Save canvas state for undo/redo
  const saveCanvasState = (canvas?: FabricCanvas) => {
    const targetCanvas = canvas || fabricCanvas;
    if (!targetCanvas) return;
    
    const json = JSON.stringify(targetCanvas.toJSON());
    setUndoStack(prev => [...prev, json]);
    setRedoStack([]); // Clear redo stack on new action
  };

  // Undo functionality
  const handleUndo = () => {
    if (!fabricCanvas || undoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(previousState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  // Redo functionality
  const handleRedo = () => {
    if (!fabricCanvas || redoStack.length === 0) return;
    
    const currentState = JSON.stringify(fabricCanvas.toJSON());
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
    });
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, undoStack, redoStack]);

  // Right mouse button panning
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2) {
        isPanningRef.current = true;
        fabricCanvas.setCursor("grabbing");
        e.preventDefault();
      }
    };

    const handleMouseMove = (opt: any) => {
      if (!isPanningRef.current) return;
      const e = opt.e as MouseEvent;
      
      // Direct viewport transform manipulation for reliable panning
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        vpt[4] += e.movementX;
        vpt[5] += e.movementY;
        fabricCanvas.setViewportTransform(vpt);
        fabricCanvas.requestRenderAll();
      }
    };

    const handleMouseUp = (opt: any) => {
      const e = opt.e as MouseEvent;
      if (e.button === 2 && isPanningRef.current) {
        isPanningRef.current = false;
        fabricCanvas.setCursor("default");
      }
    };

    // Document-level mouseup for reliability
    const handleDocMouseUp = (e: MouseEvent) => {
      if (e.button === 2 && isPanningRef.current) {
        isPanningRef.current = false;
        fabricCanvas.setCursor("default");
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    document.addEventListener("mouseup", handleDocMouseUp);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      document.removeEventListener("mouseup", handleDocMouseUp);
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

  // Handle erase mode
  useEffect(() => {
    if (!fabricCanvas || mode !== "erase") return;

    fabricCanvas.selection = false;
    fabricCanvas.defaultCursor = "crosshair";

    const handleMouseDown = (opt: any) => {
      // Only respond to left-clicks for erase
      if (opt.e.button !== 0) return;

      const pointer = fabricCanvas.getPointer(opt.e);
      setEraseStart({ x: pointer.x, y: pointer.y });
      
      const rect = new Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: "#ffffff",
        opacity: 0.7,
        selectable: false,
        evented: false,
      });
      
      fabricCanvas.add(rect);
      setEraseRect(rect);
    };

    const handleMouseMove = (opt: any) => {
      if (!eraseStart || !eraseRect) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      const width = pointer.x - eraseStart.x;
      const height = pointer.y - eraseStart.y;
      
      eraseRect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : eraseStart.x,
        top: height < 0 ? pointer.y : eraseStart.y,
      });
      
      fabricCanvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!eraseStart || !eraseRect) return;
      
      // Finalize the erase rectangle
      eraseRect.set({
        opacity: 1,
        selectable: true,
        evented: true,
      });
      
      fabricCanvas.renderAll();
      saveCanvasState(fabricCanvas);
      
      setEraseStart(null);
      setEraseRect(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && eraseRect) {
        fabricCanvas.remove(eraseRect);
        setEraseStart(null);
        setEraseRect(null);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fabricCanvas, mode, eraseStart, eraseRect]);

  // Reset mode to select
  useEffect(() => {
    if (!fabricCanvas || mode === "crop" || mode === "measure" || mode === "erase") return;
    
    fabricCanvas.selection = true;
    fabricCanvas.defaultCursor = "default";
  }, [fabricCanvas, mode]);


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

    // Remove crop rect before export to avoid dotted lines
    fabricCanvas.remove(cropRect);

    // Export cropped region as image
    const dataUrl = fabricCanvas.toDataURL({
      left,
      top,
      width,
      height,
      format: "png",
      multiplier: 4, // Higher quality for readability
    });

    // Send to parent to open as new sheet
    onExtract?.(dataUrl);
    toast.success("Extracted to new sheet");
    
    // Clean up
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
    const ratio = (1 / pixelsPerMm).toFixed(1);
    setScale(pixelsPerMm);
    toast.success(`Scale set: 1:${ratio}`);
    
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

  const handleErase = () => {
    setMode(mode === "erase" ? "select" : "erase");
    if (mode !== "erase") {
      toast.info("Click and drag to white-out areas");
    }
  };

  // Calculate grid spacing for CSS overlay
  const gridSpacing = scale && showGrid ? parseFloat(gridSize) * scale * zoomLevel : 0;

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
              variant={mode === "erase" ? "default" : "outline"}
              size="sm"
              onClick={handleErase}
            >
              <Eraser className="w-4 h-4 mr-2" />
              Erase
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fabricCanvas && onExport(fabricCanvas)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <div className="flex items-center gap-4 ml-auto">
              {scale && (
                <span className="text-sm text-muted-foreground">
                  Scale: 1:{(1 / scale).toFixed(1)}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                Zoom: {(zoomLevel * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </Card>

        <div 
          ref={containerRef}
          className="flex-1 border border-border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center relative"
        >
          <canvas ref={canvasRef} />
          {/* Fixed grid overlay */}
          {showGrid && gridSpacing > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(to right, rgba(136,136,136,0.3) 0, rgba(136,136,136,0.3) 1px, transparent 1px, transparent ${gridSpacing}px),
                  repeating-linear-gradient(to bottom, rgba(136,136,136,0.3) 0, rgba(136,136,136,0.3) 1px, transparent 1px, transparent ${gridSpacing}px)
                `,
                backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
              }}
            />
          )}
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
