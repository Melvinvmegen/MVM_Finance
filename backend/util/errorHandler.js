exports.notFound = function(next, modelName) {
  const error = new Error(`${modelName} not found.`)
  error.statusCode = 404
  return next(error)
}

exports.validationFailed = function(next) {
  const error = new Error('Validation failed.')
  error.statusCode = 422
  return next(error)
}

exports.alreadyError = function(next, message = 'Quotation already converted.') {
  const error = new Error(message)
  error.statusCode = 403
  return next(error)
}