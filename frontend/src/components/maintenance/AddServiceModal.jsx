import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiOutlineX } from 'react-icons/hi';
import './AddServiceModal.css';

const API_BASE = 'http://localhost:5000/api';

const SERVICE_TYPES = [
  'Oil Change', 'Brake Inspection', 'Tire Replacement', 'Tire Rotation',
  'AC Service', 'Battery Replacement', 'Engine Tune-up', 'Suspension Repair',
  'Clutch Plate', 'Transmission Repair', 'Radiator Service', 'Wheel Alignment',
  'Engine Overhaul', 'Brake Overhaul', 'Battery Health Check', 'Other'
];

export default function AddServiceModal({ open, onClose, onSuccess }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle_id: '',
    service_type: '',
    description: '',
    cost: '',
    scheduled_date: '',
    performed_by: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      axios.get(`${API_BASE}/maintenance`)
        .then(() => {
          // Fetch available vehicles — we do a raw query via a dedicated endpoint
          // For now, we'll use a simple fetch
          return fetch(`${API_BASE}/fuel`).then(r => r.json());
        })
        .catch(() => { });

      // Fetch vehicles list — reusing a lightweight approach
      fetch('http://localhost:5000/api/maintenance')
        .then(r => r.json())
        .then(data => {
          // Extract unique vehicles from maintenance data
          const seen = new Set();
          const vehicleList = [];
          if (Array.isArray(data)) {
            data.forEach(row => {
              if (!seen.has(row.vehicle_id)) {
                seen.add(row.vehicle_id);
                vehicleList.push({
                  id: row.vehicle_id,
                  name: row.vehicle_name,
                  plate: row.license_plate,
                });
              }
            });
          }
          setVehicles(vehicleList);
        })
        .catch(() => { });
    }
  }, [open]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.service_type || !form.cost || !form.scheduled_date) {
      setError('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/maintenance`, {
        vehicle_id: parseInt(form.vehicle_id),
        service_type: form.service_type,
        description: form.description,
        cost: parseFloat(form.cost),
        scheduled_date: form.scheduled_date,
        performed_by: form.performed_by,
      }, {
        headers: { 'x-user-role': 'manager' }
      });

      setForm({ vehicle_id: '', service_type: '', description: '', cost: '', scheduled_date: '', performed_by: '' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create maintenance log');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Schedule Service</h2>
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
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.plate}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">Service Type *</label>
            <select
              name="service_type"
              value={form.service_type}
              onChange={handleChange}
              className="modal-select"
              required
            >
              <option value="">Select service type</option>
              {SERVICE_TYPES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="modal-textarea"
              rows={3}
              placeholder="Service details..."
            />
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Cost (INR) *</label>
              <input
                type="number"
                name="cost"
                value={form.cost}
                onChange={handleChange}
                className="modal-input"
                placeholder="0.00"
                min="1"
                step="0.01"
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Scheduled Date *</label>
              <input
                type="date"
                name="scheduled_date"
                value={form.scheduled_date}
                onChange={handleChange}
                className="modal-input"
                required
              />
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Performed By</label>
            <input
              type="text"
              name="performed_by"
              value={form.performed_by}
              onChange={handleChange}
              className="modal-input"
              placeholder="Garage / Technician name"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn modal-btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn--primary" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
