const isSandbox = process.env.ZARINPAL_SANDBOX === "true";

const BASE_URL = isSandbox
  ? "https://sandbox.zarinpal.com"
  : "https://api.zarinpal.com";

const START_PAY_URL = isSandbox
  ? "https://sandbox.zarinpal.com/pg/StartPay/"
  : "https://www.zarinpal.com/pg/StartPay/";

// درخواست ساخت تراکنش پرداخت
export const requestPayment = async ({ amountToman, description, mobile }) => {
  const response = await fetch(`${BASE_URL}/pg/v4/payment/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: amountToman * 10,
      callback_url: `${process.env.SERVER_URL}/api/orders/verify`,
      description,
      metadata: mobile ? { mobile } : undefined,
    }),
  });

  const result = await response.json();

  if (result.data && result.data.code === 100) {
    return {
      success: true,
      authority: result.data.authority,
      paymentUrl: `${START_PAY_URL}${result.data.authority}`,
    };
  }

  return { success: false, error: result.errors?.message || "خطا در اتصال به درگاه پرداخت" };
};

// تایید تراکنش بعد از بازگشت کاربر از درگاه
export const verifyPayment = async ({ authority, amountToman }) => {
  const response = await fetch(`${BASE_URL}/pg/v4/payment/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: amountToman * 10,
      authority,
    }),
  });

  const result = await response.json();

  if (result.data && (result.data.code === 100 || result.data.code === 101)) {
    return { success: true, refId: result.data.ref_id };
  }

  return { success: false, error: result.errors?.message || "پرداخت تایید نشد" };
};