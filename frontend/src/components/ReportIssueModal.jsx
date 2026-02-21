import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ChevronDown, Loader2, MapPin, Clock } from 'lucide-react';
import api from '../utils/api';
import './Modal.css';

const TYPES = ['Traffic Violation', 'Late Delivery Pattern', 'Customer Complaint', 'Vehicle Misuse', 'Document Issue', 'Safety Violation', 'Other'];
const SEVS = ['low', 'medium', 'high', 'critical'];

export default function ReportIssueModal({ drivers, onClose, onSubmit }) {
    const [form, setForm] = useState({
        driver_id: '',
        issue_type: TYPES[0],
        severity: 'medium',
        occurred_at: new Date().toISOString().slice(0, 16),
        location: '',
        description: ''
    });
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

    const filteredDrivers = (drivers || []).filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()));
    const selectedDriver = (drivers || []).find(d => Number(d.id) === Number(form.driver_id));

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
        <div className="modal">
            <div className="modal__overlay" onClick={onClose} />
            <div className="modal__container modal__container--danger">
                <div className="modal__header">
                    <div className="modal__header-info">
                        <div className="modal__icon-wrap modal__icon-wrap--danger">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2 className="modal__title">Report Issue</h2>
                            <p className="modal__subtitle">File a new incident report for a driver</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal__close">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal__body">
                    {errors.form && (
                        <div className="modal__error" style={{ marginBottom: '20px', padding: '12px', background: 'var(--danger-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-200)' }}>
                            {errors.form}
                        </div>
                    )}

                    <div className="modal__field" ref={ref}>
                        <label className="modal__label">Driver <span>*</span></label>
                        <div className="relative">
                            <button type="button" onClick={() => setShowDriverList(!showDriverList)}
                                className={`modal__input ${errors.driver_id ? 'modal__input--error' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer' }}>
                                <span style={{ color: selectedDriver ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: selectedDriver ? '600' : '400' }}>
                                    {selectedDriver ? selectedDriver.name : 'Select driver...'}
                                </span>
                                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                            </button>
                            {showDriverList && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 20, overflow: 'hidden'
                                }}>
                                    <input type="text" placeholder="Search drivers..." value={driverSearch} onChange={e => setDriverSearch(e.target.value)}
                                        className="modal__input" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-base)' }} autoFocus />
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                                        {filteredDrivers.length === 0 ? (
                                            <p style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>No drivers found</p>
                                        ) : filteredDrivers.map(d => (
                                            <button key={d.id} onClick={() => { setForm({ ...form, driver_id: d.id }); setShowDriverList(false); setDriverSearch(''); }}
                                                style={{
                                                    width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: '0.88rem',
                                                    color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                                <span style={{ fontWeight: '500' }}>{d.name}</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.license_number}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.driver_id && <p className="modal__error">{errors.driver_id}</p>}
                    </div>

                    <div className="modal__grid">
                        <div className="modal__field">
                            <label className="modal__label">Issue Type</label>
                            <select value={form.issue_type} onChange={e => setForm({ ...form, issue_type: e.target.value })}
                                className="modal__input" style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px', paddingRight: '40px' }}>
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="modal__field">
                            <label className="modal__label">Severity</label>
                            <div className="modal__grid" style={{ gap: '8px' }}>
                                {SEVS.map(s => (
                                    <button key={s} type="button" onClick={() => setForm({ ...form, severity: s })}
                                        style={{
                                            padding: '8px 0', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', fontWeight: '700',
                                            textTransform: 'capitalize', border: '1px solid', transition: 'all var(--duration-fast)',
                                            ...(form.severity === s ? {
                                                background: s === 'low' ? 'var(--success-50)' : s === 'medium' ? 'var(--warning-50)' : s === 'high' ? 'rgba(234, 88, 12, 0.1)' : 'var(--danger-50)',
                                                borderColor: s === 'low' ? 'var(--success-200)' : s === 'medium' ? 'var(--warning-200)' : s === 'high' ? 'rgba(234, 88, 12, 0.3)' : 'var(--danger-200)',
                                                color: s === 'low' ? 'var(--success-600)' : s === 'medium' ? 'var(--warning-600)' : s === 'high' ? '#ea580c' : 'var(--danger-600)'
                                            } : {
                                                background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)'
                                            })
                                        }}
                                        onMouseEnter={e => { if (form.severity !== s) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                                        onMouseLeave={e => { if (form.severity !== s) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal__grid">
                        <div className="modal__field">
                            <label className="modal__label">Date & Time <span>*</span></label>
                            <input type="datetime-local" value={form.occurred_at} onChange={e => setForm({ ...form, occurred_at: e.target.value })}
                                className={`modal__input ${errors.occurred_at ? 'modal__input--error' : ''}`} />
                            {errors.occurred_at && <p className="modal__error">{errors.occurred_at}</p>}
                        </div>
                        <div className="modal__field">
                            <label className="modal__label">Location <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.68rem' }}>(optional)</span></label>
                            <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City or highway..."
                                className="modal__input" />
                        </div>
                    </div>

                    <div className="modal__field">
                        <label className="modal__label">Description <span>*</span></label>
                        <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident in detail..."
                            className={`modal__input ${errors.description ? 'modal__input--error' : ''}`} style={{ resize: 'none' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                            {errors.description && <p className="modal__error" style={{ marginTop: 0 }}>{errors.description}</p>}
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{form.description.length}/500</span>
                        </div>
                    </div>
                </div>

                <div className="modal__footer">
                    <button onClick={onClose} className="modal__btn modal__btn--ghost">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="modal__btn modal__btn--danger">
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Submit Report
                    </button>
                </div>
            </div>
        </div>
    );
}
