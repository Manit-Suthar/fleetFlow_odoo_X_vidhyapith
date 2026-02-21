import { useState, useEffect } from 'react';
import { X, Shield, Clock, TrendingUp, AlertTriangle, MapPin, Calendar, ChevronDown, ChevronUp, Loader2, Phone, Star } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const TABS = ['Overview', 'Performance', 'Trips', 'Issues'];

export default function DriverProfileModal({ driver, onClose }) {
    const [tab, setTab] = useState(0);
    const [full, setFull] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/drivers/${driver.id}`).then(r => setFull(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, [driver.id]);

    const d = full || driver;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-overlay" onClick={onClose} />
            <div className="relative w-[480px] h-full bg-white border-l border-slate-200 shadow-2xl overflow-y-auto animate-slide-in">
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 pt-5 pb-0">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700">
                                {d.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{d.name}</h2>
                                <p className="text-xs text-slate-500 font-mono">{d.license_number}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex gap-0">
                        {TABS.map((t, i) => (
                            <button key={t} onClick={() => setTab(i)}
                                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === i ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-700'
                                    }`}>{t}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={20} className="text-slate-400 animate-spin" />
                    </div>
                ) : (
                    <div className="p-6">
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
    if (expDays !== null && expDays < 30) alerts.push({ type: expDays < 0 ? 'danger' : 'caution', icon: <Calendar size={14} />, text: expDays < 0 ? 'License expired' : `License expires in ${expDays} days` });
    if (d.issue_count > 2) alerts.push({ type: 'caution', icon: <AlertTriangle size={14} />, text: `${d.issue_count} open issues require attention` });
    if (d.safety_score < 60) alerts.push({ type: 'danger', icon: <Shield size={14} />, text: 'Safety score below threshold' });

    return (
        <div className="space-y-5">
            {alerts.length > 0 && (
                <div className="space-y-2">
                    {alerts.map((a, i) => (
                        <div key={i} className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold ${a.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            {a.icon}
                            {a.text}
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Phone" value={d.phone} icon={<Phone size={14} />} />
                <InfoItem label="Status" value={d.status?.replace('-', ' ')} />
                <InfoItem label="License Expiry" value={d.license_expiry ? new Date(d.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                <InfoItem label="Rating" value={`${d.rating || 'N/A'} / 5`} icon={<Star size={14} className="text-amber-500" />} />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <MiniKPI label="Total Trips" value={d.total_trips} />
                <MiniKPI label="Completion" value={`${d.completion_rate}%`} accent={d.completion_rate >= 80 ? 'positive' : 'caution'} />
                <MiniKPI label="Safety" value={d.safety_score} accent={d.safety_score >= 80 ? 'positive' : d.safety_score >= 60 ? 'caution' : 'danger'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <MiniKPI label="On-time Rate" value={`${d.ontime_rate}%`} />
                <MiniKPI label="Late Deliveries" value={d.late_count || 0} accent={(d.late_count || 0) > 3 ? 'danger' : 'default'} />
            </div>
        </div>
    );
}

function PerformanceTab({ d }) {
    const monthlyTrips = d.monthly_trips || [];
    const monthlyLate = d.monthly_late || [];
    return (
        <div className="space-y-5">
            <ChartCard title="Trips Per Month">
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyTrips}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip content={<Tip />} />
                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Trips" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Late Deliveries Trend">
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthlyLate}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip content={<Tip />} />
                        <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} dot={{ r: 4, fill: '#dc2626' }} name="Late" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>
            {monthlyTrips.length === 0 && <Empty text="No performance data available" />}
        </div>
    );
}

function TripsTab({ d }) {
    const [showAll, setShowAll] = useState(false);
    const trips = d.trips || [];
    const visible = showAll ? trips : trips.slice(0, 8);
    return (
        <div>
            {trips.length === 0 ? <Empty text="No trips recorded" /> : (
                <>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider pb-3">Route</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider pb-3">Date</th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider pb-3">Distance</th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visible.map((t, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pr-3">
                                        <p className="text-sm font-semibold text-slate-900">{t.origin}</p>
                                        <p className="text-xs text-slate-400">to {t.destination}</p>
                                    </td>
                                    <td className="py-3 text-xs text-slate-500">{new Date(t.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                    <td className="py-3 text-right text-sm text-slate-600 tabular-nums">{t.distance_km} km</td>
                                    <td className="py-3 text-right">
                                        {t.is_late ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">Late</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{t.status}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {trips.length > 8 && (
                        <button onClick={() => setShowAll(!showAll)} className="w-full flex items-center justify-center gap-1 py-3 mt-3 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
                            {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {trips.length} trips</>}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

function IssuesTab({ d }) {
    const issues = d.issues || [];
    const severityClr = { 
        low: 'text-emerald-600 bg-emerald-50 border-emerald-200', 
        medium: 'text-amber-600 bg-amber-50 border-amber-200', 
        high: 'text-orange-600 bg-orange-50 border-orange-200', 
        critical: 'text-red-600 bg-red-50 border-red-200' 
    };
    return (
        <div>
            {issues.length === 0 ? <Empty text="No issues reported" /> : (
                <div className="space-y-3">
                    {issues.map((iss, i) => (
                        <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-semibold text-slate-900">{iss.issue_type}</p>
                                <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-md border ${severityClr[iss.severity] || 'text-slate-500 bg-slate-100'}`}>{iss.severity}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3 leading-relaxed">{iss.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                {iss.location && <span className="flex items-center gap-1"><MapPin size={12} />{iss.location}</span>}
                                <span className="flex items-center gap-1"><Clock size={12} />{new Date(iss.occurred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                <span className={`capitalize px-2 py-0.5 rounded-md font-semibold text-xs ${iss.status === 'open' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        iss.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>{iss.status?.replace('_', ' ')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>
            {children}
        </div>
    );
}

function InfoItem({ label, value, icon }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">{label}</p>
            <div className="flex items-center gap-2">
                {icon && <span className="text-slate-400">{icon}</span>}
                <p className="text-sm font-semibold text-slate-900 capitalize">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

function MiniKPI({ label, value, accent }) {
    const c = accent === 'positive' ? 'text-emerald-600' : accent === 'caution' ? 'text-amber-600' : accent === 'danger' ? 'text-red-600' : 'text-slate-900';
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
            <p className="text-[11px] text-slate-500 font-medium mb-1">{label}</p>
            <p className={`text-lg font-bold ${c}`}>{value}</p>
        </div>
    );
}

function Empty({ text }) {
    return (
        <div className="py-12 text-center">
            <p className="text-sm text-slate-400">{text}</p>
        </div>
    );
}

function Tip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg text-xs shadow-lg">
            <p className="text-slate-300 mb-1">{label}</p>
            {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>)}
        </div>
    );
}
