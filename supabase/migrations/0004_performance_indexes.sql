-- 0004_performance_indexes.sql
-- Performance indexes targeting high-frequency filters and foreign key joins

-- 1. Farm filter for active groves (used on Dashboard & Farms list)
CREATE INDEX IF NOT EXISTS idx_farms_active ON public.farms(active);

-- 2. Purchase filters for confirmed harvest calculations and active balances (used on Dashboard & P&L)
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_balance ON public.purchases(balance) WHERE balance > 0;
CREATE INDEX IF NOT EXISTS idx_purchases_farm_id ON public.purchases(farm_id);

-- 3. Sales order filter for draft pipeline and non-cancelled orders (used on Dashboard & P&L)
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_buyer_id ON public.sales_orders(buyer_id);

-- 4. Bills filter for outstanding receivables (used on Dashboard & Bills list)
CREATE INDEX IF NOT EXISTS idx_bills_balance_due ON public.bills(balance_due) WHERE balance_due > 0;
CREATE INDEX IF NOT EXISTS idx_bills_buyer_id ON public.bills(buyer_id);

-- 5. Stock movements filter for ready stock inflow calculations (used on Dashboard & Stock page)
CREATE INDEX IF NOT EXISTS idx_stock_movements_to_state ON public.stock_movements(to_state);
CREATE INDEX IF NOT EXISTS idx_stock_movements_godown_id ON public.stock_movements(godown_id);

-- 6. Dispatches filter for outflow calculations (used on Dashboard & Stock page)
CREATE INDEX IF NOT EXISTS idx_dispatches_sales_order_id ON public.dispatches(sales_order_id);

-- 7. Transport trips filter for active trips & freight costs (used on Transport list & P&L)
CREATE INDEX IF NOT EXISTS idx_transport_trips_status ON public.transport_trips(status);
CREATE INDEX IF NOT EXISTS idx_transport_trips_date ON public.transport_trips(date);
