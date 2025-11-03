import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileLoad: (file: File) => void;
}

export const FileUpload = ({ onFileLoad }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "application/pdf" || file.type.startsWith("image/"))) {
        onFileLoad(file);
      }
    },
    [onFileLoad]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileLoad(file);
      }
    },
    [onFileLoad]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg bg-card p-8"
    >
      <Upload className="w-16 h-16 mb-4 text-muted-foreground" />
      <h2 className="text-2xl font-semibold mb-2 text-foreground">Upload Floor Plan</h2>
      <p className="text-muted-foreground mb-6">Drag and drop or click to browse (PDF or Image)</p>
      <Button asChild>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          Choose File
        </label>
      </Button>
    </div>
  );
};
