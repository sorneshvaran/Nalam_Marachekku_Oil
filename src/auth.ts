import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { burnPasswordWork, verifyPassword } from '@/lib/password';
import { loginSchema, normalizeEmail } from '@/lib/auth-validation';
import { env } from '@/lib/env';
import { usersData } from '@/lib/users';

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Same secret Auth.js already reads from the environment, sourced from the
  // validated server environment so a production misconfiguration fails early.
  secret: env.AUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const email = normalizeEmail(parsed.data.email);
        const user = await usersData.getForCredentials(email);

        if (!user?.passwordHash) {
          await burnPasswordWork(parsed.data.password);
          return null;
        }

        const passwordIsValid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordIsValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
