-- 0002_audit_fixes.sql

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('alert', 'warning', 'success', 'info', 'general')),
    read BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize default settings
INSERT INTO public.settings (key, value) VALUES
('company_info', '{"name": "Rakshi Coco ERP", "gst": "", "address": ""}'::jsonb),
('harvest_cycle_days', '40'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. RLS Policies
-- Enable RLS on all tables created in 0001_erp_schema.sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutting_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grouping_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Note: Proper policies need to be implemented depending on roles.
-- For the MVP audit, we will allow authenticated users to read/write.
-- In a real production setup, these would be restricted by role (e.g. auth.uid() = user_id or has_role('admin')).

CREATE POLICY "Allow authenticated full access to profiles" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to farms" ON public.farms FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to farm_followups" ON public.farm_followups FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to purchases" ON public.purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to teams" ON public.teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to workers" ON public.workers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to cutting_batches" ON public.cutting_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to grouping_batches" ON public.grouping_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to transport_trips" ON public.transport_trips FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to processing_batches" ON public.processing_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to buyers" ON public.buyers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to sales_orders" ON public.sales_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to dispatch_batches" ON public.dispatch_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to bills" ON public.bills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to buyer_payments" ON public.buyer_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to farm_payments" ON public.farm_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to labour_payments" ON public.labour_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to expenses" ON public.expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to notifications" ON public.notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access to settings" ON public.settings FOR ALL TO authenticated USING (true);

-- 4. Harvest Cycle Audit Fix
-- Trigger to update farm expected_next_harvest_date based on actual harvest completion
CREATE OR REPLACE FUNCTION update_farm_harvest_date()
RETURNS TRIGGER AS $$
DECLARE
    cycle_days INT;
BEGIN
    -- Only act when a purchase reaches 'COMPLETED' (harvest finished)
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        -- Get harvest cycle days from settings, default 40
        SELECT COALESCE((value->>'harvest_cycle_days')::INT, 40) INTO cycle_days FROM public.settings WHERE key = 'harvest_cycle_days';
        
        -- Update the farm's expected next harvest date based on completion date
        UPDATE public.farms 
        SET expected_next_harvest_date = CURRENT_DATE + (cycle_days || ' days')::INTERVAL
        WHERE id = NEW.farm_id;
        
        -- Also add a follow-up record for the new cycle
        INSERT INTO public.farm_followups (farm_id, follow_up_date, expected_yield, status, notes)
        VALUES (NEW.farm_id, CURRENT_DATE + (cycle_days || ' days')::INTERVAL, NEW.expected_quantity, 'UPCOMING', 'Auto-generated from completed harvest ' || NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_farm_harvest_date ON public.purchases;
CREATE TRIGGER trigger_update_farm_harvest_date
AFTER UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION update_farm_harvest_date();
