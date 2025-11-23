import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Palette, Minus, Type } from "lucide-react";

interface DistanceStyleControlsProps {
  color: string;
  strokeWidth: number;
  fontSize: number;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onFontSizeChange: (fontSize: number) => void;
}

export const DistanceStyleControls = ({
  color,
  strokeWidth,
  fontSize,
  onColorChange,
  onStrokeWidthChange,
  onFontSizeChange,
}: DistanceStyleControlsProps) => {
  return (
    <Card className="p-4 space-y-4 relative z-10" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <h3 className="font-semibold text-sm">Distance Style</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label htmlFor="distance-color" className="text-sm">Color</Label>
        </div>
        <Input
          id="distance-color"
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="h-10 cursor-pointer"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Minus className="w-4 h-4" />
          <Label htmlFor="distance-stroke" className="text-sm">Line Thickness</Label>
          <span className="ml-auto text-xs text-muted-foreground">{strokeWidth}px</span>
        </div>
        <Slider
          id="distance-stroke"
          min={1}
          max={10}
          step={1}
          value={[strokeWidth]}
          onValueChange={(value) => onStrokeWidthChange(value[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4" />
          <Label htmlFor="distance-font" className="text-sm">Text Size</Label>
          <span className="ml-auto text-xs text-muted-foreground">{fontSize}px</span>
        </div>
        <Slider
          id="distance-font"
          min={10}
          max={32}
          step={2}
          value={[fontSize]}
          onValueChange={(value) => onFontSizeChange(value[0])}
        />
      </div>
    </Card>
  );
};
