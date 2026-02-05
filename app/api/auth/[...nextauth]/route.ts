// app/api/auth/[...nextauth]/route.ts
import { prisma } from "@/lib/prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// 👈 Export authOptions so App Router can reuse them
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      // Upsert user
      const dbUser = await prisma.user.upsert({
        where: { email: user.email! },
        update: { name: user.name, image: user.image },
        create: { email: user.email!, name: user.name, image: user.image },
      });

      // Store OAuth account
      await prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId!,
          },
        },
        update: {
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          expiresAt: new Date(account.expires_at! * 1000),
        },
        create: {
          userId: dbUser.id,
          provider: account.provider,
          providerAccountId: account.providerAccountId!,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          expiresAt: new Date(account.expires_at! * 1000),
        },
      });

      return true;
    },
    async session({ session }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user?.email! },
      });

      if (dbUser) (session as any).userId = dbUser.id;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Export for GET/POST
export { handler as GET, handler as POST };
