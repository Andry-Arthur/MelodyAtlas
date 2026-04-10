-- Pin tags table (for tagging friends on memories)
create table if not exists public.pin_tags (
  id uuid default gen_random_uuid() primary key,
  pin_id uuid references public.pins(id) on delete cascade not null,
  tagged_user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (pin_id, tagged_user_id)
);

alter table public.pin_tags enable row level security;

create policy "Tags are viewable by pin owner or tagged user"
  on public.pin_tags for select
  using (
    auth.uid() = tagged_user_id
    or exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

create policy "Pin owner can tag users"
  on public.pin_tags for insert
  with check (
    exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

create policy "Pin owner can remove tags"
  on public.pin_tags for delete
  using (
    exists (
      select 1 from public.pins where id = pin_id and user_id = auth.uid()
    )
  );

create index if not exists idx_pin_tags_tagged_user_id on public.pin_tags(tagged_user_id);
create index if not exists idx_pin_tags_pin_id on public.pin_tags(pin_id);
