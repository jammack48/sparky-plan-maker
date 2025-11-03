import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CanvasDialogsProps {
  showCropDialog: boolean;
  showMeasureDialog: boolean;
  onCropDialogChange: (open: boolean) => void;
  onMeasureDialogChange: (open: boolean) => void;
  onCropExtract: () => void;
  onCancelCrop: () => void;
  onMeasureSubmit: (value: number) => void;
  onCancelMeasure: () => void;
}

export const CanvasDialogs = ({
  showCropDialog,
  showMeasureDialog,
  onCropDialogChange,
  onMeasureDialogChange,
  onCropExtract,
  onCancelCrop,
  onMeasureSubmit,
  onCancelMeasure,
}: CanvasDialogsProps) => {
  return (
    <>
      {/* Crop Dialog */}
      <AlertDialog open={showCropDialog} onOpenChange={onCropDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Extract to New Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to extract the selected area to a new sheet?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelCrop}>No</AlertDialogCancel>
            <AlertDialogAction onClick={onCropExtract}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Measure Dialog */}
      <AlertDialog open={showMeasureDialog} onOpenChange={onMeasureDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Scale</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the real-world distance in millimeters for the measured line.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4">
            <Label htmlFor="realDistance">Distance (mm):</Label>
            <Input
              id="realDistance"
              type="number"
              placeholder="e.g., 1000"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = parseFloat((e.target as HTMLInputElement).value);
                  if (value > 0) onMeasureSubmit(value);
                }
              }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelMeasure}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const input = document.getElementById("realDistance") as HTMLInputElement;
                const value = parseFloat(input.value);
                if (value > 0) onMeasureSubmit(value);
              }}
            >
              Set Scale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
