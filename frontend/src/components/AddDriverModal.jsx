import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function AddDriverModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({ name: '', phone: '', license_number: '', license_expiry: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.phone.trim()) e.phone = 'Required';
        else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter 10-digit number';
        if (!form.license_number.trim()) e.license_number = 'Required';
        if (!form.license_expiry) e.license_expiry = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await api.post('/drivers', form);
            onSubmit();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed';
            if (msg.includes('license')) setErrors({ license_number: 'License number already exists' });
            else setErrors({ form: msg });
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-overlay" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <UserPlus size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Add Driver</h2>
                            <p className="text-xs text-slate-500">Register a new driver</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {errors.form && (
                        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
                            {errors.form}
                        </div>
                    )}

                    <Field label="Full Name" value={form.name} onChange={v => set('name', v)} error={errors.name} placeholder="Rajesh Kumar" />
                    <Field label="Phone Number" value={form.phone} onChange={v => set('phone', v)} error={errors.phone} placeholder="9876543210" />
                    <Field label="License Number" value={form.license_number} onChange={v => set('license_number', v)} error={errors.license_number} placeholder="GJ-05-2021-0012345" />
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            License Expiry <span className="text-red-500">*</span>
                        </label>
                        <input type="date" value={form.license_expiry} onChange={e => set('license_expiry', e.target.value)}
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus-ring ${errors.license_expiry ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
                        {errors.license_expiry && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.license_expiry}</p>}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 border border-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Add Driver
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, error, placeholder }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {label} <span className="text-red-500">*</span>
            </label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className={`w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus-ring ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`} />
            {error && <p className="text-xs text-red-600 mt-1.5 font-medium">{error}</p>}
        </div>
    );
}
