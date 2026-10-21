// ارسال پیامک از طریق سرویس لیمو اس‌ام‌اس
const sendSms = async (mobileNumber, message) => {
  // حالت توسعه: به‌جای ارسال واقعی، پیام (شامل کد OTP) توی کنسول چاپ می‌شه
  if (process.env.SMS_MODE === "console") {
    console.log(`📱 [SMS → ${mobileNumber}] ${message}`);
    return { success: true, mode: "console" };
  }

  let response;
  try {
    response = await fetch("https://api.limosms.com/api/sendsms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ApiKey: process.env.LIMOSMS_API_KEY,
      },
      body: JSON.stringify({
        Message: message,
        SenderNumber: process.env.LIMOSMS_SENDER_NUMBER,
        MobileNumber: [mobileNumber],
        SendToBlocksNumber: true,
      }),
    });
  } catch (err) {
    console.error(`❌ LimoSMS network error: ${err.cause?.code || err.message}`);
    throw new Error("خطا در ارسال پیامک");
  }

  const raw = await response.text();

  if (!response.ok) {
    console.error(`❌ LimoSMS responded ${response.status}: ${raw}`);
    throw new Error("خطا در ارسال پیامک");
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export default sendSms;