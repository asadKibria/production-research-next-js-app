import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/app/lib/prisma";

export const CUSTOMER_SESSION_COOKIE = "hizjaab_customer_session";
const CUSTOMER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;

/** Read-only: safe to call from Server Components. */
export async function getCustomerSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_SESSION_COOKIE)?.value ?? null;
}

/** Mutates cookies — only call from Server Actions or Route Handlers. */
export async function ensureCustomerSessionToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (existing) return existing;

  const token = crypto.randomUUID();
  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
  });
  return token;
}

/** Read-only: safe to call from Server Components. */
export async function getCurrentCustomer() {
  const token = await getCustomerSessionToken();
  if (!token) return null;
  return prisma.customer.findUnique({ where: { sessionToken: token } });
}
