const Joi = require("joi");

const runCodeSchema = Joi.object({
  compiler: Joi.string().required().messages({
    "any.required": "compiler and code are required",
    "string.empty": "compiler and code are required"
  }),
  code: Joi.string().required().messages({
    "any.required": "compiler and code are required",
    "string.empty": "compiler and code are required"
  }),
  input: Joi.string().allow("").default("")
});

module.exports = {
  runCodeSchema
};
