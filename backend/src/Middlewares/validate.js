// میدلور عمومی ولیدیشن با zod
// خروجی خطا به شکل { field: "پیام خطا" } هست تا فرانت راحت هندلش کنه
const validate =
  (schema, source = "body") =>
  (req, res, next) => {
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

    if (source === "query") {
      // توی Express 5 نمیشه مستقیم req.query رو بازنویسی کرد (فقط getter هست)
      // پس به‌جاش فیلدهای validate‌شده رو روی همون object موجود merge می‌کنیم
      Object.assign(req.query, result.data);
    } else {
      req[source] = result.data;
    }

    next();
  };

export default validate;
