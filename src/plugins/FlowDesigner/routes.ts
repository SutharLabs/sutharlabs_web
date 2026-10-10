import { Router } from "express";
import fs from "fs";
import path from "path";
import { getPrismaClient } from "../../../api/_utils.js";
import { authenticateToken } from "../../middleware/auth.js";

const prisma = getPrismaClient();

function getUserFlowFilePath(userEmail: string): string {
  const safeEmail = userEmail.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(process.cwd(), "data", "flows");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return path.join(dir, `flow_nodes_${safeEmail}.json`);
}

function getDefaultUserNodes(userEmail: string) {
  const safeId = userEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 8);
  return [
    { id: `node_src_${safeId}`, label: 'SutharCore Live Feed', type: 'source', status: 'EXECUTED', x: 50, y: 80, fileUsed: 'stocks_list_feed.csv', pluginActive: false },
    { id: 'node_proc_' + safeId, label: 'Analytics Node', type: 'processor', status: 'ACTIVE', pluginActive: true, x: 260, y: 150, fileUsed: null },
    { id: 'node_out_' + safeId, label: 'Secure Sovereign Ledger', type: 'output', status: 'IDLE', pluginActive: false, x: 480, y: 90, fileUsed: null }
  ];
}

export function registerRoutes(router: Router) {
  // GET /nodes - Strictly fetch only the current authenticated user's workflow layout nodes
  router.get("/nodes", authenticateToken, async (req: any, res: any) => {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }

    try {
      let nodes = await prisma.flowNode.findMany({
        where: { userEmail }
      });

      // If user has no nodes in DB, check fallback file or initialize defaults
      if (nodes.length === 0) {
        const filePath = getUserFlowFilePath(userEmail);
        if (fs.existsSync(filePath)) {
          try {
            const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
            if (Array.isArray(fileData) && fileData.length > 0) {
              return res.json(fileData);
            }
          } catch {}
        }

        // Initialize personal defaults
        const defaults = getDefaultUserNodes(userEmail);
        try {
          for (const d of defaults) {
            await prisma.flowNode.create({
              data: {
                id: `${userEmail}_${d.id}`,
                userEmail,
                label: d.label,
                type: d.type,
                status: d.status,
                pluginActive: d.pluginActive,
                fileUsed: d.fileUsed,
                x: d.x,
                y: d.y
              }
            }).catch(() => {});
          }
          nodes = await prisma.flowNode.findMany({ where: { userEmail } });
        } catch {
          return res.json(defaults);
        }
      }

      res.json(nodes);
    } catch (error) {
      // Fallback read from user's isolated file
      const filePath = getUserFlowFilePath(userEmail);
      if (fs.existsSync(filePath)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
          return res.json(fileData);
        } catch {}
      }
      res.json(getDefaultUserNodes(userEmail));
    }
  });

  // POST /nodes/sync - Strictly synchronize only the current authenticated user's visual canvas nodes
  router.post("/nodes/sync", authenticateToken, async (req: any, res: any) => {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user authentication session." });
    }

    const nodes = req.body;
    if (!Array.isArray(nodes)) {
      return res.status(400).json({ error: "Payload must be a valid list of layout nodes." });
    }

    try {
      const labels = nodes.map((n: any) => n.label);
      const uniqueLabels = new Set(labels);
      if (uniqueLabels.size !== labels.length) {
        return res.status(400).json({ error: "Pipeline DAG validation failed: Duplicate node labels are not allowed." });
      }

      // Persist to user's isolated fallback storage immediately
      try {
        const filePath = getUserFlowFilePath(userEmail);
        fs.writeFileSync(filePath, JSON.stringify(nodes, null, 2), "utf8");
      } catch (fileErr) {
        console.warn("[FlowDesigner] Failed to write fallback file:", fileErr);
      }

      // Atomically delete and recreate ONLY this user's nodes in the database
      await prisma.$transaction(async (tx: any) => {
        await tx.flowNode.deleteMany({
          where: { userEmail }
        });

        for (const n of nodes) {
          // Ensure node ID is partitioned per user to avoid collision
          const nodeId = String(n.id).startsWith(userEmail) ? String(n.id) : `${userEmail}_${n.id}`;
          await tx.flowNode.create({
            data: {
              id: nodeId,
              userEmail,
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
      console.error("[FlowDesigner] Canvas sync error:", error);
      res.status(500).json({ error: "Failed to synchronize visual canvas coordinates." });
    }
  });
}
