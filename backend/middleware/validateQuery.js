const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: result.error.issues,
      });
    }

    req.validatedQuery = result.data;
    next();
  };
};

module.exports = validateQuery;
