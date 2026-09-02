// Services throw plain Error objects with an optional `.status`; this is
// the one place that turns them into an HTTP response, so controllers stay
// free of try/catch boilerplate (see routes/*.js — every route is wrapped
// in asyncHandler, which forwards errors here via next()).

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Something went wrong' : err.message,
  });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
