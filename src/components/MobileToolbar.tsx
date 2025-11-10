import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Crop, 
  Ruler, 
  Grid3x3, 
  Download, 
  X, 
  Eraser, 
  Undo2, 
  Redo2, 
  Settings,
  Lock,
  Unlock,
  Wrench,
  Layers
} from "lucide-react";

interface MobileToolbarProps {
  mode: "none" | "select" | "move" | "crop" | "measure" | "erase" | "place-symbol" | "draw";
  scale: number | null;
  showGrid: boolean;
  showTitleBlock: boolean;
  lockBackground: boolean;
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
  onToggleLockBackground: (locked: boolean) => void;
  onGridSizeChange: (value: string) => void;
  onGridColorChange: (value: string) => void;
  onGridThicknessChange: (value: number) => void;
  onGridOpacityChange: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onPageSetup: () => void;
}

export const MobileToolbar = ({
  mode,
  scale,
  showGrid,
  showTitleBlock,
  lockBackground,
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
  onToggleLockBackground,
  onGridSizeChange,
  onGridColorChange,
  onGridThicknessChange,
  onGridOpacityChange,
  onUndo,
  onRedo,
  onExport,
  onPageSetup,
}: MobileToolbarProps) => {
  return (
    <div className="flex gap-2 p-2 bg-card border-b border-border">
      {/* Left side - Tools dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Wrench className="w-4 h-4 mr-2" />
            Tools
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 z-50">
          <div className="flex flex-col gap-2 p-2">
            <Button
              variant={mode === "select" ? "default" : "outline"}
              size="sm"
              onClick={onSelect}
              className="justify-start"
            >
              Select
            </Button>
            <Button
              variant={mode === "move" ? "default" : "outline"}
              size="sm"
              onClick={onMove}
              className="justify-start"
            >
              Move
            </Button>
            <Button
              variant={mode === "crop" ? "default" : "outline"}
              size="sm"
              onClick={onCrop}
              className="justify-start"
            >
              {mode === "crop" ? <X className="w-4 h-4 mr-2" /> : <Crop className="w-4 h-4 mr-2" />}
              {mode === "crop" ? "Cancel Crop" : "Crop"}
            </Button>
            <Button
              variant={mode === "measure" ? "default" : "outline"}
              size="sm"
              onClick={onMeasure}
              className="justify-start"
            >
              {mode === "measure" ? <X className="w-4 h-4 mr-2" /> : <Ruler className="w-4 h-4 mr-2" />}
              {mode === "measure" ? "Cancel" : "Measure"}
            </Button>
            <Button
              variant={mode === "erase" ? "default" : "outline"}
              size="sm"
              onClick={onErase}
              className="justify-start"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Erase
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Middle - Quick actions */}
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

      {/* Right side - Settings dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1">
            <Layers className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 z-50">
          <div className="p-3 space-y-4">
            {/* Lock background toggle */}
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm flex items-center gap-2">
                {lockBackground ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                Lock Background
              </Label>
              <Switch
                checked={lockBackground}
                onCheckedChange={onToggleLockBackground}
              />
            </div>

            {/* Grid toggle */}
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm flex items-center gap-2">
                <Grid3x3 className="w-4 h-4" />
                Show Grid
              </Label>
              <Switch
                checked={showGrid}
                onCheckedChange={onToggleGrid}
                disabled={!scale}
              />
            </div>

            {showGrid && (
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm">Grid Size (mm)</Label>
                  <Input
                    type="number"
                    value={gridSize}
                    onChange={(e) => onGridSizeChange(e.target.value)}
                    className="w-20"
                  />
                </div>
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
                  <Label className="text-sm">Thickness</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={gridThickness}
                    onChange={(e) => onGridThicknessChange(Number(e.target.value))}
                    className="w-16"
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
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {Math.round(gridOpacity * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Title block toggle */}
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm">Title Block</Label>
              <Switch
                checked={showTitleBlock}
                onCheckedChange={onToggleTitleBlock}
              />
            </div>

            {/* Page setup */}
            <Button
              variant="outline"
              size="sm"
              onClick={onPageSetup}
              className="w-full justify-start"
            >
              <Settings className="w-4 h-4 mr-2" />
              Page Setup
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>

            {/* Stats */}
            <div className="pt-2 border-t space-y-1">
              {scale && (
                <div className="text-xs text-muted-foreground">
                  Scale: 1:{(1 / scale).toFixed(1)}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Zoom: {(zoomLevel * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
