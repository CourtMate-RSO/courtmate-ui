import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call your User Service endpoint for credentials login
          const baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8000';
          const url = baseUrl.endsWith('/') ? `${baseUrl}auth/login` : `${baseUrl}/auth/login`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            return {
              id: data.user.id,
              name: data.user.email,
              email: data.user.email,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            };
          }
          
          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        try {
          // Send Google token to your User Service
          const baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8000';
          const url = baseUrl.endsWith('/') ? `${baseUrl}auth/google` : `${baseUrl}/auth/google`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_token: account.id_token,
              email: profile?.email,
              name: profile?.name,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // Store tokens in user object
            user.accessToken = data.access_token;
            user.refreshToken = data.refresh_token;
            user.id = data.user.id;
            return true;
          }
          return false;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now
        return token;
      }

      // Check if token has expired and refresh if needed
      if (token.expiresAt && Date.now() > token.expiresAt - 5 * 60 * 1000) { // Refresh 5 mins before expiry
        try {
          console.log('[Auth] Token expiring soon, refreshing...');
          const baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:8000';
          const url = baseUrl.endsWith('/') ? `${baseUrl}auth/refresh_token` : `${baseUrl}/auth/refresh_token`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token.accessToken}`
            },
            body: JSON.stringify({
              refresh_token: token.refreshToken,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Auth] Token refreshed successfully');
            return {
              ...token,
              accessToken: data.accessToken || data.access_token,
              refreshToken: data.refreshToken || data.refresh_token || token.refreshToken,
              expiresAt: Date.now() + 60 * 60 * 1000, // Reset expiry time
            };
          } else {
            console.error('[Auth] Failed to refresh token:', response.status);
            // Token refresh failed, mark as expired
            return { ...token, expiresAt: 0 };
          }
        } catch (error) {
          console.error('[Auth] Error refreshing token:', error);
          return { ...token, expiresAt: 0 };
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
  trustHost: true,
});
