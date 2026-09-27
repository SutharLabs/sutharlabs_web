import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPrismaClient, hashPassword, generateToken } from '../_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Email, Full Name, and Password are required parameters." });
  }

  const prisma = getPrismaClient();

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    // Determine role based on standard corporate rules
    let resolvedRole = "Pending";
    if (
      email.toLowerCase().includes("admin") ||
      email.toLowerCase() === "mr.sutharsuresh@gmail.com" ||
      email.toLowerCase().endsWith("@sutharlabs.com")
    ) {
      resolvedRole = "Admin";
    }

    const createdUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash: hashPassword(password),
        role: resolvedRole,
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

    if (createdUser.role === "Pending") {
      return res.status(403).json({
        error: "Registration successful! Your account is pending administrator approval before you can access the workspace."
      });
    }

    // Generate cryptographically signed token
    const token = generateToken({ email: createdUser.email, role: createdUser.role, name: createdUser.name });

    res.status(201).json({
      user: {
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        isLoggedIn: true,
        token
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "An internal server error occurred during account initialization." });
  }
}
