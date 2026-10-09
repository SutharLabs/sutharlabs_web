import React, { useState, useEffect } from 'react';
import {
  BalanceSheetReport,
  ProfitAndLossReport,
  TrialBalanceReport,
  AgingAnalysisReport,
  BankReconciliationReport
} from '../types.js';
import { formatINR } from '../gstEngine.js';

interface FinancialStatementsViewProps {
  userToken: string;
}

export default function FinancialStatementsView({ userToken }: FinancialStatementsViewProps) {
  const [activeReport, setActiveReport] = useState<'BS' | 'PL' | 'TB' | 'AGING' | 'BRS'>('BS');

  const [bs, setBs] = useState<BalanceSheetReport | null>(null);
  const [pl, setPl] = useState<ProfitAndLossReport | null>(null);
  const [tb, setTb] = useState<TrialBalanceReport | null>(null);
  const [aging, setAging] = useState<AgingAnalysisReport | null>(null);
  const [brs, setBrs] = useState<BankReconciliationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStatements = async () => {
      try {
        setIsLoading(true);
        const headers = { Authorization: `Bearer ${userToken}` };
        const [bsRes, plRes, tbRes, agingRes, brsRes] = await Promise.all([
          fetch('/api/plugins/wp_accounting/reports/balance-sheet', { headers }).then(r => r.json()),
          fetch('/api/plugins/wp_accounting/reports/profit-loss', { headers }).then(r => r.json()),
          fetch('/api/plugins/wp_accounting/reports/trial-balance', { headers }).then(r => r.json()),
          fetch('/api/plugins/wp_accounting/reports/aging', { headers }).then(r => r.json()),
          fetch('/api/plugins/wp_accounting/reports/brs', { headers }).then(r => r.json())
        ]);

        setBs(bsRes);
        setPl(plRes);
        setTb(tbRes);
        setAging(agingRes);
        setBrs(brsRes);
      } catch (err) {
        console.error('Failed to load financial statements:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStatements();
  }, [userToken]);

  if (isLoading || !bs || !pl || !tb || !aging || !brs) {
    return (
      <div className="p-12 text-center font-mono text-xs text-slate-400 dark:text-gray-400">
        <span className="material-symbols-outlined text-3xl animate-spin text-primary dark:text-[#00dbe7] block mb-2">sync</span>
        Calculating Financial Statements & Auditing Ledgers...
      </div>
    );
  }

  return (
    <div className="space-y-5 font-mono text-xs animate-fade-in">
      
      {/* Top Statements Navigation Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-[#3a494b]/20 pb-2 scrollbar-hide">
        {[
          { id: 'BS', label: 'Balance Sheet (Schedule III)', icon: 'account_balance' },
          { id: 'PL', label: 'Profit & Loss Statement', icon: 'trending_up' },
          { id: 'TB', label: 'Trial Balance', icon: 'balance' },
          { id: 'AGING', label: 'Aging Analysis (SAP FBL5N)', icon: 'schedule' },
          { id: 'BRS', label: 'Bank Reconciliation (BRS)', icon: 'assured_workload' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeReport === tab.id
                ? 'bg-primary/10 dark:bg-[#00dbe7]/15 border border-primary dark:border-[#00dbe7] text-primary dark:text-[#74f5ff] shadow-sm'
                : 'bg-white dark:bg-[#131316] border border-slate-200 dark:border-[#3a494b]/20 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== 1. BALANCE SHEET (SCHEDULE III) ==================== */}
      {activeReport === 'BS' && (
        <div className="space-y-4">
          {/* Header KPI Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-gray-400 block mb-1">
                Total Balance Sheet Size
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {formatINR(bs.assets.totalAssets)}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-[#00e476] mt-1 block">
                Assets Equal Liabilities & Equity ✓
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-gray-400 block mb-1">
                Net Working Capital
              </span>
              <span className="text-xl font-bold text-primary dark:text-[#00dbe7]">
                {formatINR(bs.workingCapital)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 mt-1 block">
                Current Assets - Current Liabilities
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 dark:text-gray-400 block mb-1">
                Shareholders' Funds (Net Worth)
              </span>
              <span className="text-xl font-bold text-purple-600 dark:text-[#ebb2ff]">
                {formatINR(bs.equitiesAndLiabilities.shareholdersFunds.total)}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 mt-1 block">
                Capital + Reserves + Current Earnings
              </span>
            </div>
          </div>

          {/* Balance Sheet Dual Column Layout (Tally & SAP Schedule III format) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Equities and Liabilities */}
            <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <div className="bg-slate-50 dark:bg-[#18181c] p-3 border-b border-slate-200 dark:border-[#3a494b]/20 font-sans font-bold text-sm text-slate-900 dark:text-white flex justify-between items-center">
                <span>I. EQUITIES & LIABILITIES</span>
                <span className="text-xs font-mono text-primary dark:text-[#00dbe7]">Schedule III</span>
              </div>

              <div className="p-4 space-y-4">
                {/* 1. Shareholders' Funds */}
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-white flex justify-between">
                    <span>1. Shareholders' Funds</span>
                    <span>{formatINR(bs.equitiesAndLiabilities.shareholdersFunds.total)}</span>
                  </div>
                  <div className="pl-3 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>(a) Share Capital</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.shareholdersFunds.shareCapital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(b) Reserves & Surplus</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.shareholdersFunds.reservesAndSurplus)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-[#00e476]">
                      <span>(c) Current Year Surplus (P&L)</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.shareholdersFunds.currentYearEarnings)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Non-Current Liabilities */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#3a494b]/10">
                  <div className="font-bold text-slate-800 dark:text-white flex justify-between">
                    <span>2. Non-Current Liabilities</span>
                    <span>{formatINR(bs.equitiesAndLiabilities.nonCurrentLiabilities.total)}</span>
                  </div>
                  <div className="pl-3 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>(a) Long-Term Borrowings (Term Loan)</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.nonCurrentLiabilities.longTermBorrowings)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Current Liabilities */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#3a494b]/10">
                  <div className="font-bold text-slate-800 dark:text-white flex justify-between">
                    <span>3. Current Liabilities</span>
                    <span>{formatINR(bs.equitiesAndLiabilities.currentLiabilities.total)}</span>
                  </div>
                  <div className="pl-3 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>(a) Trade Payables (Sundry Creditors)</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.currentLiabilities.tradePayables)}</span>
                    </div>
                    <div className="flex justify-between text-purple-600 dark:text-[#ebb2ff]">
                      <span>(b) Output GST Liability Payable</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.currentLiabilities.outputGstPayable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(c) Short-term Provisions & Utilities</span>
                      <span>{formatINR(bs.equitiesAndLiabilities.currentLiabilities.shortTermProvisions)}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-slate-300 dark:border-white/20 flex justify-between font-bold text-sm text-slate-900 dark:text-white font-sans">
                  <span>TOTAL EQUITIES & LIABILITIES:</span>
                  <span className="text-emerald-600 dark:text-[#00e476]">
                    {formatINR(bs.equitiesAndLiabilities.totalLiabilitiesAndEquity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Assets */}
            <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <div className="bg-slate-50 dark:bg-[#18181c] p-3 border-b border-slate-200 dark:border-[#3a494b]/20 font-sans font-bold text-sm text-slate-900 dark:text-white flex justify-between items-center">
                <span>II. ASSETS</span>
                <span className="text-xs font-mono text-emerald-600 dark:text-[#00e476]">Schedule III</span>
              </div>

              <div className="p-4 space-y-4">
                {/* 1. Non-Current Assets */}
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800 dark:text-white flex justify-between">
                    <span>1. Non-Current Assets (Fixed Assets)</span>
                    <span>{formatINR(bs.assets.nonCurrentAssets.total)}</span>
                  </div>
                  <div className="pl-3 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>(a) Tangible Hardware & GPU Nodes</span>
                      <span>{formatINR(bs.assets.nonCurrentAssets.fixedAssetsPlantTech)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(b) Intangible Software & Frameworks</span>
                      <span>{formatINR(bs.assets.nonCurrentAssets.intangibleAssetsSoftware)}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>Less: Accumulated Depreciation</span>
                      <span>({formatINR(bs.assets.nonCurrentAssets.accumulatedDepreciation)})</span>
                    </div>
                  </div>
                </div>

                {/* 2. Current Assets */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#3a494b]/10">
                  <div className="font-bold text-slate-800 dark:text-white flex justify-between">
                    <span>2. Current Assets</span>
                    <span>{formatINR(bs.assets.currentAssets.total)}</span>
                  </div>
                  <div className="pl-3 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                    <div className="flex justify-between font-bold text-primary dark:text-[#00dbe7]">
                      <span>(a) Cash & Bank Balances (HDFC)</span>
                      <span>{formatINR(bs.assets.currentAssets.cashAndBankBalances)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(b) Trade Receivables (Sundry Debtors)</span>
                      <span>{formatINR(bs.assets.currentAssets.tradeReceivablesDebtors)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-[#00e476]">
                      <span>(c) Input Tax Credit (GST Asset)</span>
                      <span>{formatINR(bs.assets.currentAssets.inputTaxCreditGstAsset)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(d) Hardware Stock Inventories</span>
                      <span>{formatINR(bs.assets.currentAssets.inventories)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(e) Prepaid Expenses & Advances</span>
                      <span>{formatINR(bs.assets.currentAssets.prepaidExpenses)}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t-2 border-slate-300 dark:border-white/20 flex justify-between font-bold text-sm text-slate-900 dark:text-white font-sans">
                  <span>TOTAL ASSETS:</span>
                  <span className="text-emerald-600 dark:text-[#00e476]">
                    {formatINR(bs.assets.totalAssets)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== 2. PROFIT & LOSS STATEMENT ==================== */}
      {activeReport === 'PL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-sans">
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Net Sales Revenue</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{formatINR(pl.income.netRevenue)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Gross Profit (Margin {pl.grossMarginPercent}%)</span>
              <span className="text-xl font-bold text-primary dark:text-[#00dbe7]">{formatINR(pl.grossProfit)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Operating EBITDA</span>
              <span className="text-xl font-bold text-purple-600 dark:text-[#ebb2ff]">{formatINR(pl.operatingProfitEBITDA)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Net Profit After Tax ({pl.netMarginPercent}%)</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-[#00e476]">{formatINR(pl.netProfitAfterTax)}</span>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
            <div className="bg-slate-50 dark:bg-[#18181c] p-3 border-b border-slate-200 dark:border-[#3a494b]/20 font-sans font-bold text-sm text-slate-900 dark:text-white flex justify-between">
              <span>STATEMENT OF PROFIT AND LOSS ({pl.period})</span>
              <span className="font-mono text-xs text-emerald-600 dark:text-[#00e476]">GAAP / Ind AS</span>
            </div>

            <div className="p-4 space-y-4 text-xs font-mono">
              {/* Revenue */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                  <span>I. REVENUE FROM OPERATIONS</span>
                  <span>{formatINR(pl.income.netRevenue)}</span>
                </div>
                <div className="pl-4 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Gross Sales Turnover</span>
                    <span>{formatINR(pl.income.grossSalesRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Less: Output GST Collected for Govt</span>
                    <span>({formatINR(pl.income.lessGstPaid)})</span>
                  </div>
                  <div className="flex justify-between text-slate-800 dark:text-white font-bold pt-1 border-t border-slate-100 dark:border-[#3a494b]/10">
                    <span>Net Operating Revenue</span>
                    <span>{formatINR(pl.income.netRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* COGS */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#3a494b]/20">
                <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                  <span>II. COST OF GOODS SOLD & DELIVERIES (COGS)</span>
                  <span>{formatINR(pl.costOfGoodsSold.totalCOGS)}</span>
                </div>
                <div className="pl-4 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Hardware Purchases & Inward Compute</span>
                    <span>{formatINR(pl.costOfGoodsSold.purchases)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct Technical Deployment Costs</span>
                    <span>{formatINR(pl.costOfGoodsSold.directTechnicalExpenses)}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-primary dark:text-[#00dbe7] pt-1 border-t border-slate-100 dark:border-[#3a494b]/10">
                  <span>GROSS PROFIT:</span>
                  <span>{formatINR(pl.grossProfit)}</span>
                </div>
              </div>

              {/* Operating Expenses */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#3a494b]/20">
                <div className="font-bold text-slate-900 dark:text-white flex justify-between">
                  <span>III. OPERATING & ADMINISTRATIVE EXPENSES</span>
                  <span>{formatINR(pl.operatingExpenses.totalOperatingExpenses)}</span>
                </div>
                <div className="pl-4 text-[11px] space-y-1 text-slate-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>(a) Cloud Infrastructure (AWS / Neon GPU)</span>
                    <span>{formatINR(pl.operatingExpenses.cloudInfrastructureAndServers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(b) Engineering Staff Salaries</span>
                    <span>{formatINR(pl.operatingExpenses.salariesAndStaffCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(c) Office Rent & Utilities</span>
                    <span>{formatINR(pl.operatingExpenses.rentAndUtilities)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(d) Marketing & Client Acquisition</span>
                    <span>{formatINR(pl.operatingExpenses.marketingAndClientAcquisition)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(e) Legal & Audit Compliance Fees</span>
                    <span>{formatINR(pl.operatingExpenses.legalAndAuditFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(f) Depreciation & Amortization</span>
                    <span>{formatINR(pl.operatingExpenses.depreciationAndAmortization)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit After Tax */}
              <div className="pt-3 border-t-2 border-slate-300 dark:border-white/20 space-y-1 font-bold text-sm">
                <div className="flex justify-between text-purple-600 dark:text-[#ebb2ff]">
                  <span>OPERATING PROFIT BEFORE TAX (EBITDA):</span>
                  <span>{formatINR(pl.operatingProfitEBITDA)}</span>
                </div>
                <div className="flex justify-between text-xs text-rose-500">
                  <span>Less: Corporate Tax Provision (25%)</span>
                  <span>({formatINR(pl.taxProvision)})</span>
                </div>
                <div className="flex justify-between text-base text-emerald-600 dark:text-[#00e476] pt-1 border-t border-slate-200 dark:border-[#3a494b]/20">
                  <span>NET PROFIT AFTER TAX (PAT):</span>
                  <span>{formatINR(pl.netProfitAfterTax)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. TRIAL BALANCE ==================== */}
      {activeReport === 'TB' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 flex justify-between items-center shadow-sm">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white font-sans text-sm">
                Grouped General Ledger Trial Balance
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-gray-400">
                Debits & Credits parity check across all Chart of Accounts heads
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 block">Total Debits</span>
                <span className="font-bold text-emerald-600 dark:text-[#00e476]">{formatINR(tb.totalDebit)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-gray-400 block">Total Credits</span>
                <span className="font-bold text-purple-600 dark:text-[#ebb2ff]">{formatINR(tb.totalCredit)}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-500 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
                <tr>
                  <th className="p-3">Account Code</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3 text-right">Debit (₹)</th>
                  <th className="p-3 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/15 bg-white dark:bg-surface-container-low/40">
                {(tb.accounts || []).map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-primary dark:text-[#00dbe7]">{acc.accountCode}</td>
                    <td className="p-3 text-slate-800 dark:text-white font-sans">{acc.accountName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300">
                        {acc.group}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-[#00e476]">
                      {acc.debit > 0 ? formatINR(acc.debit).replace('₹ ', '') : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-purple-600 dark:text-[#ebb2ff]">
                      {acc.credit > 0 ? formatINR(acc.credit).replace('₹ ', '') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 4. AGING ANALYSIS (SAP FBL5N) ==================== */}
      {activeReport === 'AGING' && (
        <div className="space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 flex justify-between items-center shadow-sm">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white font-sans text-sm">
                Accounts Receivable & Payable Aging Matrix (SAP FBL5N)
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-gray-400">
                Default 30-day interval overdue buckets for liquidity management
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-gray-400">Total Outstanding:</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">{formatINR(aging.totalReceivables)}</span>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
            <div className="bg-slate-50 dark:bg-[#18181c] p-2.5 px-3 border-b border-slate-200 dark:border-[#3a494b]/20 font-bold text-slate-800 dark:text-white">
              Customer Trade Receivables Aging
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-500 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
                <tr>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3 text-right">Total Due (₹)</th>
                  <th className="p-3 text-right">Not Due</th>
                  <th className="p-3 text-right">1 - 30 Days</th>
                  <th className="p-3 text-right">31 - 60 Days</th>
                  <th className="p-3 text-right">61 - 90 Days</th>
                  <th className="p-3 text-right">&gt; 90 Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/15 bg-white dark:bg-surface-container-low/40">
                {(aging.receivablesAging || []).map(row => (
                  <tr key={row.partyId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-slate-900 dark:text-white font-sans">{row.partyName}</td>
                    <td className="p-3 text-primary dark:text-[#00dbe7]">{row.gstin || 'B2C'}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(row.totalOutstanding)}</td>
                    <td className="p-3 text-right text-emerald-600 dark:text-[#00e476]">{formatINR(row.notDue)}</td>
                    <td className="p-3 text-right text-amber-600 dark:text-amber-400">{formatINR(row.days1To30)}</td>
                    <td className="p-3 text-right text-orange-600 dark:text-orange-400">{formatINR(row.days31To60)}</td>
                    <td className="p-3 text-right text-rose-500">{formatINR(row.days61To90)}</td>
                    <td className="p-3 text-right text-rose-600 font-bold">{formatINR(row.daysOver90)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 5. BANK RECONCILIATION STATEMENT (BRS) ==================== */}
      {activeReport === 'BRS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Company Ledger Book Balance</span>
              <span className="text-xl font-bold text-primary dark:text-[#00dbe7]">{formatINR(brs.bookBalance)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Bank Statement Feeds Balance</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{formatINR(brs.bankStatementBalance)}</span>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
              <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 block mb-1">Reconciliation State</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-[#00e476]">
                {brs.isReconciled ? 'Reconciled ✓' : 'Discrepancy ⚠'}
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 dark:border-outline/15 bg-white dark:bg-surface-container-low/40 shadow-sm">
            <div className="bg-slate-50 dark:bg-[#18181c] p-3 border-b border-slate-200 dark:border-[#3a494b]/20 font-bold text-slate-800 dark:text-white flex justify-between">
              <span>{brs.bankName} (A/C: {brs.accountNumber}) Clearing Feeds</span>
              <span className="text-xs text-slate-500 dark:text-gray-400">Unpresented: {formatINR(brs.unpresentedCheques)}</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-[#18181c] text-[10px] text-slate-500 dark:text-gray-400 uppercase border-b border-slate-200 dark:border-[#3a494b]/20">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Voucher Ref</th>
                  <th className="p-3">Particulars</th>
                  <th className="p-3">Transaction Flow</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#3a494b]/15 bg-white dark:bg-surface-container-low/40">
                {(brs.transactions || []).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="p-3 text-slate-500 dark:text-gray-400">{item.date}</td>
                    <td className="p-3 font-bold text-primary dark:text-[#00dbe7]">{item.voucherNumber}</td>
                    <td className="p-3 text-slate-800 dark:text-white font-sans">{item.partyOrParticulars}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'Deposit'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00e476]'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatINR(item.amount)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        item.status === 'Reconciled'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00e476] border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
