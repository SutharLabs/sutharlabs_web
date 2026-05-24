import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "plugins-db.json");

// Default initial plugins data
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

// Helper to load plugins from JSON file db
function getPluginsFromDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultPlugins, null, 2), "utf-8");
      return defaultPlugins;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading plugins database:", error);
    return defaultPlugins;
  }
}

// Helper to save plugins to JSON file db
function savePluginsToDB(plugins: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(plugins, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing to plugins database:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API router configuration
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // GET store plugins
  app.get("/api/plugins", (req, res) => {
    const plugins = getPluginsFromDB();
    res.json(plugins);
  });

  // POST create plugin
  app.post("/api/plugins", (req, res) => {
    const { name, category, type, downloads, rating, description, iconSymbol, tags } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Plugin name and description are required fields." });
    }

    const plugins = getPluginsFromDB();
    const newPlugin = {
      id: `plugin_${Date.now()}`,
      name,
      category: category || "General",
      type: type || "Free",
      downloads: downloads || "0k",
      rating: Number(rating) || 5.0,
      description,
      iconSymbol: iconSymbol || "smart_toy",
      tags: Array.isArray(tags) ? tags : []
    };

    plugins.push(newPlugin);
    savePluginsToDB(plugins);
    res.status(201).json(newPlugin);
  });

  // DELETE plugin listing
  app.delete("/api/plugins/:id", (req, res) => {
    const { id } = req.params;
    let plugins = getPluginsFromDB();
    const existingCount = plugins.length;
    plugins = plugins.filter((p: any) => p.id !== id);

    if (plugins.length === existingCount) {
      return res.status(404).json({ error: "Plugin not found." });
    }

    savePluginsToDB(plugins);
    res.json({ success: true, removedId: id });
  });

  // Mount Vite development server or production static assets handler
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SutharLabs Sovereign Engine] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to bootstrap full-stack workspace node server:", err);
});
