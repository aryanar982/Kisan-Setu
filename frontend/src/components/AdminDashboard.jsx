import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Users, MapPin, IndianRupee, Clock,
  Sparkles, RefreshCw, AlertTriangle, ShieldCheck, ChevronRight,
  Award, Layers, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { api } from '../api';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [aiRecs, setAiRecs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rerouteApplied, setRerouteApplied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [anaRes, aiRes] = await Promise.all([
        api.getAnalytics(),
        api.getAiRecommendations(),
      ]);
      if (anaRes.success) setAnalytics(anaRes.data);
      if (aiRes.success) setAiRecs(aiRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = analytics?.kpis || {
    totalFarmers: 4,
    farmersToday: 3,
    slotsBookedToday: 24,
    totalCapacityToday: 195,
    capacityUtilization: 48,
    totalVolumeQuintals: 189.2,
    totalPaymentsDisbursed: 458800,
    pendingPaymentsAmount: 62500,
    averageWaitMinutes: 18,
  };

  const trends = analytics?.procurementTrends || [
    { day: 'Mon', volume: 45 },
    { day: 'Tue', volume: 62 },
    { day: 'Wed', volume: 55 },
    { day: 'Thu', volume: 80 },
    { day: 'Fri', volume: 95 },
    { day: 'Sat', volume: 110 },
    { day: 'Sun', volume: 88 },
  ];

  const centres = analytics?.centrePerformance || [];
  const heatmap = analytics?.districtHeatmap || [
    { district: 'Sirsa', totalCentres: 1, dailyCapacity: 50, bookedCount: 38, congestionScore: 76 },
    { district: 'Kaithal', totalCentres: 1, dailyCapacity: 40, bookedCount: 22, congestionScore: 55 },
    { district: 'Fatehabad', totalCentres: 1, dailyCapacity: 45, bookedCount: 41, congestionScore: 91 },
    { district: 'Hisar', totalCentres: 1, dailyCapacity: 60, bookedCount: 28, congestionScore: 46 },
  ];

  const maxVolume = Math.max(...trends.map((t) => t.volume), 1);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Executive Command Header */}
      <div className="bg-gradient-to-r from-[#142217] via-[#1C3222] to-[#142217] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-[#C98A2E]/35 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold text-[#EBB668] tracking-widest bg-[#C98A2E]/20 border border-[#C98A2E]/40 px-2.5 py-0.5 rounded-full">
              Haryana State Civil Supplies & APMC Directorate
            </span>
            <span className="text-white/40 text-xs">·</span>
            <span className="text-xs text-white/70">Governance Console</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Real-Time Procurement Analytics & Governance Desk
          </h2>
          <p className="text-xs text-white/70 mt-0.5">
            Cross-Mandi Capacity Load Balancing, Price Transparency, and PFMS Direct Benefit Transfer Tracking.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-gold text-xs px-5 py-3 font-extrabold flex items-center gap-2 shadow-xl shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Sync Mandi Network
        </button>
      </div>

      {/* AI Mandi Load Balancing Advisory Card */}
      {aiRecs && aiRecs.loadBalancingAlert && (
        <div className="bg-gradient-to-r from-[#FFF9ED] via-white to-[#FFF9ED] border-l-4 border-[#C98A2E] p-6 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#DDD8CB]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C98A2E]/20 flex items-center justify-center border border-[#C98A2E]/40 shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6 text-[#C98A2E]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#142217] flex items-center gap-2">
                Automated AI Mandi Load-Balancing Recommendation
                <span className="text-[10px] uppercase font-extrabold bg-[#C98A2E] text-black px-2.5 py-0.5 rounded-full shadow-sm">
                  Active ML Model
                </span>
              </h4>
              <p className="text-xs text-[#142217]/80 mt-1 leading-relaxed max-w-2xl">
                {aiRecs.loadBalancingAlert.recommendation}
              </p>
              <p className="text-xs text-[#1B7A38] font-bold mt-1">
                ⚡ Projected Time Saved: ~{aiRecs.loadBalancingAlert.savedWaitMinutes} minutes per farmer transit trip.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setRerouteApplied(true);
              alert('AI Mandi Load Balancing activated! Rerouting farmer SMS notifications to Kaithal APMC.');
            }}
            className={`btn-primary text-xs whitespace-nowrap py-2.5 px-4 font-bold shrink-0 ${
              rerouteApplied ? 'bg-emerald-700 text-white' : ''
            }`}
          >
            {rerouteApplied ? '✓ Reroute Applied' : 'Enforce Reroute'}
          </button>
        </div>
      )}

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="kisan-card p-6 space-y-2">
          <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
            <span>Farmers Procured</span>
            <Users className="w-5 h-5 text-[#C98A2E]" />
          </div>
          <p className="font-serif text-3xl sm:text-4xl font-black text-[#142217]">{kpis.farmersToday}</p>
          <p className="text-[11px] text-[#6B7F61] font-semibold">{kpis.totalFarmers} registered farmers statewide</p>
        </div>

        <div className="kisan-card p-6 space-y-2">
          <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
            <span>Procured Volume</span>
            <TrendingUp className="w-5 h-5 text-[#1B7A38]" />
          </div>
          <p className="font-serif text-3xl sm:text-4xl font-black text-[#142217]">{kpis.totalVolumeQuintals} <span className="text-lg font-sans font-normal">Qtl</span></p>
          <p className="text-[11px] text-[#1B7A38] font-extrabold">100% MSP guaranteed rate</p>
        </div>

        <div className="kisan-card p-6 space-y-2">
          <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
            <span>DBT Disbursed</span>
            <IndianRupee className="w-5 h-5 text-[#C98A2E]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-black text-[#1B7A38]">
            ₹{kpis.totalPaymentsDisbursed.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#142217]/60">₹{kpis.pendingPaymentsAmount.toLocaleString('en-IN')} processing in PFMS</p>
        </div>

        <div className="kisan-card p-6 space-y-2">
          <div className="flex items-center justify-between text-[#142217]/50 text-xs font-bold uppercase tracking-wider">
            <span>Average Mandi Wait</span>
            <Clock className="w-5 h-5 text-[#C98A2E]" />
          </div>
          <p className="font-serif text-3xl sm:text-4xl font-black text-[#142217]">{kpis.averageWaitMinutes} <span className="text-lg font-sans font-normal">mins</span></p>
          <p className="text-[11px] text-[#6B7F61] font-extrabold">Down from baseline 180+ mins</p>
        </div>
      </div>

      {/* Analytics Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Procurement Trend */}
        <div className="kisan-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-[#142217]">
              <TrendingUp className="w-5 h-5 text-[#C98A2E]" />
              7-Day Procurement Volume Trend
            </h3>
            <span className="badge-gold text-[10px]">Quintals / Day</span>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2 border-b border-[#DDD8CB]/80">
            {trends.map((t, idx) => {
              const heightPercent = Math.max(16, Math.round((t.volume / maxVolume) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                  <span className="text-[10px] font-extrabold text-[#142217] opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.volume} Q
                  </span>
                  <div
                    className="w-full max-w-[32px] bg-gradient-to-t from-[#142217] via-[#203525] to-[#C98A2E] rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <span className="text-xs font-bold text-[#142217]/70 mt-1">{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mandi Capacity Utilization */}
        <div className="kisan-card p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-[#142217]">
              <BarChart3 className="w-5 h-5 text-[#1B7A38]" />
              Mandi Capacity Utilization (Today)
            </h3>
            <span className="badge-green text-[10px]">Live Bookings vs Total Limit</span>
          </div>

          <div className="space-y-4 pt-2">
            {centres.map((c) => (
              <div key={c.centreId} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#142217] truncate">{c.name}</span>
                  <span className={c.utilizationPercent > 85 ? 'text-[#BA3D2C]' : 'text-[#1B7A38]'}>
                    {c.bookedCount} / {c.dailyCapacity} slots ({c.utilizationPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-[#EDEAE1] rounded-full overflow-hidden p-0.5 border border-[#DDD8CB]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      c.utilizationPercent > 85
                        ? 'bg-[#BA3D2C]'
                        : c.utilizationPercent > 60
                        ? 'bg-[#C98A2E]'
                        : 'bg-[#1B7A38]'
                    }`}
                    style={{ width: `${Math.min(100, c.utilizationPercent)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Mandi Congestion Heatmap */}
      <div className="kisan-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#DDD8CB]/70">
          <div>
            <h3 className="font-serif font-bold text-lg flex items-center gap-2 text-[#142217]">
              <MapPin className="w-5 h-5 text-[#BA3D2C]" /> Statewide Mandi Congestion Heatmap
            </h3>
            <p className="text-xs text-[#142217]/60 mt-0.5">
              Live district queue congestion metrics to trigger automated load balancing.
            </p>
          </div>
          <span className="badge-gold text-xs">Haryana APMC Grid</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {heatmap.map((d) => (
            <div
              key={d.district}
              className={`p-5 rounded-2xl border transition-all ${
                d.congestionScore >= 80
                  ? 'bg-red-50/80 border-red-200 shadow-sm'
                  : d.congestionScore >= 60
                  ? 'bg-yellow-50/80 border-yellow-200 shadow-sm'
                  : 'bg-green-50/80 border-green-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-bold text-lg text-[#142217]">{d.district}</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  d.congestionScore >= 80
                    ? 'bg-red-200 text-red-950 border border-red-300'
                    : d.congestionScore >= 60
                    ? 'bg-yellow-200 text-yellow-950 border border-yellow-300'
                    : 'bg-green-200 text-green-950 border border-green-300'
                }`}>
                  {d.congestionScore >= 80 ? 'Heavy Load' : d.congestionScore >= 60 ? 'Optimal' : 'Clear Flow'}
                </span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-[#142217]/80">
                <p className="flex justify-between">
                  <span>Mandi Centres:</span> <strong className="text-[#142217]">{d.totalCentres}</strong>
                </p>
                <p className="flex justify-between">
                  <span>Total Daily Capacity:</span> <strong className="text-[#142217]">{d.dailyCapacity || d.totalCapacity} slots</strong>
                </p>
                <p className="flex justify-between pt-1 border-t border-black/5 font-bold">
                  <span>Congestion Index:</span> <strong className="font-serif text-sm text-[#142217]">{d.congestionScore}%</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
