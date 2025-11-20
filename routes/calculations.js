const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Save calculation
router.post('/', (req, res) => {
    const { monthlyInvestment, returnRate, timePeriod, investedAmount, estimatedReturns, totalValue } = req.body;
    const userId = req.user.userId;

    if (!monthlyInvestment || !returnRate || !timePeriod || !investedAmount || !estimatedReturns || !totalValue) {
        return res.status(400).json({ error: 'All calculation fields required' });
    }

    try {
        const result = db.prepare(`
      INSERT INTO calculations (user_id, monthly_investment, return_rate, time_period, invested_amount, estimated_returns, total_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, monthlyInvestment, returnRate, timePeriod, investedAmount, estimatedReturns, totalValue);

        res.status(201).json({
            message: 'Calculation saved successfully',
            calculationId: result.lastInsertRowid
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's calculations
router.get('/', (req, res) => {
    const userId = req.user.userId;

    try {
        const calculations = db.prepare(`
      SELECT * FROM calculations 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);

        res.json({ calculations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete calculation
router.delete('/:id', (req, res) => {
    const calculationId = req.params.id;
    const userId = req.user.userId;

    try {
        // Verify ownership before deleting
        const calculation = db.prepare('SELECT * FROM calculations WHERE id = ? AND user_id = ?').get(calculationId, userId);

        if (!calculation) {
            return res.status(404).json({ error: 'Calculation not found' });
        }

        db.prepare('DELETE FROM calculations WHERE id = ?').run(calculationId);

        res.json({ message: 'Calculation deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
