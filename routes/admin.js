const express = require('express');
const db = require('../db');
const { adminAuthMiddleware } = require('../middleware/adminAuth');

const router = express.Router();

// All admin routes require admin authentication
router.use(adminAuthMiddleware);

// Get dashboard statistics
router.get('/stats', (req, res) => {
    try {
        console.log('Fetching admin stats...');
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
        console.log('Total users:', totalUsers);

        const totalCalculations = db.prepare('SELECT COUNT(*) as count FROM calculations').get();
        console.log('Total calculations:', totalCalculations);

        res.json({
            totalUsers: totalUsers.count,
            totalCalculations: totalCalculations.count,
            recentSignups: totalUsers.count  // Just use total users for now
        });
        console.log('Stats sent successfully');
    } catch (error) {
        console.error('Stats endpoint error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get all users with pagination
router.get('/users', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let query = 'SELECT id, name, email, is_admin, created_at FROM users';
        let countQuery = 'SELECT COUNT(*) as count FROM users';
        const params = [];

        if (search) {
            query += ' WHERE name LIKE ? OR email LIKE ?';
            countQuery += ' WHERE name LIKE ? OR email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

        const users = db.prepare(query).all(...params, limit, offset);
        const total = db.prepare(countQuery).get(...params);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total: total.count,
                totalPages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        console.error('Users endpoint error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific user
router.get('/users/:id', (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?').get(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const calcCount = db.prepare('SELECT COUNT(*) as count FROM calculations WHERE user_id = ?').get(req.params.id);

        res.json({
            ...user,
            calculationsCount: calcCount.count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user
router.put('/users/:id', (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email required' });
        }

        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.params.id);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user
router.delete('/users/:id', (req, res) => {
    try {
        if (req.user.userId === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all calculations
router.get('/calculations', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const userId = req.query.userId;

        let query = `
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM calculations c
      JOIN users u ON c.user_id = u.id
    `;
        const params = [];

        if (userId) {
            query += ' WHERE c.user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';

        const calculations = db.prepare(query).all(...params, limit, offset);

        let countQuery = 'SELECT COUNT(*) as count FROM calculations';
        if (userId) {
            countQuery += ' WHERE user_id = ?';
        }
        const total = db.prepare(countQuery).get(...(userId ? [userId] : []));

        res.json({
            calculations,
            pagination: {
                page,
                limit,
                total: total.count,
                totalPages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        console.error('Calculations endpoint error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete calculation
router.delete('/calculations/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM calculations WHERE id = ?').run(req.params.id);
        res.json({ message: 'Calculation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
