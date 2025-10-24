const mongoose = require('mongoose');
const { AppError } = require('../utils/error');

// Basic ID guard
function validateId(paramName = 'id') {
  return (req, _res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid identifier format', 400));
    }
    next();
  };
}

function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { validate, validateId };