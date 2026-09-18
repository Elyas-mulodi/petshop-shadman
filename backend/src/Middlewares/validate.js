
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = {};

    result.error.errors.forEach((err) => {
      const field = err.path.join(".") || "general";
      if (!errors[field]) {
        errors[field] = err.message;
      }
    });

    return res.status(422).json({
      success: false,
      message: "اطلاعات ارسالی معتبر نیست",
      errors,
    });
  }

  req[source] = result.data;
  next();
};

export default validate;