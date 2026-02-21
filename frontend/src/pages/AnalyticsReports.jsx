import { useState, useEffect, useMemo } from 'react';
import {
    Calendar, Download, FileText, TrendingUp, TrendingDown,
    Fuel, Wrench, DollarSign, Percent, Loader2, BarChart3,
    ArrowUpDown, Lightbulb, Truck, ArrowRight
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import api from '../utils/api';

const QUICK_RANGES = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
    { label: '1 year', days: 365 },
];

const CLR = {
    grid: '#e2e8f0',
    tick: '#94a3b8',
    indigo: '#4f46e5',
    emerald: '#059669',
    amber: '#d97706',
    rose: '#dc2626',
    purple: '#7c3aed',
    slate: '#64748b',
};

export default function AnalyticsReports() {
    const [range, setRange] = useState(90);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [summary, setSummary] = useState(null);
    const [fuelTrend, setFuelTrend] = useState([]);
    const [topVehicles, setTopVehicles] = useState([]);
    const [monthlyProfit, setMonthlyProfit] = useState([]);
    const [utilization, setUtilization] = useState(null);
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState('month');
    const [sortDir, setSortDir] = useState('asc');

    const getDates = () => {
        if (fromDate && toDate) return { from: fromDate, to: toDate };
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(Date.now() - range * 864e5).toISOString().split('T')[0];
        return { from, to };
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const { from, to } = getDates();
            const p = { from, to };
            try {
                const [s, f, t, pr, u, e] = await Promise.all([
                    api.get('/analytics/summary', { params: p }),
                    api.get('/analytics/fuel-trend', { params: p }),
                    api.get('/analytics/top-vehicles', { params: p }),
                    api.get('/analytics/monthly-profit', { params: p }),
                    api.get('/analytics/utilization', { params: p }),
                    api.get('/analytics/expense-breakdown', { params: p }),
                ]);
                setSummary(s.data); setFuelTrend(f.data);
                setTopVehicles(t.data); setMonthlyProfit(pr.data);
                setUtilization(u.data); setExpenseBreakdown(e.data);
            } catch { /* silent */ }
            finally { setLoading(false); }
        };
        load();
    }, [range, fromDate, toDate]);

    const fmt = (v) => {
        const n = parseFloat(v) || 0;
        if (Math.abs(n) >= 100000) return `${(n / 100000).toFixed(1)}L`;
        if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toFixed(0);
    };

    const exportCSV = () => {
        if (!monthlyProfit.length) return;
        const h = ['Month', 'Revenue', 'Fuel', 'Maintenance', 'Other', 'Net Profit'];
        const rows = monthlyProfit.map(r => [r.month, r.revenue, r.fuel, r.maintenance, r.other_expenses, r.net_profit]);
        const csv = [h.join(','), ...rows.map(r => r.join(','))].join('\n');
        const b = new Blob([csv], { type: 'text/csv' });
        const u = URL.createObjectURL(b);
        Object.assign(document.createElement('a'), { href: u, download: 'fleetflow_report.csv' }).click();
        URL.revokeObjectURL(u);
    };

    const sortedProfit = useMemo(() => [...monthlyProfit].sort((a, b) => {
        const m = sortDir === 'asc' ? 1 : -1;
        if (sortField === 'month') return a.month.localeCompare(b.month) * m;
        return ((parseFloat(a[sortField]) || 0) - (parseFloat(b[sortField]) || 0)) * m;
    }), [monthlyProfit, sortField, sortDir]);

    const handleSort = (f) => {
        if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(f); setSortDir('desc'); }
    };

    const totalExpenses = parseFloat(summary?.total_expenses) || 0;
    const totalRevenue = parseFloat(summary?.total_revenue) || 0;
    const netProfit = parseFloat(summary?.net_profit) || 0;
    const fuelCostPerKm = parseFloat(summary?.fuel_cost_per_km) || 0;
    const totalTrips = summary?.total_trips || 0;
    const activeVehicles = utilization?.active_vehicles || 0;
    const totalVehicles = utilization?.total_vehicles || 0;
    const utilizationRate = utilization?.utilization_rate || 0;

    // Profit margin
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Smart insights
    const insights = useMemo(() => {
        const arr = [];
        if (topVehicles.length && parseFloat(topVehicles[0].total_cost) > 20000)
            arr.push({ lvl: 'caution', text: `${topVehicles[0].vehicle_name} has the highest cost at Rs ${fmt(topVehicles[0].total_cost)} — review maintenance schedule` });
        if (fuelTrend.length >= 2) {
            const last = parseFloat(fuelTrend.at(-1)?.fuel_cost) || 0;
            const prev = parseFloat(fuelTrend.at(-2)?.fuel_cost) || 0;
            if (prev > 0 && (last - prev) / prev > 0.3)
                arr.push({ lvl: 'danger', text: 'Fuel cost spiked 30%+ compared to the previous month' });
            if (prev > 0 && last < prev)
                arr.push({ lvl: 'positive', text: 'Fuel cost is trending downward — good sign' });
        }
        if (utilizationRate < 80 && totalVehicles > 0)
            arr.push({ lvl: 'info', text: `${totalVehicles - activeVehicles} vehicle${totalVehicles - activeVehicles > 1 ? 's' : ''} idle — consider reassignment or retirement` });
        if (netProfit < 0)
            arr.push({ lvl: 'danger', text: `Operating at ${margin}% margin — expenses exceed revenue by Rs ${fmt(Math.abs(netProfit))}` });
        return arr;
    }, [topVehicles, fuelTrend, utilization, summary]);

    const Tip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-surface-0 border border-edge-0 rounded-lg px-3.5 py-2.5 shadow-lg text-[11px]">
                <p className="text-ink-200 mb-1 font-medium">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium">
                        {p.name}: Rs {fmt(p.value)}
                    </p>
                ))}
            </div>
        );
    };

    const expenseTotal = expenseBreakdown.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);

    return (
        <div className="min-h-screen">
            {/* ═══ Header ═══ */}
            <header className="sticky top-0 z-30 bg-surface-0/85 backdrop-blur-xl border-b border-edge-0">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-semibold text-ink-0">Operational Analytics & Financial Reports</h1>
                        <p className="text-[11px] text-ink-400 mt-0.5">Financial overview and fleet performance metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-surface-100 border border-edge-0 rounded-lg p-0.5">
                            {QUICK_RANGES.map(r => (
                                <button key={r.days} onClick={() => { setRange(r.days); setFromDate(''); setToDate(''); }}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${range === r.days && !fromDate ? 'bg-surface-300 text-ink-0 shadow-sm' : 'text-ink-400 hover:text-ink-200'
                                        }`}>{r.label}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-ink-400">
                            <Calendar size={13} />
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                className="px-2.5 py-1.5 bg-surface-100 border border-edge-0 rounded-lg text-[11px] text-ink-200 focus-ring" />
                            <span className="text-[10px]">to</span>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                className="px-2.5 py-1.5 bg-surface-100 border border-edge-0 rounded-lg text-[11px] text-ink-200 focus-ring" />
                        </div>
                        <div className="w-px h-5 bg-edge-100" />
                        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-ink-300 hover:text-ink-100 hover:bg-surface-100 rounded-lg transition-colors">
                            <Download size={12} /> CSV
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-ink-300 hover:text-ink-100 hover:bg-surface-100 rounded-lg transition-colors">
                            <FileText size={12} /> PDF
                        </button>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="px-8 py-6 space-y-5">
                    <div className="grid grid-cols-3 gap-4"><div className="skeleton h-24" /><div className="skeleton h-24" /><div className="skeleton h-24" /></div>
                    <div className="grid grid-cols-3 gap-4"><div className="skeleton h-20" /><div className="skeleton h-20" /><div className="skeleton h-20" /></div>
                    <div className="grid grid-cols-2 gap-4"><div className="skeleton h-64" /><div className="skeleton h-64" /></div>
                </div>
            ) : (
                <div className="px-8 py-6 space-y-5 max-w-[1440px]">

                    {/* ═══ KPI Row 1: Financial Metrics ═══ */}
                    <div>
                        <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-2.5">Financial Metrics</p>
                        <div className="grid grid-cols-3 gap-4">
                            <KPICard
                                label="Total Revenue"
                                value={`Rs ${fmt(totalRevenue)}`}
                                icon={<DollarSign size={15} />}
                                iconClr="text-emerald-400 bg-positive-muted"
                                sub={totalTrips > 0 ? `From ${totalTrips} completed trips` : 'No completed trips yet'}
                                trend={totalRevenue > 0 ? 'up' : null}
                            />
                            <KPICard
                                label="Total Expenses"
                                value={`Rs ${fmt(totalExpenses)}`}
                                icon={<BarChart3 size={15} />}
                                iconClr="text-amber-400 bg-caution-muted"
                                sub={`Fuel + Maintenance + Other`}
                                trend={totalExpenses > 0 ? 'up' : null}
                            />
                            <KPICard
                                label="Net Profit"
                                value={`Rs ${fmt(netProfit)}`}
                                icon={netProfit >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                                iconClr={netProfit >= 0 ? 'text-emerald-400 bg-positive-muted' : 'text-ink-300 bg-surface-200'}
                                sub={`${margin}% profit margin`}
                                negative={netProfit < 0}
                            />
                        </div>
                    </div>

                    {/* ═══ KPI Row 2: Operational Metrics ═══ */}
                    <div>
                        <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-2.5">Operational Metrics</p>
                        <div className="grid grid-cols-3 gap-4">
                            <KPICard
                                label="Fleet Utilization"
                                value={`${utilizationRate}%`}
                                icon={<Percent size={15} />}
                                iconClr="text-info bg-info-muted"
                                sub={`${activeVehicles} of ${totalVehicles} vehicles active`}
                            />
                            <KPICard
                                label="Cost per KM"
                                value={fuelCostPerKm > 0 ? `Rs ${fuelCostPerKm.toFixed(1)}` : '—'}
                                icon={<Fuel size={15} />}
                                iconClr="text-amber-400 bg-caution-muted"
                                sub={fuelCostPerKm > 0 ? 'Average fuel cost per kilometer' : 'Insufficient data'}
                            />
                            <KPICard
                                label="Active Vehicles"
                                value={activeVehicles}
                                icon={<Truck size={15} />}
                                iconClr="text-info bg-info-muted"
                                sub={totalVehicles > activeVehicles ? `${totalVehicles - activeVehicles} currently idle` : 'All vehicles deployed'}
                            />
                        </div>
                    </div>

                    {/* ═══ Charts Row 1: Revenue vs Expenses + Net Profit ═══ */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Revenue vs Expenses */}
                        <ChartCard title="Revenue vs Expenses">
                            {monthlyProfit.length <= 1 ? (
                                <div className="h-[220px] flex flex-col items-center justify-center">
                                    {monthlyProfit.length === 1 ? (
                                        <div className="w-full max-w-sm space-y-3">
                                            <p className="text-[11px] text-ink-300 text-center mb-4">Single period summary</p>
                                            <SummaryBar label="Revenue" value={monthlyProfit[0].revenue} max={Math.max(monthlyProfit[0].revenue, totalExpenses)} color={CLR.indigo} fmt={fmt} />
                                            <SummaryBar label="Fuel" value={monthlyProfit[0].fuel} max={Math.max(monthlyProfit[0].revenue, totalExpenses)} color={CLR.amber} fmt={fmt} />
                                            <SummaryBar label="Maintenance" value={monthlyProfit[0].maintenance} max={Math.max(monthlyProfit[0].revenue, totalExpenses)} color={CLR.purple} fmt={fmt} />
                                            <SummaryBar label="Other" value={monthlyProfit[0].other_expenses} max={Math.max(monthlyProfit[0].revenue, totalExpenses)} color={CLR.slate} fmt={fmt} />
                                        </div>
                                    ) : (
                                        <EmptyState text="No financial data for this period" />
                                    )}
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={monthlyProfit} barCategoryGap="30%">
                                            <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />
                                            <XAxis dataKey="month" tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                                            <Tooltip content={<Tip />} />
                                            <Bar dataKey="revenue" fill={CLR.indigo} radius={[4, 4, 0, 0]} name="Revenue" />
                                            <Bar dataKey="fuel" fill={CLR.amber} radius={[4, 4, 0, 0]} name="Fuel" />
                                            <Bar dataKey="maintenance" fill={CLR.purple} radius={[4, 4, 0, 0]} name="Maintenance" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <Legend items={[['Revenue', CLR.indigo], ['Fuel', CLR.amber], ['Maintenance', CLR.purple]]} />
                                </>
                            )}
                        </ChartCard>

                        {/* Net Profit Trend — clean line only, with zero baseline */}
                        <ChartCard title="Net Profit Trend">
                            {monthlyProfit.length === 0 ? <EmptyState text="No data available" /> : (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={monthlyProfit}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                                        <Tooltip content={<Tip />} />
                                        <ReferenceLine y={0} stroke={CLR.tick} strokeDasharray="4 4" strokeOpacity={0.5} />
                                        <Line type="monotone" dataKey="net_profit" stroke={CLR.indigo} strokeWidth={2} dot={{ r: 3, fill: CLR.indigo, strokeWidth: 0 }} activeDot={{ r: 5, fill: CLR.indigo }} name="Net Profit" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ═══ Charts Row 2: Fuel, Top Vehicles, Utilization ═══ */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Fuel Cost Trend */}
                        <ChartCard title="Fuel Cost Trend">
                            {fuelTrend.length === 0 ? <EmptyState text="No fuel data recorded" /> : (
                                <ResponsiveContainer width="100%" height={190}>
                                    <LineChart data={fuelTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                                        <Tooltip content={<Tip />} />
                                        <Line type="monotone" dataKey="fuel_cost" stroke={CLR.amber} strokeWidth={2} dot={{ r: 2.5, fill: CLR.amber, strokeWidth: 0 }} name="Fuel Cost" />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Top Costliest Vehicles — neutral blue bars */}
                        <ChartCard title="Top Costliest Vehicles">
                            {topVehicles.length === 0 ? <EmptyState text="No vehicle cost data" /> : (
                                <ResponsiveContainer width="100%" height={190}>
                                    <BarChart data={topVehicles} layout="vertical" barSize={12}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} horizontal={false} />
                                        <XAxis type="number" tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                                        <YAxis type="category" dataKey="vehicle_name" tick={{ fill: CLR.tick, fontSize: 9 }} axisLine={false} tickLine={false} width={75} />
                                        <Tooltip content={<Tip />} />
                                        <Bar dataKey="total_cost" fill={CLR.indigo} radius={[0, 4, 4, 0]} name="Total Cost" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Fleet Utilization — with center label */}
                        <ChartCard title="Fleet Utilization">
                            <div className="flex flex-col items-center justify-center h-[190px] relative">
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Active', value: activeVehicles },
                                                { name: 'Idle', value: Math.max(0, totalVehicles - activeVehicles) || 1 },
                                            ]}
                                            cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={totalVehicles > activeVehicles ? 3 : 0} dataKey="value" startAngle={90} endAngle={-270}
                                        >
                                            <Cell fill={CLR.indigo} />
                                            <Cell fill="#e2e8f0" />
                                        </Pie>
                                        <Tooltip content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            return (
                                                <div className="bg-surface-0 border border-edge-0 rounded-lg px-3 py-2 shadow-lg text-[11px]">
                                                    <p className="text-ink-0 font-medium">{payload[0].name}: {payload[0].value} vehicle{payload[0].value !== 1 ? 's' : ''}</p>
                                                </div>
                                            );
                                        }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-12px' }}>
                                    <p className="text-xl font-bold text-ink-0 tabular-nums">{activeVehicles}/{totalVehicles}</p>
                                    <p className="text-[9px] text-ink-400 uppercase tracking-wider font-medium">Active</p>
                                </div>
                                <p className="text-[11px] text-ink-300 mt-1">{utilizationRate}% fleet utilization</p>
                            </div>
                        </ChartCard>
                    </div>

                    {/* ═══ Financial Table + Insights ═══ */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Financial Summary Table */}
                        <div className="col-span-2 bg-surface-50 border border-edge-0 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-edge-0 flex items-center justify-between">
                                <h3 className="text-[13px] font-semibold text-ink-0">Financial Summary</h3>
                                <button onClick={exportCSV} className="text-[10px] text-info hover:underline font-medium">Export table</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-edge-0 bg-surface-100/50">
                                            {[['Month', 'month'], ['Revenue', 'revenue'], ['Fuel', 'fuel'], ['Maintenance', 'maintenance'], ['Other', 'other_expenses'], ['Net Profit', 'net_profit']].map(([l, k]) => (
                                                <th key={k} className="px-5 py-2.5 text-left text-[10px] font-semibold text-ink-400 uppercase tracking-wider cursor-pointer hover:text-ink-200 select-none"
                                                    onClick={() => handleSort(k)}>
                                                    <span className="flex items-center gap-1">{l}{sortField === k && <ArrowUpDown size={9} className="text-brand" />}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-edge-0/40">
                                        {sortedProfit.length === 0 ? (
                                            <tr><td colSpan={6} className="py-14 text-center text-[12px] text-ink-400">No data for this period</td></tr>
                                        ) : sortedProfit.map((r, i) => (
                                            <tr key={i} className="hover:bg-surface-100/40 transition-colors">
                                                <td className="px-5 py-3 text-[12px] text-ink-0 font-medium">{r.month}</td>
                                                <td className="px-5 py-3 text-[12px] text-emerald-400 tabular-nums font-medium">Rs {fmt(r.revenue)}</td>
                                                <td className="px-5 py-3 text-[12px] text-ink-200 tabular-nums">Rs {fmt(r.fuel)}</td>
                                                <td className="px-5 py-3 text-[12px] text-ink-200 tabular-nums">Rs {fmt(r.maintenance)}</td>
                                                <td className="px-5 py-3 text-[12px] text-ink-200 tabular-nums">Rs {fmt(r.other_expenses)}</td>
                                                <td className={`px-5 py-3 text-[12px] font-medium tabular-nums ${parseFloat(r.net_profit) >= 0 ? 'text-emerald-400' : 'text-ink-200'}`}>
                                                    Rs {fmt(r.net_profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Insights Panel */}
                        <div className="bg-surface-50 border border-edge-0 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-edge-0 flex items-center gap-2">
                                <Lightbulb size={13} className="text-caution" />
                                <h3 className="text-[13px] font-semibold text-ink-0">Smart Insights</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {insights.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-[11px] text-ink-400">No alerts for this period</p>
                                        <p className="text-[10px] text-ink-400 mt-1">All metrics within normal range</p>
                                    </div>
                                ) : insights.map((ins, i) => (
                                    <div key={i} className={`px-3.5 py-2.5 rounded-lg text-[11px] leading-relaxed border ${ins.lvl === 'danger' ? 'bg-danger-muted text-danger border-danger/15' :
                                        ins.lvl === 'caution' ? 'bg-caution-muted text-caution border-caution/15' :
                                            ins.lvl === 'positive' ? 'bg-positive-muted text-positive border-positive/15' :
                                                'bg-info-muted text-info border-info/15'
                                        }`}>{ins.text}</div>
                                ))}

                                {/* Expense Breakdown */}
                                {expenseBreakdown.length > 0 && (
                                    <div className="pt-3 mt-2 border-t border-edge-0">
                                        <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider mb-3">Expense Breakdown</p>
                                        <div className="space-y-2.5">
                                            {expenseBreakdown.map((e, i) => {
                                                const pct = expenseTotal > 0 ? Math.round((parseFloat(e.total) / expenseTotal) * 100) : 0;
                                                return (
                                                    <div key={i}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[11px] text-ink-200 capitalize">{e.category}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-ink-400">{pct}%</span>
                                                                <span className="text-[11px] text-ink-0 font-medium tabular-nums">Rs {fmt(e.total)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-1 bg-surface-300 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-500" style={{
                                                                width: `${pct}%`,
                                                                backgroundColor: [CLR.indigo, CLR.emerald, CLR.amber, CLR.rose, CLR.purple][i % 5]
                                                            }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Sub-components ─── */

function KPICard({ label, value, icon, iconClr, sub, trend, negative }) {
    return (
        <div className={`bg-surface-50 border rounded-xl px-5 py-4 ${negative ? 'border-edge-100' : 'border-edge-0'}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-ink-300 font-medium">{label}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconClr}`}>{icon}</div>
            </div>
            <p className={`text-xl font-semibold tabular-nums ${negative ? 'text-rose-400/80' : 'text-ink-0'}`}>{value}</p>
            <div className="flex items-center gap-1.5 mt-1">
                {trend && (
                    <span className={`text-[10px] font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend === 'up' ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />}
                    </span>
                )}
                <span className="text-[10px] text-ink-400">{sub}</span>
            </div>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="bg-surface-50 border border-edge-0 rounded-xl p-5">
            <h3 className="text-[12px] font-semibold text-ink-100 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function Legend({ items }) {
    return (
        <div className="flex items-center gap-5 mt-3">
            {items.map(([l, c]) => (
                <span key={l} className="flex items-center gap-1.5 text-[11px] text-ink-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />{l}
                </span>
            ))}
        </div>
    );
}

function SummaryBar({ label, value, max, color, fmt: f }) {
    const pct = max > 0 ? Math.max(4, (parseFloat(value) / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-[11px] text-ink-300 w-24 shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-surface-300 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-[11px] text-ink-0 font-medium tabular-nums w-16 text-right">Rs {f(value)}</span>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="h-[190px] flex flex-col items-center justify-center">
            <BarChart3 size={20} className="text-ink-400/30 mb-2" />
            <p className="text-[11px] text-ink-400">{text}</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Try adjusting the date range</p>
        </div>
    );
}
