-- Fix Diplomat SA admin password hash format
UPDATE users
SET password = '791f2e4ae33f10b82a8aa57d74d4618055f52f70283be0506dff46314d22f19b'
WHERE email = 'admin@diplomatsa.co.za';
