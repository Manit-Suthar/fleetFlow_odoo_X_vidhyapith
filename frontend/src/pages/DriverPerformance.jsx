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
import './DriverPerformance.css';

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
            <div className="dp__tooltip">
                <p className="dp__tooltip-label">{label}</p>
                {payload.map((p, i) => <p key={i} className="dp__tooltip-val" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
            </div>
        );
    };

    return (
        <div className="dp" onClick={() => setActionMenuId(null)}>
            {/* Toast */}
            {toast && (
                <div className={`dp__toast dp__toast--${toast.type === 'error' ? 'error' : 'success'}`}>
                    {toast.message}
                </div>
            )}

            {/* ═══ Header ═══ */}
            <div className="dp__header">
                <div>
                    <h1 className="dp__title">Driver Performance</h1>
                    <p className="dp__subtitle">{kpis.total} drivers registered</p>
                </div>
                <div className="dp__actions">
                    <button onClick={() => setShowAddModal(true)} className="dp__btn dp__btn--primary">
                        <Plus size={14} /> Add Driver
                    </button>
                    <button onClick={() => setShowReportModal(true)} className="dp__btn dp__btn--ghost">
                        <AlertTriangle size={14} /> Report Issue
                    </button>
                </div>
            </div>

            {/* ═══ KPI Strip ═══ */}
            <div className="dp__kpis">
                <div className="dp__kpi dp__kpi--accent">
                    <div className="dp__kpi-top">
                        <span className="dp__kpi-label">Total Drivers</span>
                        <div className="dp__kpi-icon dp__kpi-icon--accent"><Users size={16} /></div>
                    </div>
                    <p className="dp__kpi-value">{kpis.total}</p>
                </div>
                <div className="dp__kpi dp__kpi--success">
                    <div className="dp__kpi-top">
                        <span className="dp__kpi-label">Active Now</span>
                        <div className="dp__kpi-icon dp__kpi-icon--success"><Activity size={16} /></div>
                    </div>
                    <p className="dp__kpi-value">{kpis.active}</p>
                </div>
                <div className="dp__kpi dp__kpi--accent">
                    <div className="dp__kpi-top">
                        <span className="dp__kpi-label">Avg Completion</span>
                        <div className="dp__kpi-icon dp__kpi-icon--accent"><TrendingUp size={16} /></div>
                    </div>
                    <p className="dp__kpi-value">{kpis.avgCompletion}%</p>
                </div>
                <div className="dp__kpi dp__kpi--accent">
                    <div className="dp__kpi-top">
                        <span className="dp__kpi-label">Avg Safety Score</span>
                        <div className="dp__kpi-icon dp__kpi-icon--accent"><Shield size={16} /></div>
                    </div>
                    <p className="dp__kpi-value">{kpis.avgSafety}</p>
                </div>
                <div className={`dp__kpi ${kpis.openIssues > 0 ? 'dp__kpi--danger dp__kpi--alert' : 'dp__kpi--accent'}`}>
                    <div className="dp__kpi-top">
                        <span className="dp__kpi-label">Open Issues</span>
                        <div className={`dp__kpi-icon ${kpis.openIssues > 0 ? 'dp__kpi-icon--danger' : 'dp__kpi-icon--accent'}`}>
                            <AlertCircle size={16} />
                        </div>
                    </div>
                    <p className={`dp__kpi-value ${kpis.openIssues > 0 ? 'dp__kpi-value--danger' : ''}`}>{kpis.openIssues}</p>
                </div>
            </div>

            {/* ═══ Top Performers ═══ */}
            {topDrivers.length > 0 && (
                <div className="dp__performers">
                    <p className="dp__section-label">Top Performers</p>
                    <div className="dp__performers-grid">
                        {topDrivers.map((d, i) => (
                            <button key={d.id} onClick={() => setSelectedDriver(d)} className="dp__performer">
                                <div className={`dp__performer-medal dp__performer-medal--${i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'}`}>
                                    <Award size={16} />
                                </div>
                                <div className="dp__performer-info">
                                    <p className="dp__performer-name">{d.name}</p>
                                    <p className="dp__performer-meta">{d.total_trips} trips · {d.completion_rate}% done</p>
                                </div>
                                <div className="dp__performer-score">
                                    <p className={`dp__performer-score-val ${safetyScoreCls(d.safety_score)}`}>{d.safety_score}</p>
                                    <p className="dp__performer-score-label">score</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Controls Row ═══ */}
            <div className="dp__controls">
                <div className="dp__tab-group">
                    <button onClick={() => setActiveView('drivers')}
                        className={`dp__tab ${activeView === 'drivers' ? 'dp__tab--active' : ''}`}>
                        Drivers
                    </button>
                    <button onClick={() => setActiveView('issues')}
                        className={`dp__tab ${activeView === 'issues' ? 'dp__tab--active' : ''}`}>
                        Issues
                        {kpis.openIssues > 0 && <span className="dp__issue-count">{kpis.openIssues}</span>}
                    </button>
                </div>

                <div className="dp__search">
                    <Search size={14} className="dp__search-icon" />
                    <input type="text" placeholder="Search by name, license..." value={search}
                        onChange={e => setSearch(e.target.value)} className="dp__search-input" />
                </div>

                <button onClick={() => setShowFilters(!showFilters)}
                    className={`dp__filter-btn ${showFilters ? 'dp__filter-btn--active' : ''}`}>
                    <SlidersHorizontal size={13} /> Filters
                    {(statusFilter !== 'all' || licenseFilter !== 'all') && <span className="dp__filter-dot" />}
                </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="dp__filter-panel">
                    <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
                        opts={[['all', 'All'], ['available', 'Available'], ['on-trip', 'On Trip'], ['off-duty', 'Off Duty']]} />
                    <FilterSelect label="License" value={licenseFilter} onChange={setLicenseFilter}
                        opts={[['all', 'All'], ['expiring', 'Expiring'], ['expired', 'Expired']]} />
                    {activeView === 'issues' && (
                        <>
                            <FilterSelect label="Severity" value={issueSevFilter} onChange={setIssueSevFilter}
                                opts={[['all', 'All'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'Critical']]} />
                            <FilterSelect label="Issue Status" value={issueStatFilter} onChange={setIssueStatFilter}
                                opts={[['all', 'All'], ['open', 'Open'], ['under_review', 'In Review'], ['resolved', 'Resolved']]} />
                        </>
                    )}
                    <button onClick={() => { setStatusFilter('all'); setLicenseFilter('all'); setIssueSevFilter('all'); setIssueStatFilter('all'); }}
                        className="dp__filter-clear">Clear all</button>
                </div>
            )}

            {/* ═══ Main Content ═══ */}
            {loading ? (
                <div className="dp__skeleton-row">
                    {[...Array(6)].map((_, i) => <div key={i} className="dp__skeleton" />)}
                </div>
            ) : (
                <div className="dp__content">
                    {/* ─── Left: Table ─── */}
                    <div className="dp__table-wrap">
                        {activeView === 'drivers' ? (
                            <div className="dp__table-container">
                                <table className="dp__table">
                                    <thead>
                                        <tr>
                                            <th>Driver</th>
                                            <th>License</th>
                                            <th className="dp__th--sortable" onClick={() => handleSort('total_trips')}>
                                                <span className="dp__th-inner">
                                                    Performance
                                                    {sortBy === 'total_trips' && <ArrowUpDown size={10} style={{ color: CLR.indigo }} />}
                                                </span>
                                            </th>
                                            <th className="dp__th--sortable" onClick={() => handleSort('safety_score')}>
                                                <span className="dp__th-inner">
                                                    Safety
                                                    {sortBy === 'safety_score' && <ArrowUpDown size={10} style={{ color: CLR.indigo }} />}
                                                </span>
                                            </th>
                                            <th>Issues</th>
                                            <th>Status</th>
                                            <th style={{ width: '44px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedDrivers.length === 0 ? (
                                            <tr><td colSpan={7}>
                                                <div className="dp__empty">
                                                    <Users size={24} className="dp__empty-icon" />
                                                    <p className="dp__empty-text">No drivers match your filters</p>
                                                    <p className="dp__empty-sub">Try adjusting the search or filter criteria</p>
                                                </div>
                                            </td></tr>
                                        ) : sortedDrivers.map(d => {
                                            const lic = licBadge(d.license_expiry);
                                            const isExpired = lic.lvl === 'expired';
                                            const hasTrips = d.total_trips > 0;
                                            return (
                                                <tr key={d.id} className={isExpired ? 'dp__row--expired' : ''}>
                                                    {/* Driver */}
                                                    <td>
                                                        <div className="dp__driver-cell">
                                                            <div className="dp__driver-avatar">{initials(d.name)}</div>
                                                            <div>
                                                                <button onClick={() => setSelectedDriver(d)} className="dp__driver-name">{d.name}</button>
                                                                <p className="dp__driver-license">{d.license_number}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* License */}
                                                    <td>
                                                        <span className="dp__license-cell">
                                                            {isExpired && <AlertOctagon size={12} style={{ color: 'var(--danger, #dc2626)' }} />}
                                                            <span className={`dp__badge dp__badge--${lic.variant}`}>{lic.text}</span>
                                                        </span>
                                                    </td>
                                                    {/* Performance */}
                                                    <td>
                                                        {hasTrips ? (
                                                            <span className="dp__perf-text">
                                                                <strong>{d.total_trips}</strong> trips
                                                                <span className="dp__perf-divider">·</span>
                                                                <strong>{d.completion_rate}%</strong>
                                                                <span className="dp__perf-divider">·</span>
                                                                {d.ontime_rate}% on-time
                                                            </span>
                                                        ) : (
                                                            <span className="dp__perf-empty">No trips yet</span>
                                                        )}
                                                    </td>
                                                    {/* Safety */}
                                                    <td>
                                                        {hasTrips ? (
                                                            <div className="dp__safety-cell">
                                                                <span className={`dp__safety-dot dp__safety-dot--${safetyLvl(d.safety_score)}`} />
                                                                <div className="dp__safety-info">
                                                                    <p className={`dp__safety-score dp__safety-score--${safetyLvl(d.safety_score)}`}>{d.safety_score}</p>
                                                                    <div className="dp__safety-bar">
                                                                        <div className={`dp__safety-fill dp__safety-fill--${safetyLvl(d.safety_score)}`}
                                                                            style={{ width: `${d.safety_score}%` }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="dp__safety-na">—</span>
                                                        )}
                                                    </td>
                                                    {/* Issues */}
                                                    <td>
                                                        {d.issue_count > 0 ? (
                                                            <span className="dp__issue-badge">{d.issue_count}</span>
                                                        ) : (
                                                            <span className="dp__issue-zero">0</span>
                                                        )}
                                                    </td>
                                                    {/* Status */}
                                                    <td><StatusDot s={d.status} /></td>
                                                    {/* Actions */}
                                                    <td>
                                                        <div className="dp__action-wrap">
                                                            <button onClick={e => { e.stopPropagation(); setActionMenuId(actionMenuId === d.id ? null : d.id); }}
                                                                className="dp__action-btn">
                                                                <MoreHorizontal size={15} />
                                                            </button>
                                                            {actionMenuId === d.id && (
                                                                <div className="dp__action-menu" onClick={e => e.stopPropagation()}>
                                                                    <button onClick={() => { setSelectedDriver(d); setActionMenuId(null); }} className="dp__menu-item">
                                                                        <Eye size={13} /> View Profile
                                                                    </button>
                                                                    <button onClick={() => handleSuspend(d.id)} className="dp__menu-item dp__menu-item--caution">
                                                                        <UserX size={13} /> Suspend
                                                                    </button>
                                                                    <div className="dp__menu-divider" />
                                                                    <button onClick={() => handleDelete(d.id)} className="dp__menu-item dp__menu-item--danger">
                                                                        <X size={13} /> Remove
                                                                    </button>
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
                            <div className="dp__table-container">
                                <table className="dp__table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Driver</th>
                                            <th>Type</th>
                                            <th>Severity</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issues.length === 0 ? (
                                            <tr><td colSpan={7}>
                                                <div className="dp__empty">
                                                    <Shield size={24} className="dp__empty-icon" />
                                                    <p className="dp__empty-text">No issues found</p>
                                                </div>
                                            </td></tr>
                                        ) : issues.map(issue => (
                                            <tr key={issue.id}>
                                                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{issue.id}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{issue.driver_name}</td>
                                                <td>{issue.issue_type}</td>
                                                <td><span className={`dp__badge dp__badge--${sevVariant(issue.severity)}`}>{issue.severity}</span></td>
                                                <td style={{ color: 'var(--text-muted)' }}>{fmtDate(issue.occurred_at)}</td>
                                                <td><span className={`dp__badge dp__badge--${statVariant(issue.status)}`}>{issue.status?.replace('_', ' ')}</span></td>
                                                <td>
                                                    <div className="dp__issue-actions">
                                                        {issue.status !== 'resolved' && (
                                                            <button onClick={() => handleResolve(issue.id)} className="dp__issue-action-btn dp__issue-action-btn--resolve" title="Resolve">
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteIssue(issue.id)} className="dp__issue-action-btn dp__issue-action-btn--delete" title="Delete">
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

                    {/* ─── Right: Charts Panel ─── */}
                    <div className="dp__charts">
                        {/* Safety Score Trend */}
                        <div className="dp__chart-card">
                            <h3 className="dp__chart-title">Safety Score Trend</h3>
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
                        <div className="dp__chart-card">
                            <h3 className="dp__chart-title">Trips Per Month</h3>
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
                        <div className="dp__chart-card">
                            <h3 className="dp__chart-title">Incident Distribution</h3>
                            {incidentDist.length === 0 ? (
                                <p className="dp__chart-empty">No incidents recorded</p>
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
                                                    <div className="dp__tooltip">
                                                        <p className="dp__tooltip-val" style={{ textTransform: 'capitalize' }}>
                                                            {payload[0].payload.severity}: {payload[0].value}
                                                        </p>
                                                    </div>
                                                );
                                            }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="dp__chart-legend">
                                        {incidentDist.map(e => (
                                            <span key={e.severity} className="dp__legend-item">
                                                <span className="dp__legend-dot" style={{ backgroundColor: SEV_COLORS[e.severity] }} />
                                                <span style={{ textTransform: 'capitalize' }}>{e.severity}</span>
                                                <span className="dp__legend-count">({e.count})</span>
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

function StatusDot({ s }) {
    const m = {
        available: { cls: 'active', l: 'Active' },
        'on-trip': { cls: 'trip', l: 'On Trip' },
        'off-duty': { cls: 'off', l: 'Off Duty' },
        suspended: { cls: 'suspended', l: 'Suspended' },
    };
    const v = m[s] || m['off-duty'];
    return (
        <span className="dp__status">
            <span className={`dp__status-dot dp__status-dot--${v.cls}`} />
            <span className="dp__status-text">{v.l}</span>
        </span>
    );
}

function FilterSelect({ label, value, onChange, opts }) {
    return (
        <div className="dp__filter-group">
            <label className="dp__filter-label">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="dp__filter-select">
                {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </div>
    );
}

/* Helpers */
function initials(n) { return n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

function safetyLvl(s) { return s >= 80 ? 'good' : s >= 60 ? 'mid' : 'bad'; }
function safetyScoreCls(s) { return s >= 80 ? 'dp__safety-score--good' : s >= 60 ? 'dp__safety-score--mid' : 'dp__safety-score--bad'; }

function licBadge(exp) {
    if (!exp) return { text: 'N/A', variant: 'neutral', lvl: 'na' };
    const d = (new Date(exp) - new Date()) / 864e5;
    if (d < 0) return { text: 'Expired', variant: 'danger', lvl: 'expired' };
    if (d < 30) return { text: 'Expiring', variant: 'warning', lvl: 'expiring' };
    return { text: 'Valid', variant: 'success', lvl: 'valid' };
}

function sevVariant(s) {
    return { low: 'success', medium: 'warning', high: 'orange', critical: 'danger' }[s] || 'neutral';
}

function statVariant(s) {
    return { open: 'danger', under_review: 'warning', resolved: 'success' }[s] || 'neutral';
}

function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
