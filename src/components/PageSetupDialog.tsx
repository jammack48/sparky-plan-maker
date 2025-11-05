import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageSetup } from "@/types/pageSetup";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PageSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageSetup: PageSetup;
  onSave: (setup: PageSetup) => void;
}

export const PageSetupDialog = ({ open, onOpenChange, pageSetup, onSave }: PageSetupDialogProps) => {
  const [localSetup, setLocalSetup] = useState<PageSetup>(pageSetup);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLocalSetup({ ...localSetup, logo: result });
        toast.success("Logo uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLocalSetup({ ...localSetup, logo: undefined });
    toast.success("Logo removed");
  };

  const handleSave = () => {
    onSave(localSetup);
    onOpenChange(false);
    toast.success("Page setup saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Page Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {localSetup.logo ? (
                <div className="relative">
                  <img src={localSetup.logo} alt="Logo preview" className="h-20 w-20 object-contain border rounded" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={localSetup.title}
              onChange={(e) => setLocalSetup({ ...localSetup, title: e.target.value })}
              placeholder="Floor Plan"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={localSetup.subtitle}
              onChange={(e) => setLocalSetup({ ...localSetup, subtitle: e.target.value })}
              placeholder="Project name or location"
            />
          </div>

          {/* Details */}
          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={localSetup.details}
              onChange={(e) => setLocalSetup({ ...localSetup, details: e.target.value })}
              placeholder="Additional details, address, project code, etc."
              rows={2}
            />
          </div>

          {/* Border Settings */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="border-enabled">Border</Label>
              <Switch
                id="border-enabled"
                checked={localSetup.border.enabled}
                onCheckedChange={(enabled) =>
                  setLocalSetup({ ...localSetup, border: { ...localSetup.border, enabled } })
                }
              />
            </div>

            {localSetup.border.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="border-style">Border Style</Label>
                  <Select
                    value={localSetup.border.style}
                    onValueChange={(value: 'solid' | 'dashed' | 'double') =>
                      setLocalSetup({ ...localSetup, border: { ...localSetup.border, style: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-thickness">Border Thickness: {localSetup.border.thickness}px</Label>
                  <Slider
                    id="border-thickness"
                    min={1}
                    max={10}
                    step={1}
                    value={[localSetup.border.thickness]}
                    onValueChange={(value) =>
                      setLocalSetup({ ...localSetup, border: { ...localSetup.border, thickness: value[0] } })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-color">Border Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="border-color"
                      type="color"
                      value={localSetup.border.color}
                      onChange={(e) =>
                        setLocalSetup({ ...localSetup, border: { ...localSetup.border, color: e.target.value } })
                      }
                      className="h-10 w-20 border rounded bg-background cursor-pointer"
                    />
                    <Input
                      value={localSetup.border.color}
                      onChange={(e) =>
                        setLocalSetup({ ...localSetup, border: { ...localSetup.border, color: e.target.value } })
                      }
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Layout Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Layout</h3>

            <div className="space-y-2">
              <Label htmlFor="margin-size">Margin Size: {localSetup.layout.marginSize}%</Label>
              <Slider
                id="margin-size"
                min={0}
                max={20}
                step={1}
                value={[localSetup.layout.marginSize]}
                onValueChange={(value) =>
                  setLocalSetup({ ...localSetup, layout: { ...localSetup.layout, marginSize: value[0] } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title-bar-height">Title Bar Height: {localSetup.layout.titleBarHeight}px</Label>
              <Slider
                id="title-bar-height"
                min={30}
                max={120}
                step={5}
                value={[localSetup.layout.titleBarHeight]}
                onValueChange={(value) =>
                  setLocalSetup({ ...localSetup, layout: { ...localSetup.layout, titleBarHeight: value[0] } })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-position">Logo Position</Label>
              <Select
                value={localSetup.layout.logoPosition}
                onValueChange={(value: 'left' | 'center' | 'right') =>
                  setLocalSetup({ ...localSetup, layout: { ...localSetup.layout, logoPosition: value } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-size">Logo Size: {localSetup.layout.logoSize}%</Label>
              <Slider
                id="logo-size"
                min={30}
                max={100}
                step={5}
                value={[localSetup.layout.logoSize]}
                onValueChange={(value) =>
                  setLocalSetup({ ...localSetup, layout: { ...localSetup.layout, logoSize: value[0] } })
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="footer">Footer Text</Label>
            <Input
              id="footer"
              value={localSetup.footer}
              onChange={(e) => setLocalSetup({ ...localSetup, footer: e.target.value })}
              placeholder="Optional footer text (date, page number, etc.)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Setup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
