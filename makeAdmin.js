// Script to make a user admin
// Usage: node makeAdmin.js <email>

const db = require('./db');

const email = process.argv[2];

if (!email) {
    console.error('Usage: node makeAdmin.js <email>');
    process.exit(1);
}

try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
        console.error(`User with email "${email}" not found.`);
        console.log('\nPlease sign up first at http://localhost:5173/signup');
        process.exit(1);
    }

    if (user.is_admin === 1) {
        console.log(`User "${user.name}" (${email}) is already an admin.`);
        process.exit(0);
    }

    db.prepare('UPDATE users SET is_admin = 1 WHERE email = ?').run(email);

    console.log(`✅ Success! User "${user.name}" (${email}) is now an admin.`);
    console.log('\nPlease log out and log back in to see admin privileges.');
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
