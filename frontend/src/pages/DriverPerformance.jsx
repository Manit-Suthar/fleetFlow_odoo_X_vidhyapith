import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, Plus, AlertTriangle, MoreHorizontal,
    Eye, UserX, Shield, TrendingUp, X, Check,
    ArrowUpDown, Loader2, Users, Activity, AlertCircle,
    SlidersHorizontal, AlertOctagon, Award
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import DriverProfileModal from '../components/DriverProfileModal';
import ReportIssueModal from '../components/ReportIssueModal';
import AddDriverModal from '../components/AddDriverModal';

const CLR = { grid: '#e2e8f0', tick: '#94a3b8', indigo: '#4f46e5', emerald: '#059669', amber: '#d97706', rose: '#dc2626' };
const SEV_COLORS = { low: '#059669', medium: '#d97706', high: '#f97316', critical: '#dc2626' };

export default function DriverPerformance() {
    const [drivers, setDrivers] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [licenseFilter, setLicenseFilter] = useState('all');
    const [sortBy, setSortBy] = useState('safety_score');
    const [sortDir, setSortDir] = useState('desc');
    const [activeView, setActiveView] = useState('drivers');
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [issueSevFilter, setIssueSevFilter] = useState('all');
    const [issueStatFilter, setIssueStatFilter] = useState('all');
    const [actionMenuId, setActionMenuId] = useState(null);
    const [toast, setToast] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const fetchDrivers = useCallback(async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (licenseFilter !== 'all') params.license = licenseFilter;
            const res = await api.get('/drivers', { params });
            setDrivers(res.data);
        } catch { showToast('Failed to load drivers', 'error'); }
    }, [search, statusFilter, licenseFilter]);

    const fetchIssues = useCallback(async () => {
        try {
            const params = {};
            if (issueStatFilter !== 'all') params.status = issueStatFilter;
            if (issueSevFilter !== 'all') params.severity = issueSevFilter;
            const res = await api.get('/issues', { params });
            setIssues(res.data);
        } catch { /* silent */ }
    }, [issueStatFilter, issueSevFilter]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchDrivers(), fetchIssues()]).finally(() => setLoading(false));
    }, [fetchDrivers, fetchIssues]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('desc'); }
    };

    // Sort drivers — expired licenses always at top
    const sortedDrivers = useMemo(() => {
        const now = new Date();
        return [...drivers].sort((a, b) => {
            const aExpired = a.license_expiry && new Date(a.license_expiry) < now;
            const bExpired = b.license_expiry && new Date(b.license_expiry) < now;
            if (aExpired && !bExpired) return -1;
            if (!aExpired && bExpired) return 1;
            const m = sortDir === 'asc' ? 1 : -1;
            if (sortBy === 'safety_score') return (a.safety_score - b.safety_score) * m;
            if (sortBy === 'completion_rate') return (a.completion_rate - b.completion_rate) * m;
            if (sortBy === 'total_trips') return (a.total_trips - b.total_trips) * m;
            return 0;
        });
    }, [drivers, sortBy, sortDir]);

    // FIX #2: Only rank drivers who actually have trips
    const topDrivers = useMemo(() =>
        [...drivers]
            .filter(d => d.total_trips > 0)
            .sort((a, b) => (b.safety_score + b.completion_rate) - (a.safety_score + a.completion_rate))
            .slice(0, 3),
        [drivers]
    );

    const kpis = useMemo(() => {
        const total = drivers.length;
        const active = drivers.filter(d => d.status === 'available' || d.status === 'on-trip').length;
        const driversWithTrips = drivers.filter(d => d.total_trips > 0);
        const avgCompletion = driversWithTrips.length > 0 ? Math.round(driversWithTrips.reduce((s, d) => s + d.completion_rate, 0) / driversWithTrips.length) : 0;
        const avgSafety = driversWithTrips.length > 0 ? Math.round(driversWithTrips.reduce((s, d) => s + d.safety_score, 0) / driversWithTrips.length) : 0;
        const openIssues = issues.filter(i => i.status === 'open').length;
        return { total, active, avgCompletion, avgSafety, openIssues };
    }, [drivers, issues]);

    // Chart data
    const safetyTrend = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map(m => ({ month: m, score: Math.round(70 + Math.random() * 25) }));
    }, []);

    const tripsByMonth = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        return months.map(m => ({ month: m, count: Math.round(20 + Math.random() * 30) }));
    }, []);

    const incidentDist = useMemo(() => {
        const counts = { low: 0, medium: 0, high: 0, critical: 0 };
        issues.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });
        return Object.entries(counts).filter(([, v]) => v > 0).map(([severity, count]) => ({ severity, count }));
    }, [issues]);

    const handleSuspend = async (id) => {
        try { await api.patch(`/drivers/${id}/status`, { status: 'off-duty' }); showToast('Driver suspended'); fetchDrivers(); } catch { showToast('Failed', 'error'); }
        setActionMenuId(null);
    };
    const handleDelete = async (id) => {
        try { await api.delete(`/drivers/${id}`); showToast('Driver removed'); fetchDrivers(); } catch { showToast('Failed', 'error'); }
        setActionMenuId(null);
    };
    const handleResolve = async (id) => {
        try { await api.patch(`/issues/${id}/status`, { status: 'resolved' }); showToast('Issue resolved'); fetchIssues(); } catch { showToast('Failed', 'error'); }
    };
    const handleDeleteIssue = async (id) => {
        try { await api.delete(`/issues/${id}`); showToast('Issue deleted'); fetchIssues(); } catch { showToast('Failed', 'error'); }
    };

    const ChartTip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 11 }}>
                <p style={{ color: '#64748b', marginBottom: 2 }}>{label}</p>
                {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>)}
            </div>
        );
    };

    return (
        <div className="min-h-screen" onClick={() => setActionMenuId(null)}>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-lg text-[13px] font-medium shadow-lg border animate-fade-in ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>{toast.message}</div>
            )}

            {/* ═══ Header ═══ */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Driver Performance</h1>
                        <p className="text-xs text-slate-500 mt-0.5">{kpis.total} drivers registered</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button onClick={() => setShowAddModal(true)}
                            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-[13px]">
                            <Plus size={14} /> Add Driver
                        </button>
                        <button onClick={() => setShowReportModal(true)}
                            className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-[13px]">
                            <AlertTriangle size={14} className="text-amber-600" /> Report Issue
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 py-6 max-w-[1440px]">
                {/* ═══ KPI Strip — FIX #9: Standardized icon colors ═══ */}
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <KPI label="Total Drivers" value={kpis.total} icon={<Users size={15} />} color="indigo" />
                    <KPI label="Active Now" value={kpis.active} icon={<Activity size={15} />} color="green" />
                    <KPI label="Avg Completion" value={`${kpis.avgCompletion}%`} icon={<TrendingUp size={15} />} color="indigo" />
                    <KPI label="Avg Safety Score" value={kpis.avgSafety} icon={<Shield size={15} />} color="indigo" />
                    <KPI label="Open Issues" value={kpis.openIssues} icon={<AlertCircle size={15} />}
                        color={kpis.openIssues > 0 ? 'red' : 'indigo'} alert={kpis.openIssues > 3} />
                </div>

                {/* ═══ Top Performers — FIX #1 & #7 ═══ */}
                {topDrivers.length > 0 && (
                    <div className="mb-6">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Top Performers</p>
                        <div className="grid grid-cols-3 gap-4">
                            {topDrivers.map((d, i) => (
                                <button key={d.id} onClick={() => setSelectedDriver(d)}
                                    className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all text-left group overflow-hidden">
                                    {/* Medal badge */}
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300'
                                        : i === 1 ? 'bg-slate-100 text-slate-500 ring-1 ring-slate-300'
                                            : 'bg-orange-50 text-orange-400 ring-1 ring-orange-200'
                                        }`}>
                                        <Award size={16} />
                                    </div>
                                    {/* Info — takes remaining space */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{d.name}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{d.total_trips} trips · {d.completion_rate}% done</p>
                                    </div>
                                    {/* FIX #7: Smaller score */}
                                    <div className="text-right shrink-0 pl-2">
                                        <p className={`text-base font-bold tabular-nums ${safetyClr(d.safety_score)}`}>{d.safety_score}</p>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">score</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══ Controls Row — FIX #8: Removed redundant "DRIVERS DIRECTORY" label ═══ */}
                <div className="mb-4">
                    <div className="flex items-center gap-3">
                        {/* View toggle */}
                        <div className="flex bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                            <button onClick={() => setActiveView('drivers')}
                                className={`px-4 py-2 rounded-md text-[12px] font-semibold transition-all ${activeView === 'drivers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                Drivers
                            </button>
                            <button onClick={() => setActiveView('issues')}
                                className={`px-4 py-2 rounded-md text-[12px] font-semibold transition-all flex items-center gap-1.5 ${activeView === 'issues' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                Issues
                                {kpis.openIssues > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex items-center justify-center">{kpis.openIssues}</span>}
                            </button>
                        </div>

                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by name, license..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 placeholder:text-slate-400 focus-ring transition-colors" />
                        </div>

                        <button onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold border transition-all ${showFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}>
                            <SlidersHorizontal size={13} /> Filters
                            {(statusFilter !== 'all' || licenseFilter !== 'all') && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                        </button>
                    </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in">
                        <Sel label="Status" value={statusFilter} onChange={setStatusFilter}
                            opts={[['all', 'All'], ['available', 'Available'], ['on-trip', 'On Trip'], ['off-duty', 'Off Duty']]} />
                        <Sel label="License" value={licenseFilter} onChange={setLicenseFilter}
                            opts={[['all', 'All'], ['expiring', 'Expiring'], ['expired', 'Expired']]} />
                        {activeView === 'issues' && (
                            <>
                                <Sel label="Severity" value={issueSevFilter} onChange={setIssueSevFilter}
                                    opts={[['all', 'All'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']]} />
                                <Sel label="Issue Status" value={issueStatFilter} onChange={setIssueStatFilter}
                                    opts={[['all', 'All'], ['open', 'Open'], ['under_review', 'In Review'], ['resolved', 'Resolved']]} />
                            </>
                        )}
                        <button onClick={() => { setStatusFilter('all'); setLicenseFilter('all'); setIssueSevFilter('all'); setIssueStatFilter('all'); }}
                            className="text-[11px] text-slate-500 hover:text-slate-700 ml-auto transition-colors font-medium">Clear all</button>
                    </div>
                )}

                {/* ═══ Main Content ═══ */}
                {loading ? (
                    <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}</div>
                ) : (
                    <div className="flex gap-6">
                        {/* ─── Left: Table ─── */}
                        <div className="flex-1 min-w-0">
                            {activeView === 'drivers' ? (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/60">
                                                <TH>Driver</TH>
                                                <TH>License</TH>
                                                <TH sortable active={sortBy === 'total_trips'} onClick={() => handleSort('total_trips')}>Performance</TH>
                                                <TH sortable active={sortBy === 'safety_score'} onClick={() => handleSort('safety_score')}>Safety</TH>
                                                <TH>Issues</TH>
                                                <TH>Status</TH>
                                                <TH w="44px"></TH>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedDrivers.length === 0 ? (
                                                <tr><td colSpan={7} className="py-16 text-center">
                                                    <Users size={24} className="mx-auto mb-3 text-slate-300" />
                                                    <p className="text-sm text-slate-500 font-medium">No drivers match your filters</p>
                                                    <p className="text-xs text-slate-400 mt-1">Try adjusting the search or filter criteria</p>
                                                </td></tr>
                                            ) : sortedDrivers.map(d => {
                                                const lic = licBadge(d.license_expiry);
                                                const isExpired = lic.lvl === 'expired';
                                                const hasTrips = d.total_trips > 0;
                                                return (
                                                    // FIX #6: Stronger expired row highlight with left border
                                                    <tr key={d.id}
                                                        className={`group transition-colors ${isExpired
                                                            ? 'bg-red-50/60 hover:bg-red-50'
                                                            : 'hover:bg-slate-50'
                                                            }`}
                                                        style={isExpired ? { borderLeft: '3px solid #dc2626' } : {}}>
                                                        {/* Driver */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-[11px] font-bold text-indigo-600 shrink-0 border border-indigo-100">
                                                                    {initials(d.name)}
                                                                </div>
                                                                <div>
                                                                    <button onClick={() => setSelectedDriver(d)} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">{d.name}</button>
                                                                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{d.license_number}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* License */}
                                                        <td className="px-5 py-3.5">
                                                            <span className="flex items-center gap-1.5">
                                                                {isExpired && <AlertOctagon size={12} className="text-red-500" />}
                                                                <Badge cls={lic.cls}>{lic.text}</Badge>
                                                            </span>
                                                        </td>
                                                        {/* FIX #3: Compact performance column */}
                                                        <td className="px-5 py-3.5">
                                                            {hasTrips ? (
                                                                <div className="text-[12px] text-slate-600">
                                                                    <span className="font-semibold text-slate-900">{d.total_trips}</span> trips
                                                                    <span className="text-slate-300 mx-1.5">·</span>
                                                                    <span className="font-medium">{d.completion_rate}%</span>
                                                                    <span className="text-slate-300 mx-1.5">·</span>
                                                                    <span className="text-slate-400">{d.ontime_rate}% on-time</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[12px] text-slate-400 italic">No trips yet</span>
                                                            )}
                                                        </td>
                                                        {/* FIX #2 & #4: Safety — N/A when no trips, thicker progress bar */}
                                                        <td className="px-5 py-3.5">
                                                            {hasTrips ? (
                                                                <div className="flex items-center gap-2.5 min-w-[80px]">
                                                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.safety_score >= 80 ? 'bg-emerald-500' : d.safety_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                                        }`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-bold tabular-nums ${safetyClr(d.safety_score)}`}>{d.safety_score}</p>
                                                                        <div className="w-full h-[5px] bg-slate-200 rounded-full mt-1 overflow-hidden">
                                                                            <div className={`h-full rounded-full transition-all duration-700 ${d.safety_score >= 80 ? 'bg-emerald-500' : d.safety_score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                                                                }`} style={{ width: `${d.safety_score}%` }} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        {/* Issues */}
                                                        <td className="px-5 py-3.5">
                                                            {d.issue_count > 0 ? (
                                                                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">{d.issue_count}</span>
                                                            ) : (
                                                                <span className="text-sm text-slate-400">0</span>
                                                            )}
                                                        </td>
                                                        {/* Status */}
                                                        <td className="px-5 py-3.5"><StatusDot s={d.status} /></td>
                                                        {/* Actions */}
                                                        <td className="px-3 py-3.5">
                                                            <div className="relative">
                                                                <button onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === d.id ? null : d.id); }}
                                                                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                                                                    <MoreHorizontal size={15} />
                                                                </button>
                                                                {actionMenuId === d.id && (
                                                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-fade-in" onClick={e => e.stopPropagation()}>
                                                                        <MItem onClick={() => { setSelectedDriver(d); setActionMenuId(null); }} icon={<Eye size={13} />}>View Profile</MItem>
                                                                        <MItem onClick={() => handleSuspend(d.id)} icon={<UserX size={13} />} v="caution">Suspend</MItem>
                                                                        <div className="my-1 mx-2 border-t border-slate-100" />
                                                                        <MItem onClick={() => handleDelete(d.id)} icon={<X size={13} />} v="danger">Remove</MItem>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* ─── Issues Table ─── */
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/60">
                                                <TH>ID</TH>
                                                <TH>Driver</TH>
                                                <TH>Type</TH>
                                                <TH>Severity</TH>
                                                <TH>Date</TH>
                                                <TH>Status</TH>
                                                <TH></TH>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {issues.length === 0 ? (
                                                <tr><td colSpan={7} className="py-16 text-center">
                                                    <Shield size={24} className="mx-auto mb-3 text-slate-300" />
                                                    <p className="text-sm text-slate-500 font-medium">No issues found</p>
                                                </td></tr>
                                            ) : issues.map(issue => (
                                                <tr key={issue.id} className="hover:bg-slate-50 transition-colors group border-b border-slate-100">
                                                    <td className="px-5 py-3.5 text-[12px] text-slate-400 font-mono">#{issue.id}</td>
                                                    <td className="px-5 py-3.5 text-sm text-slate-900 font-semibold">{issue.driver_name}</td>
                                                    <td className="px-5 py-3.5 text-[13px] text-slate-600">{issue.issue_type}</td>
                                                    <td className="px-5 py-3.5"><Badge cls={sevBadge(issue.severity)}>{issue.severity}</Badge></td>
                                                    <td className="px-5 py-3.5 text-[12px] text-slate-500">{fmtDate(issue.occurred_at)}</td>
                                                    <td className="px-5 py-3.5"><Badge cls={statBadge(issue.status)}>{issue.status?.replace('_', ' ')}</Badge></td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {issue.status !== 'resolved' && (
                                                                <button onClick={() => handleResolve(issue.id)} className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors" title="Resolve">
                                                                    <Check size={14} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDeleteIssue(issue.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* ─── Right: Charts Panel — FIX #5: better sizing ─── */}
                        <div className="w-[320px] shrink-0 space-y-4">
                            {/* Safety Score Trend */}
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-4">Safety Score Trend</h3>
                                <ResponsiveContainer width="100%" height={140}>
                                    <LineChart data={safetyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[60, 100]} tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTip />} />
                                        <Line type="monotone" dataKey="score" stroke={CLR.indigo} strokeWidth={2.5} dot={{ r: 3.5, fill: CLR.indigo, strokeWidth: 0 }} name="Score" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Trips Per Month */}
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-4">Trips Per Month</h3>
                                <ResponsiveContainer width="100%" height={130}>
                                    <BarChart data={tripsByMonth}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CLR.grid} vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: CLR.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTip />} />
                                        <Bar dataKey="count" fill={CLR.indigo} radius={[4, 4, 0, 0]} name="Trips" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Incident Distribution */}
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-4">Incident Distribution</h3>
                                {incidentDist.length === 0 ? (
                                    <p className="text-[12px] text-slate-400 py-6 text-center">No incidents recorded</p>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={120}>
                                            <PieChart>
                                                <Pie data={incidentDist} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3} dataKey="count" nameKey="severity">
                                                    {incidentDist.map((e, i) => <Cell key={i} fill={SEV_COLORS[e.severity] || CLR.indigo} />)}
                                                </Pie>
                                                <Tooltip content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    return (
                                                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 11 }}>
                                                            <p style={{ color: '#0f172a', fontWeight: 600, textTransform: 'capitalize' }}>{payload[0].payload.severity}: {payload[0].value}</p>
                                                        </div>
                                                    );
                                                }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                                            {incidentDist.map(e => (
                                                <span key={e.severity} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SEV_COLORS[e.severity] }} />
                                                    <span className="capitalize">{e.severity}</span>
                                                    <span className="text-slate-400">({e.count})</span>
                                                </span>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedDriver && <DriverProfileModal driver={selectedDriver} onClose={() => setSelectedDriver(null)} />}
            {showReportModal && <ReportIssueModal drivers={drivers} onClose={() => setShowReportModal(false)}
                onSubmit={() => { setShowReportModal(false); fetchIssues(); fetchDrivers(); showToast('Issue reported'); }} />}
            {showAddModal && <AddDriverModal onClose={() => setShowAddModal(false)}
                onSubmit={() => { setShowAddModal(false); fetchDrivers(); showToast('Driver added'); }} />}
        </div>
    );
}

/* ─── Sub-components ─── */

// FIX #9: Standardized KPI colors
function KPI({ label, value, icon, color, alert }) {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        red: 'text-red-600 bg-red-50 border-red-100',
    };
    const c = colors[color] || colors.indigo;
    return (
        <div className={`bg-white border rounded-xl px-5 py-4 shadow-sm ${alert ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-slate-500 font-medium">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${c}`}>{icon}</div>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}

function TH({ children, sortable, active, onClick, w }) {
    return (
        <th style={w ? { width: w } : {}} className={`px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${sortable ? 'cursor-pointer select-none hover:text-slate-600' : ''}`} onClick={onClick}>
            {sortable ? <span className="flex items-center gap-1">{children}{active && <ArrowUpDown size={10} className="text-indigo-600" />}</span> : children}
        </th>
    );
}

function Badge({ cls, children }) {
    return <span className={`inline-flex items-center px-2.5 py-[3px] rounded-md text-[11px] font-semibold capitalize ${cls}`}>{children}</span>;
}

function StatusDot({ s }) {
    const m = {
        available: { c: 'bg-emerald-500', l: 'Active' },
        'on-trip': { c: 'bg-blue-500', l: 'On Trip' },
        'off-duty': { c: 'bg-slate-400', l: 'Off Duty' },
        suspended: { c: 'bg-red-500', l: 'Suspended' },
    };
    const v = m[s] || m['off-duty'];
    return <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${v.c}`} /><span className="text-[12px] text-slate-600 font-medium">{v.l}</span></span>;
}

function MItem({ children, onClick, icon, v }) {
    const c = v === 'danger' ? 'text-red-600 hover:bg-red-50' : v === 'caution' ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-700 hover:bg-slate-50';
    return <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors ${c}`}>{icon}{children}</button>;
}

function Sel({ label, value, onChange, opts }) {
    return (
        <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 focus-ring">
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </div>
    );
}

/* Helpers */
function initials(n) { return n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function safetyClr(s) { return s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-600' : 'text-red-600'; }
function licBadge(exp) {
    if (!exp) return { text: 'N/A', cls: 'bg-slate-100 text-slate-500 border border-slate-200', lvl: 'na' };
    const d = (new Date(exp) - new Date()) / 864e5;
    if (d < 0) return { text: 'Expired', cls: 'bg-red-50 text-red-600 border border-red-200', lvl: 'expired' };
    if (d < 30) return { text: 'Expiring', cls: 'bg-amber-50 text-amber-600 border border-amber-200', lvl: 'expiring' };
    return { text: 'Valid', cls: 'bg-emerald-50 text-emerald-600 border border-emerald-200', lvl: 'valid' };
}
function sevBadge(s) { return { low: 'bg-emerald-50 text-emerald-600 border border-emerald-200', medium: 'bg-amber-50 text-amber-600 border border-amber-200', high: 'bg-orange-50 text-orange-600 border border-orange-200', critical: 'bg-red-50 text-red-600 border border-red-200' }[s] || 'bg-slate-100 text-slate-500'; }
function statBadge(s) { return { open: 'bg-red-50 text-red-600 border border-red-200', under_review: 'bg-amber-50 text-amber-600 border border-amber-200', resolved: 'bg-emerald-50 text-emerald-600 border border-emerald-200' }[s] || 'bg-slate-100 text-slate-500'; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
