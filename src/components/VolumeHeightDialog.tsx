import { useState } from "react";
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

interface VolumeHeightDialogProps {
  open: boolean;
  onConfirm: (height: number) => void;
  onCancel: () => void;
}

export const VolumeHeightDialog = ({ open, onConfirm, onCancel }: VolumeHeightDialogProps) => {
  const [height, setHeight] = useState("2400");

  const handleConfirm = () => {
    const heightValue = parseFloat(height);
    if (heightValue > 0) {
      onConfirm(heightValue);
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enter Room Height</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the height of the room in millimeters to calculate volume.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="height">Height (mm)</Label>
          <Input
            id="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="2400"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Example: 2400mm = 2.4m ceiling height
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
