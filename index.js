require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const calculationsRoutes = require('./routes/calculations');
const adminRoutes = require('./routes/admin');
require('./db'); // Initialize database

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/calculations', calculationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/advisor', require('./routes/advisor'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
