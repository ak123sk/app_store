const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            throw new Error();
        }
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

const generateAdminToken = () => {
    return jwt.sign(
        { role: 'admin', timestamp: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = { adminAuth, generateAdminToken };
