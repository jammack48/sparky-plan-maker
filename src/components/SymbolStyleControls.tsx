import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Palette, Minus, Eye, Maximize } from "lucide-react";

interface SymbolStyleControlsProps {
  color: string;
  thickness: number;
  transparency: number;
  scale: number;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onTransparencyChange: (transparency: number) => void;
  onScaleChange: (scale: number) => void;
  colorHistory?: string[];
}

export const SymbolStyleControls = ({
  color,
  thickness,
  transparency,
  scale,
  onColorChange,
  onThicknessChange,
  onTransparencyChange,
  onScaleChange,
  colorHistory = [],
}: SymbolStyleControlsProps) => {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-sm">Symbol Style</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label htmlFor="symbol-color" className="text-sm">Color</Label>
        </div>
        <Input
          id="symbol-color"
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="h-10 cursor-pointer"
        />
        {colorHistory.length > 0 && (
          <div className="flex gap-1 mt-2">
            {colorHistory.map((historyColor, index) => (
              <button
                key={index}
                onClick={() => onColorChange(historyColor)}
                className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: historyColor }}
                title={`Recent color: ${historyColor}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Minus className="w-4 h-4" />
          <Label htmlFor="symbol-thickness" className="text-sm">Thickness</Label>
          <span className="ml-auto text-xs text-muted-foreground">{thickness}px</span>
        </div>
        <Slider
          id="symbol-thickness"
          min={1}
          max={10}
          step={1}
          value={[thickness]}
          onValueChange={(value) => onThicknessChange(value[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <Label htmlFor="symbol-transparency" className="text-sm">Opacity</Label>
          <span className="ml-auto text-xs text-muted-foreground">{Math.round(transparency * 100)}%</span>
        </div>
        <Slider
          id="symbol-transparency"
          min={0}
          max={1}
          step={0.1}
          value={[transparency]}
          onValueChange={(value) => onTransparencyChange(value[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Maximize className="w-4 h-4" />
          <Label htmlFor="symbol-scale" className="text-sm">Scale</Label>
          <span className="ml-auto text-xs text-muted-foreground">{scale.toFixed(1)}x</span>
        </div>
        <Slider
          id="symbol-scale"
          min={0.5}
          max={3}
          step={0.1}
          value={[scale]}
          onValueChange={(value) => onScaleChange(value[0])}
        />
      </div>
    </Card>
  );
};
