/* schema.sql */
DROP TABLE IF EXISTS Track;
DROP TABLE IF EXISTS Project;
DROP TABLE IF EXISTS Category;

CREATE TABLE Category (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE Project (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category_id TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES Category(id) ON DELETE CASCADE
);
CREATE TABLE Track (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    src TEXT NOT NULL,
    project_id TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES Project(id) ON DELETE CASCADE
);
CREATE INDEX idx_project_category ON Project(category_id);
CREATE INDEX idx_track_project ON Track(project_id);