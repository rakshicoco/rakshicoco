-- schema.sql
-- Initial Database Schema for Coconut Processing Business Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types for statuses
CREATE TYPE status_type AS ENUM ('Draft', 'Scheduled', 'Assigned', 'In Progress', 'Completed', 'Cancelled', 'Settled', 'Archived', 'Reserved', 'Prepared', 'Dispatched', 'Delivered', 'Paid', 'Pending');
CREATE TYPE stock_state AS ENUM ('RECEIVED', 'PROCESSING', 'READY', 'DAMAGED', 'REJECTED', 'RESERVED', 'DISPATCHED');
CREATE TYPE team_type AS ENUM ('Cutting', 'Grouping', 'Dehusking', 'Loading', 'Unloading', 'Other');

-- 1. PROFILES & ROLES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'USER', -- OWNER, MANAGER, ACCOUNTANT, CUTTING_LEAD, PEELING_LEAD, DRIVER
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MASTER DATA
CREATE TABLE farms (
    farm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. FARM-0001
    owner_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    village VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE labour_groups (
    team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) NOT NULL,
    team_type team_type NOT NULL,
    leader_id UUID, -- References workers(worker_id) but circular, handled later or soft link
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workers (
    worker_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    team_id UUID REFERENCES labour_groups(team_id),
    role VARCHAR(50),
    default_rate NUMERIC(10,2),
    rate_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    owner_provider VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE drivers (
    driver_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    license_details VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE buyers (
    buyer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    state VARCHAR(50),
    city VARCHAR(50),
    address TEXT,
    gst_number VARCHAR(50),
    payment_terms TEXT,
    credit_limit NUMERIC(15,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_grades (
    grade_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_name VARCHAR(100) NOT NULL, -- Grade A, Grade B, Large, Medium
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE godowns (
    godown_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    location TEXT,
    status VARCHAR(20) DEFAULT 'Active'
);

-- 3. PROCUREMENT
CREATE TABLE purchases (
    purchase_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number VARCHAR(50) UNIQUE NOT NULL, -- PUR-2026-0001
    farm_id UUID REFERENCES farms(farm_id) NOT NULL,
    purchase_date DATE NOT NULL,
    expected_quantity INTEGER DEFAULT 0,
    actual_quantity INTEGER DEFAULT 0,
    purchase_rate NUMERIC(10,2) DEFAULT 0,
    total_purchase_amount NUMERIC(15,2) DEFAULT 0,
    advance_amount NUMERIC(15,2) DEFAULT 0,
    balance_amount NUMERIC(15,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    status status_type DEFAULT 'Scheduled',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_quality_details (
    pq_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    grade_id UUID REFERENCES product_grades(grade_id),
    quantity INTEGER NOT NULL,
    rate NUMERIC(10,2) NOT NULL,
    amount NUMERIC(15,2) NOT NULL
);

-- 4. OPERATIONS
CREATE TABLE cutting_batches (
    cutting_batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(50) UNIQUE NOT NULL, -- CUT-2026-0001
    purchase_id UUID REFERENCES purchases(purchase_id),
    farm_id UUID REFERENCES farms(farm_id),
    team_id UUID REFERENCES labour_groups(team_id),
    expected_quantity INTEGER DEFAULT 0,
    actual_quantity INTEGER DEFAULT 0,
    rate NUMERIC(10,2) DEFAULT 0,
    rate_type VARCHAR(50),
    labour_amount NUMERIC(15,2) DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    start_date DATE,
    completion_date DATE,
    status status_type DEFAULT 'Assigned',
    notes TEXT
);

CREATE TABLE grouping_batches (
    grouping_batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(50) UNIQUE NOT NULL, -- GRP-2026-0001
    purchase_id UUID REFERENCES purchases(purchase_id),
    team_id UUID REFERENCES labour_groups(team_id),
    quantity_received INTEGER DEFAULT 0,
    quantity_grouped INTEGER DEFAULT 0,
    rate NUMERIC(10,2) DEFAULT 0,
    rate_type VARCHAR(50),
    labour_amount NUMERIC(15,2) DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    status status_type DEFAULT 'Assigned',
    notes TEXT
);

CREATE TABLE processing_batches (
    processing_batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(50) UNIQUE NOT NULL, -- PROC-2026-0001
    purchase_id UUID REFERENCES purchases(purchase_id),
    team_id UUID REFERENCES labour_groups(team_id),
    godown_id UUID REFERENCES godowns(godown_id),
    quantity_given INTEGER DEFAULT 0,
    rate NUMERIC(10,2) DEFAULT 0,
    rate_type VARCHAR(50),
    labour_amount NUMERIC(15,2) DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    rejected_quantity INTEGER DEFAULT 0,
    ready_quantity INTEGER DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    start_date DATE,
    completion_date DATE,
    status status_type DEFAULT 'Assigned',
    notes TEXT
);

-- 5. TRANSPORT & INVENTORY
CREATE TABLE transport_trips (
    trip_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_number VARCHAR(50) UNIQUE NOT NULL, -- TRIP-2026-0001
    trip_type VARCHAR(50) NOT NULL, -- FarmToGodown, GodownToBuyer
    source TEXT,
    destination TEXT,
    purchase_id UUID REFERENCES purchases(purchase_id),
    sale_id UUID, -- References sales_orders(sale_id)
    vehicle_id UUID REFERENCES vehicles(vehicle_id),
    driver_id UUID REFERENCES drivers(driver_id),
    quantity_loaded INTEGER DEFAULT 0,
    quantity_received INTEGER DEFAULT 0,
    trip_cost NUMERIC(15,2) DEFAULT 0,
    trip_date DATE NOT NULL,
    status status_type DEFAULT 'In Progress',
    difference_reason TEXT,
    notes TEXT
);

CREATE TABLE stock_movements (
    stock_movement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    godown_id UUID REFERENCES godowns(godown_id),
    purchase_id UUID REFERENCES purchases(purchase_id),
    processing_batch_id UUID REFERENCES processing_batches(processing_batch_id),
    movement_type VARCHAR(50) NOT NULL, -- IN, OUT, TRANSFER, ADJUSTMENT
    quantity INTEGER NOT NULL,
    from_state stock_state,
    to_state stock_state,
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SALES
CREATE TABLE sales_orders (
    sale_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(50) UNIQUE NOT NULL, -- SALE-2026-0001
    buyer_id UUID REFERENCES buyers(buyer_id) NOT NULL,
    sale_date DATE NOT NULL,
    status status_type DEFAULT 'Draft',
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    additional_charges NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    amount_received NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add reference in transport_trips
ALTER TABLE transport_trips ADD CONSTRAINT fk_sale FOREIGN KEY (sale_id) REFERENCES sales_orders(sale_id);

CREATE TABLE sale_items (
    sale_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales_orders(sale_id) ON DELETE CASCADE,
    grade_id UUID REFERENCES product_grades(grade_id),
    quantity INTEGER NOT NULL,
    rate NUMERIC(10,2) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    source_stock UUID -- Optional link back to specific purchases if needed
);

CREATE TABLE dispatches (
    dispatch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales_orders(sale_id),
    trip_id UUID REFERENCES transport_trips(trip_id),
    dispatch_date DATE,
    status status_type DEFAULT 'Prepared',
    notes TEXT
);

-- 7. FINANCE
CREATE TABLE bills (
    bill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number VARCHAR(50) UNIQUE NOT NULL, -- INV-2026-0001
    bill_type VARCHAR(50) NOT NULL, -- Purchase, Labour, Grouping, Transport, Processing, Sales Invoice, Expense
    reference_type VARCHAR(50), -- Table name or module
    reference_id UUID, -- ID of the transaction
    party_type VARCHAR(50), -- Buyer, FarmOwner, Vendor, Worker
    party_id UUID, -- ID of the party
    bill_date DATE NOT NULL,
    subtotal NUMERIC(15,2) DEFAULT 0,
    tax NUMERIC(15,2) DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    amount_paid NUMERIC(15,2) DEFAULT 0,
    balance NUMERIC(15,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    due_date DATE,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_type VARCHAR(50) NOT NULL, -- Payable (Farm, Transport, Labour) vs Receivable (Buyer)
    party_id UUID NOT NULL,
    reference_type VARCHAR(50), -- Bill, Purchase, Sale
    reference_id UUID,
    amount NUMERIC(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    expense_date DATE NOT NULL,
    reference_type VARCHAR(50), -- Optional link to Purchase/Batch
    reference_id UUID,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. REMINDERS
CREATE TABLE farm_harvest_cycles (
    cycle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(farm_id) NOT NULL,
    last_harvest_date DATE,
    expected_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE farm_reminders (
    reminder_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES farms(farm_id) NOT NULL,
    cycle_id UUID REFERENCES farm_harvest_cycles(cycle_id),
    reminder_date DATE NOT NULL,
    reminder_type VARCHAR(50), -- Early, Due, Overdue
    status VARCHAR(50) DEFAULT 'Pending', -- Contacted, Negotiating, Purchased, Postponed, Skipped
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. AUDIT
CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SYSTEM SETTINGS
CREATE TABLE settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. BUSINESS SETTINGS (Phase 1)
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) DEFAULT 'Rakshi Coco',
    business_address TEXT,
    business_phone VARCHAR(50),
    gst_number VARCHAR(50),
    default_currency VARCHAR(10) DEFAULT 'INR',
    early_reminder_days INTEGER DEFAULT 35,
    second_reminder_days INTEGER DEFAULT 38,
    expected_harvest_days INTEGER DEFAULT 40,
    overdue_after_days INTEGER DEFAULT 42,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists for global settings
CREATE UNIQUE INDEX business_settings_single_row ON business_settings((1));

-- 12. AUTH TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    'MANAGER' -- Default to MANAGER for early development, should be strictly controlled in production
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can read their own profile, Owners/Managers can read all
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owners and Managers can read all profiles" ON profiles
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('OWNER', 'MANAGER')
    );

CREATE POLICY "Owners can update all profiles" ON profiles
    FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'OWNER'
    );

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Settings: All authenticated users can read settings
CREATE POLICY "Authenticated users can read business settings" ON business_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can update business settings" ON business_settings
    FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'OWNER'
    );
