import { Router } from "express";
import { getPrismaClient } from "../../../api/_utils.js";
import { authenticateToken } from "../../middleware/auth.js";

const prisma = getPrismaClient();

export function registerRoutes(router: Router) {
  // GET /nodes
  router.get("/nodes", authenticateToken, async (_req, res) => {
    try {
      const nodes = await prisma.flowNode.findMany();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch visual workflow canvas nodes." });
    }
  });

  // POST /nodes/sync
  router.post("/nodes/sync", authenticateToken, async (req: any, res: any) => {
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

      await prisma.$transaction(async (tx: any) => {
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
}
