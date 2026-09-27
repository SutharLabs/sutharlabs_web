import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrismaClient, generateToken } from '../_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { platform, token, email, name } = req.body;
  if (!platform) {
    return res.status(400).json({ error: "Authentication provider platform is required." });
  }

  let oauthEmail = email;
  let oauthName = name;

  if (platform === 'Google' && token) {
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userInfoResponse.ok) {
        return res.status(401).json({ error: "Failed to verify Google access token." });
      }
      const userInfo = await userInfoResponse.json();
      oauthEmail = userInfo.email;
      oauthName = userInfo.name || userInfo.email.split('@')[0];
    } catch (err) {
      return res.status(500).json({ error: "Error verifying Google authentication." });
    }
  } else if (!email) {
    // Fallback for GitHub or manual bypass
    oauthEmail = `developer@${platform.toLowerCase()}.com`;
    oauthName = `OAuth ${platform} Developer`;
  }

  const prisma = getPrismaClient();

  try {
    let user = await prisma.user.findUnique({ where: { email: oauthEmail } });
    if (user) {
      if (user.role === "Banned") {
        return res.status(403).json({ error: "Access Denied: Your workspace permissions have been administratively revoked." });
      }
      if (user.role === "Pending") {
        return res.status(403).json({ error: "Access Denied: Your account is pending administrator approval before you can access the workspace." });
      }
      await prisma.user.update({
        where: { email: oauthEmail },
        data: { activityCount: { increment: 1 } }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: oauthEmail,
          name: oauthName,
          role: "Pending",
          activityCount: 1,
          portfolio: {
            create: {
              cash: 10000.0,
              shares: 0,
              buyPrice: 0.0
            }
          }
        }
      });
      return res.status(403).json({ error: "Registration successful! Your account is pending administrator approval before you can access the workspace." });
    }

    const signedToken = generateToken({ email: user.email, role: user.role, name: user.name });

    res.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        isLoggedIn: true,
        token: signedToken
      }
    });
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).json({ error: "An internal server error occurred during oauth handshake." });
  }
}
