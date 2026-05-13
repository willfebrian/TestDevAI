PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  location_code TEXT NOT NULL UNIQUE,
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS production_processes (
  id TEXT PRIMARY KEY,
  process_code TEXT NOT NULL UNIQUE,
  process_type TEXT NOT NULL,
  process_location_id TEXT,
  started_at TEXT,
  finished_at TEXT,
  status TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,

  FOREIGN KEY (process_location_id) REFERENCES locations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  batch_no TEXT NOT NULL UNIQUE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('Jumbo Roll', 'Slit Roll')),
  product_stage TEXT NOT NULL CHECK (product_stage IN ('Semi-finished Good', 'Finish Good')),
  production_time TEXT NOT NULL,
  current_location_id TEXT,
  qc_status TEXT NOT NULL CHECK (qc_status IN ('PASS', 'FAIL', 'HOLD')),
  characteristics_json TEXT,
  created_by_process_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (current_location_id) REFERENCES locations(id),
  FOREIGN KEY (created_by_process_id) REFERENCES production_processes(id)
);

CREATE TABLE IF NOT EXISTS raw_materials (
  id TEXT PRIMARY KEY,
  material_code TEXT NOT NULL,
  material_name TEXT NOT NULL,
  batch_no TEXT NOT NULL,
  supplier TEXT,
  received_at TEXT,
  material_category TEXT NOT NULL DEFAULT 'Raw Material' CHECK (material_category = 'Raw Material'),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_sources (
  id TEXT PRIMARY KEY,
  target_product_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('Product', 'Raw Material')),
  source_product_id TEXT,
  raw_material_id TEXT,
  source_stage TEXT NOT NULL CHECK (source_stage IN ('Raw Material', 'Semi-finished Good', 'Finish Good')),
  quantity REAL,
  quantity_label TEXT,
  unit TEXT,
  process_id TEXT,
  sequence_no INTEGER NOT NULL,
  created_at TEXT NOT NULL,

  FOREIGN KEY (target_product_id) REFERENCES products(id),
  FOREIGN KEY (source_product_id) REFERENCES products(id),
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
  FOREIGN KEY (process_id) REFERENCES production_processes(id),
  CHECK (
    (source_type = 'Product' AND source_product_id IS NOT NULL AND raw_material_id IS NULL)
    OR
    (source_type = 'Raw Material' AND raw_material_id IS NOT NULL AND source_product_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS product_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  movement_time TEXT NOT NULL,
  from_location_id TEXT,
  to_location_id TEXT,
  movement_location_id TEXT,
  movement_type TEXT NOT NULL,
  related_product_id TEXT,
  related_product_type TEXT,
  note TEXT,
  source_details_json TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (from_location_id) REFERENCES locations(id),
  FOREIGN KEY (to_location_id) REFERENCES locations(id),
  FOREIGN KEY (movement_location_id) REFERENCES locations(id),
  FOREIGN KEY (related_product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS qc_checks (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  qc_status TEXT NOT NULL CHECK (qc_status IN ('PASS', 'FAIL', 'HOLD')),
  checked_by TEXT,
  checked_at TEXT NOT NULL,
  remarks TEXT,
  created_at TEXT NOT NULL,

  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (checked_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS qc_check_items (
  id TEXT PRIMARY KEY,
  qc_check_id TEXT NOT NULL,
  parameter TEXT NOT NULL,
  actual_value TEXT,
  standard_value TEXT,
  method TEXT,
  sample_point TEXT,
  result TEXT NOT NULL CHECK (result IN ('PASS', 'FAIL')),
  reason TEXT,
  action TEXT,
  assessment TEXT,
  sequence_no INTEGER NOT NULL,

  FOREIGN KEY (qc_check_id) REFERENCES qc_checks(id)
);

CREATE TABLE IF NOT EXISTS product_characteristics (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  characteristic_name TEXT NOT NULL,
  characteristic_value TEXT NOT NULL,
  unit TEXT,
  sequence_no INTEGER NOT NULL,

  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(location_code);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);

CREATE INDEX IF NOT EXISTS idx_products_batch_no ON products(batch_no);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_stage ON products(product_stage);
CREATE INDEX IF NOT EXISTS idx_products_qc_status ON products(qc_status);
CREATE INDEX IF NOT EXISTS idx_products_production_time ON products(production_time);
CREATE INDEX IF NOT EXISTS idx_products_current_location ON products(current_location_id);

CREATE INDEX IF NOT EXISTS idx_raw_materials_batch_no ON raw_materials(batch_no);
CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials(material_code);

CREATE INDEX IF NOT EXISTS idx_processes_type ON production_processes(process_type);
CREATE INDEX IF NOT EXISTS idx_processes_location ON production_processes(process_location_id);
CREATE INDEX IF NOT EXISTS idx_processes_started_at ON production_processes(started_at);

CREATE INDEX IF NOT EXISTS idx_product_sources_target ON product_sources(target_product_id);
CREATE INDEX IF NOT EXISTS idx_product_sources_source_product ON product_sources(source_product_id);
CREATE INDEX IF NOT EXISTS idx_product_sources_raw_material ON product_sources(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_product_sources_process ON product_sources(process_id);

CREATE INDEX IF NOT EXISTS idx_product_movements_product ON product_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_product_movements_time ON product_movements(movement_time);
CREATE INDEX IF NOT EXISTS idx_product_movements_type ON product_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_product_movements_related_product ON product_movements(related_product_id);

CREATE INDEX IF NOT EXISTS idx_qc_checks_product ON qc_checks(product_id);
CREATE INDEX IF NOT EXISTS idx_qc_checks_checked_at ON qc_checks(checked_at);
CREATE INDEX IF NOT EXISTS idx_qc_check_items_check ON qc_check_items(qc_check_id);

CREATE INDEX IF NOT EXISTS idx_product_characteristics_product ON product_characteristics(product_id);

COMMIT;
