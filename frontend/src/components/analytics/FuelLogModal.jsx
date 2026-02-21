import { useState } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import axios from 'axios';
import '../maintenance/AddServiceModal.css'; /* Reuse modal shared styles */

const API_BASE = 'http://localhost:5000/api';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];

export default function FuelLogModal({ open, onClose, onSuccess, vehicles }) {
  const [form, setForm] = useState({
    vehicle_id: '',
    fuel_type: '',
    quantity_liters: '',
    cost_per_liter: '',
    odometer_km: '',
    fueled_at: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalCost = (parseFloat(form.quantity_liters) || 0) * (parseFloat(form.cost_per_liter) || 0);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.fuel_type || !form.quantity_liters || !form.cost_per_liter) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/fuel`, {
        vehicle_id: parseInt(form.vehicle_id),
        fuel_type: form.fuel_type.toLowerCase(),
        quantity_liters: parseFloat(form.quantity_liters),
        cost_per_liter: parseFloat(form.cost_per_liter),
        odometer_km: form.odometer_km ? parseFloat(form.odometer_km) : null,
        fueled_at: form.fueled_at || null,
      }, {
        headers: { 'x-user-role': 'manager' }
      });

      setForm({ vehicle_id: '', fuel_type: '', quantity_liters: '', cost_per_liter: '', odometer_km: '', fueled_at: '' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log fuel entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Log Fuel Entry</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <HiOutlineX />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-field">
            <label className="modal-label">Vehicle *</label>
            <select
              name="vehicle_id"
              value={form.vehicle_id}
              onChange={handleChange}
              className="modal-select"
              required
            >
              <option value="">Select vehicle</option>
              {(vehicles || []).map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_name} — {v.license_plate}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">Fuel Type *</label>
            <select
              name="fuel_type"
              value={form.fuel_type}
              onChange={handleChange}
              className="modal-select"
              required
            >
              <option value="">Select fuel type</option>
              {FUEL_TYPES.map(ft => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Quantity (L) *</label>
              <input
                type="number"
                name="quantity_liters"
                value={form.quantity_liters}
                onChange={handleChange}
                className="modal-input"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Cost/Liter (INR) *</label>
              <input
                type="number"
                name="cost_per_liter"
                value={form.cost_per_liter}
                onChange={handleChange}
                className="modal-input"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          {totalCost > 0 && (
            <div className="modal-field">
              <label className="modal-label">Total Cost (auto-calculated)</label>
              <div className="modal-input" style={{ background: 'var(--ff-accent-dim)', color: 'var(--ff-accent)', fontWeight: 700, border: '1px solid rgba(196,138,46,0.2)' }}>
                {totalCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </div>
            </div>
          )}

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Odometer (KM)</label>
              <input
                type="number"
                name="odometer_km"
                value={form.odometer_km}
                onChange={handleChange}
                className="modal-input"
                placeholder="Current reading"
                min="0"
                step="0.01"
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Date & Time</label>
              <input
                type="datetime-local"
                name="fueled_at"
                value={form.fueled_at}
                onChange={handleChange}
                className="modal-input"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={submitting}>
              {submitting ? 'Logging...' : 'Log Fuel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
