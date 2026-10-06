import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Search,
  Star,
  GitFork,
  ShieldCheck,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Share2,
  TrendingUp,
  Sliders,
  Play,
  RotateCcw,
  Plus,
  Lock,
  Globe,
  Tag,
  Clock,
  User,
  Filter,
  X
} from 'lucide-react';
import { IStrategy, StrategyReview, VerifiedBacktestBadge } from '../plugins/StockTracker/strategies/types';

export interface StockStrategyMarketplaceProps {
  strategies: IStrategy[];
  activeStrategyId: string;
  userEmail?: string;
  userName?: string;
  onSelectStrategy: (strategyId: string) => void;
  onForkStrategy: (forked: IStrategy) => void;
  onOpenBuilder: (strategyId?: string) => void;
  onOpenBacktest: (strategyId: string) => void;
  onRefreshStrategies: () => Promise<void>;
  isDark?: boolean;
}

const STOCK_API = '/api/workspace/stock-analyzer';

export default function StockStrategyMarketplace({
  strategies,
  activeStrategyId,
  userEmail = 'trader@sutharlabs.com',
  userName = 'Community Trader',
  onSelectStrategy,
  onForkStrategy,
  onOpenBuilder,
  onOpenBacktest,
  onRefreshStrategies,
  isDark = true
}: StockStrategyMarketplaceProps) {
  // Filter and Search states
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'VERIFIED' | 'PRESETS' | 'COMMUNITY' | 'MY_STRATEGIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'RATING' | 'CAGR' | 'NEWEST'>('POPULAR');

  // Review Modal state
  const [reviewingStrategy, setReviewingStrategy] = useState<IStrategy | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Verification status tracker
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    strategies.forEach(s => {
      if (s.tags) s.tags.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [strategies]);

  // Filtered & Sorted strategies
  const displayedStrategies = useMemo(() => {
    let list = [...strategies];

    // Filter by Tab
    if (activeFilter === 'VERIFIED') {
      list = list.filter(s => s.verifiedBadge != null);
    } else if (activeFilter === 'PRESETS') {
      list = list.filter(s => s.isPreset);
    } else if (activeFilter === 'COMMUNITY') {
      list = list.filter(s => !s.isPreset && s.isPublic);
    } else if (activeFilter === 'MY_STRATEGIES') {
      const cleanUser = userEmail.toLowerCase().trim();
      list = list.filter(s => s.authorEmail && s.authorEmail.toLowerCase().trim() === cleanUser);
    }

    // Filter by Tag
    if (selectedTag) {
      list = list.filter(s => s.tags?.includes(selectedTag));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.authorName?.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'POPULAR') {
        return (b.clonesCount || 0) - (a.clonesCount || 0);
      }
      if (sortBy === 'RATING') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'CAGR') {
        const cagrA = a.verifiedBadge?.annualizedCagr || -999;
        const cagrB = b.verifiedBadge?.annualizedCagr || -999;
        return cagrB - cagrA;
      }
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });

    return list;
  }, [strategies, activeFilter, selectedTag, searchQuery, sortBy, userEmail]);

  // Handle 1-Click Fork
  const handleFork = async (strategy: IStrategy) => {
    try {
      setForkingId(strategy.id);
      const res = await fetch(`${STOCK_API}/strategies/${strategy.id}/fork`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, userName })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fork strategy');
      }
      const forked: IStrategy = await res.json();
      onForkStrategy(forked);
      await onRefreshStrategies();
      showToast(`Successfully forked "${strategy.name}" to your workspace!`);
    } catch (e: any) {
      alert(`Fork error: ${e.message}`);
    } finally {
      setForkingId(null);
    }
  };

  // Handle Server-Side Verified Backtest Badge Generation
  const handleVerifyStrategy = async (strategyId: string) => {
    try {
      setVerifyingId(strategyId);
      const res = await fetch(`${STOCK_API}/strategies/${strategyId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate verified badge');
      }
      await onRefreshStrategies();
      showToast('Verified Institutional Performance Badge generated successfully!');
    } catch (e: any) {
      alert(`Verification error: ${e.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  // Submit Community Review
  const handleSubmitReview = async () => {
    if (!reviewingStrategy) return;
    try {
      setIsSubmittingReview(true);
      const res = await fetch(`${STOCK_API}/strategies/${reviewingStrategy.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: userRating,
          comment: userComment,
          userEmail,
          userName
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit review');
      }
      const { strategy: updatedStrategy } = await res.json();
      setReviewingStrategy(updatedStrategy);
      setUserComment('');
      await onRefreshStrategies();
      showToast('Review and rating published to the community!');
    } catch (e: any) {
      alert(`Review error: ${e.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-on-surface font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-surface-container-high border border-[#00dbe7]/50 text-[#00dbe7] text-xs font-mono font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#00dbe7]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-outline/25 bg-gradient-to-br from-[#00dbe7]/10 via-surface-container-lowest to-[#9d4edd]/10 p-5 sm:p-6 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-[#00dbe7]/20 text-[#00dbe7] border border-[#00dbe7]/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Community Algorithm Marketplace & Ratings
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                Stage 5
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Discover, rate, and clone battle-tested quantitative algorithms authored by global traders. Every published strategy features tamper-proof verified backtests, institutional risk ratios, and community peer reviews.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenBuilder()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00dbe7] to-[#00b4d8] text-[#002022] font-mono text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(0,219,231,0.3)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Strategy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-surface-container-low/80 border border-outline/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Main Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
            {(['ALL', 'VERIFIED', 'PRESETS', 'COMMUNITY', 'MY_STRATEGIES'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === tab
                    ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline/20'
                }`}
              >
                {tab === 'ALL' && 'All Algorithms'}
                {tab === 'VERIFIED' && '🛡️ Verified Proofs'}
                {tab === 'PRESETS' && '⚡ Core Presets'}
                {tab === 'COMMUNITY' && '🌐 Community'}
                {tab === 'MY_STRATEGIES' && '👤 My Custom'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-xs">
            <span className="text-[11px] text-on-surface-variant">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-container-lowest border border-outline/30 text-xs text-on-surface focus:outline-none focus:border-[#00dbe7] cursor-pointer"
            >
              <option value="POPULAR">Most Cloned</option>
              <option value="RATING">Highest Rated (★)</option>
              <option value="CAGR">Top Verified CAGR</option>
              <option value="NEWEST">Recently Created</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Tag Chips */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 pt-1 border-t border-outline/10">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search algorithms by name, author, indicators, or tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline/30 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#00dbe7]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] py-0.5">
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 cursor-pointer"
              >
                <span>Clear Tag</span>
                <X className="w-2.5 h-2.5" />
              </button>
            )}
            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-all whitespace-nowrap cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/50 font-bold'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline/20'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Grid */}
      {displayedStrategies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-outline/20 bg-surface-container-low/50 flex flex-col items-center justify-center gap-3">
          <Layers className="w-10 h-10 text-on-surface-variant/40" />
          <h4 className="font-bold text-sm text-on-surface">No algorithms matched your criteria</h4>
          <p className="text-xs text-on-surface-variant font-mono max-w-md">
            Try adjusting your search terms or resetting filters to browse all community algorithms.
          </p>
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setSearchQuery('');
              setSelectedTag(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 text-xs font-mono font-bold hover:bg-[#00dbe7]/25 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedStrategies.map(strat => {
            const isActive = strat.id === activeStrategyId;
            const isAuthor = strat.authorEmail && strat.authorEmail.toLowerCase().trim() === userEmail.toLowerCase().trim();

            return (
              <div
                key={strat.id}
                className={`group relative rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 bg-surface-container-lowest shadow-md ${
                  isActive
                    ? 'border-[#00dbe7] shadow-[0_0_15px_rgba(0,219,231,0.15)] ring-1 ring-[#00dbe7]/40'
                    : 'border-outline/25 hover:border-[#00dbe7]/50 hover:shadow-lg'
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-on-surface group-hover:text-[#00dbe7] transition-colors truncate">
                          {strat.name}
                        </h3>
                        {strat.isPreset && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30">
                            CORE PRESET
                          </span>
                        )}
                        {strat.forkedFrom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-purple-300 bg-purple-500/15 border border-purple-500/30 flex items-center gap-1">
                            <GitFork className="w-2.5 h-2.5" />
                            <span>Forked</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant flex-wrap">
                        <span>by <strong>{strat.authorName || 'Quant Trader'}</strong></span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-surface-container border border-outline/20">
                          {strat.market}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-surface-container border border-outline/20">
                          {strat.timeframe}
                        </span>
                        <span>•</span>
                        <span className="text-on-surface-variant/80">v{strat.version}</span>
                      </div>
                    </div>

                    {/* Active Indicator Chip */}
                    {isActive && (
                      <span className="px-2.5 py-1 rounded-full bg-[#00dbe7] text-[#002022] font-mono text-[10px] font-bold shadow-sm shrink-0">
                        ACTIVE IN WORKSPACE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {strat.description}
                  </p>

                  {/* Verified Proof-of-Performance Badge */}
                  {strat.verifiedBadge ? (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#00dbe7]/15 via-surface-container-high/60 to-purple-500/10 border border-[#00dbe7]/30 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <div className="flex items-center gap-1 text-[#00dbe7] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified Proof-of-Performance ({strat.verifiedBadge.range.toUpperCase()})</span>
                        </div>
                        <span className="text-on-surface-variant">
                          Bench: <strong className="text-on-surface">{strat.verifiedBadge.symbol}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center font-mono">
                        <div className="bg-surface-container-lowest/80 p-1.5 rounded-lg border border-outline/15">
                          <span className="block text-[8px] text-on-surface-variant uppercase">Net Return</span>
                          <span className={`text-xs font-bold ${strat.verifiedBadge.netReturnPct >= 0 ? 'text-[#00e476]' : 'text-[#ff6b6b]'}`}>
                            {strat.verifiedBadge.netReturnPct >= 0 ? '+' : ''}{strat.verifiedBadge.netReturnPct}%
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest/80 p-1.5 rounded-lg border border-outline/15">
                          <span className="block text-[8px] text-on-surface-variant uppercase">CAGR</span>
                          <span className="text-xs font-bold text-on-surface">
                            {strat.verifiedBadge.annualizedCagr}%
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest/80 p-1.5 rounded-lg border border-outline/15">
                          <span className="block text-[8px] text-on-surface-variant uppercase">Sharpe</span>
                          <span className="text-xs font-bold text-[#00dbe7]">
                            {strat.verifiedBadge.sharpeRatio}
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest/80 p-1.5 rounded-lg border border-outline/15">
                          <span className="block text-[8px] text-on-surface-variant uppercase">Win Rate</span>
                          <span className="text-xs font-bold text-amber-300">
                            {strat.verifiedBadge.winRatePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    isAuthor && (
                      <div className="p-2 rounded-xl bg-surface-container-low border border-dashed border-outline/30 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          No verified benchmark badge generated yet
                        </span>
                        <button
                          onClick={() => handleVerifyStrategy(strat.id)}
                          disabled={verifyingId === strat.id}
                          className="px-2.5 py-1 rounded-lg bg-[#00dbe7]/15 text-[#00dbe7] border border-[#00dbe7]/30 text-[10px] font-mono font-bold hover:bg-[#00dbe7]/25 cursor-pointer disabled:opacity-50"
                        >
                          {verifyingId === strat.id ? 'Verifying...' : 'Run Server Verification'}
                        </button>
                      </div>
                    )
                  )}

                  {/* Tags */}
                  {strat.tags && strat.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {strat.tags.map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-container border border-outline/20 text-on-surface-variant"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Row: Stats & Action Buttons */}
                <div className="pt-3 border-t border-outline/15 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Rating & Clone Counter */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <button
                      onClick={() => setReviewingStrategy(strat)}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="View community reviews & ratings"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold">{strat.rating && strat.rating > 0 ? strat.rating : 'New'}</span>
                      <span className="text-on-surface-variant text-[11px]">
                        ({strat.reviewsCount || 0})
                      </span>
                    </button>

                    <div className="flex items-center gap-1 text-on-surface-variant text-[11px]">
                      <GitFork className="w-3.5 h-3.5" />
                      <span>{strat.clonesCount || 0} forks</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    
                    {/* Backtest Button */}
                    <button
                      onClick={() => onOpenBacktest(strat.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-[#00dbe7]/15 text-on-surface hover:text-[#00dbe7] border border-outline/20 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Open Backtest Engine with this algorithm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Backtest</span>
                    </button>

                    {/* 1-Click Fork Button */}
                    <button
                      onClick={() => handleFork(strat)}
                      disabled={forkingId === strat.id}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Clone this strategy into your private workspace"
                    >
                      <GitFork className="w-3 h-3" />
                      <span>{forkingId === strat.id ? 'Forking...' : 'Fork'}</span>
                    </button>

                    {/* Activate in Workspace */}
                    {!isActive ? (
                      <button
                        onClick={() => {
                          onSelectStrategy(strat.id);
                          showToast(`Activated "${strat.name}" as primary trading strategy`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#00dbe7] text-[#002022] text-xs font-mono font-bold hover:brightness-110 shadow-sm transition-all cursor-pointer"
                      >
                        Activate
                      </button>
                    ) : (
                      isAuthor && (
                        <button
                          onClick={() => onOpenBuilder(strat.id)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline/30 text-xs font-mono font-bold hover:text-[#00dbe7] cursor-pointer"
                        >
                          Edit Rules
                        </button>
                      )
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Community Review & Star Rating Modal */}
      {reviewingStrategy && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-outline/30 bg-surface-container-lowest p-6 shadow-2xl flex flex-col gap-4 font-sans max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline/20">
              <div>
                <h3 className="font-bold text-base text-on-surface">
                  Community Reviews & Ratings
                </h3>
                <p className="text-xs font-mono text-[#00dbe7] mt-0.5">
                  {reviewingStrategy.name}
                </p>
              </div>
              <button
                onClick={() => setReviewingStrategy(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Leave a Review Section */}
            <div className="p-4 rounded-xl bg-surface-container-low/70 border border-outline/20 space-y-3">
              <span className="text-xs font-mono font-bold text-on-surface uppercase block">
                Rate this Strategy
              </span>

              {/* Star Rating Selector */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = hoverRating ? star <= hoverRating : star <= userRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setUserRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          filled ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/40'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="text-xs font-mono text-on-surface-variant ml-2 font-bold">
                  {userRating} / 5 Stars
                </span>
              </div>

              {/* Comment Input */}
              <textarea
                value={userComment}
                onChange={e => setUserComment(e.target.value)}
                placeholder="Share your quantitative testing notes, market regime observations, or parameter suggestions..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-outline/30 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-[#00dbe7]"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="px-4 py-2 rounded-xl bg-[#00dbe7] text-[#002022] font-mono text-xs font-bold hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </div>

            {/* Existing Reviews List */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-on-surface-variant uppercase">
                Trader Feedback ({reviewingStrategy.reviews?.length || 0})
              </span>

              {(!reviewingStrategy.reviews || reviewingStrategy.reviews.length === 0) ? (
                <div className="p-6 text-center text-xs font-mono text-on-surface-variant rounded-xl border border-outline/15 bg-surface-container/30">
                  No community reviews submitted yet. Be the first to share your backtesting feedback!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviewingStrategy.reviews.map(rev => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl bg-surface-container-low border border-outline/15 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono">
                          <User className="w-3 h-3 text-[#00dbe7]" />
                          <strong className="text-on-surface">{rev.userName}</strong>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono leading-relaxed">
                        {rev.comment}
                      </p>
                      <span className="text-[10px] text-on-surface-variant/70 font-mono block">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
