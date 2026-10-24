// میدلور عمومی ولیدیشن با zod
// خروجی خطا به شکل { field: "پیام خطا" } هست تا فرانت راحت هندلش کنه
const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const errors = {};

      // در Zod 4 به‌جای error.errors باید از error.issues استفاده کرد
      result.error.issues.forEach((issue) => {
        const field = issue.path.join(".") || "general";
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });

      return res.status(422).json({
        success: false,
        message: "اطلاعات ارسالی معتبر نیست",
        errors,
      });
    }

    if (source === "query") {
      // توی Express 5، req.query فقط getter هست و هر بار از نو ساخته می‌شه،
      // پس نتیجه‌ی ولیدیشن توی req.validatedQuery می‌مونه (کنترلرها همون req.query خام رو می‌خونن)
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }

    next();
  };

export default validate;