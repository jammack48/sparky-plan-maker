import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette } from "lucide-react";

interface AreaColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  colorHistory?: string[];
}

export const AreaColorPicker = ({
  color,
  onColorChange,
  colorHistory = [],
}: AreaColorPickerProps) => {
  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4" />
        <Label htmlFor="area-color" className="text-sm">Area Fill Color</Label>
      </div>
      <Input
        id="area-color"
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-10 cursor-pointer"
      />
      {colorHistory.length > 0 && (
        <div className="flex gap-1">
          {colorHistory.map((historyColor, index) => (
            <button
              key={index}
              onClick={() => onColorChange(historyColor)}
              className="w-6 h-6 rounded border-2 border-border hover:border-primary transition-colors"
              style={{ backgroundColor: historyColor }}
              title={`Recent color: ${historyColor}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
