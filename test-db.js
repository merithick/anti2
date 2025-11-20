const db = require('./db');

console.log('Testing database queries...\n');

try {
    console.log('1. Total users count:');
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('   Result:', totalUsers);

    console.log('\n2. Total calculations count:');
    const totalCalculations = db.prepare('SELECT COUNT(*) as count FROM calculations').get();
    console.log('   Result:', totalCalculations);

    console.log('\n3. Recent users (7 days):');
    const recentUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")').get();
    console.log('   Result:', recentUsers);

    console.log('\n✅ All queries successful!');
    console.log('\nStats would be:');
    console.log({
        totalUsers: totalUsers.count,
        totalCalculations: totalCalculations.count,
        recentSignups: recentUsers.count
    });
} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
}
