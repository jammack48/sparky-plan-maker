import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Crop, Ruler, Grid3x3, Download, X, Eraser, Undo2, Redo2, ChevronDown } from "lucide-react";

interface CanvasToolbarProps {
  mode: "select" | "crop" | "measure" | "erase" | "place-symbol";
  scale: number | null;
  showGrid: boolean;
  gridSize: string;
  gridColor: string;
  gridThickness: number;
  gridOpacity: number;
  zoomLevel: number;
  undoStackLength: number;
  redoStackLength: number;
  onCrop: () => void;
  onMeasure: () => void;
  onErase: () => void;
  onToggleGrid: () => void;
  onGridSizeChange: (value: string) => void;
  onGridColorChange: (value: string) => void;
  onGridThicknessChange: (value: number) => void;
  onGridOpacityChange: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

export const CanvasToolbar = ({
  mode,
  scale,
  showGrid,
  gridSize,
  gridColor,
  gridThickness,
  gridOpacity,
  zoomLevel,
  undoStackLength,
  redoStackLength,
  onCrop,
  onMeasure,
  onErase,
  onToggleGrid,
  onGridSizeChange,
  onGridColorChange,
  onGridThicknessChange,
  onGridOpacityChange,
  onUndo,
  onRedo,
  onExport,
}: CanvasToolbarProps) => {
  return (
    <Card className="p-4 mb-4 overflow-x-auto">
      <div className="flex items-center gap-2 flex-nowrap min-w-max">
        <Button
          variant={mode === "crop" ? "default" : "outline"}
          size="sm"
          onClick={onCrop}
        >
          {mode === "crop" ? <X className="w-4 h-4 mr-2" /> : <Crop className="w-4 h-4 mr-2" />}
          {mode === "crop" ? "Cancel" : "Crop"}
        </Button>
        <Button
          variant={mode === "measure" ? "default" : "outline"}
          size="sm"
          onClick={onMeasure}
        >
          {mode === "measure" ? <X className="w-4 h-4 mr-2" /> : <Ruler className="w-4 h-4 mr-2" />}
          {mode === "measure" ? "Cancel" : "Measure"}
        </Button>
        <Button
          variant={mode === "erase" ? "default" : "outline"}
          size="sm"
          onClick={onErase}
        >
          <Eraser className="w-4 h-4 mr-2" />
          Erase
        </Button>
        <Button
          variant={showGrid ? "default" : "outline"}
          size="sm"
          onClick={onToggleGrid}
          disabled={!scale}
        >
          <Grid3x3 className="w-4 h-4 mr-2" />
          Grid
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!scale} aria-label="Grid settings">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="z-50 w-64">
            <div className="p-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Color</Label>
                <input
                  type="color"
                  value={gridColor}
                  onChange={(e) => onGridColorChange(e.target.value)}
                  className="h-8 w-12 border rounded bg-background"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Thickness (px)</Label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={gridThickness}
                  onChange={(e) => onGridThicknessChange(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">Opacity</Label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={gridOpacity}
                  onChange={(e) => onGridOpacityChange(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(gridOpacity * 100)}%</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {showGrid && (
          <div className="flex items-center gap-2 ml-4">
            <Label htmlFor="gridSize" className="text-sm whitespace-nowrap">
              Grid (mm):
            </Label>
            <Input
              id="gridSize"
              type="number"
              value={gridSize}
              onChange={(e) => onGridSizeChange(e.target.value)}
              className="w-20"
            />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={undoStackLength === 0}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={redoStackLength === 0}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
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
  );
};
