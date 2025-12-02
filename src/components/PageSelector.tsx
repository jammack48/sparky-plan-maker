import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ZoomIn, ChevronLeft, ChevronRight, Home, X, Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PageSelectorProps {
  pages: string[];
  onSelect: (selectedPages: number[]) => void;
  onCancel?: () => void;
  onHome?: () => void;
  onAddMore?: () => void;
}

export const PageSelector = ({ pages, onSelect, onCancel, onHome, onAddMore }: PageSelectorProps) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [previewPage, setPreviewPage] = useState<number | null>(null);

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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          {onHome && (
            <Button
              variant="outline"
              size="icon"
              onClick={onHome}
              aria-label="Home"
            >
              <Home className="w-4 h-4" />
            </Button>
          )}
          {onCancel && (
            <Button
              variant="outline"
              size="icon"
              onClick={onCancel}
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold text-foreground">Select Pages</h2>
          {onAddMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddMore}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add more files
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewPage(index);
              }}
              className="absolute top-2 left-2 bg-background/90 hover:bg-background rounded-full p-1.5 transition-colors shadow-md"
              aria-label="Preview page"
            >
              <ZoomIn className="w-4 h-4 text-foreground" />
            </button>
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
        <div className="p-6 border-t border-border bg-background">
          <Button onClick={handleContinue} disabled={selected.length === 0} className="w-full">
            Continue with {selected.length} page{selected.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      <Dialog open={previewPage !== null} onOpenChange={() => setPreviewPage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
          {previewPage !== null && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                    disabled={previewPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Page {previewPage + 1} of {pages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPreviewPage(Math.min(pages.length - 1, previewPage + 1))}
                    disabled={previewPage === pages.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant={selected.includes(previewPage) ? "secondary" : "default"}
                  onClick={() => {
                    togglePage(previewPage);
                  }}
                >
                  {selected.includes(previewPage) ? (
                    <>
                      <Check className="w-4 h-4" />
                      Selected
                    </>
                  ) : (
                    "Select This Page"
                  )}
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
                <img
                  src={pages[previewPage]}
                  alt={`Page ${previewPage + 1} preview`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
