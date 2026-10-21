// تنظیمات موقع فراخوانی خونده می‌شه، نه موقع import
const getConfig = () => {
  const sandbox = process.env.ZARINPAL_SANDBOX === "true";
  return {
    baseUrl: sandbox ? "https://sandbox.zarinpal.com" : "https://api.zarinpal.com",
    startPayUrl: sandbox
      ? "https://sandbox.zarinpal.com/pg/StartPay/"
      : "https://www.zarinpal.com/pg/StartPay/",
    merchantId: process.env.ZARINPAL_MERCHANT_ID,
  };
};

// حالت توسعه: پرداخت شبیه‌سازی می‌شه و درگاهی صدا زده نمی‌شه (در production هرگز فعال نمی‌شه)
const isMock = () => process.env.PAYMENT_MODE === "mock" && process.env.NODE_ENV !== "production";

// درخواست ساخت تراکنش پرداخت
export const requestPayment = async ({ amountToman, description, mobile }) => {
  if (isMock()) {
    const authority = `MOCK${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    return {
      success: true,
      authority,
      paymentUrl: `${process.env.SERVER_URL}/api/orders/verify?Authority=${authority}&Status=OK`,
    };
  }

  const { baseUrl, startPayUrl, merchantId } = getConfig();

  let result;
  try {
    const response = await fetch(`${baseUrl}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amountToman * 10, // تبدیل تومان به ریال
        callback_url: `${process.env.SERVER_URL}/api/orders/verify`,
        description,
        metadata: mobile ? { mobile } : undefined,
      }),
    });
    result = await response.json();
  } catch (err) {
    console.error(`❌ ZarinPal network error: ${err.cause?.code || err.message}`);
    return { success: false, error: "ارتباط با درگاه پرداخت برقرار نشد" };
  }

  if (result.data && result.data.code === 100) {
    return {
      success: true,
      authority: result.data.authority,
      paymentUrl: `${startPayUrl}${result.data.authority}`,
    };
  }

  console.error("❌ ZarinPal request failed:", JSON.stringify(result.errors));
  return { success: false, error: result.errors?.message || "خطا در اتصال به درگاه پرداخت" };
};

// تایید تراکنش بعد از بازگشت کاربر از درگاه
export const verifyPayment = async ({ authority, amountToman }) => {
  if (isMock()) return { success: true, refId: "MOCK-REF" };

  const { baseUrl, merchantId } = getConfig();

  let result;
  try {
    const response = await fetch(`${baseUrl}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: amountToman * 10,
        authority,
      }),
    });
    result = await response.json();
  } catch (err) {
    console.error(`❌ ZarinPal verify network error: ${err.cause?.code || err.message}`);
    return { success: false, error: "ارتباط با درگاه پرداخت برقرار نشد" };
  }

  if (result.data && (result.data.code === 100 || result.data.code === 101)) {
    return { success: true, refId: result.data.ref_id };
  }

  console.error("❌ ZarinPal verify failed:", JSON.stringify(result.errors));
  return { success: false, error: result.errors?.message || "پرداخت تایید نشد" };
};