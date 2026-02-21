import { useState, useEffect } from 'react';
import { X, Shield, Clock, TrendingUp, AlertTriangle, MapPin, Calendar, ChevronDown, ChevronUp, Loader2, Phone, Star } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../utils/api';
import './Modal.css';

const TABS = ['Overview', 'Performance', 'Trips', 'Issues'];

export default function DriverProfileModal({ driver, onClose }) {
    const [tab, setTab] = useState(0);
    const [full, setFull] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/drivers/${driver.id}`)
            .then(r => {
                setFull(r.data);
            })
            .catch(err => {
                console.error('Failed to load driver details:', err);
            })
            .finally(() => setLoading(false));
    }, [driver.id]);

    const d = {
        ...driver,
        ...(full || {}),
        completion_rate: full?.completion_rate ?? driver.completion_rate ?? 0,
        ontime_rate: full?.ontime_rate ?? driver.ontime_rate ?? 0,
        safety_score: full?.safety_score ?? driver.safety_score ?? 0,
        total_trips: full?.total_trips ?? driver.total_trips ?? 0,
        issue_count: full?.issue_count ?? driver.issue_count ?? 0,
        trips: full?.trips || [],
        issues: full?.issues || [],
        monthly_trips: full?.monthly_trips || [],
        monthly_late: full?.monthly_late || [],
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="modal__overlay" onClick={onClose} />
            <div className="relative w-[560px] h-full bg-white border-l border-slate-200 shadow-2xl overflow-y-auto animate-slide-in">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200">
                    <div className="px-10 pt-10 pb-6">
                        <div className="flex items-start justify-between mb-8">
                            <div className="modal__profile-info">
                                <div className="modal__avatar" style={{ width: '64px', height: '64px', fontSize: '1.6rem', boxShadow: '0 4px 12px var(--accent-100)' }}>
                                    {d.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <h2 className="modal__title" style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}>{d.name}</h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <p className="modal__subtitle font-mono" style={{ background: 'var(--bg-inset)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{d.license_number}</p>
                                        <span className={`modal__badge ${d.status === 'available' ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                                            {d.status?.replace('-', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="modal__close" style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: '12px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal__tabs" style={{ margin: '0 -40px', padding: '0 40px' }}>
                            {TABS.map((t, i) => (
                                <button key={t} onClick={() => setTab(i)}
                                    className={`modal__tab ${tab === i ? 'modal__tab--active' : ''}`}
                                    style={{ padding: '16px 20px' }}>{t}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading && !full ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-center">
                            <Loader2 size={32} className="text-accent-500 animate-spin mx-auto mb-5" />
                            <p className="text-sm text-slate-400 font-semibold tracking-wide">SYNCING PROFILE DATA...</p>
                        </div>
                    </div>
                ) : (
                    <div className="px-10 py-8">
                        {tab === 0 && <OverviewTab d={d} />}
                        {tab === 1 && <PerformanceTab d={d} />}
                        {tab === 2 && <TripsTab d={d} />}
                        {tab === 3 && <IssuesTab d={d} />}
                    </div>
                )}
            </div>
        </div>
    );
}

function OverviewTab({ d }) {
    const alerts = [];
    const expDays = d.license_expiry ? Math.ceil((new Date(d.license_expiry) - new Date()) / 864e5) : null;

    if (expDays !== null && expDays < 30) {
        alerts.push({
            type: expDays < 0 ? 'danger' : 'warning',
            icon: <Calendar size={18} />,
            text: expDays < 0 ? 'Driving license has expired' : `Driving license expires in ${expDays} days`
        });
    }

    if (d.issue_count > 0) {
        alerts.push({
            type: d.issue_count > 2 ? 'danger' : 'warning',
            icon: <AlertTriangle size={18} />,
            text: `${d.issue_count} incident${d.issue_count > 1 ? 's' : ''} reported on this profile`
        });
    }

    return (
        <div className="space-y-8">
            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((a, i) => (
                        <div key={i} className={`modal__alert modal__alert--${a.type}`} style={{ padding: '14px 20px', borderRadius: '14px' }}>
                            {a.icon}
                            <span style={{ fontSize: '0.88rem' }}>{a.text}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="modal__stat-grid">
                <InfoItem label="Phone Number" value={d.phone} icon={<Phone size={14} />} />
                <div className="modal__stat-card">
                    <p className="modal__stat-label">Driver Status</p>
                    <p className="modal__stat-value capitalize" style={{ fontSize: '1rem' }}>
                        <span className="status-dot" style={{ width: '10px', height: '10px', backgroundColor: d.status === 'available' ? 'var(--success-500)' : 'var(--warning-500)' }} />
                        {d.status?.replace('-', ' ')}
                    </p>
                </div>
                <InfoItem label="License Expiry" value={d.license_expiry ? new Date(d.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} icon={<Calendar size={14} />} />
                <InfoItem label="Average Rating" value={`${d.rating || 'N.A'} / 5`} icon={<Star size={14} className="text-amber-500" fill="currentColor" />} />
            </div>

            <div>
                <p className="modal__label" style={{ marginBottom: '16px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Performance Summary</p>
                <div className="modal__stat-grid modal__stat-grid--3">
                    <MiniKPI label="Total Trips" value={d.total_trips} />
                    <MiniKPI label="Completion" value={`${d.completion_rate}%`} accent={d.completion_rate >= 80 ? 'positive' : 'caution'} />
                    <MiniKPI label="Safety Score" value={d.safety_score} accent={d.safety_score >= 80 ? 'positive' : d.safety_score >= 60 ? 'caution' : 'danger'} />
                </div>
            </div>

            <div className="modal__stat-grid">
                <MiniKPI label="Historical On-time Rate" value={`${d.ontime_rate}%`} active />
                <MiniKPI label="Total Incidents" value={d.issue_count} accent={d.issue_count > 3 ? 'danger' : d.issue_count > 0 ? 'caution' : 'default'} />
            </div>
        </div>
    );
}

function PerformanceTab({ d }) {
    const monthlyTrips = d.monthly_trips || [];
    const monthlyLate = d.monthly_late || [];
    const hasData = monthlyTrips.length > 0;

    return (
        <div className="space-y-8">
            <ChartCard title="Monthly Trip Volume">
                <div style={{ height: '240px', width: '100%' }}>
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrips} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--accent-500)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--accent-600)" stopOpacity={0.85} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<Tip />} cursor={{ fill: 'var(--bg-inset)', radius: 4 }} />
                                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Trips" barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <Empty text="No trip volume data found" />}
                </div>
            </ChartCard>
            <ChartCard title="Late Deliveries History">
                <div style={{ height: '240px', width: '100%' }}>
                    {hasData ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyLate} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<Tip />} />
                                <Line type="monotone" dataKey="count" stroke="var(--danger-500)" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 3, stroke: 'var(--danger-500)' }} activeDot={{ r: 7, fill: 'var(--danger-500)' }} name="Late" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <Empty text="No delivery history found" />}
                </div>
            </ChartCard>
        </div>
    );
}

function TripsTab({ d }) {
    const [showAll, setShowAll] = useState(false);
    const trips = d.trips || [];
    const visible = showAll ? trips : trips.slice(0, 10);
    return (
        <div>
            {trips.length === 0 ? <Empty text="No trip history available" /> : (
                <>
                    <div className="modal__table-wrap">
                        <table className="modal__table">
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>Date</th>
                                    <th style={{ textAlign: 'right' }}>Distance</th>
                                    <th style={{ textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((t, i) => (
                                    <tr key={i} style={{ transition: 'background var(--duration-fast)' }}>
                                        <td>
                                            <p className="font-bold text-slate-900" style={{ fontSize: '0.85rem' }}>{t.origin}</p>
                                            <p className="text-[10px] text-slate-400 font-medium tracking-wide">TO {t.destination}</p>
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{new Date(t.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                        <td style={{ textAlign: 'right' }} className="tabular-nums font-bold text-slate-700">{t.distance_km} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>KM</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            {t.is_late ? (
                                                <span className="modal__badge badge-danger" style={{ background: 'var(--danger-50)', color: 'var(--danger-700)', border: '1px solid var(--danger-100)' }}>Late</span>
                                            ) : (
                                                <span className="modal__badge badge-success" style={{ background: 'var(--success-50)', color: 'var(--success-700)', border: '1px solid var(--success-100)' }}>{t.status}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {trips.length > 10 && (
                        <button onClick={() => setShowAll(!showAll)} className="w-full flex items-center justify-center gap-2 py-5 mt-3 text-sm text-slate-500 hover:text-accent-600 font-bold transition-all hover:bg-slate-50 rounded-xl">
                            {showAll ? <><ChevronUp size={18} /> SHOW FEWER TRIPS</> : <><ChevronDown size={18} /> VIEW ALL {trips.length} TRIPS</>}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

function IssuesTab({ d }) {
    const issues = d.issues || [];
    return (
        <div className="space-y-5">
            {issues.length === 0 ? <Empty text="No reported incidents" /> : (
                <>
                    {issues.map((iss, i) => (
                        <div key={i} className="modal__stat-card" style={{ gap: '12px', background: 'var(--bg-surface)', padding: '20px 24px', position: 'relative' }}>
                            <div className="flex items-start justify-between">
                                <p className="font-extrabold text-slate-900" style={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}>{iss.issue_type}</p>
                                <span className={`modal__badge ${iss.severity === 'critical' || iss.severity === 'high' ? 'badge-danger' : 'badge-warning'}`} style={{ borderRadius: '8px', padding: '4px 10px' }}>{iss.severity}</span>
                            </div>
                            <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>{iss.description}</p>
                            <div className="flex items-center flex-wrap gap-6 mt-2 border-t border-slate-100 pt-4">
                                {iss.location && <span className="flex items-center gap-2 text-[11px] text-slate-500 font-medium"><MapPin size={14} className="text-slate-400" />{iss.location}</span>}
                                <span className="flex items-center gap-2 text-[11px] text-slate-500 font-medium"><Clock size={14} className="text-slate-400" />{new Date(iss.occurred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <span className={`modal__badge ${iss.status === 'open' ? 'badge-danger' : 'badge-success'}`} style={{ marginLeft: 'auto', fontSize: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{iss.status?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="modal__stat-card" style={{ padding: '24px 28px', gap: '24px', background: 'linear-gradient(to bottom, #fff, var(--bg-surface))' }}>
            <p className="modal__stat-label" style={{ fontSize: '0.7rem', fontWeight: 800 }}>{title}</p>
            {children}
        </div>
    );
}

function InfoItem({ label, value, icon }) {
    return (
        <div className="modal__stat-card">
            <p className="modal__stat-label">{label}</p>
            <div className="modal__stat-value" style={{ fontSize: '1rem' }}>
                {icon && <span style={{ color: 'var(--text-muted)', opacity: 0.8 }}>{icon}</span>}
                <p className="capitalize font-bold">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

function MiniKPI({ label, value, accent, active }) {
    const color = accent === 'positive' ? 'var(--success-600)' : accent === 'caution' ? 'var(--warning-600)' : accent === 'danger' ? 'var(--danger-600)' : 'var(--text-heading)';
    return (
        <div className={`modal__stat-card ${active ? 'modal__stat-card--accent' : ''}`} style={{ textAlign: 'center', padding: '20px' }}>
            <p className="modal__stat-label" style={{ marginBottom: '8px' }}>{label}</p>
            <p className="modal__stat-value modal__stat-value--large" style={{ color, justifyContent: 'center' }}>{value}</p>
        </div>
    );
}

function Empty({ text }) {
    return (
        <div className="py-20 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/60">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <Shield size={20} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400 font-bold tracking-wide">{text.toUpperCase()}</p>
        </div>
    );
}

function Tip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl text-[11px] shadow-2xl border border-white/10">
            <p className="text-slate-400 mb-2 font-bold tracking-wider uppercase" style={{ fontSize: '10px' }}>{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color }} />
                    <p className="font-extrabold" style={{ color: '#fff' }}>{p.name}: <span className="ml-1" style={{ color: p.color }}>{p.value}</span></p>
                </div>
            ))}
        </div>
    );
}
