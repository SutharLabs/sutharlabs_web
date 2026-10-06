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
  console.log("→ Seeding workspace plugins...");
  const inTreePlugins = [
    {
      id: "wp_stock_analyzer",
      name: "Stock Tracker",
      category: "Finance",
      type: "Native",
      description: "Professional quantitative trading suite: interactive TradingView charts, drag-resizable split-pane workspace, multi-market global universes (India, US, Europe, Asia), pluggable algorithmic strategy engine (IStrategy), visual condition builder, real-time news & dual AI sentiment analysis, and high-performance quantitative backtesting engine with localized friction & statutory tax modeling (STT, SEC, GST, SDRT, slippage).",
      iconSymbol: "monitoring",
      version: "0.5.0"
    },
    {
      id: "wp_flow_designer",
      name: "Custom Flow",
      category: "Architecture",
      type: "Native",
      description: "Interactive visual node editor for architectural topologies, microservice workflows, and system graph design.",
      iconSymbol: "account_tree",
      version: "0.1.0"
    },
    {
      id: "wp_doc_nexus",
      name: "Doc Nexus",
      category: "Documentation",
      type: "Native",
      description: "Collaborative markdown documentation studio with live preview, syntax highlighting, and cloud persistence.",
      iconSymbol: "menu_book",
      version: "0.1.0"
    },
    {
      id: "wp_accounting",
      name: "Accounting",
      category: "Operations",
      type: "Native",
      description: "Financial ledger, invoicing, daily transaction sequences, and balance auditing.",
      iconSymbol: "currency_exchange",
      version: "0.1.0"
    }
  ];

  for (const wp of inTreePlugins) {
    await prisma.workspacePlugin.upsert({
      where: { id: wp.id },
      update: wp,
      create: wp
    });
  }
  console.log(`  ✓ ${inTreePlugins.length} workspace plugins ensured in catalog.`);

  // 2a. Seed initial version history records
  const initialVersions = [
    {
      pluginId: "wp_stock_analyzer",
      version: "0.1.0",
      changelog: "Initial public release. Real-time Yahoo Finance quote streaming, technical indicators (RSI, MACD, Bollinger Bands), and deterministic paper trading execution log.",
      checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh",
      publishedAt: new Date("2026-10-01T10:00:00Z")
    },
    {
      pluginId: "wp_stock_analyzer",
      version: "0.2.0",
      changelog: "Stage 1 Foundation & Global Markets: Interactive TradingView Lightweight Candlestick Charts (zoom, pan, volume histogram), Pluggable Global Market Universes (India NSE/BSE, US NYSE/NASDAQ, Europe LSE/DAX/Euronext, China/HK CSI 300/Hang Seng, Japan TSE), multi-currency normalization, and persistent database watchlists.",
      checksumSha256: "d5a8c2918f4bb71900a7b489c44ea1d58e3881267b14072895bc803e404bf912",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh",
      publishedAt: new Date("2026-10-04T12:00:00Z")
    },
    {
      pluginId: "wp_stock_analyzer",
      version: "0.3.0",
      changelog: "Stage 2 Strategy Architecture & Visual Rule Builder: Pluggable IStrategy lifecycle engine, 4 battle-tested quant presets (EMA Golden / Death Cross, RSI Mean Reversion, Bollinger Bands Breakout, Supertrend Trend-Following), persistent JSON storage for custom strategies, and Visual Condition Builder UI with live sandbox test evaluator.",
      checksumSha256: "7a94cb0211a7db8f134591a1820468351b9e0f54316d2cae89b4f0b080e7d592",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh",
      publishedAt: new Date("2026-10-05T18:00:00Z")
    },
    {
      pluginId: "wp_stock_analyzer",
      version: "0.4.0",
      changelog: "Stage 3 Real-Time News Stream & AI Sentiment Intelligence: Multi-region financial news stream with verified source links (Moneycontrol, ET, Livemint, SEBI, CNBC, MarketWatch, SEC EDGAR, Reuters, FCA), Dual-Engine Sentiment Analysis (Google Gemini 2.5 Flash + Autonomous Financial Lexicon Engine at $0 cost and <1ms latency), in-app Gemini API key settings, daily free tier quota tracker (1,500 RPD), and AI sentiment confluence factor in quantitative trading signals.",
      checksumSha256: "b41ad1262b377e6f7c1a1f040859231f41b392a10486c91a3205739c9842bf91",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh",
      publishedAt: new Date("2026-10-05T23:30:00Z")
    },
    {
      pluginId: "wp_stock_analyzer",
      version: "0.5.0",
      changelog: "Stage 4 High-Performance Quantitative Backtesting Engine & Multi-Country Market Friction: Point-in-time sequential simulation over historical daily/intraday bars with zero lookahead bias, localized statutory tax & friction modeling (India NSE STT/GST/SEBI/Stamp Duty, US SEC 31/FINRA TAF, UK SDRT, China A-share T+1 rule, HK/Japan board lots, bid-ask slippage), institutional KPI suite (CAGR, Sharpe, Sortino, Max Drawdown duration, Win Rate, Profit Factor, Alpha vs Buy & Hold), interactive SVG Equity Curve with hover telemetry, Trade Log table with CSV export, and TradingView-style drag-resizable split pane with tab strip carousel.",
      checksumSha256: "c52be147983ac12781b268f761d4a8e9821435fc607d891b2978a2e1f40b2195",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh",
      publishedAt: new Date("2026-10-06T03:30:00Z")
    },

    {
      pluginId: "wp_flow_designer",
      version: "0.1.0",
      changelog: "Initial public release. Interactive canvas for architectural node topologies, microservices modeling, and JSON state import/export.",
      checksumSha256: "ca978112ca1bbdcafac231b39a23dc4da786081498f409f5c6a1e3518e38d689",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh"
    },
    {
      pluginId: "wp_doc_nexus",
      version: "0.1.0",
      changelog: "Initial public release. Collaborative split-pane markdown documentation editor with live render, code snippet styling, and cloud persistence.",
      checksumSha256: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh"
    },
    {
      pluginId: "wp_accounting",
      version: "0.1.0",
      changelog: "Initial public release. Financial ledger, double-entry invoicing sequences, and balance sheet auditing.",
      checksumSha256: "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5",
      minEngineVersion: "0.1.0",
      publishedBy: "Suthar Suresh"
    }
  ];

  for (const v of initialVersions) {
    await prisma.workspacePluginVersion.upsert({
      where: { pluginId_version: { pluginId: v.pluginId, version: v.version } },
      update: v,
      create: v
    });
  }
  console.log(`  ✓ ${initialVersions.length} initial plugin version records ensured`);

  // 3. Users
  console.log("→ Ensuring default users exist...");
  const defaultUsers = [
    { name: "Suthar Suresh",    email: "mr.sutharsuresh@gmail.com",   password: "suthar123",    role: "Admin",     joinedAt: new Date("2026-05-20T10:14:00Z"), activityCount: 842 },
    { name: "Suthar Developer", email: "developer@sutharlabs.com",    password: "developer123", role: "Admin",     joinedAt: new Date("2026-05-21T08:30:15Z"), activityCount: 452 },
    { name: "Johan Decker",     email: "johan.decker@consensys.net",  password: "developer123", role: "Developer", joinedAt: new Date("2026-05-22T14:45:00Z"), activityCount: 118 },
    { name: "Rogue Spammer",    email: "spammer99@rogue.io",          password: "developer123", role: "Banned",    joinedAt: new Date("2026-05-23T05:12:00Z"), activityCount: 12  }
  ];
  for (const u of defaultUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { name: u.name, email: u.email, passwordHash: hashPassword(u.password), role: u.role, joinedAt: u.joinedAt, activityCount: u.activityCount }
    });
  }
  console.log(`  ✓ ${defaultUsers.length} users ensured`);

  // 2b. Seed Real Workspace Plugin Reviews & Ratings
  console.log("→ Seeding real workspace plugin reviews...");
  const sampleReviews = [
    {
      pluginId: "wp_stock_analyzer",
      userEmail: "johan.decker@consensys.net",
      userName: "Johan Decker",
      rating: 5,
      feedback: "The real-time Bollinger Bands and RSI calculations run with zero latency. Seamless integration with our algorithmic strategies."
    },
    {
      pluginId: "wp_stock_analyzer",
      userEmail: "developer@sutharlabs.com",
      userName: "Suthar Developer",
      rating: 5,
      feedback: "Yahoo Finance feed reconnects reliably in the background. Paper trading execution log is completely deterministic."
    },
    {
      pluginId: "wp_flow_designer",
      userEmail: "johan.decker@consensys.net",
      userName: "Johan Decker",
      rating: 5,
      feedback: "Excellent drag-and-drop node graph. We mapped out our microservices topology in minutes and exported the entire architecture as JSON."
    },
    {
      pluginId: "wp_doc_nexus",
      userEmail: "mr.sutharsuresh@gmail.com",
      userName: "Suthar Suresh",
      rating: 5,
      feedback: "Live markdown rendering with code fences and cloud persistence makes documenting internal APIs fast and distraction-free."
    },
    {
      pluginId: "wp_accounting",
      userEmail: "developer@sutharlabs.com",
      userName: "Suthar Developer",
      rating: 4,
      feedback: "Solid double-entry reconciliation and invoice management. Looking forward to additional multi-currency balance views."
    }
  ];

  for (const r of sampleReviews) {
    await prisma.workspacePluginReview.upsert({
      where: { userEmail_pluginId: { userEmail: r.userEmail, pluginId: r.pluginId } },
      update: r,
      create: r
    });
  }
  console.log(`  ✓ ${sampleReviews.length} real plugin reviews ensured`);

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
