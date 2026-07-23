-- Run this once in Supabase: Dashboard -> SQL Editor -> New Query -> paste -> Run

create table orders (
  id bigint generated always as identity primary key,
  request_code text not null,
  plan_id text not null,
  full_name text,
  mobile text,
  email text,
  address text,
  business_name text,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_paise bigint,
  status text not null default 'created', -- created | license_issued
  license_key text,
  expires_at bigint,                       -- ms since epoch, same format the frontend expects
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_razorpay_order_id on orders(razorpay_order_id);
create index idx_orders_request_code on orders(request_code);

create table trial_activations (
  request_code text primary key,
  activated_at timestamptz default now()
);

-- Locks both tables down from the public API by default. Our backend uses
-- the service_role key, which bypasses this entirely, so nothing here
-- changes how the app works -- it's just a safety net in case the anon
-- key is ever used against these tables by mistake.
alter table orders enable row level security;
alter table trial_activations enable row level security;
