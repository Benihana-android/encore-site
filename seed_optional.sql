-- Optional: run this in Supabase's SQL Editor if you'd like a couple
-- of example shows/venues to look at right away. Safe to skip entirely
-- if you'd rather start from a completely empty site.

insert into venues (name, city, capacity) values
  ('The Hollow Room', 'Austin, TX', '1,200'),
  ('Union Yard Amphitheater', 'Denver, CO', '6,500');

insert into concerts (artist, venue_id, event_date)
select 'Marigold Static', id, '2026-08-14' from venues where name = 'The Hollow Room';

insert into concerts (artist, venue_id, event_date)
select 'Cassette Fever', id, '2026-08-30' from venues where name = 'Union Yard Amphitheater';
