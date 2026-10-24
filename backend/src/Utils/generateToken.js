import jwt from "jsonwebtoken";

export const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || "15m",
  });
};

export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 روز
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
};