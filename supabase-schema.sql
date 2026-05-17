-- 
-- OUR WHISPER - SUPABASE SCHEMA (BLUEPRINT)
-- 

-- Users table (extension of auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  name text,
  spouse_email text,
  couple_id uuid,
  photo_url text,
  role text check (role in ('husband', 'wife')),
  created_at timestamp with time zone default now()
);

-- Couples table
create table public.couples (
  id uuid default gen_random_uuid() primary key,
  emails text[] not null, -- Array of two emails
  wedding_date timestamp with time zone,
  theme text default 'Moonlit Night',
  created_at timestamp with time zone default now()
);

-- Memories table
create table public.memories (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples not null,
  author_id uuid references public.users not null,
  title text not null,
  description text,
  media_url text,
  category text,
  is_locked boolean default false,
  unlock_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Letters table
create table public.letters (
  id uuid default gen_random_uuid() primary key,
  couple_id uuid references public.couples not null,
  author_id uuid references public.users not null,
  recipient_id uuid references public.users not null,
  title text,
  content text not null,
  is_read boolean default false,
  seal_type text default 'standard',
  created_at timestamp with time zone default now()
);

-- Enable RLS for all tables
alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.memories enable row level security;
alter table public.letters enable row level security;

-- Policies
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Couples can read their own space" on public.couples for select using (auth.email() = any(emails));
