const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const isProd = process.env.NODE_ENV === "production";
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errors = null;

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "فرمت داده‌ی ارسالی (JSON) معتبر نیست";
  }

  if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "حجم داده‌ی ارسالی بیش از حد مجاز است";
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "منبع مورد نظر یافت نشد";
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    errors = { [field]: "این مقدار قبلاً استفاده شده است" };
    message = "اطلاعات ارسالی معتبر نیست";
  }

  if (err.name === "ValidationError" && err.errors) {
    statusCode = 422;
    errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    message = "اطلاعات ارسالی معتبر نیست";
  }

  if (err.name === "MulterError") {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "حجم هر عکس حداکثر ۳ مگابایت است"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "تعداد عکس‌ها بیش از حد مجاز است"
          : err.message;
  }

  if (statusCode >= 500) {
    console.error(`❌ [${req.method}] ${req.originalUrl}`, err);
    if (isProd) message = "خطای داخلی سرور. لطفاً دوباره تلاش کنید.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(!isProd && { stack: err.stack }),
  });
};

export { notFound, errorHandler };
