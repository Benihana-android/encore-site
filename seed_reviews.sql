-- Run this AFTER seed_optional.sql (which creates the example venues/concerts).
-- This adds a handful of reviews to each, so the ratings/EQ-meters actually
-- show something instead of "no ratings yet."
--
-- Important: these are placeholder reviews for demo purposes, not real
-- attendee feedback. Once real users start rating things, I'd recommend
-- deleting these (or at least the ones on shows/venues real people are
-- also reviewing) so visitors aren't seeing fabricated numbers mixed in
-- with genuine community ratings.

insert into concert_reviews (concert_id, reviewer_name, scores, review_text)
select id, 'demo_alex',
  '{"performance":9,"vocals":8,"band":9,"beats":9,"lightshow":10}'::jsonb,
  'Incredible energy all night — the light show during the encore was unreal.'
from concerts where artist = 'Marigold Static';

insert into concert_reviews (concert_id, reviewer_name, scores, review_text)
select id, 'demo_jordan',
  '{"performance":8,"vocals":9,"band":8,"beats":8,"lightshow":9}'::jsonb,
  'Vocals were pitch perfect live, band was tight all set.'
from concerts where artist = 'Marigold Static';

insert into concert_reviews (concert_id, reviewer_name, scores, review_text)
select id, 'demo_sam',
  '{"performance":8,"vocals":8,"band":7,"beats":9,"lightshow":7}'::jsonb,
  'Sound mix was a little muddy early but the setlist made up for it.'
from concerts where artist = 'Cassette Fever';

insert into venue_reviews (venue_id, reviewer_name, scores, review_text)
select id, 'demo_priya',
  '{"sound":9,"access":7,"seating":7,"staff":8,"vibe":9}'::jsonb,
  'Best sound in the city, but the line for the door can be brutal on busy nights.'
from venues where name = 'The Hollow Room';

insert into venue_reviews (venue_id, reviewer_name, scores, review_text)
select id, 'demo_marcus',
  '{"sound":9,"access":8,"seating":6,"staff":9,"vibe":9}'::jsonb,
  'Staff here are genuinely great, seating in the balcony is tight though.'
from venues where name = 'The Hollow Room';

insert into venue_reviews (venue_id, reviewer_name, scores, review_text)
select id, 'demo_lena',
  '{"sound":8,"access":9,"seating":8,"staff":8,"vibe":8}'::jsonb,
  'Huge amphitheater, easy parking, sound holds up well even from the lawn.'
from venues where name = 'Union Yard Amphitheater';
