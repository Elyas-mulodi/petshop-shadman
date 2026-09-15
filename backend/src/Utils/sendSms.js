const sendSms = async (mobileNumber, message) => {
  const response = await fetch("https://api.limosms.com/api/sendsms", {
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

  if (!response.ok) {
    throw new Error("خطا در ارسال پیامک");
  }

  return response.json();
};

export default sendSms;