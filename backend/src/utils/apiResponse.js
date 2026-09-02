// One shared shape for every successful response, so the frontend can
// write one generic API handler instead of parsing each endpoint differently.
function ok(res, data, message = '', status = 200) {
  return res.status(status).json({ success: true, data, message });
}

module.exports = { ok };
