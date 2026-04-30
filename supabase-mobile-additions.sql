-- Recommended additions for the mobile sales app.
-- Run these in Supabase SQL editor if your live project does not already have them.

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shopid BIGINT REFERENCES public.shops(id),
    sold_by_id UUID REFERENCES public.users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Cleared')),
    createdat TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orderid UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    productid UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,
    createdat TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    orderid UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    collected_by_id UUID REFERENCES public.users(id),
    createdat TIMESTAMPTZ DEFAULT now()
);
