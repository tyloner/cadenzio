import NextAuth from "next-auth"
import { randomBytes } from "crypto"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"

const DEV_USER = {
  id: "dev-user-001",
  name: "Dev User",
  email: "dev@cadenz.io",
  image: null,
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev Login",
            credentials: {},
            async authorize() {
              const existing = await db.user.findUnique({ where: { id: DEV_USER.id } })
              if (!existing) await db.user.create({ data: DEV_USER })
              return DEV_USER
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string
      return session
    },
  },
  events: {
    // createUser fires after the adapter has committed the User row — safe to create FK relations
    async createUser({ user }) {
      if (!user.id) return
      try {
        const base = (user.email?.split("@")[0] ?? "user").replace(/[^a-z0-9]/gi, "").toLowerCase()
        const username = `${base}_${randomBytes(4).toString("hex")}`
        await db.profile.create({ data: { userId: user.id, username } })
        await db.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: `pending_${user.id}`,
            tier: "FREE",
            status: "active",
          },
        })
      } catch (err) {
        console.error("[auth] createUser event error:", err)
      }
    },
  },
})
