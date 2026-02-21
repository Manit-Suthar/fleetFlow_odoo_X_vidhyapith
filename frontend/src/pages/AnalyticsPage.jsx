import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import KpiCard from '../components/analytics/KpiCard';
import CostDonutChart from '../components/analytics/CostDonutChart';
import CostTrendChart from '../components/analytics/CostTrendChart';
import FuelLogModal from '../components/analytics/FuelLogModal';
import { HiOutlineChartBar, HiOutlinePlus } from 'react-icons/hi2';
import { BsFuelPump } from 'react-icons/bs';
import { FiTool, FiTrendingUp, FiTruck } from 'react-icons/fi';
import './AnalyticsPage.css';

const API_BASE = 'http://localhost:5000/api';

export default function AnalyticsPage() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch vehicles list from fuel logs (extracting unique vehicles)
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get(`${API_BASE}/fuel`);
        const seen = new Set();
        const list = [];
        res.data.forEach(row => {
          if (!seen.has(row.vehicle_id)) {
            seen.add(row.vehicle_id);
            list.push({
              id: row.vehicle_id,
              vehicle_name: row.vehicle_name,
              license_plate: row.license_plate,
            });
          }
        });
        setVehicles(list);
        if (list.length > 0 && !selectedVehicle) {
          setSelectedVehicle(String(list[0].id));
        }
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      }
    };
    fetchVehicles();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/analytics/vehicle/${selectedVehicle}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleFuelSuccess = () => {
    fetchAnalytics();
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '--';
    return Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
  };

  const formatNumber = (val, decimals = 0) => {
    if (val === undefined || val === null) return '--';
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  return (
    <div className="analytics-page">
      {/* ── Header ── */}
      <div className="analytics-page__header">
        <div className="analytics-page__header-left">
          <div className="analytics-page__icon-wrap">
            <HiOutlineChartBar />
          </div>
          <div>
            <h1 className="analytics-page__title">Fuel & Cost Analytics</h1>
            <p className="analytics-page__subtitle">Operational cost breakdown by vehicle</p>
          </div>
        </div>
        <button className="analytics-page__add-btn" onClick={() => setModalOpen(true)}>
          <HiOutlinePlus />
          Log Fuel
        </button>
      </div>

      {/* ── Vehicle Selector ── */}
      <div className="analytics-page__selector">
        <label className="analytics-page__selector-label">Select Vehicle</label>
        <select
          className="analytics-page__selector-select"
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.vehicle_name} — {v.license_plate}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="analytics-page__loading">
          <div className="analytics-page__spinner" />
          Loading analytics...
        </div>
      )}

      {!loading && analytics && (
        <>
          {/* ── KPI Cards ── */}
          <div className="analytics-page__kpi-grid">
            <KpiCard
              icon={<BsFuelPump />}
              label="Total Fuel Cost"
              value={formatCurrency(analytics.fuelCost)}
              accentColor="#C48A2E"
            />
            <KpiCard
              icon={<FiTool />}
              label="Total Maintenance"
              value={formatCurrency(analytics.maintenanceCost)}
              accentColor="#42A5F5"
            />
            <KpiCard
              icon={<FiTrendingUp />}
              label="Cost per KM"
              value={formatCurrency(analytics.costPerKm)}
              unit="/km"
              accentColor="#66BB6A"
            />
            <KpiCard
              icon={<FiTruck />}
              label="Total Distance"
              value={formatNumber(analytics.totalDistance, 1)}
              unit="km"
              accentColor="#AB47BC"
            />
          </div>

          {/* ── Charts ── */}
          <div className="analytics-page__charts">
            <CostDonutChart
              fuelCost={analytics.fuelCost}
              maintenanceCost={analytics.maintenanceCost}
            />
            <CostTrendChart
              data={analytics.monthlyTrend}
            />
          </div>
        </>
      )}

      {!loading && !analytics && selectedVehicle && (
        <div className="analytics-page__empty">
          <p>No analytics data available for this vehicle.</p>
        </div>
      )}

      {/* ── Fuel Modal ── */}
      <FuelLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleFuelSuccess}
        vehicles={vehicles}
      />
    </div>
  );
}
