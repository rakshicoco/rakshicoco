-- 0003_complete_fix.sql
-- Fix all missing tables, default settings, and Row Level Security (RLS) policies

-- 1. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.settings (key, value) VALUES
('company_info', '{"name": "Rakshi Coco ERP", "gst": "", "address": ""}'::jsonb),
('harvest_cycle_days', '40'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Create Missing Operational & Payment Tables
CREATE TABLE IF NOT EXISTS public.processing_batches (
    id VARCHAR(20) PRIMARY KEY,
    purchase_id VARCHAR(20) REFERENCES purchases(id),
    team_id VARCHAR(20) REFERENCES teams(id),
    qty_given NUMERIC(10, 2) DEFAULT 0,
    rate NUMERIC(10, 2) DEFAULT 0,
    labour_amount NUMERIC(15, 2) DEFAULT 0,
    qty_returned NUMERIC(10, 2) DEFAULT 0,
    damaged NUMERIC(10, 2) DEFAULT 0,
    rejected NUMERIC(10, 2) DEFAULT 0,
    ready_qty NUMERIC(10, 2) DEFAULT 0,
    paid NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING',
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispatch_batches (
    id VARCHAR(20) PRIMARY KEY,
    sales_order_id VARCHAR(20) REFERENCES sales_orders(id),
    buyer_id VARCHAR(20) REFERENCES buyers(id),
    vehicle TEXT,
    driver_id VARCHAR(20) REFERENCES workers(id),
    loaded_qty NUMERIC(10, 2) DEFAULT 0,
    delivered_qty NUMERIC(10, 2) DEFAULT 0,
    difference NUMERIC(10, 2) GENERATED ALWAYS AS (loaded_qty - delivered_qty) STORED,
    diff_reason TEXT,
    dispatch_date DATE,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'PREPARED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buyer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id VARCHAR(20) REFERENCES buyers(id),
    amount_received NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'CASH',
    reference_no TEXT,
    notes TEXT,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.farm_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id VARCHAR(20) REFERENCES farms(id),
    purchase_id VARCHAR(20) REFERENCES purchases(id),
    amount_paid NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'CASH',
    reference_no TEXT,
    notes TEXT,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.labour_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id VARCHAR(20) REFERENCES teams(id),
    worker_id VARCHAR(20) REFERENCES workers(id),
    amount_paid NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'CASH',
    reference_no TEXT,
    notes TEXT,
    status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Universal RLS Configuration: Allow authenticated users full read/write access
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'profiles', 'farms', 'farm_followups', 'purchases', 'teams', 'workers',
        'cutting_batches', 'grouping_batches', 'transport_trips', 'stock_movements',
        'processing_batches', 'buyers', 'sales_orders', 'dispatch_batches', 'bills',
        'buyer_payments', 'farm_payments', 'labour_payments', 'expenses', 'audit_logs',
        'notifications', 'settings', 'payments'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Enable RLS on table if it exists
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', t);
        -- Drop any conflicting policy
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_auth_%s" ON public.%I;', t, t);
        -- Create clean full access policy for authenticated users
        EXECUTE format('CREATE POLICY "allow_all_auth_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;
