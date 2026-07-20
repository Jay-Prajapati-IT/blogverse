import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is missing from .env.local");
}

const secretKey = new TextEncoder().encode(secret);

export interface SessionPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

/* Create JWT token */
export async function createSessionToken(
  payload: SessionPayload
) {
  return await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/* Verify JWT token */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      secretKey
    );

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "user" | "admin",
    };
  } catch {
    return null;
  }
}