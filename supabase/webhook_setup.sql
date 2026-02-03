-- 1. Enable pg_net extension (Required for calling the Edge Function)
create extension if not exists pg_net;

-- 2. Create the Trigger Function
create or replace function public.notify_new_booking()
returns trigger as $$
declare
  -- Your actual Edge Function URL
  edge_function_url text := 'https://hvxpettfgduydstoccnb.supabase.co/functions/v1/booking-notification'; 
  
  -- Your actual Anon Key
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHBldHRmZ2R1eWRzdG9jY25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTY5NTMsImV4cCI6MjA4NTU5Mjk1M30.FGa0LdhnocO2AhuP0_3-4xFX2njBs5klICe53PpnW6o';
begin
  perform
    net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'record', row_to_json(new)
      )
    );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create Trigger on bookings table
drop trigger if exists on_booking_created on bookings;
create trigger on_booking_created
  after insert on bookings
  for each row execute procedure public.notify_new_booking();
