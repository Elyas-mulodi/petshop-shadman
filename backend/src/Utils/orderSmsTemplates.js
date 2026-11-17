export const orderConfirmedSms = (orderNumber, totalAmount) =>
  `فاکسی پت
سفارش شما با شماره ${orderNumber} با موفقیت ثبت و پرداخت شد.
مبلغ: ${totalAmount.toLocaleString()} تومان
از خرید شما سپاسگزاریم 🐾`;

export const orderShippedSms = (orderNumber) =>
  `فاکسی پت
سفارش ${orderNumber} شما ارسال شد و به‌زودی به دستتان می‌رسد.`;

export const orderDeliveredSms = (orderNumber) =>
  `فاکسی پت
سفارش ${orderNumber} با موفقیت تحویل داده شد.
امیدواریم از خریدتان راضی باشید 🐾`;