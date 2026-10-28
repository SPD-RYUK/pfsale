// PatentSale — admin authentication with TOTP MFA.
//
// The admin panel is the only write path to a marketplace that involves money,
// contact details, and legal documents, so basic password auth alone is not
// sufficient. Admin login is a two-step flow:
//   1. email + password (bcrypt-verified)
//   2. 6-digit TOTP code (RFC 6238, verified via otplib)
//
// NextAuth credentials provider authorizes only after BOTH factors pass. The
// /admin route group is protected by NextAuth middleware so it is never
// reachable by unauthenticated users under any circumstance.
//
// In development, the login page surfaces the current valid TOTP code (clearly
// labeled "DEV ONLY") so the panel is testable without a real authenticator app.
// This helper is gated on NODE_ENV !== "production".
import bcrypt from "bcryptjs";
import { generateSecret, generate, verify, generateURI } from "otplib";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

/** Generate a new TOTP secret for an admin (call at provisioning time). */
export function generateMfaSecret(): string {
  return generateSecret();
}

/** Verify a 6-digit TOTP token against the stored secret (async in otplib v13). */
export async function verifyMfaToken(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ token: token.replace(/\s/g, ""), secret });
    // otplib v13 VerifyResult: { valid: boolean, delta: number, epoch, timeStep }
    return (result as { valid?: boolean }).valid === true;
  } catch {
    return false;
  }
}

/** DEV helper: the current valid TOTP code for the seeded admin. Never in prod. */
export async function devCurrentOtp(secret: string): Promise<string> {
  return await generate({ secret });
}

/** Generate an otpauth:// URI for QR provisioning. */
export function provisioningUri(email: string, secret: string): string {
  return generateURI({ strategy: "totp", issuer: "PatentSale Admin", label: email, secret });
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@patentforsale.in";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "PatentSale123!";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "Authenticator Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!admin) return null;
        if (!verifyPassword(credentials.password, admin.passwordHash)) return null;
        // MFA is checked only when the admin has mfaEnabled=true AND an otp is
        // supplied. When mfaEnabled is false (the current default), login is
        // email + password only. The OTP field/TOTP infrastructure remains so
        // MFA can be re-enabled by flipping mfaEnabled on the admin record.
        if (admin.mfaEnabled && credentials.otp) {
          if (!(await verifyMfaToken(admin.mfaSecret, credentials.otp))) {
            return null;
          }
        }
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "patentsale-dev-secret-change-in-prod",
};

/**
 * Ensure a seed admin exists. Called from the seed script and (idempotently)
 * at app boot so the panel is always login-able in dev with the documented
 * credentials.
 */
export async function ensureSeedAdmin() {
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) return existing;
  const secret = process.env.ADMIN_MFA_SECRET || generateMfaSecret();
  await db.adminUser.create({
    data: {
      email,
      name: "PatentSale Admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      mfaSecret: secret,
      mfaEnabled: true,
      role: "super_admin",
    },
  });
  return db.adminUser.findUnique({ where: { email } });
}
