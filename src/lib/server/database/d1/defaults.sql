--> statement-breakpoint
INSERT INTO `users` 
    (id, avatar, first_name, last_name, email, hashed_password, tester, super_admin, created_at, updated_at, created_by_id, updated_by_id)
VALUES
    ('0000-0000-0000-0000', '', 'System', 'Administrator', 'denver02.james14@gmail.com', '$2a$10$Vkngx8aWEOE3k0mNuae2UObdz3D5sGHPcn3NTL4bFehcnKxU5sPCm', 0, 1, unixepoch(), unixepoch(), '0000-0000-0000-0000', '0000-0000-0000-0000');


--> statement-breakpoint
INSERT INTO `features` 
    (id, created_at, created_by_id, updated_at, updated_by_id, name, status)
VALUES
    ('feat_0001', unixepoch(), '0000-0000-0000-0000', unixepoch(), '0000-0000-0000-0000', 'login', 'on');
