import { PageSetup } from "./pageSetup";
import { SymbolCategory } from "@/components/SymbolToolbar";

export interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  canvas_json: any;
  current_page_index: number;
  scale: number | null;
  grid_size: string | null;
  grid_color: string | null;
  grid_thickness: number | null;
  grid_opacity: number | null;
  show_grid: boolean;
  page_setup: PageSetup | null;
  show_title_block: boolean;
  symbol_settings: Record<string, any> | null;
  symbol_categories: SymbolCategory[] | null;
  background_image_url: string | null;
  original_file_name: string | null;
  original_file_type: string | null;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SaveProjectPayload {
  name: string;
  canvas_json: any;
  current_page_index: number;
  scale?: number | null;
  grid_size?: string | null;
  grid_color?: string | null;
  grid_thickness?: number | null;
  grid_opacity?: number | null;
  show_grid?: boolean;
  page_setup?: PageSetup | null;
  show_title_block?: boolean;
  symbol_settings?: Record<string, any> | null;
  symbol_categories?: SymbolCategory[] | null;
  background_image_url?: string | null;
  original_file_name?: string | null;
  original_file_type?: string | null;
}
