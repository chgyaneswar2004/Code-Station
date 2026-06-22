/**
 * Express middleware to validate request bodies against a Joi schema
 * @param {Object} schema Joi schema object
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: true });
    
    if (error) {
      const message = error.details[0].message;
      return res.status(400).json({ error: message });
    }
    
    req.body = value;
    next();
  };
};

module.exports = validateBody;
