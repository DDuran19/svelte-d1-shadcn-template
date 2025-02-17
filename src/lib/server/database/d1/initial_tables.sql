-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar TEXT, -- File path for avatar, optional
    status BOOLEAN,
    super_admin BOOLEAN
);