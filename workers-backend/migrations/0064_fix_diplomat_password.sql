-- Fix Diplomat SA admin password hash
-- The auth route uses SHA-256 (not bcrypt), so we need the correct hash
-- Password: DiplomatAdmin123! -> SHA-256 hex
UPDATE users
SET password = '791f2e4ae33f10b82a8aa57d74d4618055f52f70283be0506dff46314d22f19b'
WHERE email = 'admin@diplomatsa.co.za';
