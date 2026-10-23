import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { demoMode } from '@/config'
import { authorizeRequest, checkAccess } from '@/server/access'

const SESSION_MAX_AGE_S = 7 * 24 * 3600

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Demo sessions never grant access; this public value only lets Auth.js process the replay request.
  trustHost: demoMode() ? true : undefined,
  secret: demoMode() ? 'public-fictional-replay-only-secret' : process.env.AUTH_SECRET,
  providers: demoMode() ? [] : [GitHub({ authorization: { params: { scope: 'read:user' } } })],
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_S },
  pages: { signIn: '/entrar', error: '/fechado' },
  callbacks: {
    async signIn({ profile }) {
      return typeof profile?.login === 'string' && (await checkAccess(profile.login))
    },
    jwt({ token, profile }) {
      if (typeof profile?.login === 'string') token.login = profile.login
      return token
    },
    session({ session, token }) {
      session.user.login = typeof token.login === 'string' ? token.login : undefined
      return session
    },
    authorized({ auth: session, request }) {
      if (authorizeRequest(request.nextUrl.pathname, Boolean(session?.user), process.env, request.nextUrl.hostname)) return true
      if (request.nextUrl.pathname.startsWith('/api/')) return Response.json({ error: 'unauthorized' }, { status: 401 })
      return false
    },
  },
})
