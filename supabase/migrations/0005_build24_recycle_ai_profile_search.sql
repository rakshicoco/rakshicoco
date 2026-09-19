-- 0005_build24_recycle_ai_profile_search.sql
-- Schema migration for Build 24: Recycle Bin, Avatar storage, and Processing batches

-- 1. Add Soft-delete Columns to user-deletable operational tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'farms', 'purchases', 'sales_orders', 'bills', 'buyers', 'expenses',
        'transport_trips', 'cutting_batches', 'grouping_batches', 'dispatches',
        'teams', 'workers'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;', tbl);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;', tbl);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS delete_reason TEXT DEFAULT NULL;', tbl);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS scheduled_delete_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;', tbl);
            
            -- Add performance index on deleted_at
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_deleted_at ON public.%I(deleted_at);', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- 2. Add avatar_url and avatar_path to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path TEXT DEFAULT NULL;

-- 3. Ensure processing_batches table exists
CREATE TABLE IF NOT EXISTS public.processing_batches (
    id VARCHAR(20) PRIMARY KEY,
    purchase_id VARCHAR(20) REFERENCES public.purchases(id),
    team_id VARCHAR(20) REFERENCES public.teams(id),
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
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL,
    delete_reason TEXT DEFAULT NULL,
    scheduled_delete_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_auth_processing_batches" ON public.processing_batches;
CREATE POLICY "allow_all_auth_processing_batches" ON public.processing_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Storage Bucket Setup for Profile Avatars (PRIVATE as required by Build 24/26)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage object policies for private avatars bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated User Avatar Select" ON storage.objects;
    CREATE POLICY "Authenticated User Avatar Select" ON storage.objects 
    FOR SELECT TO authenticated USING (bucket_id = 'avatars');

    DROP POLICY IF EXISTS "Authenticated Avatar Upload" ON storage.objects;
    CREATE POLICY "Authenticated Avatar Upload" ON storage.objects 
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

    DROP POLICY IF EXISTS "Authenticated Avatar Update" ON storage.objects;
    CREATE POLICY "Authenticated Avatar Update" ON storage.objects 
    FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

    DROP POLICY IF EXISTS "Authenticated Avatar Delete" ON storage.objects;
    CREATE POLICY "Authenticated Avatar Delete" ON storage.objects 
    FOR DELETE TO authenticated USING (bucket_id = 'avatars');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

