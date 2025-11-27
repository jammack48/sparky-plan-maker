import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExportPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPages: number;
  onExport: (pageIndices: number[]) => void;
}

export const ExportPdfDialog = ({ open, onOpenChange, totalPages, onExport }: ExportPdfDialogProps) => {
  const [selectedPages, setSelectedPages] = useState<number[]>(() => 
    Array.from({ length: totalPages }, (_, i) => i)
  );

  const handleTogglePage = (pageIndex: number) => {
    setSelectedPages(prev => 
      prev.includes(pageIndex)
        ? prev.filter(i => i !== pageIndex)
        : [...prev, pageIndex].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i));
  };

  const handleSelectNone = () => {
    setSelectedPages([]);
  };

  const handleExport = () => {
    if (selectedPages.length === 0) {
      return;
    }
    onExport(selectedPages);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export to PDF</DialogTitle>
          <DialogDescription>
            Select which pages to include in the PDF export
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              Clear All
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-3">
              {Array.from({ length: totalPages }, (_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`page-${i}`}
                    checked={selectedPages.includes(i)}
                    onCheckedChange={() => handleTogglePage(i)}
                  />
                  <Label
                    htmlFor={`page-${i}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Page {i + 1}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            {selectedPages.length} of {totalPages} page{totalPages !== 1 ? 's' : ''} selected
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedPages.length === 0}>
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
