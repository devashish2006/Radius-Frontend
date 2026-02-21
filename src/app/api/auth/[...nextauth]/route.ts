import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        try {
          // Call backend to create/update user and get JWT
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-google`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              oauthId: account.providerAccountId,
              email: profile?.email,
              name: profile?.name,
              picture: (profile as any)?.picture,
            }),
          });

          if (!response.ok) {
            // Handle banned user
            if (response.status === 403) {
              try {
                const errorData = await response.json();
                if (errorData.banned) {
                  // Store ban info in account for redirection
                  (account as any).banned = true;
                  (account as any).banReason = errorData.banReason;
                  (account as any).bannedAt = errorData.bannedAt;
                  return `/banned?reason=${encodeURIComponent(errorData.banReason || 'Account suspended')}&bannedAt=${encodeURIComponent(errorData.bannedAt || new Date().toISOString())}`;
                }
              } catch (e) {
                console.error("Error parsing ban response:", e);
              }
            }
            const errorText = await response.text();
            console.error("Backend validation failed:", response.status, errorText);
            return false;
          }

          const data = await response.json();
          // Store the backend JWT token
          (account as any).backendToken = data.access_token;
          
          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token and backend JWT to the token right after signin
      if (account) {
        token.backendToken = (account as any).backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      (session as any).backendToken = token.backendToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
