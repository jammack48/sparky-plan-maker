-- Create projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Canvas state
  canvas_json jsonb not null,
  current_page_index integer default 0,
  
  -- Grid and measurement settings
  scale numeric,
  grid_size text,
  grid_color text,
  grid_thickness numeric,
  grid_opacity numeric,
  show_grid boolean default false,
  
  -- Page setup (title block)
  page_setup jsonb,
  show_title_block boolean default false,
  
  -- Symbol settings
  symbol_settings jsonb,
  symbol_categories jsonb,
  
  -- File references
  background_image_url text,
  original_file_name text,
  original_file_type text
);

-- Enable RLS (but allow public access for testing)
alter table public.projects enable row level security;

-- Public access policy for testing (no authentication required)
create policy "Public access for testing"
  on public.projects
  for all
  using (true)
  with check (true);

-- Create storage bucket for floor plans
insert into storage.buckets (id, name, public)
values ('floor-plans', 'floor-plans', true);

-- Storage policies for public access (testing)
create policy "Public upload access"
  on storage.objects for insert
  with check (bucket_id = 'floor-plans');

create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'floor-plans');

create policy "Public delete access"
  on storage.objects for delete
  using (bucket_id = 'floor-plans');