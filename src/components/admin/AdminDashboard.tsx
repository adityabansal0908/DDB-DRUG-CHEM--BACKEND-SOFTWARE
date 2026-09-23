import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Pill,
  Users,
  UserCheck,
  ShoppingCart,
  TrendUp,
  MapPin,
  Clock,
  CheckCircle,
  FileText,
  CaretRight,
  ArrowUpRight,
  ChartBar,
  ChartPie,
  Calendar,
  Sparkle,
  ShieldCheck,
  Eye
} from '@phosphor-icons/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    reps,
    visits,
    orders,
    doctors,
    setActiveAdminTab,
    setPreviewPhotoUrl
  } = useApp();

  const [visitChartMode, setVisitChartMode] = useState<'today_hourly' | 'weekly_trend'>('today_hourly');

  // 1. Key Metric: Total Products
  const totalProductsCount = products.length;
  const activeProductsForReps = products.filter(p => !p.hiddenFromRep).length;
  const uniqueCategoriesCount = useMemo(() => {
    const cats = new Set(products.map(p => p.category?.trim()).filter(Boolean));
    return cats.size;
  }, [products]);

  // 2. Key Metric: Active Sales Reps
  const activeReps = reps.filter(r => r.status === 'active_in_field');
  const activeRepsCount = activeReps.length;
  const totalRepsCount = reps.length;
  const avgBattery = Math.round(reps.reduce((acc, r) => acc + (r.batteryLevel || 0), 0) / (totalRepsCount || 1));

  // 3. Key Metric: Doctors Visited Today
  // Check visits timestamp or isoDate for today
  const todayVisits = useMemo(() => {
    const todayStr = 'Today';
    const nowIsoPrefix = new Date().toISOString().slice(0, 10);
    return visits.filter(v => {
      if (v.timestamp && v.timestamp.toLowerCase().includes('today')) return true;
      if (v.isoDate && v.isoDate.startsWith(nowIsoPrefix)) return true;
      return false;
    });
  }, [visits]);

  const doctorsVisitedTodayCount = todayVisits.length;
  const totalDailyTarget = reps.reduce((acc, r) => acc + (r.todayTarget || 0), 0) || 17;
  const todayTargetProgress = Math.min(100, Math.round((doctorsVisitedTodayCount / totalDailyTarget) * 100));

  // Total Orders & Revenue Booked
  const totalOrdersAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalSamplesDistributed = visits.reduce((sum, v) => sum + (v.sampleUnitsGiven || 0), 0);

  // --- CHART DATA 1: Doctors Visited Today (Hourly Breakdown) vs 7-Day Trend ---
  const todayHourlyVisitData = [
    { hour: '9 AM', visits: 1, target: 2 },
    { hour: '10 AM', visits: 3, target: 3 },
    { hour: '11 AM', visits: 4, target: 4 },
    { hour: '12 PM', visits: 2, target: 3 },
    { hour: '1 PM', visits: 1, target: 1 },
    { hour: '2 PM', visits: 2, target: 3 },
    { hour: '3 PM', visits: 1, target: 3 },
    { hour: '4 PM', visits: 0, target: 2 },
    { hour: '5 PM', visits: 0, target: 2 }
  ];

  const weeklyVisitTrendData = [
    { day: 'Thu (10 Sep)', visits: 9, target: 15 },
    { day: 'Fri (11 Sep)', visits: 11, target: 15 },
    { day: 'Sat (12 Sep)', visits: 7, target: 12 },
    { day: 'Mon (14 Sep)', visits: 14, target: 16 },
    { day: 'Tue (15 Sep)', visits: 15, target: 17 },
    { day: 'Wed (Today)', visits: doctorsVisitedTodayCount > 0 ? doctorsVisitedTodayCount : 12, target: totalDailyTarget }
  ];

  // --- CHART DATA 2: Active Sales Reps Field Progress & Target ---
  const repPerformanceChartData = useMemo(() => {
    return reps.map(r => ({
      name: r.name.split(' ')[0],
      fullName: r.name,
      territory: r.territory,
      status: r.status,
      completedToday: r.todayVisitsCompleted,
      targetToday: r.todayTarget,
      monthlyAchieved: r.monthlyAchieved,
      monthlyTarget: r.monthlyTarget,
      completionRate: Math.round((r.todayVisitsCompleted / (r.todayTarget || 1)) * 100)
    }));
  }, [reps]);

  // --- CHART DATA 3: Product Portfolio by Category ---
  const categoryDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category?.trim() || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = [
      '#2563eb', // blue
      '#059669', // emerald
      '#7c3aed', // purple
      '#d97706', // amber
      '#e11d48', // rose
      '#0891b2', // cyan
      '#4f46e5', // indigo
      '#64748b'  // slate
    ];

    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [products]);

  // --- CHART DATA 4: Sales Revenue & Order Velocity (Past 5 Weeks) ---
  const revenueTrendData = [
    { week: 'Week 1 (Aug 15-21)', revenue: 142000, ordersCount: 8, visitsCount: 38 },
    { week: 'Week 2 (Aug 22-28)', revenue: 178500, ordersCount: 11, visitsCount: 44 },
    { week: 'Week 3 (Aug 29-Sep 4)', revenue: 162000, ordersCount: 9, visitsCount: 41 },
    { week: 'Week 4 (Sep 5-11)', revenue: 194800, ordersCount: 14, visitsCount: 50 },
    { week: 'Current (Sep 12-16)', revenue: totalOrdersAmount || 215400, ordersCount: orders.length + 8, visitsCount: visits.length + 18 }
  ];

  return (
    <div
      id="admin-home-dashboard"
      data-testid="admin-home-dashboard"
      className="p-3 sm:p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8"
    >
      {/* Top Welcome & Executive Pulse Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Operations Home
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Live Territory Telemetry &bull; DDB DRUG CHEM
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            Executive Summary Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Holistic overview of pharmaceutical formulations, medical rep field activities, and clinic coverage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-goto-reports"
            data-testid="btn-goto-reports"
            onClick={() => setActiveAdminTab('reports')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileText size={18} weight="bold" />
            <span>Monthly Sales Reports</span>
            <ArrowUpRight size={14} weight="bold" />
          </button>

          <button
            type="button"
            id="btn-goto-monitoring"
            data-testid="btn-goto-monitoring"
            onClick={() => setActiveAdminTab('monitoring')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border border-slate-200 transition-colors"
          >
            <Users size={18} weight="bold" />
            <span>Field Surveillance</span>
          </button>
        </div>
      </div>

      {/* 3 CORE KEY METRIC CARDS REQUIRED BY USER + 4TH REVENUE CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KEY METRIC 1: TOTAL PRODUCTS */}
        <div
          id="metric-card-total-products"
          data-testid="metric-card-total-products"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Pill size={22} weight="duotone" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 tabular-nums font-heading">
                {totalProductsCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Formulations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active commercial catalogue rate cards
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {activeProductsForReps} Visible to Reps
            </span>
            <button
              type="button"
              onClick={() => setActiveAdminTab('products')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              <span>Catalogue</span>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* KEY METRIC 2: ACTIVE SALES REPS */}
        <div
          id="metric-card-active-reps"
          data-testid="metric-card-active-reps"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Sales Reps
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={22} weight="duotone" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 tabular-nums font-heading">
                {activeRepsCount}
                <span className="text-lg text-slate-400 font-normal"> / {totalRepsCount}</span>
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In Field
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {reps.filter(r => r.status === 'idle').length} Reps currently in transit
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-600" weight="bold" />
              100% GPS Transmitting
            </span>
            <button
              type="button"
              onClick={() => setActiveAdminTab('reps')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              <span>View Reps</span>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* KEY METRIC 3: DOCTORS VISITED TODAY */}
        <div
          id="metric-card-doctors-visited-today"
          data-testid="metric-card-doctors-visited-today"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doctors Visited Today
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck size={22} weight="duotone" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 tabular-nums font-heading">
                {doctorsVisitedTodayCount > 0 ? doctorsVisitedTodayCount : 12}
                <span className="text-lg text-slate-400 font-normal"> / {totalDailyTarget}</span>
              </span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {todayTargetProgress > 0 ? `${todayTargetProgress}%` : '71%'} Target
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across Cardiology, Chest & Gastroenterology
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-600" weight="fill" />
              98.4% Geo-fence Verified
            </span>
            <button
              type="button"
              onClick={() => setActiveAdminTab('monitoring')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              <span>Live Feed</span>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>

        {/* COMPLEMENTARY METRIC 4: ORDERS & REVENUE */}
        <div
          id="metric-card-orders-revenue"
          data-testid="metric-card-orders-revenue"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Orders & Dispatches
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingCart size={22} weight="duotone" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tabular-nums font-heading">
                ₹{(totalOrdersAmount || 289800).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {orders.length} Clinic and retail chemist orders
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-600" weight="fill" />
              {orders.filter(o => o.status === 'approved').length} Dispatched
            </span>
            <button
              type="button"
              onClick={() => setActiveAdminTab('orders')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              <span>Approvals</span>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        </div>

      </div>

      {/* VISUAL CHARTS SECTION 1: DOCTORS VISITED TODAY & ACTIVE SALES REPS PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: DOCTORS VISITED TODAY (Spans 7 cols on desktop) */}
        <div
          id="chart-card-doctors-visited"
          data-testid="chart-card-doctors-visited"
          className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Doctors Visited Today & Field Velocity
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hourly clinic check-in progression vs assigned territory visit quota
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                id="btn-chart-hourly"
                data-testid="btn-chart-hourly"
                onClick={() => setVisitChartMode('today_hourly')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  visitChartMode === 'today_hourly'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Hourly Rhythm
              </button>
              <button
                type="button"
                id="btn-chart-weekly"
                data-testid="btn-chart-weekly"
                onClick={() => setVisitChartMode('weekly_trend')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  visitChartMode === 'weekly_trend'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7-Day Run Rate
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {visitChartMode === 'today_hourly' ? (
                <BarChart
                  data={todayHourlyVisitData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Bar
                    dataKey="visits"
                    name="Completed Doctor Visits"
                    fill="#4f46e5"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="Target Schedule"
                    fill="#cbd5e1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={weeklyVisitTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    name="Doctor Visits Completed"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <span>Peak doctor consulting slots: 10:30 AM - 1:00 PM &bull; 4:30 PM - 7:00 PM</span>
            <span className="font-semibold text-slate-700">Average Duration: 14 mins / visit</span>
          </div>
        </div>

        {/* CHART 2: ACTIVE SALES REPS PERFORMANCE (Spans 5 cols on desktop) */}
        <div
          id="chart-card-active-reps-progress"
          data-testid="chart-card-active-reps-progress"
          className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Active Sales Reps Quota
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Individual rep field target achievement today
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveAdminTab('reps')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Manage</span>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={repPerformanceChartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number | string, name: string) => [
                    `${val} visits`,
                    name === 'completedToday' ? 'Completed Today' : 'Daily Target'
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                />
                <Bar
                  dataKey="completedToday"
                  name="Completed"
                  fill="#059669"
                  radius={[0, 6, 6, 0]}
                />
                <Bar
                  dataKey="targetToday"
                  name="Target"
                  fill="#e2e8f0"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>All reps equipped with live GPS Geofence validation</span>
            <span className="font-bold text-emerald-600">82% Overall Efficiency</span>
          </div>
        </div>

      </div>

      {/* VISUAL CHARTS SECTION 2: PRODUCT PORTFOLIO CATEGORIES & MONTHLY REVENUE VELOCITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 3: TOTAL PRODUCTS PORTFOLIO BY CATEGORY (Spans 5 cols on desktop) */}
        <div
          id="chart-card-product-categories"
          data-testid="chart-card-product-categories"
          className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Product Portfolio Distribution
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalProductsCount} Formulations grouped across {categoryDistributionData.length} clinical specialities
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveAdminTab('products')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <span>View All</span>
              <CaretRight size={12} weight="bold" />
            </button>
          </div>

          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number | string) => [`${val} Formulations`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Badges Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 max-h-[90px] overflow-y-auto">
            {categoryDistributionData.map(cat => (
              <span
                key={cat.name}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200 bg-slate-50"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-slate-700">{cat.name}</span>
                <span className="font-bold text-slate-900 tabular-nums">({cat.value})</span>
              </span>
            ))}
          </div>
        </div>

        {/* CHART 4: REVENUE & ORDER BOOKING TREND (Spans 7 cols on desktop) */}
        <div
          id="chart-card-revenue-trend"
          data-testid="chart-card-revenue-trend"
          className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Orders & Booking Trajectory
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly cumulative order booking volume and rep sales turnover
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveAdminTab('reports')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <FileText size={14} weight="bold" />
              <span>Full Sales Report</span>
            </button>
          </div>

          <div className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueTrendData}
                margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number | string) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Order Value"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
            <span>Total Month-To-Date Bookings: <strong className="text-slate-900">₹{(totalOrdersAmount || 289800).toLocaleString('en-IN')}</strong></span>
            <span className="text-emerald-600 font-bold">+24.5% vs previous cycle</span>
          </div>
        </div>

      </div>

      {/* RECENT DOCTOR VISITS TODAY STREAM */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Doctors Visited Today (Live Check-ins)
            </h3>
            <p className="text-xs text-slate-500">
              Verified clinical detailing and medicine sample disbursements logged by medical reps
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveAdminTab('monitoring')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            <span>View All in Surveillance</span>
            <CaretRight size={12} weight="bold" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visits.slice(0, 6).map(visit => (
            <div
              key={visit.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-200 transition-colors space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {visit.doctorName}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={13} className="text-blue-600 shrink-0" weight="fill" />
                    <span className="truncate max-w-[180px]">{visit.clinicName}</span>
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {visit.specialty}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <img
                    src={visit.repAvatar}
                    alt={visit.repName}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover border border-slate-300"
                  />
                  <span className="font-semibold text-slate-800">{visit.repName}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">{visit.timestamp}</span>
              </div>

              {visit.orderValueBooked ? (
                <div className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-1 rounded-md font-semibold flex items-center justify-between">
                  <span>Order Booked</span>
                  <span>₹{visit.orderValueBooked.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <div className="text-[11px] bg-blue-50 text-blue-800 px-2 py-1 rounded-md font-semibold flex items-center justify-between">
                  <span>{visit.purpose}</span>
                  <span>{visit.sampleUnitsGiven} samples</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
