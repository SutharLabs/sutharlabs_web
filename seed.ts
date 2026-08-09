import "dotenv/config";
import fs from "fs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const defaultPlugins = [
  {
    id: "plugin_1",
    name: "JIRA MCP Server",
    category: "DevOps",
    type: "Free",
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
    type: "Premium",
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
    type: "Free",
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
    type: "Premium",
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
    type: "Trial",
    downloads: "15k",
    rating: 4.8,
    description: "Seamlessly sync relational transaction databases to vector storage indexes for dynamic context RAG logic.",
    iconSymbol: "database",
    tags: ["Vector DB", "RAG", "Admin"]
  }
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Check your .env file.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Starting database seed...\n");

  // 1. Plugins
  const pluginCount = await prisma.plugin.count();
  if (pluginCount === 0) {
    console.log("→ Seeding store plugins...");
    for (const p of defaultPlugins) {
      await prisma.plugin.create({
        data: { ...p, tags: JSON.stringify(p.tags) }
      });
    }
    console.log(`  ✓ ${defaultPlugins.length} plugins inserted`);
  } else {
    console.log(`  ⏭  Plugins already exist (${pluginCount}), skipping`);
  }

  // 2. Workspace plugins
  const wsPluginCount = await prisma.workspacePlugin.count();
  if (wsPluginCount === 0) {
    console.log("→ Seeding workspace plugins...");
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
    console.log("  ✓ 1 workspace plugin inserted");
  } else {
    console.log(`  ⏭  Workspace plugins already exist (${wsPluginCount}), skipping`);
  }

  // 3. Users
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("→ Seeding users...");
    const defaultUsers = [
      { name: "Suthar Suresh",    email: "mr.sutharsuresh@gmail.com",   password: "suthar123",    role: "Admin",     joinedAt: new Date("2026-05-20T10:14:00Z"), activityCount: 842 },
      { name: "Suthar Developer", email: "developer@sutharlabs.com",    password: "developer123", role: "Admin",     joinedAt: new Date("2026-05-21T08:30:15Z"), activityCount: 452 },
      { name: "Johan Decker",     email: "johan.decker@consensys.net",  password: "developer123", role: "Developer", joinedAt: new Date("2026-05-22T14:45:00Z"), activityCount: 118 },
      { name: "Rogue Spammer",    email: "spammer99@rogue.io",          password: "developer123", role: "Banned",    joinedAt: new Date("2026-05-23T05:12:00Z"), activityCount: 12  }
    ];
    for (const u of defaultUsers) {
      await prisma.user.create({
        data: { name: u.name, email: u.email, passwordHash: hashPassword(u.password), role: u.role, joinedAt: u.joinedAt, activityCount: u.activityCount }
      });
    }
    console.log(`  ✓ ${defaultUsers.length} users inserted`);
  } else {
    console.log(`  ⏭  Users already exist (${userCount}), skipping`);
  }

  // 4. Invoices
  const invoiceCount = await prisma.invoice.count();
  if (invoiceCount === 0) {
    console.log("→ Seeding invoices...");
    const defaultInvoices = [
      { id: "INV-20260518-0001", date: "2026-05-18", client: "AlphaCorp Int",  amount: 8450.00,  status: "Paid"    },
      { id: "INV-20260520-0002", date: "2026-05-20", client: "Tesla Forge",    amount: 12500.00, status: "Pending" },
      { id: "INV-20260522-0003", date: "2026-05-22", client: "Vertex Grid",    amount: 9950.00,  status: "Pending" },
      { id: "INV-20260523-0004", date: "2026-05-23", client: "Lambda Group",   amount: 4800.00,  status: "Paid"    }
    ];
    for (const inv of defaultInvoices) {
      await prisma.invoice.create({ data: inv });
    }
    console.log(`  ✓ ${defaultInvoices.length} invoices inserted`);
  } else {
    console.log(`  ⏭  Invoices already exist (${invoiceCount}), skipping`);
  }

  // 5. Flow nodes
  const nodeCount = await prisma.flowNode.count();
  if (nodeCount === 0) {
    console.log("→ Seeding flow nodes...");
    const defaultNodes = [
      { id: "1", label: "SutharCore Stock API",  type: "source",    status: "EXECUTED", x: 50,  y: 80,  fileUsed: "stocks_list_feed.csv", pluginActive: false },
      { id: "2", label: "SutharAnalytics Node",  type: "processor", status: "ACTIVE",   x: 260, y: 150, fileUsed: null,                   pluginActive: true  },
      { id: "3", label: "PostgreSQL Ledger",      type: "output",    status: "IDLE",     x: 480, y: 90,  fileUsed: null,                   pluginActive: false }
    ];
    for (const node of defaultNodes) {
      await prisma.flowNode.create({ data: node });
    }
    console.log(`  ✓ ${defaultNodes.length} flow nodes inserted`);
  } else {
    console.log(`  ⏭  Flow nodes already exist (${nodeCount}), skipping`);
  }

  // 6. Development portfolio projects (from data/portfolios.json)
  const portfolioCount = await prisma.developmentProject.count();
  if (portfolioCount === 0) {
    const dataPath = "./data/portfolios.json";
    if (fs.existsSync(dataPath)) {
      console.log("→ Seeding development projects from data/portfolios.json...");
      const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      for (const p of data) {
        await prisma.developmentProject.create({
          data: {
            id: p.id,
            title: p.title || "",
            segment: p.segment || "",
            description: p.description || "",
            detailedCase: p.detailedCase || "",
            stat: p.stat || "",
            statLabel: p.statLabel || "",
            techs: JSON.stringify(p.techs || []),
            client: p.client || "",
            clientTitle: p.clientTitle || "",
            blueprintSymbol: p.blueprintSymbol || "globe",
            imageSrc: p.imageSrc || ""
          }
        });
      }
      console.log(`  ✓ ${data.length} development projects inserted`);
    } else {
      console.log("  ⚠  data/portfolios.json not found, skipping");
    }
  } else {
    console.log(`  ⏭  Development projects already exist (${portfolioCount}), skipping`);
  }

  console.log("\n✅ Seed complete!");
  await pool.end();
}

seed().catch((e) => {
  console.error("\n❌ Seed failed:", e);
  process.exit(1);
});
