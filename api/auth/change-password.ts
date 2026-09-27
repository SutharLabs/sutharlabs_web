import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrismaClient, hashPassword, verifyToken } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Auth Middleware Equivalent
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access Denied: Bearer authentication token is required." });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Access Denied: Session token is invalid or has expired." });
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 5) {
    return res.status(400).json({ error: "New password must be at least 5 characters." });
  }

  const prisma = getPrismaClient();

  try {
    await prisma.user.update({
      where: { email: decoded.email },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update password." });
  }
}
