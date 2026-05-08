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

CREATE TABLE IF NOT EXISTS public.sales_attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userid UUID REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'clocked_out', 'auto_clocked_out')),
    clockedinat TIMESTAMPTZ NOT NULL DEFAULT now(),
    clockedoutat TIMESTAMPTZ,
    pausedat TIMESTAMPTZ,
    totalpausedms BIGINT NOT NULL DEFAULT 0,
    pausereason TEXT,
    createdat TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_attendance_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sessionid UUID REFERENCES public.sales_attendance_sessions(id) ON DELETE CASCADE,
    userid UUID REFERENCES public.users(id),
    eventtype TEXT NOT NULL CHECK (eventtype IN ('clock_in', 'pause', 'resume', 'clock_out', 'auto_clock_out')),
    reason TEXT,
    createdat TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userid UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    readat TIMESTAMPTZ,
    createdat TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userid UUID REFERENCES public.users(id),
    reason TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('Urgent', 'Important', 'Suggestion', 'Feedback')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    createdat TIMESTAMPTZ DEFAULT now()
);
