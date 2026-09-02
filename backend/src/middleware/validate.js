// Usage: router.post('/bookings', validate(bookingSchema), controller.create)
// Keeps validation declarative and out of controllers — controllers should
// assume req.body is already shaped correctly by the time they run.

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
