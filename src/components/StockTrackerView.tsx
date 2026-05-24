import React, { useState, useEffect, useRef } from 'react';
import { TerminalLog, UserPortfolio } from '../types';

interface StockTrackerViewProps {
  logs: TerminalLog[];
  onAddLog: (log: TerminalLog) => void;
  userEmail: string;
  userToken: string;
}

// Initial 1W prices for drawing
const initialPrices = [858.20, 869.50, 862.10, 873.40, 868.90, 875.28];

export default function StockTrackerView({ logs, onAddLog, userEmail, userToken }: StockTrackerViewProps) {
  const [currentPrice, setCurrentPrice] = useState(875.28);
  const [priceChange, setPriceChange] = useState(24.50);
  const [pricePercent, setPricePercent] = useState(2.88);
  const [prices, setPrices] = useState<number[]>(initialPrices);
  const [activeTab, setActiveTab] = useState<'AGENT_LOGS' | 'OUTPUT' | 'DEBUG_CONSOLE'>('AGENT_LOGS');
  const [activePeriod, setActivePeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  
  // Simulated portfolio state
  const [portfolio, setPortfolio] = useState<UserPortfolio>({
    cash: 10000,
    shares: 0,
    buyPrice: 0
  });

  // Load portfolio state from database on mount or when user changes
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/portfolio?email=${encodeURIComponent(userEmail)}`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPortfolio(data);
        }
      } catch (err) {
        console.error('Failed to load portfolio state:', err);
      }
    };
    fetchPortfolio();
  }, [userEmail, userToken]);

  const [notification, setNotification] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<'BUY' | 'SELL' | null>(null);
  const [actionQuantity, setActionQuantity] = useState<number>(1);

  // Reference for scrolling terminal
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Trigger price ticking
  useEffect(() => {
    const interval = setInterval(() => {
      // Small simulated tick fluctuation
      const change = (Math.random() - 0.45) * 2.45; // slight positive drift
      setCurrentPrice((prev) => {
        const next = parseFloat((prev + change).toFixed(2));
        
        // Append price to series
        setPrices((prevSeries) => {
          const updated = [...prevSeries.slice(1), next];
          return updated;
        });
 
        // Trigger log
        onAddLog({
          timestamp: new Date().toLocaleTimeString(),
          type: 'DATA',
          message: `Received tick -> NVDA: $${next}`
        });

        // Random Agent triggers
        const triggerRand = Math.random();
        if (triggerRand > 0.8) {
          onAddLog({
            timestamp: new Date().toLocaleTimeString(),
            type: 'AGENT',
            message: `AGENT: Computing Bollinger Bands. Price relative to Upper Channel: ${(0.4 + Math.random() * 0.4).toFixed(2)}`
          });
        } else if (triggerRand > 0.6) {
          onAddLog({
            timestamp: new Date().toLocaleTimeString(),
            type: 'ALERT',
            message: `ALERT: Active volume uptick detected. Delta: +${change.toFixed(2)}`
          });
        }

        return next;
      });

      // Update change calculations since initial mockup values
      setPriceChange((prev) => parseFloat((prev + change).toFixed(2)));
    }, 5000);

    return () => clearInterval(interval);
  }, [onAddLog]);

  // Handle buy/sell execution
  const executeBuy = async () => {
    if (actionQuantity <= 0) return;
    try {
      const response = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          email: userEmail,
          action: 'BUY',
          quantity: actionQuantity,
          price: currentPrice
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setNotification(data.error || 'INSUFFICIENT CAPITAL: Order rejected.');
        return;
      }

      setPortfolio(data);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `SUCCESS: Bought ${actionQuantity} NVDA at $${currentPrice}. Total cost: $${(currentPrice * actionQuantity).toFixed(2)}`
      });

      setNotification(`Successfully purchased ${actionQuantity} shares of NVDA!`);
      setSelectedAction(null);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      setNotification('Failed to execute order due to server error.');
    }
  };

  const executeSell = async () => {
    if (actionQuantity <= 0) return;
    try {
      const response = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          email: userEmail,
          action: 'SELL',
          quantity: actionQuantity,
          price: currentPrice
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setNotification(data.error || 'INSUFFICIENT POSITION: Limit exceeded.');
        return;
      }

      setPortfolio(data);
      onAddLog({
        timestamp: new Date().toLocaleTimeString(),
        type: 'SUCCESS',
        message: `SUCCESS: Sold ${actionQuantity} NVDA at $${currentPrice}. Realized value: $${(currentPrice * actionQuantity).toFixed(2)}`
      });

      setNotification(`Successfully liquidated ${actionQuantity} shares of NVDA!`);
      setSelectedAction(null);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      setNotification('Failed to execute order due to server error.');
    }
  };

  // Keep terminal scrolled
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeTab]);

  // Recalculate percent change from baseline
  const baseline = 850.78;
  const computedPercent = parseFloat((((currentPrice - baseline) / baseline) * 100).toFixed(2));

  // Math helper for rendering custom responsiveness SVG
  const minPrice = 845;
  const maxPrice = 885;
  const pRange = maxPrice - minPrice;

  // Render SVG coordinate paths
  const svgWidth = 600;
  const svgHeight = 220;
  
  const getCoordinates = () => {
    return prices.map((price, idx) => {
      const x = (idx / (prices.length - 1)) * (svgWidth - 40) + 10;
      const y = svgHeight - ((price - minPrice) / pRange) * (svgHeight - 40) - 20;
      return { x, y };
    });
  };

  const coordinates = getCoordinates();
  const polylineStr = coordinates.map(p => `${p.x},${p.y}`).join(' ');
  const polygonStr = `${coordinates[0]?.x || 0},${svgHeight} ` + 
                     polylineStr + ` ` + 
                     `${coordinates[coordinates.length - 1]?.x || svgWidth},${svgHeight}`;

  return (
    <div className="flex-grow flex flex-col gap-4">
      {/* Simulation notifications */}
      {notification && (
        <div className="bg-[#00e476]/10 border border-[#00fb83]/30 text-[#00e476] p-3 rounded text-xs font-mono flex items-center gap-2 animate-fade-in z-50">
          <span className="material-symbols-outlined text-sm select-none">check_circle</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Ticker Information Panel (Bento row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Main NVDA Core display */}
        <div className="lg:col-span-8 glass-panel rounded-lg p-6 flex flex-col justify-between neon-border-active relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00dbe7]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-sans font-bold tracking-tight text-[#e5e1e4]">NVDA</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/40 leading-none">NASDAQ</span>
              </div>
              <p className="text-xs text-[#b9cacb] mt-1.5 font-light">NVIDIA Corporation</p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-sans font-bold text-[#00e476]">${currentPrice.toFixed(2)}</div>
              <div className="flex items-center justify-end gap-1 text-[#00e476] font-mono text-xs mt-1">
                <span className="material-symbols-outlined text-sm select-none">arrow_upward</span>
                <span>+{priceChange > 0 ? priceChange : '24.50'} ({computedPercent > 0 ? computedPercent : pricePercent}%)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8 z-10">
            <button 
              onClick={() => setSelectedAction('BUY')}
              className="flex-1 bg-[#00dbe7] text-[#002022] font-mono text-xs py-3 rounded font-bold uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_12px_rgba(0,219,231,0.5)] transition-all cursor-pointer"
            >
              BUY NVDA
            </button>
            <button 
              onClick={() => setSelectedAction('SELL')}
              className="flex-1 border border-[#3a494b] text-[#e5e1e4] font-mono text-xs py-3 rounded uppercase tracking-wider hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              SELL NVDA
            </button>
          </div>
        </div>

        {/* Info Grid summary modules */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">Vol (24h)</span>
            <span className="font-mono text-sm text-[#e5e1e4] font-semibold">42.8M</span>
          </div>
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">Market Cap</span>
            <span className="font-mono text-sm text-[#e5e1e4] font-semibold">2.15T</span>
          </div>
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">P/E Ratio</span>
            <span className="font-mono text-sm text-[#e5e1e4] font-semibold">72.4</span>
          </div>
          <div className="glass-panel rounded-lg p-4 flex flex-col justify-center border-b-2 border-[#00e476]">
            <span className="font-mono text-[10px] uppercase text-[#849495] tracking-widest mb-1.5">Market Flow</span>
            <span className="font-mono text-xs text-[#00e476] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00fb83] animate-pulse"></span>
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Buy/Sell Form Drawer inside View */}
      {selectedAction && (
        <div className="glass-panel rounded-lg p-5 border border-[#00dbe7]/40 bg-[#131315] animate-fade-in">
          <div className="flex justify-between items-center border-b border-[#3a494b]/20 pb-3 mb-4">
            <h4 className="font-sans font-bold text-sm text-[#74f5ff] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00dbe7] text-base select-none">bolt</span>
              Order Execution Terminal - {selectedAction} NVDA
            </h4>
            <button 
              onClick={() => setSelectedAction(null)}
              className="text-[#b9cacb] hover:text-white hover:bg-white/10 rounded-full p-0.5 cursor-pointer flex"
            >
              <span className="material-symbols-outlined text-sm select-none">close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30">
              <span className="block font-mono text-[10px] text-[#849495] uppercase">Share Price</span>
              <span className="font-mono text-sm text-[#e5e1e4] font-bold block mt-1">${currentPrice.toFixed(2)}</span>
            </div>
            
            <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30">
              <span className="block font-mono text-[10px] text-[#849495] uppercase">Available Cash</span>
              <span className="font-mono text-sm text-[#ebb2ff] font-bold block mt-1">${portfolio.cash}</span>
            </div>

            <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30">
              <span className="block font-mono text-[10px] text-[#849495] uppercase">Positions owned</span>
              <span className="font-mono text-sm text-[#e2ffe3] font-bold block mt-1">{portfolio.shares} Shares (avg: ${portfolio.buyPrice})</span>
            </div>

            <div className="flex gap-2">
              <div className="bg-[#0e0e10]/80 p-3 rounded border border-[#3a494b]/30 flex-grow relative flex flex-col justify-center">
                <span className="block font-mono text-[9px] text-[#849495] uppercase leading-none">QTY</span>
                <input 
                  type="number" 
                  min="1" 
                  max="1000"
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(Math.max(1, parseInt(e.target.value) || 0))} 
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-mono text-white p-0 mt-1 block"
                />
              </div>
              <button 
                onClick={selectedAction === 'BUY' ? executeBuy : executeSell}
                className={`px-6 rounded font-mono text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  selectedAction === 'BUY' 
                    ? 'bg-[#00dbe7] text-[#002022] hover:bg-[#74f5ff]' 
                    : 'bg-[#ce5dff] text-[#480064] hover:bg-[#ebb2ff]'
                }`}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Stock visual Line Chart container */}
      <div className="glass-panel rounded-lg flex-1 min-h-[320px] flex flex-col p-1">
        {/* Chart header toggles */}
        <div className="flex justify-between items-center p-3 border-b border-[#3a494b]/10 bg-[#1c1b1d]/40">
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '1Y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  activePeriod === period
                    ? 'bg-[#00dbe7]/20 text-[#74f5ff] border border-[#00dbe7]/30'
                    : 'bg-[#201f21] text-[#b9cacb] hover:text-[#e5e1e4]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="p-1 rounded text-[#b9cacb] hover:bg-white/10 transition-colors cursor-pointer flex">
              <span className="material-symbols-outlined text-base select-none">add_chart</span>
            </button>
            <button className="p-1 rounded text-[#b9cacb] hover:bg-white/10 transition-colors cursor-pointer flex">
              <span className="material-symbols-outlined text-base select-none">settings</span>
            </button>
          </div>
        </div>

        {/* Real-time Responsive SVG Line graph with grid alignment */}
        <div className="flex-grow relative chart-grid m-2 rounded overflow-hidden bg-[#131315]/40 flex min-h-[200px]">
          
          {/* SVG Canvas drawing path */}
          <div className="flex-grow h-full relative z-0 pr-12 pb-6">
            <svg 
              className="absolute inset-0 w-full h-full" 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gradient shader core */}
                <linearGradient id="neonGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00dbe7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Render glowing areas under nodes */}
              <polygon fill="url(#neonGradient)" points={polygonStr}></polygon>
              
              {/* Neon illuminated vector stroke */}
              <polyline 
                fill="none" 
                points={polylineStr} 
                stroke="#00dbe7" 
                strokeWidth="2" 
                className="drop-shadow-[0_0_6px_rgba(0,219,231,0.8)]"
              />
              
              {/* Highlight dynamic active dot marker */}
              {coordinates.length > 0 && (
                <circle 
                  cx={coordinates[coordinates.length - 1].x} 
                  cy={coordinates[coordinates.length - 1].y} 
                  r="4" 
                  fill="#ffffff" 
                  stroke="#00dbe7"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_8px_rgba(0,219,231,1)]"
                />
              )}
              
              {/* Dashed baseline identifier */}
              {coordinates.length > 0 && (
                <line 
                  opacity="0.25" 
                  stroke="#00dbe7" 
                  strokeDasharray="4 4" 
                  strokeWidth="1" 
                  x1="0" 
                  x2={svgWidth} 
                  y1={coordinates[coordinates.length - 1].y} 
                  y2={coordinates[coordinates.length - 1].y}
                />
              )}
            </svg>
          </div>

          {/* Y Axis Prices Labels layout on Right */}
          <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col justify-between py-4 text-[9px] font-mono text-[#849495] bg-[#131315]/90 backdrop-blur pl-2 border-l border-[#3a494b]/20 z-10 select-none">
            <span>880.00</span>
            <span>870.00</span>
            <span>860.00</span>
            <span>850.00</span>
          </div>

          {/* X Axis Time Labels layout at bottom */}
          <div className="absolute bottom-0 left-0 right-12 h-6 flex justify-between px-6 text-[9px] font-mono text-[#849495] bg-[#131315]/90 backdrop-blur items-center border-t border-[#3a494b]/20 z-10 select-none">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
          </div>

        </div>
      </div>

      {/* Embedded Terminal panel inside stock dashboard */}
      <div className="h-44 border border-[#3a494b]/20 bg-[#0e0e10]/90 rounded-lg flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-1.5 border-b border-[#3a494b]/10 bg-[#201f21]/80 select-none">
          <span className="font-mono text-[9px] font-bold text-[#b9cacb] uppercase tracking-widest leading-none">TERMINAL</span>
          <div className="flex gap-4 ml-6 font-mono text-[10px]">
            <button 
              onClick={() => setActiveTab('AGENT_LOGS')}
              className={`pb-0.5 cursor-pointer transition-all ${
                activeTab === 'AGENT_LOGS' ? 'text-[#74f5ff] border-b border-[#00dbe7]' : 'text-[#849495] hover:text-[#e5e1e4]'
              }`}
            >
              AGENT_LOGS
            </button>
            <button 
              onClick={() => setActiveTab('OUTPUT')}
              className={`pb-0.5 cursor-pointer transition-all ${
                activeTab === 'OUTPUT' ? 'text-[#74f5ff] border-b border-[#00dbe7]' : 'text-[#849495] hover:text-[#e5e1e4]'
              }`}
            >
              OUTPUT
            </button>
            <button 
              onClick={() => setActiveTab('DEBUG_CONSOLE')}
              className={`pb-0.5 cursor-pointer transition-all ${
                activeTab === 'DEBUG_CONSOLE' ? 'text-[#74f5ff] border-b border-[#00dbe7]' : 'text-[#849495] hover:text-[#e5e1e4]'
              }`}
            >
              DEBUG_CONSOLE
            </button>
          </div>
        </div>
        
        {/* Active terminal elements scroll log output */}
        <div className="flex-1 p-3 font-mono text-xs overflow-y-auto custom-scrollbar bg-[#050505]">
          {activeTab === 'AGENT_LOGS' && (
            <div className="space-y-1">
              {logs.map((log, index) => {
                let colorClass = 'text-[#b9cacb]/80';
                if (log.type === 'SUCCESS') colorClass = 'text-[#00e476]';
                else if (log.type === 'ALERT') colorClass = 'text-[#ce5dff]';
                else if (log.type === 'AGENT') colorClass = 'text-[#00dbe7]';
                else if (log.type === 'ERROR') colorClass = 'text-[#ffb4ab]';
                
                return (
                  <div key={index} className={`flex gap-2 ${colorClass}`}>
                    <span className="text-[#849495]">[{log.timestamp}]</span>
                    <span>{log.message}</span>
                  </div>
                );
              })}
              <div className="text-[#b9cacb]/80 flex gap-2">
                <span className="text-[#849495]">[{new Date().toLocaleTimeString()}]</span>
                <span className="animate-pulse">_</span>
              </div>
              <div ref={terminalEndRef} />
            </div>
          )}

          {activeTab === 'OUTPUT' && (
            <div className="text-[#849495]">
              <div>&gt; Loading Webpack Bundle... COMPLETED</div>
              <div>&gt; Spawning Stock Tracker microservices... COMPLETED</div>
              <div>&gt; Listening to wss://data.sutharlabs.io/market active threads</div>
              <div className="text-[#00e476]">Status: System health stable. Core VM telemetry active.</div>
              <div ref={terminalEndRef} />
            </div>
          )}

          {activeTab === 'DEBUG_CONSOLE' && (
            <div className="text-[#ebb2ff] space-y-1">
              <div>[DEBUG] Memory Allocation: Custom_Flow.flow active heap 124MB / limits 2048M</div>
              <div>[DEBUG] Socket latency optimal: Average 18ms routing.</div>
              <div>[DEBUG] Process ID mapped: Cloud Run thread-20412.</div>
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
