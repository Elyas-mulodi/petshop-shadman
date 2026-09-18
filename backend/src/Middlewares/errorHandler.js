const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = null;

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "منبع مورد نظر یافت نشد";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    errors = { [field]: `این مقدار قبلاً استفاده شده است` };
    message = "اطلاعات ارسالی معتبر نیست";
  }

  if (err.name === "ValidationError") {
    statusCode = 422;
    errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    message = "اطلاعات ارسالی معتبر نیست";
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { notFound, errorHandler };