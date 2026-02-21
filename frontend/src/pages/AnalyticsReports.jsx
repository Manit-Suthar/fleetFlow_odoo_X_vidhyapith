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
import './AnalyticsReports.css';

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
    }, [range]);

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

    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Smart insights
    const insights = useMemo(() => {
        const arr = [];
        if (topVehicles.length && parseFloat(topVehicles[0].total_cost) > 20000)
            arr.push({ lvl: 'caution', text: `${topVehicles[0].vehicle_name} has the highest cost at ₹${fmt(topVehicles[0].total_cost)} — review maintenance schedule` });
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
            arr.push({ lvl: 'danger', text: `Operating at ${margin}% margin — expenses exceed revenue by ₹${fmt(Math.abs(netProfit))}` });
        return arr;
    }, [topVehicles, fuelTrend, utilization, summary]);

    const Tip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="ar__tooltip">
                <p className="ar__tooltip-label">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} className="ar__tooltip-val" style={{ color: p.color }}>
                        {p.name}: ₹{fmt(p.value)}
                    </p>
                ))}
            </div>
        );
    };

    const expenseTotal = expenseBreakdown.reduce((s, e) => s + (parseFloat(e.total) || 0), 0);

    return (
        <div className="ar">
            {/* ═══ Header ═══ */}
            <div className="ar__header">
                <div>
                    <h1 className="ar__title">Analytics &amp; Reports</h1>
                    <p className="ar__subtitle">Financial overview and fleet performance metrics</p>
                </div>
                <div className="ar__header-actions">
                    <div className="ar__range-group">
                        {QUICK_RANGES.map(r => (
                            <button key={r.days} onClick={() => setRange(r.days)}
                                className={`ar__range-btn ${range === r.days ? 'ar__range-btn--active' : ''}`}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <div className="ar__divider" />
                    <button onClick={exportCSV} className="ar__export-btn"><Download size={12} /> CSV</button>
                    <button onClick={() => window.print()} className="ar__export-btn"><FileText size={12} /> PDF</button>
                </div>
            </div>

            {loading ? (
                <div className="ar__skeleton-row">
                    <div className="ar__skeleton-grid-3"><div className="ar__skeleton ar__skeleton--md" /><div className="ar__skeleton ar__skeleton--md" /><div className="ar__skeleton ar__skeleton--md" /></div>
                    <div className="ar__skeleton-grid-3"><div className="ar__skeleton ar__skeleton--sm" /><div className="ar__skeleton ar__skeleton--sm" /><div className="ar__skeleton ar__skeleton--sm" /></div>
                    <div className="ar__skeleton-grid-2"><div className="ar__skeleton ar__skeleton--lg" /><div className="ar__skeleton ar__skeleton--lg" /></div>
                </div>
            ) : (
                <div className="ar__body">

                    {/* ═══ KPI Row 1: Financial Metrics ═══ */}
                    <div>
                        <p className="ar__section-label">Financial Metrics</p>
                        <div className="ar__kpis">
                            <div className="ar__kpi ar__kpi--success">
                                <div className="ar__kpi-top">
                                    <span className="ar__kpi-label">Total Revenue</span>
                                    <div className="ar__kpi-icon ar__kpi-icon--success"><DollarSign size={16} /></div>
                                </div>
                                <p className="ar__kpi-value">₹{fmt(totalRevenue)}</p>
                                <p className="ar__kpi-sub">
                                    {totalRevenue > 0 && <TrendingUp size={10} style={{ color: 'var(--success-600)' }} />}
                                    {totalTrips > 0 ? `From ${totalTrips} completed trips` : 'No completed trips yet'}
                                </p>
                            </div>
                            <div className="ar__kpi ar__kpi--warning">
                                <div className="ar__kpi-top">
                                    <span className="ar__kpi-label">Total Expenses</span>
                                    <div className="ar__kpi-icon ar__kpi-icon--warning"><BarChart3 size={16} /></div>
                                </div>
                                <p className="ar__kpi-value">₹{fmt(totalExpenses)}</p>
                                <p className="ar__kpi-sub">Fuel + Maintenance + Other</p>
                            </div>
                            <div className={`ar__kpi ${netProfit >= 0 ? 'ar__kpi--success' : 'ar__kpi--negative'}`}>
                                <div className="ar__kpi-top">
                                    <span className="ar__kpi-label">Net Profit</span>
                                    <div className={`ar__kpi-icon ${netProfit >= 0 ? 'ar__kpi-icon--success' : 'ar__kpi-icon--muted'}`}>
                                        {netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                </div>
                                <p className={`ar__kpi-value ${netProfit < 0 ? 'ar__kpi-value--negative' : ''}`}>₹{fmt(netProfit)}</p>
                                <p className="ar__kpi-sub">{margin}% profit margin</p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ KPI Row 2: Operational Metrics ═══ */}
                    <div>
                        <p className="ar__section-label">Operational Metrics</p>
                        <div className="ar__kpis">
                            <div className="ar__kpi ar__kpi--info">
                                <div className="ar__kpi-top">
                                    <span className="ar__kpi-label">Fleet Utilization</span>
                                    <div className="ar__kpi-icon ar__kpi-icon--info"><Percent size={16} /></div>
                                </div>
                                <p className="ar__kpi-value">{utilizationRate}%</p>
                                <p className="ar__kpi-sub">{activeVehicles} of {totalVehicles} vehicles active</p>
                            </div>
                            <div className="ar__kpi ar__kpi--warning">
                                <div className="ar__kpi-top">
                                    <span className="ar__kpi-label">Cost per KM</span>
                                    <div className="ar__kpi-icon ar__kpi-icon--warning"><Fuel size={16} /></div>
                                </div>
                                <p className="ar__kpi-value">{fuelCostPerKm > 0 ? `₹${fuelCostPerKm.toFixed(1)}` : '—'}</p>
                                <p className="ar__kpi-sub">{fuelCostPerKm > 0 ? 'Average fuel cost per kilometer' : 'Insufficient data'}</p>
                            </div>
                            <div className="ar__kpi ar__kpi--info">
                                <div className="ar__kpi-top">
                                    <span className="ar__kpi-label">Active Vehicles</span>
                                    <div className="ar__kpi-icon ar__kpi-icon--info"><Truck size={16} /></div>
                                </div>
                                <p className="ar__kpi-value">{activeVehicles}</p>
                                <p className="ar__kpi-sub">{totalVehicles > activeVehicles ? `${totalVehicles - activeVehicles} currently idle` : 'All vehicles deployed'}</p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Charts Row 1: Revenue vs Expenses + Net Profit ═══ */}
                    <div className="ar__charts-row ar__charts-row--2col">
                        {/* Revenue vs Expenses */}
                        <div className="ar__chart-card">
                            <h3 className="ar__chart-title">Revenue vs Expenses</h3>
                            {monthlyProfit.length <= 1 ? (
                                <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    {monthlyProfit.length === 1 ? (
                                        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <p className="ar__empty-text" style={{ textAlign: 'center', marginBottom: 12 }}>Single period summary</p>
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
                                    <div className="ar__legend">
                                        {[['Revenue', CLR.indigo], ['Fuel', CLR.amber], ['Maintenance', CLR.purple]].map(([l, c]) => (
                                            <span key={l} className="ar__legend-item">
                                                <span className="ar__legend-dot" style={{ backgroundColor: c }} />{l}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Net Profit Trend */}
                        <div className="ar__chart-card">
                            <h3 className="ar__chart-title">Net Profit Trend</h3>
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
                        </div>
                    </div>

                    {/* ═══ Charts Row 2: Fuel, Top Vehicles, Utilization ═══ */}
                    <div className="ar__charts-row ar__charts-row--3col">
                        {/* Fuel Cost Trend */}
                        <div className="ar__chart-card">
                            <h3 className="ar__chart-title">Fuel Cost Trend</h3>
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
                        </div>

                        {/* Top Costliest Vehicles */}
                        <div className="ar__chart-card">
                            <h3 className="ar__chart-title">Top Costliest Vehicles</h3>
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
                        </div>

                        {/* Fleet Utilization */}
                        <div className="ar__chart-card">
                            <h3 className="ar__chart-title">Fleet Utilization</h3>
                            <div className="ar__util-wrap">
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Active', value: activeVehicles },
                                                { name: 'Idle', value: Math.max(0, totalVehicles - activeVehicles) },
                                            ]}
                                            cx="50%" cy="50%" innerRadius={44} outerRadius={62}
                                            paddingAngle={totalVehicles > activeVehicles && activeVehicles > 0 ? 3 : 0}
                                            dataKey="value" startAngle={90} endAngle={-270}
                                        >
                                            <Cell fill={CLR.indigo} />
                                            <Cell fill="#e2e8f0" />
                                        </Pie>
                                        <Tooltip content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            return (
                                                <div className="ar__tooltip">
                                                    <p className="ar__tooltip-val">{payload[0].name}: {payload[0].value} vehicle{payload[0].value !== 1 ? 's' : ''}</p>
                                                </div>
                                            );
                                        }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="ar__util-center">
                                    <p className="ar__util-value">{activeVehicles}/{totalVehicles}</p>
                                    <p className="ar__util-label">Active</p>
                                </div>
                                <p className="ar__util-sub">{utilizationRate}% fleet utilization</p>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Financial Table + Insights ═══ */}
                    <div className="ar__bottom-grid">
                        {/* Financial Summary Table */}
                        <div className="ar__table-card">
                            <div className="ar__table-header">
                                <h3 className="ar__table-title">Financial Summary</h3>
                                <button onClick={exportCSV} className="ar__table-export">Export table</button>
                            </div>
                            <div className="ar__table-wrap">
                                <table className="ar__table">
                                    <thead>
                                        <tr>
                                            {[['Month', 'month'], ['Revenue', 'revenue'], ['Fuel', 'fuel'], ['Maintenance', 'maintenance'], ['Other', 'other_expenses'], ['Net Profit', 'net_profit']].map(([l, k]) => (
                                                <th key={k} onClick={() => handleSort(k)}>
                                                    <span className="ar__th-inner">
                                                        {l}
                                                        {sortField === k && <ArrowUpDown size={9} style={{ color: CLR.indigo }} />}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedProfit.length === 0 ? (
                                            <tr><td colSpan={6} className="ar__table-empty">No data for this period</td></tr>
                                        ) : sortedProfit.map((r, i) => (
                                            <tr key={i}>
                                                <td className="ar__td-month">{r.month}</td>
                                                <td className="ar__td-revenue">₹{fmt(r.revenue)}</td>
                                                <td className="ar__td-number">₹{fmt(r.fuel)}</td>
                                                <td className="ar__td-number">₹{fmt(r.maintenance)}</td>
                                                <td className="ar__td-number">₹{fmt(r.other_expenses)}</td>
                                                <td className={parseFloat(r.net_profit) >= 0 ? 'ar__td-profit--positive' : 'ar__td-profit--negative'}>
                                                    ₹{fmt(r.net_profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Insights Panel */}
                        <div className="ar__insights-card">
                            <div className="ar__insights-header">
                                <Lightbulb size={13} style={{ color: 'var(--warning-500)' }} />
                                <h3 className="ar__insights-title">Smart Insights</h3>
                            </div>
                            <div className="ar__insights-body">
                                {insights.length === 0 ? (
                                    <div className="ar__insights-empty">
                                        <p className="ar__insights-empty-text">No alerts for this period</p>
                                        <p className="ar__insights-empty-sub">All metrics within normal range</p>
                                    </div>
                                ) : insights.map((ins, i) => (
                                    <div key={i} className={`ar__insight ar__insight--${ins.lvl}`}>{ins.text}</div>
                                ))}

                                {/* Expense Breakdown */}
                                {expenseBreakdown.length > 0 && (
                                    <div className="ar__expense-section">
                                        <p className="ar__expense-label">Expense Breakdown</p>
                                        <div className="ar__expense-items">
                                            {expenseBreakdown.map((e, i) => {
                                                const pct = expenseTotal > 0 ? Math.round((parseFloat(e.total) / expenseTotal) * 100) : 0;
                                                return (
                                                    <div key={i}>
                                                        <div className="ar__expense-row-top">
                                                            <span className="ar__expense-cat">{e.category}</span>
                                                            <div className="ar__expense-vals">
                                                                <span className="ar__expense-pct">{pct}%</span>
                                                                <span className="ar__expense-amt">₹{fmt(e.total)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="ar__expense-bar-track">
                                                            <div className="ar__expense-bar-fill" style={{
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

function SummaryBar({ label, value, max, color, fmt: f }) {
    const pct = max > 0 ? Math.max(4, (parseFloat(value) / max) * 100) : 0;
    return (
        <div className="ar__summary-bar">
            <span className="ar__summary-bar-label">{label}</span>
            <div className="ar__summary-bar-track">
                <div className="ar__summary-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="ar__summary-bar-value">₹{f(value)}</span>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="ar__empty-state">
            <BarChart3 size={20} className="ar__empty-icon" />
            <p className="ar__empty-text">{text}</p>
            <p className="ar__empty-sub">Try adjusting the date range</p>
        </div>
    );
}
