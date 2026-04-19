const requirePermission = (permissionName) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user || !user.role) {
      return res.status(403).json({ success: false, message: 'Forbidden: No user role found' });
    }

    // Admin has all permissions
    if (user.role.name === 'ADMIN') {
      return next();
    }

    const hasPermission = user.role.permissions.some(p => p.name === permissionName.toUpperCase());

    if (!hasPermission) {
      return res.status(403).json({ success: false, message: `Forbidden: Missing permission ${permissionName}` });
    }

    next();
  };
};

module.exports = { requirePermission };
