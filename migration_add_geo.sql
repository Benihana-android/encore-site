-- Run this in Supabase's SQL Editor, alongside the reviewer_name migration.

alter table venues add column if not exists latitude double precision;
alter table venues add column if not exists longitude double precision;
