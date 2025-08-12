-- =============================================================================
-- HOTELZED MULTITENANT DATABASE SCHEMA
-- PostgreSQL 14+ with Row Level Security (RLS)
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Tenant status
CREATE TYPE tenant_status AS ENUM ('active', 'trial', 'suspended', 'cancelled', 'pending');

-- Subscription plans
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise', 'custom');

-- User status
CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'deleted');

-- Order status
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

-- Order types
CREATE TYPE order_type AS ENUM ('dine-in', 'takeaway', 'delivery');

-- Table status
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');

-- =============================================================================
-- CORE TENANT TABLES
-- =============================================================================

-- Tenants table (main isolation point)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    status tenant_status DEFAULT 'trial',
    plan subscription_plan DEFAULT 'starter',
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    language VARCHAR(5) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    time_format VARCHAR(5) DEFAULT '12h',
    default_tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    service_charge_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Contact information
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    contact_first_name VARCHAR(100),
    contact_last_name VARCHAR(100),
    contact_company VARCHAR(255),
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    
    -- Limits and usage
    max_users INTEGER DEFAULT 5,
    max_tables INTEGER DEFAULT 20,
    max_orders_per_month INTEGER DEFAULT 1000,
    max_menu_items INTEGER DEFAULT 100,
    max_storage_gb INTEGER DEFAULT 1,
    
    current_users INTEGER DEFAULT 0,
    current_tables INTEGER DEFAULT 0,
    current_menu_items INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10,3) DEFAULT 0.000,
    
    -- Features
    features JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    suspended_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name subscription_plan UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (for multi-location tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'restaurant',
    parent_id UUID REFERENCES organizations(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    
    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(100),
    address_zip_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    manager VARCHAR(255),
    
    -- Business hours (stored as JSONB)
    business_hours JSONB DEFAULT '[]',
    
    -- Capacity
    total_tables INTEGER DEFAULT 0,
    total_seats INTEGER DEFAULT 0,
    delivery_radius_km INTEGER DEFAULT 5,
    
    -- Features
    features JSONB DEFAULT '{}',
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

-- =============================================================================
-- USER MANAGEMENT
-- =============================================================================

-- User roles
CREATE TABLE tenant_user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, name)
);

-- Users
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    password_hash VARCHAR(255),
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    
    -- Role and permissions
    role_id UUID REFERENCES tenant_user_roles(id),
    custom_permissions JSONB DEFAULT '{}',
    
    -- Status and security
    status user_status DEFAULT 'invited',
    email_verified_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- Activity tracking
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- Metadata
    invited_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, username)
);

-- User invitations
CREATE TABLE tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES tenant_user_roles(id),
    invited_by UUID NOT NULL REFERENCES tenant_users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, email, status) -- Prevent duplicate pending invitations
);

-- =============================================================================
-- RESTAURANT OPERATIONS
-- =============================================================================

-- Menu categories
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    category_id UUID REFERENCES menu_categories(id),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    
    -- Inventory
    sku VARCHAR(100),
    track_inventory BOOLEAN DEFAULT false,
    current_stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Properties
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    prep_time_minutes INTEGER DEFAULT 15,
    
    -- Dietary info
    calories INTEGER,
    dietary_tags JSONB DEFAULT '[]', -- ['vegetarian', 'vegan', 'gluten-free', etc.]
    allergens JSONB DEFAULT '[]',
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu item modifiers
CREATE TABLE menu_modifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'single', -- 'single', 'multiple', 'required'
    options JSONB NOT NULL DEFAULT '[]', -- [{"name": "Large", "price": 2.00}, ...]
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    
    table_number VARCHAR(20) NOT NULL,
    seats INTEGER NOT NULL DEFAULT 2,
    status table_status DEFAULT 'available',
    
    -- Position (for floor plan)
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, location_id, table_number)
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_zip_code VARCHAR(20),
    
    -- Preferences
    dietary_preferences JSONB DEFAULT '[]',
    notes TEXT,
    
    -- Marketing
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Stats
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, phone)
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    
    -- Order identification
    order_number VARCHAR(50) NOT NULL,
    type order_type NOT NULL,
    status order_status DEFAULT 'pending',
    
    -- Customer info
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    
    -- Order details
    table_id UUID REFERENCES tables(id),
    estimated_prep_time INTEGER, -- minutes
    special_instructions TEXT,
    
    -- Delivery info (for delivery orders)
    delivery_address JSONB,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    delivery_instructions TEXT,
    
    -- Financial
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    delivery_fee_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Payment
    payment_status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    
    -- Staff
    created_by UUID REFERENCES tenant_users(id),
    assigned_to UUID REFERENCES tenant_users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(tenant_id, order_number)
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    
    -- Item details
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Modifiers
    modifiers JSONB DEFAULT '[]', -- Applied modifiers
    special_instructions TEXT,
    
    -- Kitchen status
    kitchen_status VARCHAR(50) DEFAULT 'pending',
    prep_time_minutes INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PAYMENT PROCESSING
-- =============================================================================

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    
    -- Transaction details
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    
    -- Payment method
    payment_method VARCHAR(100) NOT NULL,
    provider VARCHAR(100), -- stripe, square, etc.
    provider_transaction_id VARCHAR(255),
    
    -- Fees
    processing_fee DECIMAL(10,2) DEFAULT 0.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Customer info
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Payment refunds
CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES payment_transactions(id),
    
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending',
    
    provider_refund_id VARCHAR(255),
    
    processed_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- =============================================================================
-- INVENTORY MANAGEMENT
-- =============================================================================

-- Inventory items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    
    -- Units and pricing
    unit_type VARCHAR(50) DEFAULT 'each', -- each, kg, lbs, liters, etc.
    cost_per_unit DECIMAL(10,4),
    current_stock DECIMAL(12,4) DEFAULT 0,
    minimum_stock DECIMAL(12,4) DEFAULT 0,
    maximum_stock DECIMAL(12,4),
    
    -- Supplier info
    supplier_name VARCHAR(255),
    supplier_item_code VARCHAR(100),
    
    -- Tracking
    track_expiry BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, location_id, sku)
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    -- Transaction details
    type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'adjustment', 'waste', 'return'
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(10,4),
    total_cost DECIMAL(10,2),
    
    -- Reference
    reference_type VARCHAR(50), -- 'order', 'purchase_order', 'manual'
    reference_id UUID,
    
    notes TEXT,
    created_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STAFF MANAGEMENT
-- =============================================================================

-- Staff shifts
CREATE TABLE staff_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id),
    user_id UUID NOT NULL REFERENCES tenant_users(id),
    
    -- Shift details
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INTEGER DEFAULT 30,
    
    -- Actual times (for time tracking)
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    
    -- Financial
    hourly_rate DECIMAL(8,2),
    total_hours DECIMAL(5,2),
    total_pay DECIMAL(10,2),
    
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, started, completed, cancelled
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff attendance
CREATE TABLE staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tenant_users(id),
    shift_id UUID REFERENCES staff_shifts(id),
    
    -- Clock in/out
    clock_in_time TIMESTAMPTZ NOT NULL,
    clock_out_time TIMESTAMPTZ,
    
    -- Location tracking (optional)
    clock_in_location POINT,
    clock_out_location POINT,
    
    -- Break tracking
    break_start_time TIMESTAMPTZ,
    break_end_time TIMESTAMPTZ,
    total_break_minutes INTEGER DEFAULT 0,
    
    -- Calculated fields
    total_work_minutes INTEGER,
    overtime_minutes INTEGER DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT AND LOGGING
-- =============================================================================

-- Audit log
CREATE TABLE tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Request info
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System notifications
CREATE TABLE tenant_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_users(id), -- NULL for tenant-wide notifications
    
    -- Notification details
    type VARCHAR(50) NOT NULL, -- 'order', 'payment', 'inventory', 'system', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadata
    data JSONB DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Tenant isolation indexes (most important)
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_locations_tenant_id ON locations(tenant_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_user_roles_tenant_id ON tenant_user_roles(tenant_id);
CREATE INDEX idx_menu_categories_tenant_id ON menu_categories(tenant_id);
CREATE INDEX idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX idx_tables_tenant_id ON tables(tenant_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX idx_payment_transactions_tenant_id ON payment_transactions(tenant_id);
CREATE INDEX idx_inventory_items_tenant_id ON inventory_items(tenant_id);
CREATE INDEX idx_staff_shifts_tenant_id ON staff_shifts(tenant_id);
CREATE INDEX idx_audit_logs_tenant_id ON tenant_audit_logs(tenant_id);

-- Business logic indexes
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_created_at ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_customer_id ON orders(tenant_id, customer_id);
CREATE INDEX idx_orders_location_id ON orders(tenant_id, location_id);
CREATE INDEX idx_menu_items_category ON menu_items(tenant_id, category_id);
CREATE INDEX idx_menu_items_availability ON menu_items(tenant_id, is_available);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(tenant_id, status);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(tenant_id, date);
CREATE INDEX idx_staff_shifts_user ON staff_shifts(tenant_id, user_id);

-- Search indexes
CREATE INDEX idx_customers_email ON customers(tenant_id, email);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_menu_items_name ON menu_items USING gin(tenant_id, to_tsvector('english', name));
CREATE INDEX idx_orders_order_number ON orders(tenant_id, order_number);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tenant-aware tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for one table, repeat for all)
-- Applications should set current_setting('app.current_tenant_id') before queries

CREATE POLICY tenant_isolation_policy ON orders
    FOR ALL
    TO public
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON customers
    FOR ALL
    TO public
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_policy ON menu_items
    FOR ALL
    TO public
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Repeat for all tenant-aware tables...

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tenant isolation helper function
CREATE OR REPLACE FUNCTION set_current_tenant_id(tenant_uuid UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql;

-- Function to check tenant limits before insert
CREATE OR REPLACE FUNCTION check_tenant_limits()
RETURNS TRIGGER AS $$
DECLARE
    tenant_record RECORD;
BEGIN
    SELECT * INTO tenant_record FROM tenants WHERE id = NEW.tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found';
    END IF;
    
    -- Check specific limits based on table
    IF TG_TABLE_NAME = 'tenant_users' THEN
        IF tenant_record.current_users >= tenant_record.max_users THEN
            RAISE EXCEPTION 'User limit exceeded for tenant';
        END IF;
    ELSIF TG_TABLE_NAME = 'tables' THEN
        IF tenant_record.current_tables >= tenant_record.max_tables THEN
            RAISE EXCEPTION 'Table limit exceeded for tenant';
        END IF;
    ELSIF TG_TABLE_NAME = 'menu_items' THEN
        IF tenant_record.current_menu_items >= tenant_record.max_menu_items THEN
            RAISE EXCEPTION 'Menu item limit exceeded for tenant';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add limit checking triggers
CREATE TRIGGER check_user_limits BEFORE INSERT ON tenant_users FOR EACH ROW EXECUTE FUNCTION check_tenant_limits();
CREATE TRIGGER check_table_limits BEFORE INSERT ON tables FOR EACH ROW EXECUTE FUNCTION check_tenant_limits();
CREATE TRIGGER check_menu_item_limits BEFORE INSERT ON menu_items FOR EACH ROW EXECUTE FUNCTION check_tenant_limits();

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('starter', 'Starter', 'Perfect for small restaurants', 29.00, 290.00, 
 '{"basic_pos": true, "online_ordering": false, "analytics": false}',
 '{"max_users": 3, "max_tables": 10, "max_orders": 500, "max_menu_items": 50, "storage_gb": 1}'),
('professional', 'Professional', 'For growing restaurants', 79.00, 790.00,
 '{"basic_pos": true, "online_ordering": true, "analytics": true, "inventory": true}',
 '{"max_users": 10, "max_tables": 50, "max_orders": 2000, "max_menu_items": 200, "storage_gb": 5}'),
('enterprise', 'Enterprise', 'For restaurant chains', 199.00, 1990.00,
 '{"basic_pos": true, "online_ordering": true, "analytics": true, "inventory": true, "multi_location": true, "api_access": true}',
 '{"max_users": 50, "max_tables": 200, "max_orders": 10000, "max_menu_items": 1000, "storage_gb": 25}');

-- Create system roles function
CREATE OR REPLACE FUNCTION create_default_tenant_roles(tenant_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO tenant_user_roles (tenant_id, name, display_name, description, permissions, is_system, is_default) VALUES
    (tenant_uuid, 'owner', 'Owner', 'Full access to all features', '{"orders": {"create": true, "read": true, "update": true, "delete": true, "refund": true}, "settings": {"restaurant": true, "system": true, "billing": true}}', true, false),
    (tenant_uuid, 'manager', 'Manager', 'Restaurant management access', '{"orders": {"create": true, "read": true, "update": true, "delete": false, "refund": true}, "staff": {"create": true, "read": true, "update": true}}', true, false),
    (tenant_uuid, 'staff', 'Staff', 'Basic staff access', '{"orders": {"create": true, "read": true, "update": true, "delete": false}, "customers": {"create": true, "read": true}}', true, true),
    (tenant_uuid, 'cashier', 'Cashier', 'Point of sale access', '{"orders": {"create": true, "read": true, "update": true}, "payments": {"process": true, "view": true}}', true, false);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active tenants view
CREATE VIEW active_tenants AS
SELECT 
    t.*,
    COUNT(tu.id) as user_count,
    COUNT(l.id) as location_count
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id AND tu.status = 'active'
LEFT JOIN locations l ON t.id = l.tenant_id AND l.status = 'active'
WHERE t.status IN ('active', 'trial') AND t.deleted_at IS NULL
GROUP BY t.id;

-- Order summary view
CREATE VIEW order_summary AS
SELECT 
    o.*,
    c.first_name as customer_first_name,
    c.last_name as customer_last_name,
    l.name as location_name,
    COUNT(oi.id) as item_count,
    COALESCE(pt.status, 'pending') as payment_status
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN locations l ON o.location_id = l.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payment_transactions pt ON o.id = pt.order_id
GROUP BY o.id, c.first_name, c.last_name, l.name, pt.status;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE tenants IS 'Main tenant isolation table - each row represents a restaurant business';
COMMENT ON COLUMN tenants.slug IS 'URL-safe identifier used for subdomains (e.g., "joes-pizza")';
COMMENT ON TABLE tenant_users IS 'Users scoped to specific tenants with role-based permissions';
COMMENT ON TABLE orders IS 'All order types (dine-in, takeaway, delivery) with tenant isolation';

-- =============================================================================
-- GRANTS (adjust based on your application user)
-- =============================================================================

-- Grant permissions to application user (replace 'app_user' with your actual username)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;