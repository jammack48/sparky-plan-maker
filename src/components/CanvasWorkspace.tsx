import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Image as FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Crop, Ruler, Grid3x3, Download } from "lucide-react";
import { toast } from "sonner";

interface CanvasWorkspaceProps {
  imageUrl: string;
  pageNumber: number;
  onExport: (canvas: FabricCanvas) => void;
}

export const CanvasWorkspace = ({ imageUrl, pageNumber, onExport }: CanvasWorkspaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<"select" | "crop" | "measure">("select");
  const [scale, setScale] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<string>("100");
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    FabricImage.fromURL(imageUrl).then((img) => {
      img.scaleToWidth(800);
      canvas.backgroundImage = img;
      canvas.renderAll();
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  const handleCrop = () => {
    if (!fabricCanvas) return;
    setMode("crop");
    toast.info("Click and drag to select crop area");
  };

  const handleMeasure = () => {
    if (!fabricCanvas) return;
    setMode("measure");
    toast.info("Click two points to measure distance");
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
    // Grid rendering logic will be added
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
              <Crop className="w-4 h-4 mr-2" />
              Crop
            </Button>
            <Button
              variant={mode === "measure" ? "default" : "outline"}
              size="sm"
              onClick={handleMeasure}
            >
              <Ruler className="w-4 h-4 mr-2" />
              Measure
            </Button>
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={toggleGrid}
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
    </div>
  );
};
