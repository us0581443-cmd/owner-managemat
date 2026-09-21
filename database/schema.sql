-- NEST Property Management System Database Schema

PRAGMA foreign_keys = ON;

-- 0. Owners Table (Multi-owner authentication & tenancy isolation)
CREATE TABLE IF NOT EXISTS owners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    profile_image TEXT,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    otp_code TEXT NULL,
    otp_expires_at TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 0.1 Auth Sessions / Tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
    token TEXT PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- 1. Flats Table
CREATE TABLE IF NOT EXISTS flats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    flat_number TEXT NOT NULL,
    address TEXT NOT NULL,
    bedrooms TEXT NOT NULL,
    size TEXT NOT NULL,
    monthly_rent REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Vacant', -- 'Vacant' or 'Booked'
    photos TEXT DEFAULT '[]', -- JSON array of image URLs
    current_tenant_id INTEGER NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (current_tenant_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 2. Customers Table (Permanent Resident / Tenant Directory)
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    name TEXT NOT NULL,
    father_husband_name TEXT,
    dob TEXT,
    cnic TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    family_members INTEGER DEFAULT 1,
    profession TEXT,
    company TEXT,
    monthly_income REAL DEFAULT 0,
    permanent_address TEXT,
    previous_address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_relation TEXT,
    emergency_contact_phone TEXT,
    cnic_doc TEXT,
    lease_doc TEXT,
    guarantor_doc TEXT,
    stays_count INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- 3. Tenancies Table (Records current and historical stays per flat & customer)
CREATE TABLE IF NOT EXISTS tenancies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    flat_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    check_in_date TEXT NOT NULL,
    duration_months INTEGER NOT NULL,
    security_deposit REAL DEFAULT 0,
    monthly_rent REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'past'
    check_out_date TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 4. Payments Table (Rent Tracking & Digital Receipts)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    flat_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    month_year TEXT NOT NULL, -- e.g., 'September 2026'
    amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Paid', 'Partial', 'Pending', 'Late'
    paid_date TEXT NULL,
    payment_method TEXT NULL, -- 'Cash', 'Bank Transfer', 'EasyPaisa', 'JazzCash'
    receipt_number TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 5. Expenses Table (Maintenance and repairs per flat or general building)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL DEFAULT 1,
    flat_id INTEGER NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Plumbing', 'Electrical', 'Painting', 'Maintenance', 'Tax/Govt', 'Other'
    amount REAL NOT NULL,
    expense_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
    FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL
);
