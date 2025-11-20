const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const adminAuthMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        console.log('Admin check - User:', decoded.email, 'isAdmin:', decoded.isAdmin);

        // Check if user is admin
        if (!decoded.isAdmin) {
            console.log('Access denied - User is not admin');
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { adminAuthMiddleware };
