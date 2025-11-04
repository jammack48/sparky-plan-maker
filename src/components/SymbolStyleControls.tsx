import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Palette, Minus, Eye, Maximize, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SymbolStyleControlsProps {
  color: string;
  thickness: number;
  transparency: number;
  scale: number;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onTransparencyChange: (transparency: number) => void;
  onScaleChange: (scale: number) => void;
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
}: SymbolStyleControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-4 space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Symbol Style</h3>
          <CollapsibleTrigger asChild className="portrait:flex landscape:hidden md:hidden">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        
        {/* Always show on desktop and landscape, collapsible on portrait mobile */}
        <div className="portrait:hidden landscape:block md:block space-y-4 mt-4">
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
        </div>

        {/* Collapsible content for portrait mobile */}
        <CollapsibleContent className="portrait:block landscape:hidden md:hidden space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <Label htmlFor="symbol-color-mobile" className="text-sm">Color</Label>
            </div>
            <Input
              id="symbol-color-mobile"
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-10 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4" />
              <Label htmlFor="symbol-thickness-mobile" className="text-sm">Thickness</Label>
              <span className="ml-auto text-xs text-muted-foreground">{thickness}px</span>
            </div>
            <Slider
              id="symbol-thickness-mobile"
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
              <Label htmlFor="symbol-transparency-mobile" className="text-sm">Opacity</Label>
              <span className="ml-auto text-xs text-muted-foreground">{Math.round(transparency * 100)}%</span>
            </div>
            <Slider
              id="symbol-transparency-mobile"
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
              <Label htmlFor="symbol-scale-mobile" className="text-sm">Scale</Label>
              <span className="ml-auto text-xs text-muted-foreground">{scale.toFixed(1)}x</span>
            </div>
            <Slider
              id="symbol-scale-mobile"
              min={0.5}
              max={3}
              step={0.1}
              value={[scale]}
              onValueChange={(value) => onScaleChange(value[0])}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
