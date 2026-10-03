import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendUp,
  TrendDown,
  CurrencyInr,
  ShoppingCart,
  Target,
  Funnel,
  FileText,
  Calendar,
  ChartBar,
  ChartLineUp,
  CaretDown,
  CaretRight,
  CheckCircle,
  ArrowUpRight
} from '@phosphor-icons/react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface MonthlySalesDataPoint {
  month: string;
  shortMonth: string;
  target: number;
  achieved: number;
  dispatched: number;
  ordersCount: number;
  topCategory: string;
  territorySplit: Record<string, number>;
  achievementRate: number;
  aov: number;
  growthRate: number;
}

export const MonthlySalesPerformanceChart: React.FC = () => {
  const { orders, setActiveAdminTab } = useApp();

  const [timeHorizon, setTimeHorizon] = useState<'6m' | '12m'>('6m');
  const [viewMode, setViewMode] = useState<'revenue_target' | 'orders_aov' | 'growth_trend'>('revenue_target');
  const [territoryFilter, setTerritoryFilter] = useState<string>('all');
  const [showLedgerTable, setShowLedgerTable] = useState<boolean>(false);

  // Compute live orders dynamic contribution
  const liveOrdersTotal = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [orders]);

  const liveOrdersCount = orders.length;

  // Comprehensive 12-month baseline data FY 2025-26
  const monthlyData = useMemo(() => {
    const base12Months = [
      {
        month: 'Nov 2025',
        shortMonth: 'Nov',
        target: 320000,
        achieved: 310500,
        dispatched: 298000,
        ordersCount: 16,
        topCategory: 'Cardiology',
        territorySplit: { 'Central & South': 130000, 'East District': 105000, 'North Suburbs': 75500 }
      },
      {
        month: 'Dec 2025',
        shortMonth: 'Dec',
        target: 340000,
        achieved: 352000,
        dispatched: 345000,
        ordersCount: 19,
        topCategory: 'Antibiotics',
        territorySplit: { 'Central & South': 148000, 'East District': 114000, 'North Suburbs': 90000 }
      },
      {
        month: 'Jan 2026',
        shortMonth: 'Jan',
        target: 350000,
        achieved: 338000,
        dispatched: 325000,
        ordersCount: 17,
        topCategory: 'Gastroenterology',
        territorySplit: { 'Central & South': 142000, 'East District': 106000, 'North Suburbs': 90000 }
      },
      {
        month: 'Feb 2026',
        shortMonth: 'Feb',
        target: 360000,
        achieved: 374000,
        dispatched: 368000,
        ordersCount: 20,
        topCategory: 'Cardiology',
        territorySplit: { 'Central & South': 160000, 'East District': 120000, 'North Suburbs': 94000 }
      },
      {
        month: 'Mar 2026',
        shortMonth: 'Mar',
        target: 400000,
        achieved: 428000,
        dispatched: 420000,
        ordersCount: 24,
        topCategory: 'Diabetology',
        territorySplit: { 'Central & South': 185000, 'East District': 138000, 'North Suburbs': 105000 }
      },
      {
        month: 'Apr 2026',
        shortMonth: 'Apr',
        target: 400000,
        achieved: 395000,
        dispatched: 382000,
        ordersCount: 21,
        topCategory: 'Respiratory',
        territorySplit: { 'Central & South': 170000, 'East District': 125000, 'North Suburbs': 100000 }
      },
      {
        month: 'May 2026',
        shortMonth: 'May',
        target: 420000,
        achieved: 412000,
        dispatched: 401000,
        ordersCount: 23,
        topCategory: 'Antibiotics',
        territorySplit: { 'Central & South': 178000, 'East District': 132000, 'North Suburbs': 102000 }
      },
      {
        month: 'Jun 2026',
        shortMonth: 'Jun',
        target: 440000,
        achieved: 456000,
        dispatched: 448000,
        ordersCount: 25,
        topCategory: 'Cardiology',
        territorySplit: { 'Central & South': 195000, 'East District': 146000, 'North Suburbs': 115000 }
      },
      {
        month: 'Jul 2026',
        shortMonth: 'Jul',
        target: 450000,
        achieved: 435000,
        dispatched: 422000,
        ordersCount: 24,
        topCategory: 'Gastroenterology',
        territorySplit: { 'Central & South': 185000, 'East District': 140000, 'North Suburbs': 110000 }
      },
      {
        month: 'Aug 2026',
        shortMonth: 'Aug',
        target: 460000,
        achieved: 478000,
        dispatched: 465000,
        ordersCount: 28,
        topCategory: 'Diabetology',
        territorySplit: { 'Central & South': 205000, 'East District': 155000, 'North Suburbs': 118000 }
      },
      {
        month: 'Sep 2026',
        shortMonth: 'Sep',
        target: 480000,
        achieved: 498000,
        dispatched: 485000,
        ordersCount: 30,
        topCategory: 'Cardiology',
        territorySplit: { 'Central & South': 215000, 'East District': 162000, 'North Suburbs': 121000 }
      },
      {
        month: 'Oct 2026 (MTD)',
        shortMonth: 'Oct (MTD)',
        target: 500000,
        achieved: 240000 + liveOrdersTotal,
        dispatched: 220000 + Math.round(liveOrdersTotal * 0.88),
        ordersCount: 14 + liveOrdersCount,
        topCategory: 'Cardiology',
        territorySplit: {
          'Central & South': 110000 + Math.round(liveOrdersTotal * 0.46),
          'East District': 80000 + Math.round(liveOrdersTotal * 0.32),
          'North Suburbs': 50000 + Math.round(liveOrdersTotal * 0.22)
        }
      }
    ];

    let prevAchieved = 300000;
    const enriched: MonthlySalesDataPoint[] = base12Months.map((item) => {
      let activeAchieved = item.achieved;
      let activeTarget = item.target;
      let activeDispatched = item.dispatched;

      if (territoryFilter !== 'all') {
        const val = item.territorySplit[territoryFilter as keyof typeof item.territorySplit] || 0;
        const ratio = val / (item.achieved || 1);
        activeAchieved = val;
        activeTarget = Math.round(item.target * ratio);
        activeDispatched = Math.round(item.dispatched * ratio);
      }

      const achievementRate = Math.round((activeAchieved / (activeTarget || 1)) * 100);
      const aov = Math.round(activeAchieved / (item.ordersCount || 1));
      const growthRate = Math.round(((activeAchieved - prevAchieved) / (prevAchieved || 1)) * 100);
      prevAchieved = activeAchieved;

      return {
        ...item,
        achieved: activeAchieved,
        target: activeTarget,
        dispatched: activeDispatched,
        achievementRate,
        aov,
        growthRate
      };
    });

    return timeHorizon === '6m' ? enriched.slice(-6) : enriched;
  }, [timeHorizon, territoryFilter, liveOrdersTotal, liveOrdersCount]);

  // Aggregate KPI summary
  const kpis = useMemo(() => {
    const totalAchieved = monthlyData.reduce((sum, d) => sum + d.achieved, 0);
    const totalTarget = monthlyData.reduce((sum, d) => sum + d.target, 0);
    const totalDispatched = monthlyData.reduce((sum, d) => sum + d.dispatched, 0);
    const totalOrders = monthlyData.reduce((sum, d) => sum + d.ordersCount, 0);
    const overallAchievement = Math.round((totalAchieved / (totalTarget || 1)) * 100);
    const monthlyAverage = Math.round(totalAchieved / (monthlyData.length || 1));
    const averageAov = Math.round(totalAchieved / (totalOrders || 1));

    const bestMonth = [...monthlyData].sort((a, b) => b.achieved - a.achieved)[0];
    const latestMonth = monthlyData[monthlyData.length - 1];

    return {
      totalAchieved,
      totalTarget,
      totalDispatched,
      totalOrders,
      overallAchievement,
      monthlyAverage,
      averageAov,
      bestMonth,
      latestMonth
    };
  }, [monthlyData]);

  // Custom Recharts Tooltip
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlySalesDataPoint = payload[0].payload;
      const isTargetMet = data.achieved >= data.target;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2.5 min-w-[240px] pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white text-sm block">{data.month}</span>
              <span className="text-[11px] text-slate-400">Driver: {data.topCategory}</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isTargetMet ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/25 text-amber-300 border border-amber-500/30'
              }`}
            >
              {data.achievementRate}% Quota
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                Achieved Sales:
              </span>
              <span className="font-bold text-white font-mono">₹{data.achieved.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                Target Quota:
              </span>
              <span className="font-bold text-amber-300 font-mono">₹{data.target.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Dispatched / Billed:
              </span>
              <span className="font-bold text-emerald-400 font-mono">₹{data.dispatched.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <ShoppingCart size={13} className="text-purple-400" />
                Orders Booked:
              </span>
              <span className="font-bold text-purple-300 font-mono">{data.ordersCount} orders</span>
            </div>

            <div className="flex justify-between items-center text-slate-300 pt-1.5 border-t border-slate-800">
              <span className="text-slate-400">Avg Ticket Size (AOV):</span>
              <span className="font-bold text-slate-200 font-mono">₹{data.aov.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">MoM Growth:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  data.growthRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {data.growthRate >= 0 ? (
                  <>
                    <TrendUp size={13} weight="bold" />
                    +{data.growthRate}%
                  </>
                ) : (
                  <>
                    <TrendDown size={13} weight="bold" />
                    {data.growthRate}%
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="monthly-sales-performance-trends"
      data-testid="monthly-sales-performance-trends"
      className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6"
    >
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ChartLineUp size={20} weight="bold" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading">
              Monthly Sales Performance Trends
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Recharts Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical sales trajectory, quota fulfillment, and order booking velocity across medical territories
          </p>
        </div>

        {/* CONTROLS: Horizon, Territory Filter & View Mode */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Territory Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Funnel size={14} className="text-slate-500" />
            <select
              aria-label="Filter territory"
              value={territoryFilter}
              onChange={(e) => setTerritoryFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Territories</option>
              <option value="Central & South">Central & South Medical</option>
              <option value="East District">East District Belt</option>
              <option value="North Suburbs">North Suburbs / Hospitals</option>
            </select>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              id="btn-horizon-6m"
              data-testid="btn-horizon-6m"
              onClick={() => setTimeHorizon('6m')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeHorizon === '6m'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              id="btn-horizon-12m"
              data-testid="btn-horizon-12m"
              onClick={() => setTimeHorizon('12m')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                timeHorizon === '12m'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full FY 25-26
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              id="btn-view-revenue"
              data-testid="btn-view-revenue"
              onClick={() => setViewMode('revenue_target')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'revenue_target'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue vs Quota
            </button>
            <button
              type="button"
              id="btn-view-orders"
              data-testid="btn-view-orders"
              onClick={() => setViewMode('orders_aov')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'orders_aov'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orders & AOV
            </button>
            <button
              type="button"
              id="btn-view-growth"
              data-testid="btn-view-growth"
              onClick={() => setViewMode('growth_trend')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                viewMode === 'growth_trend'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MoM Growth %
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI METRIC CARDS (5 METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Period Sales */}
        <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            {timeHorizon === '6m' ? '6-Month Turnover' : 'FY25-26 Turnover'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-2xl font-bold text-slate-900 font-heading tabular-nums">
              ₹{(kpis.totalAchieved / 100000).toFixed(2)}L
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <TrendUp size={12} weight="bold" />
              +19.2%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            ₹{kpis.totalAchieved.toLocaleString('en-IN')} total booked
          </span>
        </div>

        {/* KPI 2: Target Quota Fulfillment */}
        <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Target Quota Fulfillment
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-2xl font-bold text-slate-900 font-heading tabular-nums">
              {kpis.overallAchievement}%
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              of ₹{(kpis.totalTarget / 100000).toFixed(2)}L
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                kpis.overallAchievement >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(kpis.overallAchievement, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Monthly Run Rate */}
        <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Monthly Run Rate (MRR)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-2xl font-bold text-slate-900 font-heading tabular-nums">
              ₹{(kpis.monthlyAverage / 1000).toFixed(0)}k
            </span>
            <span className="text-[11px] text-slate-500">/ month avg</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Dispatched: ₹{(kpis.totalDispatched / 100000).toFixed(2)}L
          </span>
        </div>

        {/* KPI 4: Peak Performing Month */}
        <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Peak Sales Record
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-2xl font-bold text-blue-700 font-heading tabular-nums">
              {kpis.bestMonth.shortMonth}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              ₹{(kpis.bestMonth.achieved / 1000).toFixed(0)}k
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {kpis.bestMonth.achievementRate}% quota &bull; {kpis.bestMonth.ordersCount} orders
          </span>
        </div>

        {/* KPI 5: Order Volume & AOV */}
        <div className="bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Orders Volume & AOV
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg sm:text-2xl font-bold text-slate-900 font-heading tabular-nums">
              {kpis.totalOrders}
            </span>
            <span className="text-xs text-slate-500">orders booked</span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
            AOV: <strong className="text-slate-900">₹{kpis.averageAov.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION CANVAS */}
      <div className="pt-2">
        <div className="h-[320px] sm:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'revenue_target' ? (
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="chartColorAchieved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="chartColorDispatched" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.65} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomMonthlyTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />
                <Bar
                  dataKey="achieved"
                  name="Achieved Sales (₹)"
                  fill="url(#chartColorAchieved)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="dispatched"
                  name="Dispatched / Billed (₹)"
                  fill="url(#chartColorDispatched)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Monthly Quota Target (₹)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ fill: '#f59e0b', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#d97706' }}
                />
              </ComposedChart>
            ) : viewMode === 'orders_aov' ? (
              <ComposedChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val} ord`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomMonthlyTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="ordersCount"
                  name="Orders Volume"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={42}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="aov"
                  name="Avg Order Value (AOV)"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            ) : (
              <AreaChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="chartColorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomMonthlyTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="growthRate"
                  name="Month-over-Month Growth Rate (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#chartColorGrowth)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* FOOTER CONTROLS & EXPANDABLE MONTHLY LEDGER */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Current active cycle: <strong className="text-slate-900">FY 2025-2026</strong></span>
          <span>&bull;</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle size={14} weight="fill" />
            Live sync with field orders
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-toggle-monthly-ledger"
            data-testid="btn-toggle-monthly-ledger"
            onClick={() => setShowLedgerTable(!showLedgerTable)}
            className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>{showLedgerTable ? 'Hide Breakdown Table' : 'Show Detailed Monthly Ledger'}</span>
            <CaretDown
              size={12}
              weight="bold"
              className={`transform transition-transform ${showLedgerTable ? 'rotate-180' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('reports')}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText size={14} weight="bold" />
            <span>Full Audit Ledger</span>
            <ArrowUpRight size={12} weight="bold" />
          </button>
        </div>
      </div>

      {/* EXPANDABLE MONTHLY SALES LEDGER BREAKDOWN TABLE */}
      {showLedgerTable && (
        <div
          id="monthly-sales-ledger-table-container"
          data-testid="monthly-sales-ledger-table-container"
          className="pt-2 overflow-x-auto border-t border-slate-200 animate-in fade-in duration-200"
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Primary Category Driver</th>
                <th className="py-2.5 px-3 text-right">Target Quota</th>
                <th className="py-2.5 px-3 text-right">Achieved Sales</th>
                <th className="py-2.5 px-3 text-right">Dispatched</th>
                <th className="py-2.5 px-3 text-center">Fulfillment</th>
                <th className="py-2.5 px-3 text-center">MoM Growth</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">AOV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyData.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.month}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px]">
                      {row.topCategory}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 font-mono">
                    ₹{row.target.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 font-mono">
                    ₹{row.achieved.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700 font-medium font-mono">
                    ₹{row.dispatched.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        row.achievementRate >= 100
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {row.achievementRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-semibold text-[11px] inline-flex items-center gap-0.5 ${
                        row.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {row.growthRate >= 0 ? `+${row.growthRate}%` : `${row.growthRate}%`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 font-medium">
                    {row.ordersCount}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 font-mono">
                    ₹{row.aov.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
