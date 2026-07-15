-- Run this in Supabase's SQL Editor (separate from schema.sql, which you already ran).
-- It adds a plain-text reviewer name field so people can leave a
-- review without a full account/login system.

alter table concert_reviews add column if not exists reviewer_name text;
alter table venue_reviews add column if not exists reviewer_name text;
