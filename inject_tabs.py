import re

with open('src/components/AdminConsoleView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to insert the tab rendering logic back in right after the `</>` of the DASHBOARD.
# Let's find the end of the DASHBOARD tab.
# The DASHBOARD tab ends right before the `      {/* System simulation logs drawer */}` line.
# Let's insert the code right before `      {/* System simulation logs drawer */}`.

summary_blocks = '''
      {activeAdminTab === 'APP_STORE' && (
        <div className="glass-panel p-6 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#00e476] opacity-30 mb-4">storefront</span>
          <h3 className="text-xl font-bold text-white mb-2">Public App Store Summary</h3>
          <p className="text-[#b9cacb] text-sm max-w-md text-center">
            The App Store is currently tracking {plugins.length} active public listings. 
            Detailed management and package uploads have been moved to the dedicated <b>Manage Apps</b> section in the sidebar.
          </p>
        </div>
      )}

      {activeAdminTab === 'WORKSPACE_PLUGINS' && (
        <div className="glass-panel p-6 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#00dbe7] opacity-30 mb-4">extension</span>
          <h3 className="text-xl font-bold text-white mb-2">Workspace Plugins Summary</h3>
          <p className="text-[#b9cacb] text-sm max-w-md text-center">
            There are {workspacePlugins.length} internal plugins loaded into the SutharLabs IDE workspace.
            To install new plugins via ZIP archive, use the <b>Manage Plugins</b> section in the sidebar.
          </p>
        </div>
      )}

      {activeAdminTab === 'PORTFOLIOS' && (
        <div className="glass-panel p-6 rounded-xl border border-[#3a494b]/15 bg-[#131315]/40 flex flex-col items-center justify-center min-h-[300px]">
          <span className="material-symbols-outlined text-6xl text-[#ce5dff] opacity-30 mb-4">account_balance_wallet</span>
          <h3 className="text-xl font-bold text-white mb-2">User Portfolios Summary</h3>
          <p className="text-[#b9cacb] text-sm max-w-md text-center">
            The system is actively tracking portfolios for 4 verified trading accounts.
            Detailed portfolio tracking and analytics are available in the <b>Manage Portfolios</b> sidebar menu.
          </p>
        </div>
      )}

'''

content = content.replace('      {/* System simulation logs drawer */}', summary_blocks + '      {/* System simulation logs drawer */}')

with open('src/components/AdminConsoleView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
