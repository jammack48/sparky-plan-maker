import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PageSelectorProps {
  pages: string[];
  onSelect: (selectedPages: number[]) => void;
}

export const PageSelector = ({ pages, onSelect }: PageSelectorProps) => {
  const [selected, setSelected] = useState<number[]>([]);

  const togglePage = (index: number) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((p) => p !== index) : [...prev, index]
    );
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      onSelect(selected.sort((a, b) => a - b));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Select Pages</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {pages.map((pageUrl, index) => (
          <div
            key={index}
            onClick={() => togglePage(index)}
            className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
              selected.includes(index)
                ? "border-primary ring-2 ring-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <img src={pageUrl} alt={`Page ${index + 1}`} className="w-full" />
            {selected.includes(index) && (
              <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-card/90 p-2 text-center text-sm">
              Page {index + 1}
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleContinue} disabled={selected.length === 0} className="w-full">
        Continue with {selected.length} page{selected.length !== 1 ? "s" : ""}
      </Button>
    </div>
  );
};
