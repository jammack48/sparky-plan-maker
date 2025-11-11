import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Crop, Ruler, Grid3x3, Download, X, Eraser, Undo2, Redo2, ChevronDown, Settings, Lock, Unlock, Layers, RotateCcw, RotateCw } from "lucide-react";

interface CanvasToolbarProps {
  mode: "none" | "select" | "move" | "crop" | "measure" | "erase" | "place-symbol" | "draw";
  scale: number | null;
  showGrid: boolean;
  lockBackground: boolean;
  showTitleBlock: boolean;
  gridSize: string;
  gridColor: string;
  gridThickness: number;
  gridOpacity: number;
  zoomLevel: number;
  undoStackLength: number;
  redoStackLength: number;
  onSelect: () => void;
  onMove: () => void;
  onCrop: () => void;
  onMeasure: () => void;
  onErase: () => void;
  onToggleGrid: () => void;
  onToggleTitleBlock: (show: boolean) => void;
  onLockBackground: (locked: boolean) => void;
  onGridSizeChange: (value: string) => void;
  onGridColorChange: (value: string) => void;
  onGridThicknessChange: (value: number) => void;
  onGridOpacityChange: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onPageSetup: () => void;
  onSelectAll: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotateBackgroundLeft: () => void;
  onRotateBackgroundRight: () => void;
}

export const CanvasToolbar = ({
  mode,
  scale,
  showGrid,
  lockBackground,
  showTitleBlock,
  gridSize,
  gridColor,
  gridThickness,
  gridOpacity,
  zoomLevel,
  undoStackLength,
  redoStackLength,
  onSelect,
  onMove,
  onCrop,
  onMeasure,
  onErase,
  onToggleGrid,
  onToggleTitleBlock,
  onLockBackground,
  onGridSizeChange,
  onGridColorChange,
  onGridThicknessChange,
  onGridOpacityChange,
  onUndo,
  onRedo,
  onExport,
  onPageSetup,
  onSelectAll,
  onRotateLeft,
  onRotateRight,
  onRotateBackgroundLeft,
  onRotateBackgroundRight,
}: CanvasToolbarProps) => {
  return (
    <Card className="p-2 sm:p-3 mb-2 sm:mb-3 overflow-x-auto relative z-10" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 sm:gap-2 flex-nowrap min-w-max">
        <Button
          variant={mode === "select" ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
        >
          Select
        </Button>
        <Button
          variant={mode === "move" ? "default" : "outline"}
          size="sm"
          onClick={onMove}
        >
          Move
        </Button>
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
          variant={lockBackground ? "outline" : "default"}
          size="sm"
          onClick={() => onLockBackground(!lockBackground)}
          title={lockBackground ? "Background Locked - Click to Unlock" : "Background Unlocked - Click to Lock"}
        >
          {lockBackground ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
          {lockBackground ? "Locked" : "Unlocked"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          title="Select All (excludes background when locked)"
        >
          <Layers className="w-4 h-4 mr-2" />
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotateLeft}
          title="Rotate selection 90° CCW"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotateRight}
          title="Rotate selection 90° CW"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotateBackgroundLeft}
          title="Rotate background 90° CCW"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> BG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotateBackgroundRight}
          title="Rotate background 90° CW"
        >
          <RotateCw className="w-4 h-4 mr-2" /> BG
        </Button>
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
        <div className="flex items-center gap-2 ml-2">
          <Switch
            id="title-block-toggle"
            checked={showTitleBlock}
            onCheckedChange={onToggleTitleBlock}
          />
          <Label htmlFor="title-block-toggle" className="text-sm whitespace-nowrap cursor-pointer">
            Title Block
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onPageSetup}
        >
          <Settings className="w-4 h-4 mr-2" />
          Page Setup
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
