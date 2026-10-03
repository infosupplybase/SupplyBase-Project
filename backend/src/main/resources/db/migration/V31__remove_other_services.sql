-- Other Services is no longer offered, on request.
--
-- Switches off the "Other Services" tile and the five services it opened
-- (architectural design, civil construction, furniture, fabrication,
-- finishing), so none of them is listed, found by the search box, or bookable.
-- Only `active` changes: the rows stay, so past bookings made under them still
-- show their service name in the admin panel and the customer's account, and
-- an admin can switch any of them back on from the catalogue screen.
UPDATE service_categories
SET active = FALSE
WHERE slug IN ('other-services',
               'architectural-design', 'civil-construction', 'furniture', 'fabrication', 'finishing');
