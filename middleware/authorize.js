const authorize = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            // Admin role has all permissions
            if (user.role.name === 'ADMIN') {
                return next();
            }

            // Check if user has required permissions
            const userPermissions = user.role.permissions.map(perm =>
                `${perm.resource}_${perm.action}`
            );

            const hasPermission = requiredPermissions.every(permission =>
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Authorization check failed.'
            });
        }
    };
};

module.exports = authorize;