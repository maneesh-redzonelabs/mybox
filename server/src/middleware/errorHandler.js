const ApiError = require('../lib/ApiError');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { error: { code: err.code, message: err.message } };
    if (err.fields) body.error.fields = err.fields;
    return res.status(err.status).json(body);
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
}

module.exports = { notFoundHandler, errorHandler };
