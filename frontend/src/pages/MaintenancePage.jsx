import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import AddServiceModal from '../components/maintenance/AddServiceModal';
import { HiOutlinePlus, HiOutlineWrench } from 'react-icons/hi2';
import './MaintenancePage.css';

const API_BASE = 'http://localhost:5000/api';

export default function MaintenancePage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/maintenance`);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch maintenance logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleComplete = async (id) => {
    try {
      await axios.put(`${API_BASE}/maintenance/${id}/complete`, {}, {
        headers: { 'x-user-role': 'manager' }
      });
      fetchLogs();
    } catch (err) {
      console.error('Failed to complete maintenance:', err);
    }
  };

  const statuses = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

  const filteredLogs = statusFilter === 'All'
    ? logs
    : logs.filter(log => log.status === statusFilter);

  return (
    <div className="maint-page">
      {/* ── Header ── */}
      <div className="maint-page__header">
        <div className="maint-page__header-left">
          <div className="maint-page__icon-wrap">
            <HiOutlineWrench />
          </div>
          <div>
            <h1 className="maint-page__title">Maintenance & Service Logs</h1>
            <p className="maint-page__subtitle">
              {logs.length} total records
              {statusFilter !== 'All' && ` / ${filteredLogs.length} ${statusFilter.toLowerCase()}`}
            </p>
          </div>
        </div>
        <button className="maint-page__add-btn" onClick={() => setModalOpen(true)}>
          <HiOutlinePlus />
          Add Service
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="maint-page__filters">
        {statuses.map(s => (
          <button
            key={s}
            className={`maint-page__filter-btn ${statusFilter === s ? 'maint-page__filter-btn--active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <MaintenanceTable
        data={filteredLogs}
        onComplete={handleComplete}
        loading={loading}
      />

      {/* ── Modal ── */}
      <AddServiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchLogs}
      />
    </div>
  );
}
