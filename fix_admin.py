import re

with open('src/components/AdminConsoleView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_stats = """        <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 flex items-center justify-between">
           <div>
             <div className="text-gray-500 text-xs font-mono">Active Portfolios</div>
             <div className="text-xl font-bold text-[#ce5dff]">{users.length}</div>
           </div>
           <span className="material-symbols-outlined text-[#ce5dff] text-3xl opacity-50">account_balance_wallet</span>
        </div>"""

new_stats = """        <div className="glass-panel p-4 rounded-xl border border-[#3a494b]/15 flex items-center justify-between">
           <div>
             <div className="text-gray-500 text-xs font-mono">Live Projects</div>
             <div className="text-xl font-bold text-[#ce5dff]">4</div>
           </div>
           <span className="material-symbols-outlined text-[#ce5dff] text-3xl opacity-50">web</span>
        </div>"""

old_tab = """      {activeAdminTab === 'PORTFOLIOS' && (
        <div className="glass-panel p-6 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#ce5dff] opacity-30 mb-4">account_balance_wallet</span>
          <h3 className="text-xl font-bold text-white mb-2">User Portfolios Summary</h3>
          <p className="text-[#b9cacb] text-sm max-w-md text-center">
            The system is actively tracking portfolios for 4 verified trading accounts.
            Detailed portfolio tracking and analytics are available in the <b>Manage Portfolios</b> sidebar menu.
          </p>
        </div>
      )}"""

new_tab = """      {activeAdminTab === 'PORTFOLIOS' && (
        <div className="glass-panel p-6 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#ce5dff] opacity-30 mb-4">web</span>
          <h3 className="text-xl font-bold text-white mb-2">Development Portfolio Summary</h3>
          <p className="text-[#b9cacb] text-sm max-w-md text-center">
            The SutharLabs development portfolio currently tracks 4 core service credibility projects.
            Detailed project metrics and live links are available in the <b>Manage Portfolios</b> sidebar menu.
          </p>
        </div>
      )}"""

content = content.replace(old_stats, new_stats)
content = content.replace(old_tab, new_tab)

with open('src/components/AdminConsoleView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
