import { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import api from '../utils/api';
import './Modal.css';

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
        <div className="modal">
            <div className="modal__overlay" onClick={onClose} />
            <div className="modal__container">
                <div className="modal__header">
                    <div className="modal__header-info">
                        <div className="modal__icon-wrap modal__icon-wrap--accent">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2 className="modal__title">Add Driver</h2>
                            <p className="modal__subtitle">Register a new driver to the fleet</p>
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

                    <div className="modal__grid">
                        <Field label="Full Name" value={form.name} onChange={v => set('name', v)} error={errors.name} placeholder="Rajesh Kumar" required />
                        <Field label="Phone Number" value={form.phone} onChange={v => set('phone', v)} error={errors.phone} placeholder="9876543210" required />
                    </div>

                    <div className="modal__grid" style={{ marginTop: '24px' }}>
                        <Field label="License Number" value={form.license_number} onChange={v => set('license_number', v)} error={errors.license_number} placeholder="GJ-05-2021-0012345" required />
                        <div className="modal__field">
                            <label className="modal__label">License Expiry<span>*</span></label>
                            <input type="date" value={form.license_expiry} onChange={e => set('license_expiry', e.target.value)}
                                className={`modal__input ${errors.license_expiry ? 'modal__input--error' : ''}`} />
                            {errors.license_expiry && <p className="modal__error">{errors.license_expiry}</p>}
                        </div>
                    </div>
                </div>

                <div className="modal__footer">
                    <button onClick={onClose} className="modal__btn modal__btn--ghost">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="modal__btn modal__btn--primary">
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Add Driver
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, error, placeholder, required }) {
    return (
        <div className="modal__field">
            <label className="modal__label">{label}{required && <span>*</span>}</label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className={`modal__input ${error ? 'modal__input--error' : ''}`} />
            {error && <p className="modal__error">{error}</p>}
        </div>
    );
}
