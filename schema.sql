/* schema.sql - เวอร์ชันปรับปรุง */
DROP TABLE IF EXISTS Track;
DROP TABLE IF EXISTS Project;
DROP TABLE IF EXISTS Category;

CREATE TABLE Category (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE Project (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category_id TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES Category(id) ON DELETE CASCADE
);

CREATE TABLE Track (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    src TEXT NOT NULL,
    project_id TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    file_size INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES Project(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_category ON Project(category_id);
CREATE INDEX idx_track_project ON Track(project_id);
CREATE INDEX idx_category_order ON Category(display_order);
CREATE INDEX idx_project_order ON Project(display_order);
CREATE INDEX idx_track_order ON Track(display_order);