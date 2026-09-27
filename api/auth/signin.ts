import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrismaClient, hashPassword, generateToken } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required credentials." });
  }

  const prisma = getPrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Access Denied: Invalid email address or password credentials." });
    }

    if (user.role === "Pending") {
      return res.status(403).json({ error: "Access Denied: Your account is pending administrator approval before you can access the workspace." });
    }

    if (user.role === "Banned") {
      return res.status(403).json({ error: "Access Denied: Your workspace permissions have been administratively revoked." });
    }

    // Increment activity count on successful login
    await prisma.user.update({
      where: { email: user.email },
      data: { activityCount: { increment: 1 } }
    });

    // Generate cryptographically signed token
    const token = generateToken({ email: user.email, role: user.role, name: user.name });

    res.status(200).json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        isLoggedIn: true,
        token,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "An internal server error occurred during session initialization." });
  }
}
