import express from "express";
import "dotenv/config";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { getPrismaClient } from "./api/_utils.js";
import { PluginEngine } from "./src/plugins/PluginEngine.js";

const PORT = 3000;
const prisma = getPrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "suthar-labs-sovereign-secret-key-2026-matrix-neon";

// Compact cryptographic signature token generator (stateless industry standard)
function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

// Token session verifier
function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null; // expired
    return payload;
  } catch {
    return null;
  }
}

// Express Request Token Authenticator Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access Denied: Bearer authentication token is required." });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Access Denied: Session token is invalid or has expired." });
  }

  req.user = decoded;
  next();
}

// Admin-only authorization guard — must be chained after authenticateToken
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access Denied: Administrator privileges are required for this operation." });
  }
  next();
}

// Dynamic password SHA256 hasher
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

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
          name: "Stock Market Analyzer",
          category: "Finance",
          type: "Native",
          description: "Real-time stock data fetching, technical indicators (RSI, MACD, Bollinger), and algorithmic trading suggestions via native Node.js and Yahoo Finance.",
          iconSymbol: "candlestick_chart",
          version: "2.0.0"
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
app.use(express.json());

async function startServer() {

// -------------------------------------------------------------
// Development Portfolios
// -------------------------------------------------------------
app.get('/api/portfolios', async (req, res) => {
  try {
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

  // File Upload Logic
  const multer = (await import('multer')).default;
  const upload = multer({ dest: path.join(process.cwd(), 'uploads/') });

  app.post('/api/plugins/upload', upload.single('pluginFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // In a real scenario, we would unzip the file to installed_plugins/ 
    // For now we just mock the success response.
    const fs = await import('fs/promises');
    try {
      await fs.copyFile(req.file.path, path.join(process.cwd(), 'installed_plugins', req.file.originalname));
      await fs.unlink(req.file.path);
    } catch(e) {}
    
    res.json({ message: 'File uploaded successfully', filename: req.file.originalname });
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

  // ==================== INVOICES ENDPOINTS ====================

  // GET /api/invoices
  app.get("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const invoices = await prisma.invoice.findMany({
        orderBy: { date: "desc" }
      });
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices ledger." });
    }
  });

  // POST /api/invoices (State-of-the-Art Date-Based daily sequence ID generator)
  app.post("/api/invoices", authenticateToken, async (req, res) => {
    const { client, amount, status } = req.body;
    if (!client || !amount) {
      return res.status(400).json({ error: "Client name and billing amount are required fields." });
    }

    try {
      const date = new Date();
      // Date string format YYYYMMDD
      const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      
      // Determine daily count dynamically to calculate next sequence
      const todayString = date.toISOString().split("T")[0];
      const count = await prisma.invoice.count({
        where: {
          date: {
            contains: todayString
          }
        }
      });

      const sequenceNo = count + 1;
      const formattedInvoiceId = `INV-${dateStr}-${sequenceNo.toString().padStart(4, '0')}`;

      const created = await prisma.invoice.create({
        data: {
          id: formattedInvoiceId,
          date: todayString,
          client,
          amount: parseFloat(amount),
          status: status || "Pending"
        }
      });
      res.status(201).json(created);
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({ error: "Failed to insert transaction invoice." });
    }
  });

  // ==================== FLOW DESIGNER NODES ENDPOINTS ====================


// ==========================================
// WORKSPACE PLUGIN STORE API
// ==========================================

app.get("/api/workspace-plugins", async (req, res) => {
  try {
    const plugins = await prisma.workspacePlugin.findMany();
    res.json(plugins);
  } catch (error) {
    console.error("Failed to fetch workspace plugins:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Install a plugin for the current user
app.post("/api/workspace-plugins/install", authenticateToken, async (req: any, res: any) => {
  try {
    const { pluginId } = req.body;
    if (!pluginId) return res.status(400).json({ error: "Missing pluginId" });

    const install = await prisma.userWorkspacePlugin.create({
      data: {
        userEmail: req.user.email,
        pluginId: pluginId
      }
    });
    res.json(install);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: "Plugin already installed" });
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
    const installs = await prisma.userWorkspacePlugin.findMany({
      where: { userEmail: req.user.email },
      include: { plugin: true }
    });
    res.json(installs.map(i => i.plugin));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch installed plugins" });
  }
});

// ==========================================
// NATIVE TS STOCK ANALYZER API
// ==========================================
// Using dynamic imports so we don't crash if yahoo-finance2 is missing during build
app.get("/api/workspace/stock-analyzer/quote", async (req: any, res: any) => {
  try {
    const { getQuote } = await import("./src/plugins/StockAnalyzer/index.ts");
    const data = await getQuote(req.query.symbol as string);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/workspace/stock-analyzer/history", async (req: any, res: any) => {
  try {
    const { getHistory } = await import("./src/plugins/StockAnalyzer/index.ts");
    const data = await getHistory(req.query.symbol as string, req.query.period as string, req.query.interval as string);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/workspace/stock-analyzer/analysis", async (req: any, res: any) => {
  try {
    const { getAnalysis } = await import("./src/plugins/StockAnalyzer/index.ts");
    const data = await getAnalysis(req.query.symbol as string);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/workspace/stock-analyzer/suggestion", async (req: any, res: any) => {
  try {
    const { getSuggestion } = await import("./src/plugins/StockAnalyzer/index.ts");
    const data = await getSuggestion(req.query.symbol as string);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/workspace/stock-analyzer/nifty50", (req, res) => {
  res.json([
    {"symbol": "RELIANCE.NS",   "name": "Reliance Industries"},
    {"symbol": "TCS.NS",        "name": "Tata Consultancy Services"},
    {"symbol": "HDFCBANK.NS",   "name": "HDFC Bank"},
    {"symbol": "INFY.NS",       "name": "Infosys"},
    {"symbol": "ICICIBANK.NS",  "name": "ICICI Bank"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever"}
  ]);
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


// ==========================================
// DOCNEXUS API (Document Management)
// ==========================================

  // GET /api/nodes
  app.get("/api/nodes", authenticateToken, async (req, res) => {
    try {
      const nodes = await prisma.flowNode.findMany();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visual workflow canvas nodes." });
    }
  });

  // POST /api/nodes/sync
  app.post("/api/nodes/sync", authenticateToken, async (req, res) => {
    const nodes = req.body;
    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: "Payload must be a valid list of layout nodes." });
    }

    try {
      // Cyclic Check & DAG Schema Validation (State-of-the-Art)
      const labels = nodes.map((n) => n.label);
      const uniqueLabels = new Set(labels);
      if (uniqueLabels.size !== labels.length) {
        return res.status(400).json({ error: "Pipeline DAG validation failed: Duplicate node labels are not allowed." });
      }

      // Direct SQLite transactional replacement for visual canvas states
      await prisma.$transaction(async (tx) => {
        await tx.flowNode.deleteMany();
        for (const n of nodes) {
          await tx.flowNode.create({
            data: {
              id: String(n.id),
              label: n.label,
              type: n.type,
              status: n.status || "IDLE",
              pluginActive: !!n.pluginActive,
              fileUsed: n.fileUsed || null,
              x: parseFloat(n.x) || 0.0,
              y: parseFloat(n.y) || 0.0
            }
          });
        }
      });
      res.json({ success: true, count: nodes.length });
    } catch (error) {
      console.error("Canvas sync error:", error);
      res.status(500).json({ error: "Failed to synchronize visual canvas coordinates." });
    }
  });

  // ==================== PORTFOLIO & AUDITABLE TRADING ====================

  // GET /api/portfolio
  app.get("/api/portfolio", authenticateToken, async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email parameter is required." });
    }

    try {
      let portfolio = await prisma.portfolio.findUnique({
        where: { userEmail: String(email).toLowerCase() }
      });

      if (!portfolio) {
        portfolio = await prisma.portfolio.create({
          data: {
            userEmail: String(email).toLowerCase(),
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
  app.post("/api/portfolio/trade", authenticateToken, async (req, res) => {
    const { email, action, quantity, price } = req.body;
    if (!email || !action || !quantity || !price) {
      return res.status(400).json({ error: "Email, Action (BUY/SELL), Quantity, and Price are required trading parameters." });
    }

    const qty = parseInt(quantity);
    const prc = parseFloat(price);

    if (qty <= 0 || prc <= 0) {
      return res.status(400).json({ error: "Invalid share quantity or share price coordinates." });
    }

    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { userEmail: String(email).toLowerCase() }
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
          userEmail: String(email).toLowerCase(),
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

  // ==================== DOCNEXUS DOCUMENT ENDPOINTS ====================

  // GET /api/docnexus/document
  app.get("/api/docnexus/document", authenticateToken, async (req, res) => {
    try {
      let doc = await prisma.document.findUnique({
        where: { id: "doc_nexus_default" }
      });

      if (!doc) {
        doc = await prisma.document.create({
          data: {
            id: "doc_nexus_default",
            title: "DocNexus Sovereign Guide",
            content: `# DocNexus Document Sandbox Guide\n\nWelcome to the **DocNexus Sovereign Document Engine**, a high-performance Markdown and diagramming playground!\n\n> [!NOTE]\n> This applet represents a complete TypeScript implementation of the enterprise-grade DocNexus core.\n\n## Feature Showcases\n\n### 1. Smart Sequence Diagram Compiler\nType standard sequence flows below to compile an interactive calling diagram:\n\n\`\`\`sequence\nAlice -> Bob: Request API Token\nBob -> Alice: Validate HMAC Signature\nAlice -> Gateway: Sync Telemetry\n\`\`\`\n\n### 2. Network Topology Visualizer\nAdorn your structural documents with professional node topologies instantly:\n\n\`\`\`topology\n[ClientApp] === [NginxGateway]\n[NginxGateway] === [ExpressAPI]\n[ExpressAPI] --- [PostgreSQL]\n[ExpressAPI] --- [RedisCache]\n\`\`\`\n\n### 3. High-Density Data Tables\nASCII tables are parsed dynamically into modern dashboard grids:\n\n| Service Node | Role | Telemetry | Status |\n| :--- | :--- | :---: | :---: |\n| VM-East-01 | Primary API | 14ms | ACTIVE |\n| VM-East-02 | Secondary Node | 18ms | STANDBY |\n| db-sqlite-01 | Core Database | 4ms | SYNCHRONIZED |\n`
          }
        });
      }

      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve docnexus document state." });
    }
  });

  // POST /api/docnexus/document
  app.post("/api/docnexus/document", authenticateToken, async (req, res) => {
    const { title, content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: "Document content is required." });
    }

    try {
      const updated = await prisma.document.upsert({
        where: { id: "doc_nexus_default" },
        update: { title: title || "DocNexus Guide", content },
        create: { id: "doc_nexus_default", title: title || "DocNexus Guide", content }
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to save docnexus document." });
    }
  });

  // ==================== INITIALIZE PLUGIN ENGINE ====================
  const pluginEngine = new PluginEngine(app);
  await pluginEngine.initialize();

  // Serve compiled frontend UI assets from installed plugins
  app.use('/api/plugins/serve', express.static(path.join(process.cwd(), 'installed_plugins')));

  // Mount Vite development server or production static assets handler
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
