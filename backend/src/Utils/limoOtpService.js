const LIMO_BASE = "https://api.limosms.com/api";

// مرحله ۱: درخواست ارسال کد OTP - خودِ لیمو کد رو تولید و پیامک می‌کنه
export const requestLimoOtp = async (phone) => {
  try {
    const response = await fetch(`${LIMO_BASE}/sendcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ApiKey: process.env.LIMOSMS_API_KEY,
      },
      body: JSON.stringify({
        Mobile: phone,
        Footer: "پت شاپ شادمان",
      }),
    });

    const raw = await response.text();

    // مشاهده پاسخ خام سرویس
    console.log("LimoSMS HTTP Status:", response.status);
    console.log("LimoSMS Raw Response:", raw);

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`پاسخ غیر JSON از LimoSMS: ${raw}`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.Message || "ارسال OTP ناموفق بود");
    }

    return true;
  } catch (error) {
    console.error("LimoSMS OTP request error:", error.message);
    throw new Error("خطا در ارسال کد تایید");
  }
};

// مرحله ۲: چک کردن کدی که کاربر وارد کرده - خودِ لیمو تایید می‌کنه، نه دیتابیس ما
export const verifyLimoOtp = async (phone, code) => {
  try {
    const response = await fetch(`${LIMO_BASE}/checkcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ApiKey: process.env.LIMOSMS_API_KEY,
      },
      body: JSON.stringify({
        Mobile: phone,
        Code: code,
      }),
    });

    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error("LimoSMS OTP verify error:", error.message);
    return false;
  }
};
