export function errorHandler(err, req, res, next) {
  // Avoid leaking stack traces in prod
  const status = err.statusCode || err.status || 500

  // pg unique violation
  if (err?.code === '23505') {
    return res.status(409).json({
      message: 'Conflict: unique constraint violation',
      detail: err.detail
    })
  }

  // pg foreign key
  if (err?.code === '23503') {
    return res.status(400).json({
      message: 'Bad request: foreign key violation',
      detail: err.detail
    })
  }

  return res.status(status).json({
    message: err.message || 'Internal Server Error'
  })
}

