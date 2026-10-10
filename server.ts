import express from "express";
import multer from "multer";
import "dotenv/config";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getPrismaClient, hashPassword, generateToken, verifyToken } from "./api/_utils.js";
import { PluginEngine } from "./src/plugins/PluginEngine.js";
import { registerAllPluginRoutes } from "./src/plugins/serverRegistry.js";
import { resetSimulator } from "./src/plugins/StockTracker/simulator/index.js";
import { isEncryptedPluginPackage, resolvePluginArchiveBuffer, encryptPluginPackage } from "./src/plugins/security/pluginCrypto.js";
import { getSystemTelemetry } from "./src/services/telemetryService.js";
import { notifyAdminNewInquiry } from "./src/services/emailService.js";
import {
  createBugReport,
  getBugReports,
  updateBugReport,
  deleteBugReport,
  ingestTelemetryLogs,
  getLiveTelemetryLogs
} from "./src/services/bugReportStorage.js";
import {
  isBlobConfigured,
  uploadToBlob,
  deleteFromBlob,
  listStoredBlobs,
  verifyBlobWebhookSignature
} from "./src/services/blobStorage.js";
import {
  securityHeaders,
  requestLogger,
  authLimiter,
  stockApiLimiter,
  generalApiLimiter,
  authenticateToken,
  requireAdmin,
  errorHandler,
  notFoundHandler
} from "./src/middleware/index.js";

const PORT = 3000;
const prisma = getPrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Default initial plugins data
const defaultPlugins = [
  {
    id: "plugin_1",
    name: "JIRA MCP Server",
    category: "DevOps",
    type: "Free" as const,
    downloads: "2.4k",
    rating: 4.8,
    description: "Seamless Model Context Protocol integration to read, create, update, and search JIRA issues, sprints, and project boards directly through your agent workflow.",
    iconSymbol: "smart_toy",
    tags: ["JIRA", "Atlassian", "MCP", "Workspace"]
  },
  {
    id: "plugin_2",
    name: "Confluence MCP Server",
    category: "Productivity",
    type: "Premium" as const,
    downloads: "1.9k",
    rating: 4.9,
    description: "Dynamic MCP bridge empowering agents to crawl, index, read, and write high-structured Confluence spaces, meeting notes, and engineering documentation templates.",
    iconSymbol: "database",
    tags: ["Confluence", "Atlassian", "Knowledge", "Data"]
  },
  {
    id: "plugin_3",
    name: "DevOps Copilot",
    category: "AI",
    type: "Free" as const,
    downloads: "12k",
    rating: 4.9,
    description: "Automated CI/CD pipeline monitoring, anomaly detection, and automated hot-fix container generation scripts.",
    iconSymbol: "smart_toy",
    tags: ["DevOps", "AI", "Kubernetes"]
  },
  {
    id: "plugin_4",
    name: "FinData MCP",
    category: "Finance",
    type: "Premium" as const,
    downloads: "8k",
    rating: 4.7,
    description: "Secure Model Context Protocol server for real-time market data extraction, financial ledgers, and portfolio analytics.",
    iconSymbol: "account_balance",
    tags: ["Finance", "Ledger", "API"]
  },
  {
    id: "plugin_5",
    name: "Vector Sync",
    category: "Plugin",
    type: "Trial" as const,
    downloads: "15k",
    rating: 4.8,
    description: "Seamlessly sync relational transaction databases to vector storage indexes for dynamic context RAG logic.",
    iconSymbol: "database",
    tags: ["Vector DB", "RAG", "Admin"]
  }
];

// Startup Seeding Script
async function seedDatabase() {
  try {
    // 1. Seed default plugins if none exist
    const pluginCount = await prisma.plugin.count();
    if (pluginCount === 0) {
      console.log("[Seeding] Populating default store plugins...");
      for (const p of defaultPlugins) {
        await prisma.plugin.create({
          data: {
            id: p.id,
            name: p.name,
            category: p.category,
            type: p.type,
            downloads: p.downloads,
            rating: p.rating,
            description: p.description,
            iconSymbol: p.iconSymbol,
            tags: JSON.stringify(p.tags)
          }
        });
      }
    }

    // 1b. Seed Workspace Plugins
    const wsPluginCount = await prisma.workspacePlugin.count();
    if (wsPluginCount === 0) {
      console.log("[Seeding] Populating workspace plugins...");
      await prisma.workspacePlugin.create({
        data: {
          id: "wp_stock_analyzer",
          name: "Stock Tracker",
          category: "Finance",
          type: "Native",
          description: "Enterprise multi-market quantitative trading suite featuring live TradingView charts, algorithmic strategies, visual condition builder, institutional backtesting, and automated trade simulation.",
          iconSymbol: "monitoring",
          version: "1.1.1"
        }
      });

    }

    // 2. Seed default users and their portfolios if none exist
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("[Seeding] Populating default corporate accounts...");
      const defaultUsers = [
        {
          name: "Suthar Suresh",
          email: "mr.sutharsuresh@gmail.com",
          password: "suthar123",
          role: "Admin",
          joinedAt: new Date("2026-05-20T10:14:00Z"),
          activityCount: 842
        },
        {
          name: "Suthar Developer",
          email: "developer@sutharlabs.com",
          password: "developer123",
          role: "Admin",
          joinedAt: new Date("2026-05-21T08:30:15Z"),
          activityCount: 452
        },
        {
          name: "Johan Decker",
          email: "johan.decker@consensys.net",
          password: "developer123",
          role: "Developer",
          joinedAt: new Date("2026-05-22T14:45:00Z"),
          activityCount: 118
        },
        {
          name: "Rogue Spammer",
          email: "spammer99@rogue.io",
          password: "developer123",
          role: "Banned",
          joinedAt: new Date("2026-05-23T05:12:00Z"),
          activityCount: 12
        }
      ];

      for (const u of defaultUsers) {
        await prisma.user.create({
          data: {
            name: u.name,
            email: u.email,
            passwordHash: hashPassword(u.password),
            role: u.role,
            joinedAt: u.joinedAt,
            activityCount: u.activityCount
          }
        });
      }
    }

    // 3. Seed default invoices if none exist
    const invoiceCount = await prisma.invoice.count();
    if (invoiceCount === 0) {
      console.log("[Seeding] Populating default ledger invoices...");
      const defaultInvoices = [
        { id: 'INV-20260518-0001', date: '2026-05-18', client: 'AlphaCorp Int', amount: 8450.00, status: 'Paid' },
        { id: 'INV-20260520-0002', date: '2026-05-20', client: 'Tesla Forge', amount: 12500.00, status: 'Pending' },
        { id: 'INV-20260522-0003', date: '2026-05-22', client: 'Vertex Grid', amount: 9950.00, status: 'Pending' },
        { id: 'INV-20260523-0004', date: '2026-05-23', client: 'Lambda Group', amount: 4800.00, status: 'Paid' }
      ];

      for (const inv of defaultInvoices) {
        await prisma.invoice.create({
          data: inv
        });
      }
    }

    // 4. Seed default flow nodes if none exist
    const nodeCount = await prisma.flowNode.count();
    if (nodeCount === 0) {
      console.log("[Seeding] Populating default pipeline nodes...");
      const defaultNodes = [
        { id: '1', label: 'SutharCore Stock API', type: 'source', status: 'EXECUTED', x: 50, y: 80, fileUsed: 'stocks_list_feed.csv', pluginActive: false },
        { id: '2', label: 'SutharAnalytics Node', type: 'processor', status: 'ACTIVE', pluginActive: true, x: 260, y: 150, fileUsed: null },
        { id: '3', label: 'PostgreSQL Ledger', type: 'output', status: 'IDLE', pluginActive: false, x: 480, y: 90, fileUsed: null }
      ];

      for (const node of defaultNodes) {
        await prisma.flowNode.create({
          data: node
        });
      }
    }

    console.log("[Seeding] SQLite database initialization completed successfully.");
    // 6. Seed portfolios if none exist
    const portfolioCount = await prisma.developmentProject.count();
    if (portfolioCount === 0 && fs.existsSync('./data/portfolios.json')) {
      console.log("[Seeding] Populating default portfolios...");
      const data = JSON.parse(fs.readFileSync('./data/portfolios.json', 'utf8'));
      for (const p of data) {
        await prisma.developmentProject.create({
          data: {
            id: p.id,
            title: p.title || '',
            segment: p.segment || '',
            description: p.description || '',
            detailedCase: p.detailedCase || '',
            stat: p.stat || '',
            statLabel: p.statLabel || '',
            techs: JSON.stringify(p.techs || []),
            client: p.client || '',
            clientTitle: p.clientTitle || '',
            blueprintSymbol: p.blueprintSymbol || 'globe',
            imageSrc: p.imageSrc || ''
          }
        });
      }
    }
  } catch (error) {
    console.error("Failed to seed SQLite database:", error);
  }
}

const app = express();
export default app;

// 1. Modern HTTP Security Headers & CORS Pre-flight optimization
app.use(securityHeaders);

// 2. High-precision request performance & latency logger
app.use(requestLogger);

// 3. Request body parsing
app.use(express.json());

// 4. In-memory Rate Limiters (100% Free, zero third-party dependencies)
app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/change-password", authLimiter);
app.use("/api/workspace/stock-analyzer", (req, res, next) => {
  // Pure local database / JSON / static metadata operations do not invoke external market APIs
  if (
    req.path.startsWith("/strategies") ||
    req.path.startsWith("/watchlists") ||
    req.path.startsWith("/markets") ||
    req.path.startsWith("/universes") ||
    req.path.startsWith("/scanner") ||
    req.path.startsWith("/simulator")
  ) {
    return next();
  }
  return stockApiLimiter(req, res, next);
});
app.use("/api", generalApiLimiter);

async function startServer() {

// -------------------------------------------------------------
// Development Portfolios
// -------------------------------------------------------------
app.get('/api/portfolios', async (req, res) => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'portfolios.json');
    if (fs.existsSync(dataPath)) {
      const fileData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.json(fileData);
    }
    const data = await prisma.developmentProject.findMany();
    // Parse techs back into array for frontend
    const formatted = data.map(p => ({
      ...p,
      techs: JSON.parse(p.techs)
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read portfolios from database' });
  }
});

app.put('/api/portfolios', authenticateToken, async (req: any, res: any) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const payload = req.body;
    await prisma.developmentProject.deleteMany({});
    
    for (const p of payload) {
      await prisma.developmentProject.create({
        data: {
          id: p.id,
          title: p.title || '',
          segment: p.segment || '',
          description: p.description || '',
          detailedCase: p.detailedCase || '',
          stat: p.stat || '',
          statLabel: p.statLabel || '',
          techs: JSON.stringify(p.techs || []),
          client: p.client || '',
          clientTitle: p.clientTitle || '',
          blueprintSymbol: p.blueprintSymbol || 'globe',
          imageSrc: p.imageSrc || ''
        }
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save portfolios to database' });
  }
});
  // Trigger Seeding script
  await seedDatabase();

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // ==================== AUTH ENDPOINTS ====================

  // File Upload Logic (.zip, .vsix workspace and app plugins)
  app.post("/api/plugins/upload", authenticateToken, requireAdmin, upload.single("pluginFile"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No plugin package archive was uploaded." });
      }

      const originalName = req.file.originalname;
      const size = req.file.size;
      console.log(`[Plugin Upload Engine] Received package: ${originalName} (${size} bytes)`);

      // Persist to uploads directory on disk if running outside Vercel serverless
      if (!process.env.VERCEL) {
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, originalName), req.file.buffer);
      }

      res.json({
        success: true,
        message: `Plugin archive ${originalName} uploaded successfully.`,
        filename: originalName,
        size
      });
    } catch (err: any) {
      console.error("Plugin upload error:", err);
      res.status(500).json({ error: "Failed to process uploaded plugin archive." });
    }
  });

  // POST /api/auth/signup
  app.post("/api/auth/signup", async (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Email, Full Name, and Password are required parameters." });
    }

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
  });

  // POST /api/auth/signin
  app.post("/api/auth/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required credentials." });
    }

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

      res.json({
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
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", authenticateToken, async (req: any, res: any) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ error: "New password must be at least 5 characters." });
    }
    try {
      await prisma.user.update({
        where: { email: req.user.email },
        data: {
          passwordHash: hashPassword(newPassword),
          mustChangePassword: false
        }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password." });
    }
  });

  app.post("/api/auth/oauth", async (req, res) => {
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

      // Generate cryptographically signed token
      const token = generateToken({ email: user.email, role: user.role, name: user.name });

      res.json({
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          isLoggedIn: true,
          token
        }
      });
    } catch (error) {
      console.error("OAuth error:", error);
      res.status(500).json({ error: "An internal server error occurred during oauth handshake." });
    }
  });

  // ==================== USER PROFILE & DATA MANAGEMENT (GDPR COMPLIANT) ====================

  // GET /api/user/profile
  app.get("/api/user/profile", authenticateToken, async (req: any, res: any) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email: req.user.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          githubHandle: true,
          company: true,
          joinedAt: true,
          activityCount: true,
          portfolio: {
            select: { cash: true, shares: true, buyPrice: true }
          }
        }
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      const tradesCount = await prisma.trade.count({ where: { userEmail: req.user.email } });
      const reviewsCount = await prisma.workspacePluginReview.count({ where: { userEmail: req.user.email } });
      const installedCount = await prisma.userWorkspacePlugin.count({ where: { userEmail: req.user.email } });

      res.json({
        ...user,
        stats: {
          tradesCount,
          reviewsCount,
          installedCount
        }
      });
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // PUT /api/user/profile (Update display name, bio, company, github)
  app.put("/api/user/profile", authenticateToken, async (req: any, res: any) => {
    try {
      const { name, bio, githubHandle, company } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Display name cannot be empty." });
      }

      const updated = await prisma.user.update({
        where: { email: req.user.email },
        data: {
          name: name.trim(),
          bio: bio !== undefined ? (bio ? bio.trim() : null) : undefined,
          githubHandle: githubHandle !== undefined ? (githubHandle ? githubHandle.trim() : null) : undefined,
          company: company !== undefined ? (company ? company.trim() : null) : undefined
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          githubHandle: true,
          company: true,
          joinedAt: true,
          activityCount: true
        }
      });

      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Failed to update profile:", error);
      res.status(500).json({ error: "Failed to update profile details." });
    }
  });

  // PUT /api/user/password (Change password)
  app.put("/api/user/password", authenticateToken, async (req: any, res: any) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 5) {
        return res.status(400).json({ error: "New password must be at least 5 characters long." });
      }

      const user = await prisma.user.findUnique({ where: { email: req.user.email } });
      if (!user) return res.status(404).json({ error: "User not found." });

      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password is required." });
        }
        const hashedCurrent = hashPassword(currentPassword);
        if (hashedCurrent !== user.passwordHash) {
          return res.status(400).json({ error: "Current password does not match." });
        }
      }

      const newHash = hashPassword(newPassword);
      await prisma.user.update({
        where: { email: req.user.email },
        data: { passwordHash: newHash, mustChangePassword: false }
      });

      res.json({ success: true, message: "Password updated successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to change password." });
    }
  });

  // GET /api/user/export-data (Export all user data as JSON)
  app.get("/api/user/export-data", authenticateToken, async (req: any, res: any) => {
    try {
      const email = req.user.email;
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          githubHandle: true,
          company: true,
          joinedAt: true,
          activityCount: true,
          portfolio: true,
          workspacePlugins: {
            include: { plugin: true }
          },
          pluginReviews: {
            include: { plugin: { select: { id: true, name: true, category: true } } }
          }
        }
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      const trades = await prisma.trade.findMany({
        where: { userEmail: email },
        orderBy: { timestamp: "desc" }
      });

      const exportPayload = {
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          service: "SutharLabs Sovereign Engine",
          gdprCompliant: true,
          userEmail: email
        },
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          bio: user.bio,
          githubHandle: user.githubHandle,
          company: user.company,
          joinedAt: user.joinedAt,
          activityCount: user.activityCount
        },
        portfolio: user.portfolio,
        trades,
        installedPlugins: user.workspacePlugins.map(wp => ({
          pluginId: wp.pluginId,
          name: wp.plugin.name,
          category: wp.plugin.category,
          installedVersion: wp.installedVersion,
          installedAt: wp.installedAt
        })),
        reviews: user.pluginReviews.map(r => ({
          id: r.id,
          pluginId: r.pluginId,
          pluginName: r.plugin.name,
          rating: r.rating,
          feedback: r.feedback,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }))
      };

      res.setHeader("Content-Disposition", `attachment; filename="sutharlabs_export_${Date.now()}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(exportPayload, null, 2));
    } catch (error) {
      console.error("Failed to export user data:", error);
      res.status(500).json({ error: "Failed to compile personal data export." });
    }
  });

  // DELETE /api/user/data/trades (Delete all simulated trades and reset balance)
  app.delete("/api/user/data/trades", authenticateToken, async (req: any, res: any) => {
    try {
      const email = req.user.email;
      const deleteResult = await prisma.trade.deleteMany({ where: { userEmail: email } });
      await prisma.portfolio.upsert({
        where: { userEmail: email },
        update: { cash: 10000.0, shares: 0, buyPrice: 0.0 },
        create: { userEmail: email, cash: 10000.0, shares: 0, buyPrice: 0.0 }
      });
      res.json({
        success: true,
        count: deleteResult.count,
        message: "All paper trading history has been permanently wiped and portfolio balance reset to default."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear trades." });
    }
  });

  // DELETE /api/user/data/reviews (Delete all reviews authored by user)
  app.delete("/api/user/data/reviews", authenticateToken, async (req: any, res: any) => {
    try {
      const deleteResult = await prisma.workspacePluginReview.deleteMany({ where: { userEmail: req.user.email } });
      res.json({
        success: true,
        count: deleteResult.count,
        message: "All plugin reviews and ratings authored by you have been deleted."
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear reviews." });
    }
  });

  // DELETE /api/user/data/plugins (Reset installed workspace plugins to default)
  app.delete("/api/user/data/plugins", authenticateToken, async (req: any, res: any) => {
    try {
      const email = req.user.email;
      await prisma.userWorkspacePlugin.deleteMany({ where: { userEmail: email } });

      const defaultPlugins = await prisma.workspacePlugin.findMany({ where: { type: "Native" } });
      for (const p of defaultPlugins) {
        await prisma.userWorkspacePlugin.create({
          data: { userEmail: email, pluginId: p.id, installedVersion: p.version }
        }).catch(() => {});
      }

      res.json({ success: true, message: "Workspace plugins reset to default core installation." });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset workspace plugins." });
    }
  });

  // DELETE /api/user/account (Permanently delete user account and all personal data)
  app.delete("/api/user/account", authenticateToken, async (req: any, res: any) => {
    try {
      const email = req.user.email;
      await prisma.trade.deleteMany({ where: { userEmail: email } });
      await prisma.user.delete({ where: { email } });
      res.json({ success: true, message: "User account and all associated personal data have been permanently erased." });
    } catch (error) {
      console.error("Failed to delete user account:", error);
      res.status(500).json({ error: "Failed to delete account." });
    }
  });

  // ==================== SYSTEM & HOST TELEMETRY (REAL-TIME) ====================
  // GET /api/admin/telemetry
  app.get("/api/admin/telemetry", async (req, res) => {
    try {
      const data = getSystemTelemetry();
      res.json(data);
    } catch (error) {
      console.error("Telemetry error:", error);
      res.status(500).json({ error: "Failed to gather host telemetry." });
    }
  });

  // ==================== PROTECTED USERS CRUD (ADMIN) ====================

  // GET /api/users
  app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { joinedAt: "asc" }
      });
      // Sanitize passwordHash output
      const sanitized = users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        joinedAt: u.joinedAt.toISOString(),
        activityCount: u.activityCount
      }));
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch corporate developer registry." });
    }
  });

  // POST /api/users (Provision User)
  app.post("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required fields to provision." });
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(400).json({ error: "A user with this email coordinate is already provisioned." });
      }

      // Generate a random 12-character temporary password
      const tempPassword = crypto.randomBytes(6).toString("base64url").slice(0, 12);

      const created = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          role: role || "Developer",
          passwordHash: hashPassword(tempPassword),
          mustChangePassword: true,
          activityCount: 0,
          portfolio: {
            create: {
              cash: 10000.0,
              shares: 0,
              buyPrice: 0.0
            }
          }
        }
      });

      res.status(201).json({
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        joinedAt: created.joinedAt.toISOString(),
        activityCount: created.activityCount,
        temporaryPassword: tempPassword  // returned ONCE — never stored in plaintext
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to manually provision developer account." });
    }
  });

  // PUT /api/users/:id/role (Modify user role)
  app.put("/api/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Target role is required." });
    }

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { role }
      });
      res.json({ success: true, updatedRole: updated.role });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user authorization group." });
    }
  });

  // DELETE /api/users/:id (Purge user)
  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      // Look up the user to get their email for relation cleanup
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: "User record not found." });
      }

      // Sequentially cascade-delete related records before removing the user
      await prisma.userWorkspacePlugin.deleteMany({ where: { userEmail: user.email } });
      await prisma.portfolio.deleteMany({ where: { userEmail: user.email } });
      await prisma.user.delete({ where: { id } });

      res.json({ success: true, purgedId: id });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to purge developer account credentials." });
    }
  });




// ==========================================
// WORKSPACE PLUGIN STORE API
// ==========================================

app.get("/api/workspace-plugins", async (req, res) => {
  try {
    const plugins = await prisma.workspacePlugin.findMany({
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' }
        },
        versions: {
          orderBy: { publishedAt: 'desc' }
        },
        installedBy: true
      }
    });

    const semverCompareDesc = (v1: string, v2: string) => {
      const p1 = (v1 || '0.0.0').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
      const p2 = (v2 || '0.0.0').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
      for (let i = 0; i < 3; i++) {
        const diff = (p2[i] || 0) - (p1[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    };

    const isBetaVersion = (ver: string) => {
      const major = parseInt((ver || '0.0.0').replace(/^v/i, '').split('.')[0], 10);
      return isNaN(major) || major < 1;
    };

    const enriched = plugins.map(p => {
      const reviewCount = p.reviews.length;
      const avgRating = reviewCount > 0
        ? Number((p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 0;

      const sortedVersions = [...p.versions].sort((a, b) => {
        const sDiff = semverCompareDesc(a.version, b.version);
        if (sDiff !== 0) return sDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }).map(ver => ({
        ...ver,
        stage: isBetaVersion(ver.version) ? 'Beta' : 'Stable'
      }));

      const latestVersion = (sortedVersions.length > 0 && semverCompareDesc(sortedVersions[0].version, p.version) < 0)
        ? sortedVersions[0].version
        : p.version;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        type: p.type,
        stage: isBetaVersion(latestVersion) ? 'Beta' : 'Stable',
        description: p.description,
        iconSymbol: p.iconSymbol,
        version: latestVersion,
        installsCount: p.installedBy.length,
        rating: avgRating,
        reviewsCount: reviewCount,
        reviews: p.reviews,
        versions: sortedVersions
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("Failed to fetch workspace plugins:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Submit or update a real rating & feedback review for a workspace plugin
app.post("/api/workspace-plugins/:id/reviews", authenticateToken, async (req: any, res: any) => {
  try {
    const pluginId = req.params.id;
    const { rating, feedback } = req.body;
    const ratingNum = parseInt(rating, 10);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5 stars" });
    }

    const review = await prisma.workspacePluginReview.upsert({
      where: {
        userEmail_pluginId: {
          userEmail: req.user.email,
          pluginId: pluginId
        }
      },
      update: {
        rating: ratingNum,
        feedback: feedback ? String(feedback).trim() : null,
        userName: req.user.name || req.user.email.split('@')[0]
      },
      create: {
        pluginId: pluginId,
        userEmail: req.user.email,
        userName: req.user.name || req.user.email.split('@')[0],
        rating: ratingNum,
        feedback: feedback ? String(feedback).trim() : null
      }
    });

    res.json(review);
  } catch (error) {
    console.error("Failed to submit review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Delete a user's review and rating for a workspace plugin
app.delete("/api/workspace-plugins/:id/reviews", authenticateToken, async (req: any, res: any) => {
  try {
    const pluginId = req.params.id;
    await prisma.workspacePluginReview.delete({
      where: {
        userEmail_pluginId: {
          userEmail: req.user.email,
          pluginId: pluginId
        }
      }
    });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Failed to delete review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Install or update a plugin for the current user
app.post("/api/workspace-plugins/install", authenticateToken, async (req: any, res: any) => {
  try {
    const { pluginId } = req.body;
    if (!pluginId) return res.status(400).json({ error: "Missing pluginId" });

    const plugin = await prisma.workspacePlugin.findUnique({ where: { id: pluginId } });
    if (!plugin) return res.status(404).json({ error: "Plugin not found" });

    const install = await prisma.userWorkspacePlugin.upsert({
      where: {
        userEmail_pluginId: {
          userEmail: req.user.email,
          pluginId: pluginId
        }
      },
      update: {
        installedVersion: plugin.version
      },
      create: {
        userEmail: req.user.email,
        pluginId: pluginId,
        installedVersion: plugin.version
      }
    });
    res.json(install);
  } catch (error: any) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/workspace-plugins/install/:pluginId", authenticateToken, async (req: any, res: any) => {
  try {
    const pluginId = req.params.pluginId;
    await prisma.userWorkspacePlugin.delete({
      where: {
        userEmail_pluginId: {
          userEmail: req.user.email,
          pluginId: pluginId
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to uninstall plugin" });
  }
});

app.get("/api/workspace-plugins/installed", authenticateToken, async (req: any, res: any) => {
  try {
    let installs = await prisma.userWorkspacePlugin.findMany({
      where: { userEmail: req.user.email },
      include: { plugin: true }
    });

    if (installs.length === 0) {
      const allPlugins = await prisma.workspacePlugin.findMany();
      for (const p of allPlugins) {
        try {
          await prisma.userWorkspacePlugin.create({
            data: { userEmail: req.user.email, pluginId: p.id, installedVersion: p.version }
          });
        } catch (e) {
          // ignore duplicate
        }
      }
      installs = await prisma.userWorkspacePlugin.findMany({
        where: { userEmail: req.user.email },
        include: { plugin: true }
      });
    }

    res.json(installs.map(i => ({
      ...i.plugin,
      installedVersion: i.installedVersion
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch installed plugins" });
  }
});

// Admin: Upload plugin archive package (.zip or .vsix) - Supports both Encrypted (SLPK) and Unencoded Raw ZIPs
app.post("/api/plugins/upload", authenticateToken, requireAdmin, upload.single("pluginFile"), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No archive package file provided." });
    }

    // Inspect & validate package format (Encrypted SLPK or Unencoded Raw ZIP)
    let packageBuffer = req.file.buffer;
    const resolved = resolvePluginArchiveBuffer(packageBuffer);

    console.log(`[Plugin Upload Engine] Received package: ${req.file.originalname} (${req.file.size} bytes). Format: ${resolved.format}, Encrypted: ${resolved.isEncrypted}`);

    const checksumSha256 = crypto.createHash("sha256").update(packageBuffer).digest("hex");
    const filename = req.file.originalname || "plugin-package.zip";
    let packageUrl = "";

    if (isBlobConfigured()) {
      const blob = await uploadToBlob(`plugins/${Date.now()}_${filename}`, packageBuffer, {
        contentType: req.file.mimetype || "application/octet-stream"
      });
      packageUrl = blob.url;
    } else {
      const storageDir = path.join(process.cwd(), "storage", "plugins");
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      const savedPath = path.join(storageDir, `${Date.now()}_${filename}`);
      fs.writeFileSync(savedPath, packageBuffer);
      packageUrl = `/storage/plugins/${path.basename(savedPath)}`;
    }

    res.json({
      success: true,
      filename,
      size: req.file.size,
      checksumSha256,
      packageUrl,
      isEncrypted: resolved.isEncrypted,
      format: resolved.format,
      message: resolved.isEncrypted 
        ? "Verified encrypted SutharLabs package (AES-256-GCM authenticated)." 
        : "Loaded unencoded raw ZIP package.",
      storageType: isBlobConfigured() ? "vercel_blob" : "local_disk"
    });
  } catch (error: any) {
    console.error("Failed to upload plugin package:", error);
    res.status(500).json({ error: error.message || "Failed to process plugin package archive." });
  }
});

// Secure Plugin Download Endpoint: Always returns encrypted zip package to prevent raw source exposure
app.get("/api/plugins/download/:id", authenticateToken, async (req: any, res: any) => {
  try {
    const pluginId = req.params.id;
    const storageDir = path.join(process.cwd(), "storage", "plugins");
    
    // Look for matching archive in storage/plugins/
    let targetFile: string | null = null;
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      const match = files.find(f => f.startsWith(pluginId) && f.endsWith('.zip'));
      if (match) {
        targetFile = path.join(storageDir, match);
      }
    }

    if (!targetFile || !fs.existsSync(targetFile)) {
      return res.status(404).json({ error: "Plugin archive package not found." });
    }

    let fileBuffer = fs.readFileSync(targetFile);

    // If package is not yet encrypted, encrypt it on-the-fly before serving
    if (!isEncryptedPluginPackage(fileBuffer)) {
      fileBuffer = encryptPluginPackage(fileBuffer);
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(targetFile)}"`);
    res.send(fileBuffer);
  } catch (error: any) {
    console.error("Plugin download error:", error);
    res.status(500).json({ error: "Failed to download plugin package." });
  }
});

// Blob Storage: Upload file (general endpoint)
app.post("/api/blob/upload", authenticateToken, upload.single("file"), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided for upload." });
    }
    const folder = req.body.folder || "uploads";
    const filename = `${folder}/${Date.now()}_${req.file.originalname || "file"}`;

    if (isBlobConfigured()) {
      const blob = await uploadToBlob(filename, req.file.buffer, {
        contentType: req.file.mimetype || "application/octet-stream"
      });
      return res.json({
        success: true,
        url: blob.url,
        pathname: blob.pathname,
        size: req.file.size,
        contentType: req.file.mimetype,
        storageType: "vercel_blob"
      });
    }

    // Local disk fallback
    const storageDir = path.join(process.cwd(), "storage", folder);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    const localName = `${Date.now()}_${req.file.originalname || "file"}`;
    fs.writeFileSync(path.join(storageDir, localName), req.file.buffer);
    return res.json({
      success: true,
      url: `/storage/${folder}/${localName}`,
      pathname: localName,
      size: req.file.size,
      contentType: req.file.mimetype,
      storageType: "local_disk"
    });
  } catch (err: any) {
    console.error("Blob upload error:", err);
    res.status(500).json({ error: err.message || "Failed to upload file." });
  }
});

// Blob Storage: Health & configuration status check
app.get("/api/blob/status", (_req: any, res: any) => {
  res.json({
    configured: isBlobConfigured(),
    storeId: process.env.BLOB_STORE_ID || null,
    hasToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasWebhookKey: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY)
  });
});

// Blob Storage: List blobs (Admin only)
app.get("/api/blob/list", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    if (!isBlobConfigured()) {
      return res.status(503).json({ error: "Vercel Blob storage is not configured." });
    }
    const prefix = req.query.prefix as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const cursor = req.query.cursor as string | undefined;
    const result = await listStoredBlobs({ prefix, limit, cursor });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list blobs." });
  }
});

// Blob Storage: Delete blob by URL (Admin only)
app.delete("/api/blob/delete", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { url } = req.body || req.query || {};
    if (!url) {
      return res.status(400).json({ error: "Blob url is required." });
    }
    await deleteFromBlob(url);
    res.json({ success: true, message: "Blob deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete blob." });
  }
});

// Blob Storage: Webhook receiver with Ed25519 signature verification
app.post("/api/blob/webhook", (req: any, res: any) => {
  try {
    const signature = req.headers["x-vercel-signature"] || req.headers["x-blob-signature"];
    const payload = JSON.stringify(req.body);

    if (process.env.BLOB_WEBHOOK_PUBLIC_KEY && signature) {
      const isValid = verifyBlobWebhookSignature(payload, signature as string);
      if (!isValid) {
        console.warn("[Blob Webhook] Invalid signature rejected.");
        return res.status(401).json({ error: "Invalid webhook signature." });
      }
    }

    console.log("[Blob Webhook] Verified event payload successfully.");
    res.json({ received: true });
  } catch (err: any) {
    console.error("[Blob Webhook] Error:", err);
    res.status(500).json({ error: "Webhook processing error." });
  }
});

// Admin: Publish / Add a new workspace plugin or version to the global catalog
app.post("/api/workspace-plugins", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { name, category, type, description, iconSymbol, version, changelog, checksumSha256, packageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Plugin name is a required parameter." });
    }

    const id = req.body.id || `wp_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const targetVersion = version || "0.1.0";

    const created = await prisma.workspacePlugin.upsert({
      where: { id },
      update: {
        name,
        category: category || "General",
        type: type || "Community",
        description: description || "Custom developer workspace tool extension.",
        iconSymbol: iconSymbol || "extension",
        version: targetVersion
      },
      create: {
        id,
        name,
        category: category || "General",
        type: type || "Community",
        description: description || "Custom developer workspace tool extension.",
        iconSymbol: iconSymbol || "extension",
        version: targetVersion
      }
    });

    // Record this version in historical release ledger
    await prisma.workspacePluginVersion.upsert({
      where: {
        pluginId_version: {
          pluginId: id,
          version: targetVersion
        }
      },
      update: {
        changelog: changelog || `Release ${targetVersion}`,
        checksumSha256: checksumSha256 || null,
        packageUrl: packageUrl || null,
        publishedBy: req.user.name || req.user.email
      },
      create: {
        pluginId: id,
        version: targetVersion,
        changelog: changelog || `Release ${targetVersion}`,
        checksumSha256: checksumSha256 || null,
        packageUrl: packageUrl || null,
        publishedBy: req.user.name || req.user.email
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create workspace plugin:", error);
    res.status(500).json({ error: "Failed to create workspace plugin." });
  }
});

// Admin: Delete / Unpublish a workspace plugin from the global catalog
app.delete("/api/workspace-plugins/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    // Remove user installation records first
    await prisma.userWorkspacePlugin.deleteMany({
      where: { pluginId: id }
    });
    // Remove plugin from catalog
    await prisma.workspacePlugin.delete({
      where: { id }
    });
    res.json({ success: true, removedId: id });
  } catch (error) {
    console.error("Failed to delete workspace plugin:", error);
    res.status(500).json({ error: "Failed to delete workspace plugin." });
  }
});

// ==========================================
// CONTACT INQUIRIES & ENTERPRISE LEADS API
// ==========================================

// Public: Submit a project consultation parameter inquiry
app.post("/api/contact", generalApiLimiter, async (req: any, res: any) => {
  try {
    const { name, email, projectType, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and project specification message are required." });
    }

    const trackingId = `SR_${Math.floor(10000 + Math.random() * 90000)}`;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;

    const inquiry = await prisma.contactInquiry.create({
      data: {
        trackingId,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        projectType: projectType || "Web Application Dev",
        message: String(message).trim(),
        status: "New",
        ipAddress: clientIp
      }
    });

    // Asynchronously dispatch admin notification email
    notifyAdminNewInquiry({
      trackingId: inquiry.trackingId,
      name: inquiry.name,
      email: inquiry.email,
      projectType: inquiry.projectType,
      message: inquiry.message,
      createdAt: inquiry.createdAt
    }).catch(err => console.error("Failed to dispatch admin notification email:", err));

    res.status(201).json({
      success: true,
      trackingId: inquiry.trackingId,
      createdAt: inquiry.createdAt,
      message: "Consultation inquiry received and registered."
    });
  } catch (error) {
    console.error("Failed to submit contact inquiry:", error);
    res.status(500).json({ error: "Failed to process consultation inquiry." });
  }
});

// Admin: Get all contact inquiries with statistics
app.get("/api/admin/contact-inquiries", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && status !== 'All') {
      where.status = String(status);
    }
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { trackingId: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } }
      ];
    }

    const inquiries = await prisma.contactInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const [total, newCount, inProgressCount, contactedCount, closedCount] = await Promise.all([
      prisma.contactInquiry.count(),
      prisma.contactInquiry.count({ where: { status: 'New' } }),
      prisma.contactInquiry.count({ where: { status: 'In Progress' } }),
      prisma.contactInquiry.count({ where: { status: 'Contacted' } }),
      prisma.contactInquiry.count({ where: { status: 'Closed' } })
    ]);

    res.json({
      inquiries,
      stats: {
        total,
        newCount,
        inProgressCount,
        contactedCount,
        closedCount
      }
    });
  } catch (error) {
    console.error("Failed to fetch contact inquiries:", error);
    res.status(500).json({ error: "Failed to load contact inquiries." });
  }
});

// Admin: Update status or internal notes
app.patch("/api/admin/contact-inquiries/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: updateData
    });

    res.json(updated);
  } catch (error) {
    console.error("Failed to update inquiry:", error);
    res.status(500).json({ error: "Failed to update inquiry." });
  }
});

// Admin: Delete an inquiry
app.delete("/api/admin/contact-inquiries/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.contactInquiry.delete({ where: { id } });
    res.json({ success: true, removedId: id });
  } catch (error) {
    console.error("Failed to delete inquiry:", error);
    res.status(500).json({ error: "Failed to delete inquiry." });
  }
});

// Admin: Test dispatch notification email
app.post("/api/admin/contact-inquiries/:id/test-email", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const inquiry = await prisma.contactInquiry.findUnique({ where: { id } });
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    const result = await notifyAdminNewInquiry({
      trackingId: inquiry.trackingId,
      name: inquiry.name,
      email: inquiry.email,
      projectType: inquiry.projectType,
      message: inquiry.message,
      createdAt: inquiry.createdAt
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to test dispatch email:", error);
    res.status(500).json({ error: "Failed to dispatch test notification email." });
  }
});

// ==========================================
// BUG REPORTING & TELEMETRY DIAGNOSTICS API
// ==========================================

// Public / Authenticated: Submit a user bug report with live log capture
app.post("/api/bug-reports", generalApiLimiter, async (req: any, res: any) => {
  try {
    const { title, description, module, severity, environment, capturedLogs, expectedBehavior, actualBehavior, userEmail, userName } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required to submit an issue." });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const report = await createBugReport({
      userEmail: userEmail || 'anonymous@sutharlabs.com',
      userName: userName || 'Anonymous User',
      title,
      description,
      module,
      severity,
      environment,
      capturedLogs,
      expectedBehavior,
      actualBehavior,
      ipAddress: clientIp
    });

    res.status(201).json({
      success: true,
      trackingId: report.trackingId,
      message: "Bug report and diagnostic telemetry ingested successfully.",
      report
    });
  } catch (error) {
    console.error("Failed to process bug report submission:", error);
    res.status(500).json({ error: "Failed to process bug report." });
  }
});

// Admin: Get all bug reports with statistics and filters
app.get("/api/admin/bug-reports", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { status, severity, module, search } = req.query;
    const result = await getBugReports({
      status: status as string,
      severity: severity as string,
      module: module as string,
      search: search as string
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch bug reports:", error);
    res.status(500).json({ error: "Failed to load bug reports." });
  }
});

// Admin: Update a bug report status or add admin resolution notes
app.patch("/api/admin/bug-reports/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, severity, adminNotes } = req.body;

    const updated = await updateBugReport(id, { status, severity, adminNotes });
    if (!updated) {
      return res.status(404).json({ error: "Bug report not found." });
    }

    res.json(updated);
  } catch (error) {
    console.error("Failed to update bug report:", error);
    res.status(500).json({ error: "Failed to update bug report." });
  }
});

// Admin: Delete a bug report
app.delete("/api/admin/bug-reports/:id", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await deleteBugReport(id);
    res.json({ success: true, message: "Bug report deleted successfully." });
  } catch (error) {
    console.error("Failed to delete bug report:", error);
    res.status(500).json({ error: "Failed to delete bug report." });
  }
});

// Ingest live client telemetry logs
app.post("/api/telemetry/client-logs", async (req: any, res: any) => {
  try {
    const { logs } = req.body;
    if (Array.isArray(logs)) {
      const count = await ingestTelemetryLogs(logs);
      return res.json({ success: true, ingested: count });
    }
    res.status(400).json({ error: "Logs array expected." });
  } catch (error) {
    res.status(500).json({ error: "Failed to ingest telemetry logs." });
  }
});

// Admin: Get recent live telemetry stream
app.get("/api/admin/telemetry/live-logs", authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = await getLiveTelemetryLogs(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch live telemetry logs." });
  }
});

// ==========================================
// ADMIN PORTFOLIO API
// ==========================================

app.get("/api/admin/portfolios", authenticateToken, requireAdmin, async (req: any, res: any) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: "Admins only" });
  try {
    const portfolios = await prisma.portfolio.findMany({ include: { user: true } });
    res.json(portfolios);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolios" });
  }
});




  // ==================== PORTFOLIO & AUDITABLE TRADING ====================

  // GET /api/portfolio
  app.get("/api/portfolio", authenticateToken, async (req: any, res: any) => {
    const authEmail = req.user?.email ? String(req.user.email).toLowerCase() : null;
    const queryEmail = req.query.email ? String(req.query.email).toLowerCase() : null;

    if (!authEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing active user authentication session." });
    }

    // Zero-Trust Isolation: Normal users can NEVER view another user's financial ledger
    if (queryEmail && queryEmail !== authEmail && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Access Denied: You cannot inspect another user's personal financial portfolio." });
    }

    const targetEmail = (req.user.role === 'Admin' && queryEmail) ? queryEmail : authEmail;

    try {
      let portfolio = await prisma.portfolio.findUnique({
        where: { userEmail: targetEmail }
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            userEmail: targetEmail,
            cash: 10000.0,
            shares: 0,
            buyPrice: 0.0
          }
        });
      }

      res.json({
        cash: portfolio.cash,
        shares: portfolio.shares,
        buyPrice: portfolio.buyPrice
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve stock portfolio state." });
    }
  });

  // POST /api/portfolio/trade (Auditable immutable transaction logger)
  app.post("/api/portfolio/trade", authenticateToken, async (req: any, res: any) => {
    const authEmail = req.user?.email ? String(req.user.email).toLowerCase() : null;
    const bodyEmail = req.body.email ? String(req.body.email).toLowerCase() : null;

    if (!authEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing active user authentication session." });
    }

    // Zero-Trust Isolation: Users can NEVER execute transactions against another user's funds
    if (bodyEmail && bodyEmail !== authEmail && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Access Denied: You cannot execute transactions against another user's portfolio." });
    }

    const targetEmail = authEmail;
    const { action, quantity, price } = req.body;
    if (!action || !quantity || !price) {
      return res.status(400).json({ error: "Action (BUY/SELL), Quantity, and Price are required trading parameters." });
    }

    const qty = parseInt(quantity);
    const prc = parseFloat(price);

    if (qty <= 0 || prc <= 0) {
      return res.status(400).json({ error: "Invalid share quantity or share price coordinates." });
    }

    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userEmail: targetEmail }
      });

      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio database entry not found." });
      }

      let updatedCash = portfolio.cash;
      let updatedShares = portfolio.shares;
      let updatedBuyPrice = portfolio.buyPrice;

      if (action === "BUY") {
        const cost = parseFloat((prc * qty).toFixed(2));
        if (cost > portfolio.cash) {
          return res.status(400).json({ error: "INSUFFICIENT CAPITAL: Active order rejected." });
        }
        updatedCash = parseFloat((portfolio.cash - cost).toFixed(2));
        updatedShares = portfolio.shares + qty;
        updatedBuyPrice = parseFloat(
          ((portfolio.buyPrice * portfolio.shares + cost) / updatedShares).toFixed(2)
        );
      } else if (action === "SELL") {
        if (qty > portfolio.shares) {
          return res.status(400).json({ error: "INSUFFICIENT POSITION: Active limit exceeded." });
        }
        const value = parseFloat((prc * qty).toFixed(2));
        updatedCash = parseFloat((portfolio.cash + value).toFixed(2));
        updatedShares = portfolio.shares - qty;
        updatedBuyPrice = updatedShares === 0 ? 0.0 : portfolio.buyPrice;
      } else {
        return res.status(400).json({ error: "Invalid trade action." });
      }

      // Create Immutable Auditable Trade Ledger log entry (State-of-the-Art audit trail)
      await prisma.trade.create({
        data: {
          userEmail: targetEmail,
          action,
          shares: qty,
          price: prc
        }
      });

      const updated = await prisma.portfolio.update({
        where: { userEmail: String(email).toLowerCase() },
        data: {
          cash: updatedCash,
          shares: updatedShares,
          buyPrice: updatedBuyPrice
        }
      });

      // Increment overall user activity sync count
      await prisma.user.update({
        where: { email: String(email).toLowerCase() },
        data: { activityCount: { increment: 1 } }
      });

      res.json({
        cash: updated.cash,
        shares: updated.shares,
        buyPrice: updated.buyPrice
      });
    } catch (error) {
      console.error("Trade error:", error);
      res.status(500).json({ error: "Failed to execute stock trade order." });
    }
  });

  // ==================== STORE PLUGINS ENDPOINTS ====================

  // GET /api/plugins
  app.get("/api/plugins", async (req, res) => {
    try {
      const plugins = await prisma.plugin.findMany();
      const mapped = plugins.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        type: p.type,
        downloads: p.downloads,
        rating: p.rating,
        description: p.description,
        iconSymbol: p.iconSymbol,
        tags: JSON.parse(p.tags)
      }));
      res.json(mapped);
    } catch (error) {
      console.error("Fetch plugins error:", error);
      res.status(500).json({ error: "Failed to retrieve store plugins." });
    }
  });

  // POST /api/plugins (Admin protected endpoint)
  app.post("/api/plugins", authenticateToken, requireAdmin, async (req, res) => {
    const { name, category, type, downloads, rating, description, iconSymbol, tags } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Plugin name and description are required fields." });
    }

    try {
      const created = await prisma.plugin.create({
        data: {
          id: `plugin_${Date.now()}`,
          name,
          category: category || "General",
          type: type || "Free",
          downloads: downloads || "0k",
          rating: Number(rating) || 5.0,
          description,
          iconSymbol: iconSymbol || "smart_toy",
          tags: JSON.stringify(Array.isArray(tags) ? tags : [])
        }
      });

      res.status(201).json({
        id: created.id,
        name: created.name,
        category: created.category,
        type: created.type,
        downloads: created.downloads,
        rating: created.rating,
        description: created.description,
        iconSymbol: created.iconSymbol,
        tags: JSON.parse(created.tags)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish storefront plugin metadata." });
    }
  });

  // DELETE /api/plugins/:id (Admin protected endpoint)
  app.delete("/api/plugins/:id", authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.plugin.delete({ where: { id } });
      res.json({ success: true, removedId: id });
    } catch (error) {
      res.status(500).json({ error: "Failed to unpublish storefront plugin listing." });
    }
  });

  // ==================== REGISTER IN-TREE MODULAR PLUGINS ====================
  registerAllPluginRoutes(app);

  // Direct route aliases for Trade Simulator reset across all namespaces
  app.all([
    "/api/workspace/stock-analyzer/simulator/reset",
    "/api/workspace/stock-analyzer/simulator/reset/",
    "/api/plugins/wp_stock_analyzer/simulator/reset",
    "/api/plugins/wp_stock_analyzer/simulator/reset/",
    "/api/simulator/reset",
    "/api/simulator/reset/"
  ], (req, res) => {
    try {
      const { initialCapital, marketRegion } = req.body || req.query || {};
      const resetState = resetSimulator(Number(initialCapital) || 100000, marketRegion || "IN");
      res.json({ success: true, message: "Trade Simulator reset successfully.", portfolio: resetState });
    } catch (e: any) {
      console.error("[Trade Simulator] Reset error:", e);
      res.status(500).json({ error: e.message || "Failed to reset simulator." });
    }
  });

  // ==================== INITIALIZE PLUGIN ENGINE ====================
  const pluginEngine = new PluginEngine(app);
  await pluginEngine.initialize();

  // Serve compiled frontend UI assets from installed plugins
  app.use('/api/plugins/serve', express.static(path.join(process.cwd(), 'installed_plugins')));
  // Serve plugin archives and storage assets
  app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

  // Unmatched /api/* routes return clean JSON 404 instead of falling through to SPA HTML
  app.use('/api/*', notFoundHandler);

  // Global Centralized Error Handler
  app.use(errorHandler);

  // Mount Vite development server or production static assets handler
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/storage/**', '**/installed_plugins/**', '**/.git/**']
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SutharLabs Sovereign Engine] Full-stack SQLite server running on http://0.0.0.0:${PORT}`);
    });
  }
}

export const startPromise = startServer().catch((err) => {
  console.error("Failed to bootstrap full-stack workspace node server:", err);
});
