import { Router } from "express";
import { signup, login, logout, getProfile } from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";
import { config } from "../config";
import { pgPool } from "../config/database";
import { generateToken } from "../utils/generateToken";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);

router.get("/google", (req, res) => {
    const scopes = ["openid", "email", "profile"].join(" ");
    const redirectUri = encodeURIComponent(config.google.redirectUri!);

   const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${config.google.clientId}&redirect_uri=${redirectUri}&scope=${scopes}&prompt=consent&access_type=offline`;
    res.redirect(googleAuthUrl);
});

router.get("/google/callback", async (req, res) => {
    const code = req.query.code as string;

    if (!code) {
        return res.redirect("http://localhost:3000/login?error=missing_code");
    }

    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: config.google.clientId!,
            client_secret: config.google.clientSecret!,
            redirect_uri: config.google.redirectUri!,
            grant_type: "authorization_code",
        }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error("No access token");

        const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const googleUser = await userRes.json();

        let user = (await pgPool.query("SELECT * FROM users WHERE email = $1", [googleUser.email])).rows[0];

        if (!user) {
        const insertRes = await pgPool.query(
            `INSERT INTO users (name, email, email_verified_at, profile_picture, google_id)
            VALUES ($1, $2, NOW(), $3, $4)
            RETURNING *`,
            [
            googleUser.name || googleUser.email.split("@")[0],
            googleUser.email,
            googleUser.picture,
            googleUser.sub,
            ]
        );
        user = insertRes.rows[0];
        } else if (!user.google_id) {
        await pgPool.query(
            "UPDATE users SET google_id = $1, profile_picture = $2 WHERE id = $3",
            [googleUser.sub, googleUser.picture, user.id]
        );
        }

        const token = generateToken(user.id, user.email);

        return res.json({
        success: true,
        message: "Google login successful!",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profile_picture: user.profile_picture,
            google_id: user.google_id,
            email_verified_at: user.email_verified_at,
            created_at: user.created_at,
        },
        googleData: {
            sub: googleUser.sub,
            name: googleUser.name,
            given_name: googleUser.given_name,
            family_name: googleUser.family_name,
            picture: googleUser.picture,
            email: googleUser.email,
            email_verified: googleUser.email_verified,
            locale: googleUser.locale,
        },
        token,
        });

    } catch (error) {
        console.error("Google OAuth failed:", error);
        return res.redirect("http://localhost:3000/login?error=auth_failed");
    }
});

export default router;