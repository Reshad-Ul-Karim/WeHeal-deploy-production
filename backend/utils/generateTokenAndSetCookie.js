import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  if (!process.env.JWT_SECRET) {
    console.warn('[Auth] JWT_SECRET not set. Using insecure dev secret. Set JWT_SECRET in your .env for production.');
  }
  const token = jwt.sign({ userId }, secret, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
};
