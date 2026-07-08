import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    signIn({ user }) {
      const allowed = process.env.ADMIN_EMAIL;
      return !!allowed && user.email === allowed;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
