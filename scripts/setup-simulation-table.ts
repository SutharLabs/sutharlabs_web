import 'dotenv/config';
import { getPrismaClient } from '../api/_utils.js';

async function main() {
  const prisma = getPrismaClient();
  console.log('Connecting to Neon PostgreSQL...');
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS simulation_stores (
      sim_id TEXT PRIMARY KEY,
      initial_cash DOUBLE PRECISION DEFAULT 100000,
      cash DOUBLE PRECISION DEFAULT 100000,
      positions TEXT DEFAULT '[]',
      closed_trades TEXT DEFAULT '[]',
      history TEXT DEFAULT '[]',
      last_run_date TEXT,
      total_realized_pnl DOUBLE PRECISION DEFAULT 0,
      total_friction_paid DOUBLE PRECISION DEFAULT 0,
      win_count INT DEFAULT 0,
      loss_count INT DEFAULT 0,
      last_updated TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  console.log('✅ simulation_stores table verified/created in Neon PostgreSQL!');
  
  const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM simulation_stores LIMIT 5`);
  console.log('Current rows in simulation_stores:', rows.length);
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
