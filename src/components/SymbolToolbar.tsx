import { Lightbulb, Plug, ToggleLeft, Wifi, Flame, Cable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface SymbolType {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

interface SymbolToolbarProps {
  symbols: SymbolType[];
  onSymbolSelect: (symbolId: string) => void;
  selectedSymbol: string | null;
}

export const SymbolToolbar = ({ symbols, onSymbolSelect, selectedSymbol }: SymbolToolbarProps) => {
  return (
    <Card className="p-4 space-y-2">
      <h3 className="font-semibold mb-3 text-foreground">Symbols</h3>
      {symbols.map((symbol) => (
        <Button
          key={symbol.id}
          variant={selectedSymbol === symbol.id ? "default" : "outline"}
          className="w-full justify-between"
          onClick={() => onSymbolSelect(symbol.id)}
        >
          <span className="flex items-center gap-2">
            {symbol.icon}
            {symbol.name}
          </span>
          <span className="text-xs">{symbol.count}</span>
        </Button>
      ))}
    </Card>
  );
};

export const DEFAULT_SYMBOLS: SymbolType[] = [
  { id: "light", name: "Light", icon: <Lightbulb className="w-4 h-4" />, count: 0 },
  { id: "power", name: "Power", icon: <Plug className="w-4 h-4" />, count: 0 },
  { id: "switch", name: "Switch", icon: <ToggleLeft className="w-4 h-4" />, count: 0 },
  { id: "data", name: "Data", icon: <Wifi className="w-4 h-4" />, count: 0 },
  { id: "smoke", name: "Smoke", icon: <Flame className="w-4 h-4" />, count: 0 },
  { id: "cable", name: "Cable", icon: <Cable className="w-4 h-4" />, count: 0 },
];
