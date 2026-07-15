-- Run this in Supabase's SQL Editor alongside the other migrations.

alter table concert_reviews add column if not exists ip_address text;
alter table venue_reviews add column if not exists ip_address text;
alter table concerts add column if not exists ip_address text;
alter table venues add column if not exists ip_address text;

create index if not exists idx_concert_reviews_ip on concert_reviews(ip_address, created_at);
create index if not exists idx_venue_reviews_ip on venue_reviews(ip_address, created_at);
