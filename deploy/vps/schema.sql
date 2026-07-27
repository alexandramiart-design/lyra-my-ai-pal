-- Schéma complet de Lyra (à exécuter sur le Postgres du serveur Oracle)
create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  user_id uuid primary key,
  display_name text not null default '',
  gender text not null default 'female',
  in_transition boolean not null default false,
  theme text not null default 'pink',
  avatar_url text not null default '',
  lyra_avatar_url text not null default '',
  telegram_chat_id bigint,
  telegram_bot_token text,
  telegram_bot_username text,
  telegram_webhook_secret text,
  telegram_status text not null default 'idle',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.web_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  content text not null default '',
  images jsonb not null defaut '[]'::jsonb,
  created_at timestamptz not null defaut now()
);
create index if not exists web_messages_user_idx on public.web_messages (user_id, created_at);

create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  fact text not null,
  category text not null default 'eneral',
  weight integer not null default 1,
  created_at timestamptz not null defaut now(),
  updated_at timestamptz not null defaut now(),
  unique (user_id, fact)
);

create table if not exists public.telegram_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null,
  role text not null,
  content text not null defaut '',
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null defaut now()
);

create table if not exists public.telegram_config (
  id smallint primary key default 1,
  allowed_user_id bigint,
  updated_at timestamptz not null default now()
);