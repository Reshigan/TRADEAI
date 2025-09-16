const bcrypt = require('bcrypt');

const password = 'admin123';
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm';

console.log('Testing password:', password);
console.log('Against hash:', hash);

bcrypt.compare(password, hash, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Password match:', result);
    }
    process.exit(0);
});