import { Router } from "express";
import { getPrismaClient } from "../../../api/_utils.js";
import { authenticateToken } from "../../middleware/auth.js";

const prisma = getPrismaClient();

export function registerRoutes(router: Router) {
  // GET /invoices or /api/invoices
  router.get("/invoices", authenticateToken, async (_req, res) => {
    try {
      const invoices = await prisma.invoice.findMany({
        orderBy: { date: "desc" }
      });
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices ledger." });
    }
  });

  // POST /invoices or /api/invoices
  router.post("/invoices", authenticateToken, async (req: any, res: any) => {
    const { client, amount, status } = req.body;
    if (!client || !amount) {
      return res.status(400).json({ error: "Client name and billing amount are required fields." });
    }

    try {
      const date = new Date();
      const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      
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
}
