-- Optional free text for the courier, e.g. "green door, ring twice".

alter table public.shipping_addresses
  add column special_instructions text
  check (char_length(special_instructions) <= 500);
