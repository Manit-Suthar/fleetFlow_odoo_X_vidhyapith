import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ChevronDown, Loader2 } from 'lucide-react';
import api from '../utils/api';

const TYPES = ['Traffic Violation', 'Late Delivery Pattern', 'Customer Complaint', 'Vehicle Misuse', 'Document Issue', 'Safety Violation', 'Other'];
const SEVS = ['low', 'medium', 'high', 'critical'];
const SEV_STYLES = {
    low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', activeBg: 'bg-emerald-100 border-emerald-300' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', activeBg: 'bg-amber-100 border-amber-300' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', activeBg: 'bg-orange-100 border-orange-300' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', activeBg: 'bg-red-100 border-red-300' },
};

export default function ReportIssueModal({ drivers, onClose, onSubmit }) {
    const [form, setForm] = useState({ driver_id: '', issue_type: TYPES[0], severity: 'medium', occurred_at: new Date().toISOString().slice(0, 16), location: '', description: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [driverSearch, setDriverSearch] = useState('');
    const [showDriverList, setShowDriverList] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDriverList(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const filteredDrivers = drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()));
    const selectedDriver = drivers.find(d => d.id === Number(form.driver_id));

    const validate = () => {
        const e = {};
        if (!form.driver_id) e.driver_id = 'Select a driver';
        if (!form.description.trim()) e.description = 'Description is required';
        if (form.description.trim().length > 0 && form.description.trim().length < 10) e.description = 'At least 10 characters';
        if (!form.occurred_at) e.occurred_at = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await api.post('/issues', form);
            onSubmit();
        } catch (err) {
            setErrors({ form: err.response?.data?.error || 'Failed to submit' });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-overlay" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Report Issue</h2>
                            <p className="text-xs text-slate-500">File a new incident report</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {errors.form && (
                        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                            {errors.form}
                        </div>
                    )}

                    <div ref={ref}>
                        <Label>Driver <span className="text-red-500">*</span></Label>
                        <div className="relative">
                            <button type="button" onClick={() => setShowDriverList(!showDriverList)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg text-sm text-left transition-colors ${errors.driver_id ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                <span className={selectedDriver ? 'text-slate-900 font-medium' : 'text-slate-400'}>{selectedDriver ? selectedDriver.name : 'Select driver...'}</span>
                                <ChevronDown size={16} className="text-slate-400" />
                            </button>
                            {showDriverList && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                                    <input type="text" placeholder="Search drivers..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 border-b border-slate-100 focus:outline-none" autoFocus />
                                    <div className="max-h-44 overflow-y-auto py-1">
                                        {filteredDrivers.length === 0 ? (
                                            <p className="px-4 py-3 text-sm text-slate-400">No drivers found</p>
                                        ) : filteredDrivers.map(d => (
                                            <button key={d.id} onClick={() => { setForm({ ...form, driver_id: d.id }); setShowDriverList(false); setDriverSearch(''); }}
                                                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                                <span className="font-medium">{d.name}</span>
                                                <span className="text-xs text-slate-400 font-mono">{d.license_number}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.driver_id && <ErrorMsg msg={errors.driver_id} />}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Issue Type</Label>
                            <select value={form.issue_type} onChange={e => setForm({ ...form, issue_type: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus-ring">
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label>Severity</Label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {SEVS.map(s => (
                                    <button key={s} type="button" onClick={() => setForm({ ...form, severity: s })}
                                        className={`py-2 rounded-lg text-xs font-semibold capitalize border transition-all ${form.severity === s ? SEV_STYLES[s].activeBg : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                            }`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Date & Time <span className="text-red-500">*</span></Label>
                            <input type="datetime-local" value={form.occurred_at} onChange={e => setForm({ ...form, occurred_at: e.target.value })}
                                className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus-ring ${errors.occurred_at ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                            {errors.occurred_at && <ErrorMsg msg={errors.occurred_at} />}
                        </div>
                        <div>
                            <Label>Location <span className="text-slate-400 font-normal">(optional)</span></Label>
                            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City or highway..."
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus-ring" />
                        </div>
                    </div>

                    <div>
                        <Label>Description <span className="text-red-500">*</span></Label>
                        <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident in detail..."
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus-ring resize-none ${errors.description ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                        <div className="flex items-center justify-between mt-1.5">
                            {errors.description && <ErrorMsg msg={errors.description} />}
                            <span className="text-xs text-slate-400 ml-auto">{form.description.length}/500</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 border border-red-600 rounded-lg text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
}

function Label({ children }) {
    return <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">{children}</label>;
}

function ErrorMsg({ msg }) {
    if (!msg) return null;
    return <p className="text-xs text-red-600 mt-1.5 font-medium">{msg}</p>;
}
