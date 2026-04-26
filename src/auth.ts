import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { findUserByEmail, findUserById, upsertUser } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "teacher" | "student" | "parent";
    } & DefaultSession["user"];
  }
  interface User {
    role?: "teacher" | "student" | "parent";
  }
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const email = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
      const password = typeof raw?.password === "string" ? raw.password : "";
      if (!email || !password) return null;
      const user = findUserByEmail(email);
      if (!user || !user.passwordHash) return null;
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        role: user.role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // Ensure every successful sign-in has a UserRecord in the DB.
      if (!user?.email) return true;
      const existing = findUserByEmail(user.email);
      if (existing) {
        upsertUser({
          ...existing,
          name: user.name ?? existing.name,
          image: user.image ?? existing.image,
          provider: account?.provider ?? existing.provider,
          providerAccountId: account?.providerAccountId ?? existing.providerAccountId,
        });
        return true;
      }
      // New Google sign-in — create as student by default.
      upsertUser({
        id: `u_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
        email: user.email,
        emailVerified: new Date().toISOString(),
        passwordHash: null,
        name: user.name ?? null,
        image: user.image ?? null,
        role: "student",
        grade: null,
        studentId: null,
        provider: account?.provider ?? "google",
        providerAccountId: account?.providerAccountId ?? null,
        createdAt: new Date().toISOString(),
      });
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "teacher" | "student" | "parent" }).role ?? "student";
      }
      if (!token.id && token.email) {
        const u = findUserByEmail(token.email);
        if (u) {
          token.id = u.id;
          token.role = u.role;
        }
      }
      if (token.id && !token.role) {
        const u = findUserById(String(token.id));
        if (u) token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = String(token.id);
      session.user.role =
        ((token as { role?: "teacher" | "student" | "parent" }).role) ?? "student";
      return session;
    },
  },
});
