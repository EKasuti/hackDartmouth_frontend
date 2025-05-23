import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
             params: {
               scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
             },
           },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const userId = user.id;
        const userRef = doc(db, "users", user.email);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            id: userId,
            username: user.name || "",
            email: user.email,
            avatar_url: user.image || "",
            // first_name: user.displayName.split(" ")[0],
            // first_name: user.displayName.split(" ")[1],
            role: "researcher",
            github: "",
            linkedin: "",
            specialities: "",
            bio: "",
            createdAt: new Date(),
          });
          console.log("New user created in Firestore:", user.email);
        } else {
          console.log("User already exists in Firestore:", user.email);
        }

        return true;
      } catch (error) {
        console.error("Error creating user in Firestore", error);
        return false;
      }
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
    
  },
};
