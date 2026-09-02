// Usage: router.post('/centres', auth, rbac(['admin']), controller.create)
// Must run after auth.js, since it reads req.user.

function rbac(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }
    next();
  };
}

// For centre_staff routes that must be scoped to their own centre only —
// e.g. GET /centres/:centreId/queue. Admins bypass the scope check.
function scopedToOwnCentre(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'centre_staff' && String(req.user.centreId) === String(req.params.centreId)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Not authorized for this centre' });
}

module.exports = { rbac, scopedToOwnCentre };
