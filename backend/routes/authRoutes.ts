import { Router } from "express";
import { signup, login, logout, getProfile, updateAccount, changePassword } from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";
import { config } from "../config";
import { pgPool } from "../config/database";
import { generateToken } from "../utils/generateToken";

const router = Router();

/* ===== BASIC AUTH ===== */
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.put("/update-account", authenticate, upload.single("profilePicture"), updateAccount);
router.put("/change-password", authenticate, changePassword);

/* ===== GOOGLE AUTH ===== */
router.get("/google", (req, res) => {
  const role = req.query.role === "mentor" ? "mentor" : "student";
  const state = Buffer.from(JSON.stringify({ role })).toString("base64");
  const scopes = ["openid", "email", "profile"].join(" ");

  const googleUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `response_type=code` +
    `&client_id=${config.google.clientId}` +
    `&redirect_uri=${encodeURIComponent(config.google.redirectUri)}` +
    `&scope=${scopes}` +
    `&state=${state}`;

  res.redirect(googleUrl);
});

router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = JSON.parse(Buffer.from(req.query.state as string, "base64").toString());
    const role: "student" | "mentor" = state.role === "mentor" ? "mentor" : "student";

    // Exchange code for tokens
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
    if (!tokenData.access_token) throw new Error("Failed to get access token");

    // Fetch Google user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    // Check if user exists
    let user = (await pgPool.query("SELECT * FROM users WHERE email = $1", [googleUser.email])).rows[0];

    if (!user) {
      try {
        const { rows } = await pgPool.query(
          `INSERT INTO users (name, email, email_verified_at, profile_picture, google_id, role)
           VALUES ($1,$2,NOW(),$3,$4,$5) RETURNING *`,
          [googleUser.name, googleUser.email, googleUser.picture, googleUser.sub, role]
        );
        user = rows[0];
        // console.log("Google user saved:", user);
      } catch (err) {
        console.error("Failed to insert Google user:", err);
        return res.redirect("http://localhost:3000/login?error=auth_failed");
      }
    }

    // Generate JWT and set role-based cookie
    const jwtToken = generateToken(user.id, user.email, user.role);
    const cookieName = user.role === "student" ? "student_auth_token" : "mentor_auth_token";
    res.cookie(cookieName, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend dashboard
    const redirectUrl =
      user.role === "mentor"
        ? "http://localhost:3000/mentor/dashboard"
        : "http://localhost:3000/home";

    res.redirect(redirectUrl);
  } catch (err) {
    console.error("Google auth callback error:", err);
    res.redirect("http://localhost:3000/login?error=auth_failed");
  }
});

export default router;
