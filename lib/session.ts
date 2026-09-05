import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "studio_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

export type StudioSession = {
  id: string;
  nome: string;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET não configurado");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  studio: StudioSession,
  options?: { expiresInSeconds?: number }
) {
  const expiresInSeconds = options?.expiresInSeconds ?? SESSION_DURATION_SECONDS;
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({ id: studio.id, nome: studio.nome })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(nowInSeconds)
    .setExpirationTime(nowInSeconds + expiresInSeconds)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<StudioSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    if (typeof payload.id !== "string" || typeof payload.nome !== "string") {
      return null;
    }

    return { id: payload.id, nome: payload.nome };
  } catch {
    return null;
  }
}
