export const orderConfirmedSms = (orderNumber, totalAmount) =>
  `پت شاپ شادمان
سفارش شما با شماره ${orderNumber} با موفقیت ثبت و پرداخت شد.
مبلغ: ${totalAmount.toLocaleString()} تومان
از خرید شما سپاسگزاریم 🐾`;

export const orderShippedSms = (orderNumber) =>
  `پت شاپ شادمان
سفارش ${orderNumber} شما ارسال شد و به‌زودی به دستتان می‌رسد.`;

export const orderDeliveredSms = (orderNumber) =>
  `پت شاپ شادمان
سفارش ${orderNumber} با موفقیت تحویل داده شد.
امیدواریم از خریدتان راضی باشید 🐾`;