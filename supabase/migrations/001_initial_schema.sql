-- 001_initial_schema.sql

-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales_rep');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'social_media', 'cold_call', 'event', 'other');
CREATE TYPE lead_status AS ENUM ('active', 'won', 'lost', 'archived');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'note', 'stage_change', 'status_change');
CREATE TYPE follow_up_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE follow_up_status AS ENUM ('pending', 'completed', 'overdue', 'cancelled');
CREATE TYPE demo_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
CREATE TYPE sale_status AS ENUM ('pending', 'paid', 'partial', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('pix', 'credit_card', 'bank_transfer', 'invoice');

-- 2. TABLES

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    role user_role DEFAULT 'sales_rep',
    avatar_url text,
    phone text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    order_position integer NOT NULL,
    color text NOT NULL DEFAULT '#6366f1',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text DEFAULT '',
    phone text DEFAULT '',
    company text DEFAULT '',
    position text DEFAULT '',
    source lead_source DEFAULT 'other',
    stage_id UUID REFERENCES pipeline_stages(id),
    assigned_to UUID REFERENCES profiles(id),
    status lead_status DEFAULT 'active',
    estimated_value numeric DEFAULT 0,
    notes text DEFAULT '',
    next_action_date timestamptz NOT NULL,
    next_action_description text NOT NULL DEFAULT 'Definir próxima ação',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    type activity_type NOT NULL,
    description text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    title text NOT NULL,
    description text DEFAULT '',
    due_date timestamptz NOT NULL,
    priority follow_up_priority DEFAULT 'medium',
    status follow_up_status DEFAULT 'pending',
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE demonstrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    scheduled_at timestamptz NOT NULL,
    duration_minutes integer DEFAULT 60,
    status demo_status DEFAULT 'scheduled',
    meeting_link text DEFAULT '',
    notes text DEFAULT '',
    feedback text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    title text NOT NULL,
    value numeric DEFAULT 0,
    status proposal_status DEFAULT 'draft',
    valid_until date,
    sent_at timestamptz,
    notes text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    proposal_id UUID REFERENCES proposals(id),
    user_id UUID REFERENCES profiles(id),
    value numeric NOT NULL,
    recurring_value numeric DEFAULT 0,
    payment_method payment_method DEFAULT 'pix',
    installments integer DEFAULT 1,
    status sale_status DEFAULT 'pending',
    closed_at timestamptz DEFAULT now(),
    notes text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb DEFAULT '{}',
    updated_by UUID REFERENCES profiles(id),
    updated_at timestamptz DEFAULT now()
);

-- 3. ROW LEVEL SECURITY

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE demonstrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Pipeline Stages Policies
CREATE POLICY "Pipeline stages are viewable by everyone." ON pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Only admins can modify pipeline stages." ON pipeline_stages FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Settings Policies
CREATE POLICY "Settings are viewable by everyone." ON settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify settings." ON settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Leads Policies
CREATE POLICY "Users can view all leads if admin or manager, else only assigned." ON leads FOR SELECT
USING (is_manager() OR assigned_to = auth.uid());
CREATE POLICY "Users can insert leads." ON leads FOR INSERT
WITH CHECK (is_manager() OR assigned_to = auth.uid());
CREATE POLICY "Users can update assigned leads or all if manager/admin." ON leads FOR UPDATE
USING (is_manager() OR assigned_to = auth.uid()) WITH CHECK (is_manager() OR assigned_to = auth.uid());
CREATE POLICY "Only managers and admins can delete leads." ON leads FOR DELETE
USING (is_manager());

-- Lead Activities Policies
CREATE POLICY "Users can view lead activities." ON lead_activities FOR SELECT
USING (
    is_manager() OR 
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_to = auth.uid())
);
CREATE POLICY "Users can insert activities for their leads." ON lead_activities FOR INSERT
WITH CHECK (
    is_manager() OR 
    EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND leads.assigned_to = auth.uid())
);
CREATE POLICY "Users can update their own activities." ON lead_activities FOR UPDATE
USING (is_manager() OR user_id = auth.uid()) WITH CHECK (is_manager() OR user_id = auth.uid());
CREATE POLICY "Users can delete their own activities." ON lead_activities FOR DELETE
USING (is_manager() OR user_id = auth.uid());

-- Follow Ups Policies
CREATE POLICY "Users can view follow ups." ON follow_ups FOR SELECT
USING (
    is_manager() OR 
    EXISTS (SELECT 1 FROM leads WHERE leads.id = follow_ups.lead_id AND leads.assigned_to = auth.uid())
);
CREATE POLICY "Users can manage follow ups." ON follow_ups FOR ALL
USING (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = follow_ups.lead_id AND leads.assigned_to = auth.uid())
)
WITH CHECK (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = follow_ups.lead_id AND leads.assigned_to = auth.uid())
);

-- Demonstrations Policies
CREATE POLICY "Users can view demos." ON demonstrations FOR SELECT
USING (
    is_manager() OR 
    EXISTS (SELECT 1 FROM leads WHERE leads.id = demonstrations.lead_id AND leads.assigned_to = auth.uid())
);
CREATE POLICY "Users can manage demos." ON demonstrations FOR ALL
USING (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = demonstrations.lead_id AND leads.assigned_to = auth.uid())
)
WITH CHECK (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = demonstrations.lead_id AND leads.assigned_to = auth.uid())
);

-- Proposals Policies
CREATE POLICY "Users can view proposals." ON proposals FOR SELECT
USING (
    is_manager() OR 
    EXISTS (SELECT 1 FROM leads WHERE leads.id = proposals.lead_id AND leads.assigned_to = auth.uid())
);
CREATE POLICY "Users can manage proposals." ON proposals FOR ALL
USING (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = proposals.lead_id AND leads.assigned_to = auth.uid())
)
WITH CHECK (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = proposals.lead_id AND leads.assigned_to = auth.uid())
);

-- Sales Policies
CREATE POLICY "Users can view sales." ON sales FOR SELECT
USING (
    is_manager() OR 
    EXISTS (SELECT 1 FROM leads WHERE leads.id = sales.lead_id AND leads.assigned_to = auth.uid())
);
CREATE POLICY "Users can manage sales." ON sales FOR ALL
USING (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = sales.lead_id AND leads.assigned_to = auth.uid())
)
WITH CHECK (
    is_manager() OR user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM leads WHERE leads.id = sales.lead_id AND leads.assigned_to = auth.uid())
);

-- 4. TRIGGERS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE PROCEDURE set_updated_at();

-- Trigger to auto-create profile for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'), 'sales_rep');
    RETURN new;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Trigger to auto-log stage changes
CREATE OR REPLACE FUNCTION log_lead_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO lead_activities (lead_id, user_id, type, description)
        VALUES (
            NEW.id,
            auth.uid(),
            'stage_change',
            'Lead moved to stage: ' || (SELECT name FROM pipeline_stages WHERE id = NEW.stage_id)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_lead_stage_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE PROCEDURE log_lead_stage_change();

-- 5. INDEXES

CREATE INDEX IF NOT EXISTS leads_stage_id_idx ON leads(stage_id);
CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_next_action_date_idx ON leads(next_action_date);

CREATE INDEX IF NOT EXISTS follow_ups_lead_id_idx ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS follow_ups_user_id_idx ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS follow_ups_status_idx ON follow_ups(status);
CREATE INDEX IF NOT EXISTS follow_ups_due_date_idx ON follow_ups(due_date);

CREATE INDEX IF NOT EXISTS demonstrations_lead_id_idx ON demonstrations(lead_id);
CREATE INDEX IF NOT EXISTS demonstrations_status_idx ON demonstrations(status);
CREATE INDEX IF NOT EXISTS demonstrations_scheduled_at_idx ON demonstrations(scheduled_at);

CREATE INDEX IF NOT EXISTS proposals_lead_id_idx ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status);

CREATE INDEX IF NOT EXISTS sales_lead_id_idx ON sales(lead_id);
CREATE INDEX IF NOT EXISTS sales_user_id_idx ON sales(user_id);
CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);

CREATE INDEX IF NOT EXISTS lead_activities_lead_id_idx ON lead_activities(lead_id);

-- 6. SEED DATA

INSERT INTO pipeline_stages (name, order_position, color) VALUES
    ('Prospecção', 1, '#8b5cf6'),
    ('Qualificação', 2, '#3b82f6'),
    ('Demonstração', 3, '#06b6d4'),
    ('Proposta', 4, '#f59e0b'),
    ('Negociação', 5, '#f97316'),
    ('Fechamento', 6, '#10b981');
