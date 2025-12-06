import dotenv from "dotenv";
dotenv.config();

export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
  },
  jwtSecret: process.env.SECRET_KEY!,
  appUrl: process.env.APP_URL!,
};

