// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
    console.log('🔐 Admin Middleware Check:');
    console.log('   User:', req.user ? req.user.email : 'No user');
    console.log('   Role:', req.user ? req.user.role : 'No role');

    if (req.user && req.user.role === 'admin') {
        console.log('✅ Admin access granted');
        next();
    } else {
        console.log('❌ Admin access denied');
        res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }
};

module.exports = adminMiddleware;
