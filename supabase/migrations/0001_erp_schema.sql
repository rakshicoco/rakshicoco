-- 0001_erp_schema.sql
-- Contains the entire ERP schema for Rakshi Coco

-- 1. ENUMS (Status flags)
CREATE TYPE farm_followup_status AS ENUM ('UPCOMING', 'DUE', 'OVERDUE', 'CONTACTED', 'NEGOTIATING', 'PURCHASED', 'POSTPONED', 'SKIPPED');
CREATE TYPE purchase_status AS ENUM ('DRAFT', 'CONFIRMED', 'HARVESTING', 'HARVESTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE batch_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE transport_type AS ENUM ('FARM_TO_GODOWN', 'GODOWN_TO_BUYER');
CREATE TYPE transport_status AS ENUM ('PLANNED', 'LOADED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');
CREATE TYPE stock_state AS ENUM ('RECEIVED', 'PROCESSING', 'READY', 'DAMAGED', 'REJECTED', 'RESERVED', 'DISPATCHED');
CREATE TYPE sales_status AS ENUM ('DRAFT', 'CONFIRMED', 'RESERVED', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'DELIVERED', 'CANCELLED');
CREATE TYPE dispatch_status AS ENUM ('PREPARED', 'LOADED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'PAYMENT_PENDING', 'PAID');
CREATE TYPE bill_type AS ENUM ('PURCHASE_BILL', 'LABOUR_BILL', 'GROUPING_BILL', 'TRANSPORT_BILL', 'PROCESSING_BILL', 'SALES_INVOICE', 'EXPENSE_BILL');
CREATE TYPE bill_status AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE payment_type AS ENUM ('ADVANCE', 'PARTIAL', 'FINAL', 'REFUND', 'RECEIPT');
CREATE TYPE expense_category AS ENUM ('PURCHASE', 'HARVESTING', 'CUTTING', 'GROUPING', 'TRANSPORT', 'PROCESSING', 'HANDLING', 'OPERATIONS', 'OTHER');

-- 2. FARMS
CREATE TABLE farms (
    id VARCHAR(20) PRIMARY KEY, -- e.g. FARM-0001
    owner_name TEXT NOT NULL,
    phone TEXT,
    alt_phone TEXT,
    village TEXT,
    location TEXT,
    address TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    actual_harvest_date DATE,
    expected_next_harvest_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE farm_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id VARCHAR(20) REFERENCES farms(id) ON DELETE CASCADE,
    status farm_followup_status DEFAULT 'UPCOMING',
    last_contact DATE,
    next_followup DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PURCHASES
CREATE TABLE purchases (
    id VARCHAR(20) PRIMARY KEY, -- e.g. PUR-0001
    farm_id VARCHAR(20) REFERENCES farms(id),
    purchase_date DATE NOT NULL,
    harvest_date DATE,
    expected_qty NUMERIC(10, 2) DEFAULT 0,
    actual_qty NUMERIC(10, 2) DEFAULT 0,
    rate NUMERIC(10, 2) DEFAULT 0,
    gross_amount NUMERIC(15, 2) DEFAULT 0,
    advance NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0,
    status purchase_status DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LABOUR (TEAMS & WORKERS)
CREATE TABLE teams (
    id VARCHAR(20) PRIMARY KEY, -- e.g. TEAM-0001
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    workload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workers (
    id VARCHAR(20) PRIMARY KEY, -- e.g. WRK-0001
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT,
    team_id VARCHAR(20) REFERENCES teams(id),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add leader reference to teams
ALTER TABLE teams ADD COLUMN leader_id VARCHAR(20) REFERENCES workers(id);

CREATE TABLE labour_payments (
    id VARCHAR(20) PRIMARY KEY, -- e.g. LPAY-0001
    worker_or_team_id VARCHAR(20), -- references either teams(id) or workers(id)
    reference_type TEXT, -- 'CUTTING', 'GROUPING', 'PROCESSING'
    reference_id VARCHAR(20),
    amount NUMERIC(15, 2) DEFAULT 0,
    paid BOOLEAN DEFAULT FALSE,
    balance NUMERIC(15, 2) DEFAULT 0,
    payment_date DATE,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. OPERATIONS: CUTTING, GROUPING, PROCESSING
CREATE TABLE cutting_batches (
    id VARCHAR(20) PRIMARY KEY, -- e.g. CUT-0001
    purchase_id VARCHAR(20) REFERENCES purchases(id),
    team_id VARCHAR(20) REFERENCES teams(id),
    expected_qty NUMERIC(10, 2) DEFAULT 0,
    actual_qty NUMERIC(10, 2) DEFAULT 0,
    rate NUMERIC(10, 2) DEFAULT 0,
    formula TEXT,
    labour_amount NUMERIC(15, 2) DEFAULT 0,
    paid NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0,
    status batch_status DEFAULT 'PENDING',
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE grouping_batches (
    id VARCHAR(20) PRIMARY KEY, -- e.g. GRP-0001
    purchase_id VARCHAR(20) REFERENCES purchases(id),
    cutting_batch_id VARCHAR(20) REFERENCES cutting_batches(id),
    qty_input NUMERIC(10, 2) DEFAULT 0,
    qty_grouped NUMERIC(10, 2) DEFAULT 0,
    damaged NUMERIC(10, 2) DEFAULT 0,
    rejected NUMERIC(10, 2) DEFAULT 0,
    ready_qty NUMERIC(10, 2) DEFAULT 0,
    team_id VARCHAR(20) REFERENCES teams(id),
    rate NUMERIC(10, 2) DEFAULT 0,
    labour_amount NUMERIC(15, 2) DEFAULT 0,
    paid NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) DEFAULT 0,
    status batch_status DEFAULT 'PENDING',
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE processing_batches (
    id VARCHAR(20) PRIMARY KEY, -- e.g. PRC-0001
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
    status batch_status DEFAULT 'PENDING',
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BUYERS & SALES
CREATE TABLE buyers (
    id VARCHAR(20) PRIMARY KEY, -- e.g. BUY-0001
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    alt_phone TEXT,
    state TEXT,
    city TEXT,
    address TEXT,
    gst TEXT,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sales_orders (
    id VARCHAR(20) PRIMARY KEY, -- e.g. SO-0001
    buyer_id VARCHAR(20) REFERENCES buyers(id),
    date DATE NOT NULL,
    qty NUMERIC(10, 2) DEFAULT 0,
    rate NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(15, 2) DEFAULT 0,
    reserved_qty NUMERIC(10, 2) DEFAULT 0,
    dispatched_qty NUMERIC(10, 2) DEFAULT 0,
    delivered_qty NUMERIC(10, 2) DEFAULT 0,
    status sales_status DEFAULT 'DRAFT',
    payment_status TEXT DEFAULT 'UNPAID',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TRANSPORT & DISPATCH
CREATE TABLE transport_trips (
    id VARCHAR(20) PRIMARY KEY, -- e.g. TRN-0001
    type transport_type NOT NULL,
    purchase_id VARCHAR(20) REFERENCES purchases(id),
    sales_order_id VARCHAR(20) REFERENCES sales_orders(id),
    vehicle TEXT,
    driver_id VARCHAR(20) REFERENCES workers(id),
    loading_date DATE,
    loaded_qty NUMERIC(10, 2) DEFAULT 0,
    received_qty NUMERIC(10, 2) DEFAULT 0,
    difference NUMERIC(10, 2) GENERATED ALWAYS AS (loaded_qty - received_qty) STORED,
    diff_reason TEXT,
    cost NUMERIC(15, 2) DEFAULT 0,
    status transport_status DEFAULT 'PLANNED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE dispatches (
    id VARCHAR(20) PRIMARY KEY, -- e.g. DSP-0001
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
    status dispatch_status DEFAULT 'PREPARED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. STOCK MOVEMENTS
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id VARCHAR(20) REFERENCES purchases(id),
    processing_batch_id VARCHAR(20) REFERENCES processing_batches(id),
    qty NUMERIC(10, 2) NOT NULL,
    from_state stock_state,
    to_state stock_state NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- 9. FINANCE: BILLS, PAYMENTS, EXPENSES
CREATE TABLE bills (
    id VARCHAR(20) PRIMARY KEY, -- e.g. BIL-0001
    number TEXT,
    type bill_type NOT NULL,
    entity_type TEXT, -- e.g. 'FARM', 'BUYER', 'TEAM'
    entity_id VARCHAR(20),
    ref_type TEXT,
    ref_id VARCHAR(20),
    issue_date DATE,
    due_date DATE,
    amount NUMERIC(15, 2) DEFAULT 0,
    paid NUMERIC(15, 2) DEFAULT 0,
    balance NUMERIC(15, 2) GENERATED ALWAYS AS (amount - paid) STORED,
    status bill_status DEFAULT 'DRAFT',
    notes TEXT,
    attachment TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id VARCHAR(20) PRIMARY KEY, -- e.g. PAY-0001
    type payment_type NOT NULL,
    ref_type TEXT,
    ref_id VARCHAR(20),
    bill_id VARCHAR(20) REFERENCES bills(id),
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    method TEXT,
    tx_ref TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
    id VARCHAR(20) PRIMARY KEY, -- e.g. EXP-0001
    category expense_category NOT NULL,
    ref_type TEXT,
    ref_id VARCHAR(20),
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    vendor TEXT,
    bill_id VARCHAR(20) REFERENCES bills(id),
    paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Enablement
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutting_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE grouping_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Base RLS Policies (Allow all for authenticated for now, refine per module later)
CREATE POLICY "Allow full access to authenticated users" ON farms FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON farm_followups FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON teams FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON workers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON labour_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON cutting_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON grouping_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON processing_batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON buyers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON sales_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON transport_trips FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON dispatches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON bills FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON audit_logs FOR ALL TO authenticated USING (true);
