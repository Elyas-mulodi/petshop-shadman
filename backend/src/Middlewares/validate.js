const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(", ");
    res.status(400);
    return next(new Error(message));
  }
  req.body = result.data;
  next();
};

export default validate;