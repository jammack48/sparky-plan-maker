import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, Point } from "fabric";
import { CanvasToolbar } from "./CanvasToolbar";
import { CanvasDialogs } from "./CanvasDialogs";
import { GridOverlay } from "./GridOverlay";
import { useCropMode } from "@/hooks/useCropMode";
import { useMeasureMode } from "@/hooks/useMeasureMode";
import { useEraseMode } from "@/hooks/useEraseMode";
import { useSymbolPlacement } from "@/hooks/useSymbolPlacement";
import { useSymbolCreation } from "@/hooks/useSymbolCreation";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { toast } from "sonner";

export interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: () => void;
  onExtract: (dataUrl: string) => void;
  selectedSymbol: string | null;
  onSymbolPlaced?: (symbolId: string) => void;
  onSymbolDeselect?: () => void;
  symbolColor?: string;
  symbolThickness?: number;
  symbolTransparency?: number;
  symbolScale?: number;
}

export const CanvasWorkspace = ({
  imageUrl,
  onExtract,
  selectedSymbol,
  onSymbolPlaced,
  onSymbolDeselect,
  symbolColor = "#000000",
  symbolThickness = 2,
  symbolTransparency = 1,
  symbolScale = 1,
}: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure" | "erase" | "place-symbol">("select");
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState("1000");
  const [gridColor, setGridColor] = useState("#ff0000");
  const [gridThickness, setGridThickness] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [scale, setScale] = useState<number | null>(null);
  const [bgScale, setBgScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [gridUpdateTrigger, setGridUpdateTrigger] = useState(0);

  const { createSymbol } = useSymbolCreation(symbolColor, symbolThickness, symbolTransparency, symbolScale);
  const { undoStack, redoStack, saveCanvasState, handleUndo, handleRedo } = useUndoRedo(fabricCanvas);

  useEffect(() => {
    if (selectedSymbol) {
      setMode("place-symbol");
    } else if (mode === "place-symbol") {
      setMode("select");
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "#f5f5f5",
      selection: true,
    });

    setFabricCanvas(canvas);

    const handleResize = () => {
      if (!containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      canvas.renderAll();
      setGridUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas || !imageUrl) return;

    try {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#f5f5f5";
    } catch (e) {
      console.error("Canvas clear error:", e);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fabricImage = new FabricImage(img, {
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        objectCaching: true,
      });

      const canvasWidth = fabricCanvas.getWidth();
      const canvasHeight = fabricCanvas.getHeight();
      const imgAspect = img.width / img.height;
      const canvasAspect = canvasWidth / canvasHeight;

      let scaleFactor;
      if (imgAspect > canvasAspect) {
        scaleFactor = (canvasWidth * 0.9) / img.width;
      } else {
        scaleFactor = (canvasHeight * 0.9) / img.height;
      }

      fabricImage.scale(scaleFactor);
      setBgScale(scaleFactor);

      const scaledWidth = img.width * scaleFactor;
      const scaledHeight = img.height * scaleFactor;
      fabricImage.set({
        left: (canvasWidth - scaledWidth) / 2,
        top: (canvasHeight - scaledHeight) / 2,
      });

      fabricCanvas.add(fabricImage);
      fabricCanvas.sendObjectToBack(fabricImage);
      fabricCanvas.renderAll();
      saveCanvasState();
    };
    img.src = imageUrl;
  }, [fabricCanvas, imageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const handleWheel = (opt: any) => {
      const delta = opt.e.deltaY;
      let newZoom = fabricCanvas.getZoom();
      newZoom *= 0.999 ** delta;
      newZoom = Math.min(Math.max(0.1, newZoom), 20);
      fabricCanvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      fabricCanvas.renderAll();
      setZoom(newZoom);
      setGridUpdateTrigger(prev => prev + 1);
    };

    const handleMouseDown = (opt: any) => {
      if (opt.e.altKey || opt.e.button === 1) {
        (fabricCanvas as any).isDragging = true;
        fabricCanvas.selection = false;
        (fabricCanvas as any).lastPosX = opt.e.clientX;
        (fabricCanvas as any).lastPosY = opt.e.clientY;
        fabricCanvas.defaultCursor = "grabbing";
      }
    };

    const handleMouseMove = (opt: any) => {
      if ((fabricCanvas as any).isDragging) {
        const vpt = fabricCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += opt.e.clientX - (fabricCanvas as any).lastPosX;
          vpt[5] += opt.e.clientY - (fabricCanvas as any).lastPosY;
          fabricCanvas.requestRenderAll();
          (fabricCanvas as any).lastPosX = opt.e.clientX;
          (fabricCanvas as any).lastPosY = opt.e.clientY;
          setGridUpdateTrigger(prev => prev + 1);
        }
      }
    };

    const handleMouseUp = () => {
      fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform!);
      (fabricCanvas as any).isDragging = false;
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = mode === "place-symbol" ? "none" : "default";
    };

    fabricCanvas.on("mouse:wheel", handleWheel);
    fabricCanvas.on("mouse:down", handleMouseDown);
    fabricCanvas.on("mouse:move", handleMouseMove);
    fabricCanvas.on("mouse:up", handleMouseUp);

    return () => {
      fabricCanvas.off("mouse:wheel", handleWheel);
      fabricCanvas.off("mouse:down", handleMouseDown);
      fabricCanvas.off("mouse:move", handleMouseMove);
      fabricCanvas.off("mouse:up", handleMouseUp);
    };
  }, [fabricCanvas, mode]);

  useEffect(() => {
    if (!fabricCanvas || !scale || !showGrid) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if (!obj || (obj as any).isPreview) return;

      const baseSpacing = parseFloat(gridSize) * scale;
      if (baseSpacing > 0 && (e.e.ctrlKey || e.e.metaKey)) {
        const left = Math.round(obj.left / baseSpacing) * baseSpacing;
        const top = Math.round(obj.top / baseSpacing) * baseSpacing;
        obj.set({ left, top });
      }
    };

    fabricCanvas.on("object:moving", handleObjectMoving);

    return () => {
      fabricCanvas.off("object:moving", handleObjectMoving);
    };
  }, [fabricCanvas, scale, showGrid, gridSize]);

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [showMeasureDialog, setShowMeasureDialog] = useState(false);
  const [measureDistance, setMeasureDistance] = useState(0);

  const handleCropExtract = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj && activeObj.type === "rect") {
      const dataUrl = fabricCanvas.toDataURL({
        left: activeObj.left,
        top: activeObj.top,
        width: activeObj.width! * activeObj.scaleX!,
        height: activeObj.height! * activeObj.scaleY!,
        multiplier: 1,
      });
      onExtract(dataUrl);
      fabricCanvas.remove(activeObj);
      setShowCropDialog(false);
      setMode("select");
    }
  }, [fabricCanvas, onExtract]);

  const handleMeasureSubmit = useCallback((realDistance: number) => {
    if (measureDistance > 0) {
      const calculatedScale = realDistance / measureDistance;
      setScale(calculatedScale);
      toast.success(`Scale set: ${realDistance}mm = ${measureDistance.toFixed(0)}px`);
    }
    setShowMeasureDialog(false);
    setMode("select");
  }, [measureDistance]);

  useCropMode(fabricCanvas, mode, () => setShowCropDialog(true));
  useMeasureMode(fabricCanvas, mode, () => setShowMeasureDialog(true));
  useEraseMode(fabricCanvas, mode, saveCanvasState);
  useSymbolPlacement(
    fabricCanvas,
    mode,
    selectedSymbol,
    showGrid,
    scale,
    bgScale,
    gridSize,
    createSymbol,
    onSymbolPlaced,
    onSymbolDeselect,
    saveCanvasState,
    setMode
  );

  const gridSpacing = scale && showGrid ? parseFloat(gridSize) * scale * zoom : 0;
  
  const gridOffset = (() => {
    if (!fabricCanvas || !scale || !showGrid || gridSpacing <= 0) {
      return { x: 0, y: 0 };
    }

    const vpt = fabricCanvas.viewportTransform;
    if (!vpt || !containerRef.current || !fabricCanvas.upperCanvasEl) {
      return { x: 0, y: 0 };
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasRect = fabricCanvas.upperCanvasEl.getBoundingClientRect();
    
    const canvasOffsetX = canvasRect.left - containerRect.left;
    const canvasOffsetY = canvasRect.top - containerRect.top;

    const offsetX = (canvasOffsetX + (vpt[4] % gridSpacing) + gridSpacing) % gridSpacing;
    const offsetY = (canvasOffsetY + (vpt[5] % gridSpacing) + gridSpacing) % gridSpacing;

    return { x: offsetX, y: offsetY };
  })();

  const handleModeChange = (newMode: "crop" | "measure" | "erase") => {
    if (mode === newMode) {
      setMode("select");
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CanvasToolbar
        mode={mode}
        scale={scale}
        showGrid={showGrid}
        gridSize={gridSize}
        gridColor={gridColor}
        gridThickness={gridThickness}
        gridOpacity={gridOpacity}
        zoomLevel={zoom}
        undoStackLength={undoStack.length}
        redoStackLength={redoStack.length}
        onCrop={() => handleModeChange("crop")}
        onMeasure={() => handleModeChange("measure")}
        onErase={() => handleModeChange("erase")}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onGridSizeChange={setGridSize}
        onGridColorChange={setGridColor}
        onGridThicknessChange={setGridThickness}
        onGridOpacityChange={setGridOpacity}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={() => toast.info("Export coming soon")}
      />

      <div ref={containerRef} className="relative flex-1 bg-muted">
        <canvas ref={canvasRef} />
        <GridOverlay
          showGrid={showGrid}
          gridSpacing={gridSpacing}
          gridOffset={gridOffset}
          gridLineColor={gridColor}
          gridLineThickness={`${gridThickness}px`}
        />
      </div>

      <CanvasDialogs
        showCropDialog={showCropDialog}
        showMeasureDialog={showMeasureDialog}
        onCropDialogChange={setShowCropDialog}
        onMeasureDialogChange={setShowMeasureDialog}
        onCropExtract={handleCropExtract}
        onCancelCrop={() => {
          setShowCropDialog(false);
          setMode("select");
        }}
        onMeasureSubmit={handleMeasureSubmit}
        onCancelMeasure={() => {
          setShowMeasureDialog(false);
          setMode("select");
        }}
      />
    </div>
  );
};
