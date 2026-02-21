import { useState, useEffect } from 'react';
import { HiTrendingUp, HiPlus, HiX } from 'react-icons/hi';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../utils/api';
import './Page6.css';

function FuelAndAnalytics() {
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('all');

    // Raw Data State
    const [allFuel, setAllFuel] = useState([]);
    const [allMaint, setAllMaint] = useState([]);

    // Derived State
    const [chartData, setChartData] = useState([]);
    const [vehicleStats, setVehicleStats] = useState({ totalFuel: 0, totalMaintenance: 0 });

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        vehicle_id: '', fuel_type: 'diesel', quantity_liters: '', cost_per_liter: '', odometer_km: '', fueled_at: ''
    });

    useEffect(() => {
        fetchAppData();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [allFuel, allMaint, selectedVehicle]);

    const fetchAppData = async () => {
        try {
            setLoading(true);
            const [fuelRes, maintRes, vehRes] = await Promise.all([
                api.get('/fuel'),
                api.get('/maintenance'),
                api.get('/maintenance/vehicles')
            ]);

            setAllFuel(fuelRes.data);
            setAllMaint(maintRes.data);
            setVehicles(vehRes.data);

            if (vehRes.data.length > 0) {
                setFormData(prev => ({ ...prev, vehicle_id: vehRes.data[0].id }));
            }
        } catch (err) {
            console.error('Error fetching analytics data:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const filteredFuel = selectedVehicle === 'all'
            ? allFuel
            : allFuel.filter(f => f.vehicle_id.toString() === selectedVehicle);

        const filteredMaint = selectedVehicle === 'all'
            ? allMaint
            : allMaint.filter(m => m.vehicle_id.toString() === selectedVehicle);

        const fuelCost = filteredFuel.reduce((sum, item) => sum + (Number(item.quantity_liters) * Number(item.cost_per_liter)), 0);
        const maintCost = filteredMaint.reduce((sum, item) => sum + Number(item.cost), 0);

        setVehicleStats({ totalFuel: fuelCost, totalMaintenance: maintCost });

        // Simple mock for the 6-month chart - can be replaced with real grouped data later
        setChartData([
            { name: 'Jan', fuel: fuelCost * 0.15, maintenance: maintCost * 0.1 },
            { name: 'Feb', fuel: fuelCost * 0.1, maintenance: maintCost * 0.2 },
            { name: 'Mar', fuel: fuelCost * 0.2, maintenance: maintCost * 0.15 },
            { name: 'Apr', fuel: fuelCost * 0.15, maintenance: maintCost * 0.3 },
            { name: 'May', fuel: fuelCost * 0.25, maintenance: maintCost * 0.05 },
            { name: 'Jun', fuel: fuelCost * 0.15, maintenance: maintCost * 0.2 },
        ]);
    };

    const handleCreateFuelLog = async (e) => {
        e.preventDefault();
        try {
            const dateStr = formData.fueled_at ? new Date(formData.fueled_at).toISOString() : new Date().toISOString();
            await api.post('/fuel', { ...formData, fueled_at: dateStr });
            setModalOpen(false);
            setFormData(prev => ({ ...prev, quantity_liters: '', cost_per_liter: '', odometer_km: '', fueled_at: '' }));
            fetchAppData();
        } catch (err) {
            console.error('Error saving fuel log:', err);
            const msg = err.response?.data?.error || err.message;
            alert('Failed to add fuel record.\n\nDetails: ' + msg);
        }
    };

    const handleDownloadReport = () => {
        const title = selectedVehicle === 'all' ? 'All Vehicles' : vehicles.find(v => v.id.toString() === selectedVehicle)?.vehicle_name;

        let csvRows = [
            [`Report: Fleet Analytics & Costs - ${title}`],
            ['Generated On', new Date().toLocaleString()],
            []
        ];

        if (selectedVehicle === 'all') {
            csvRows.push(['OVERALL METRICS']);
            csvRows.push(['Total Fuel Cost (INR)', vehicleStats.totalFuel.toFixed(2)]);
            csvRows.push(['Total Maintenance Cost (INR)', vehicleStats.totalMaintenance.toFixed(2)]);
            csvRows.push(['Total Operational Cost (INR)', (vehicleStats.totalFuel + vehicleStats.totalMaintenance).toFixed(2)]);
            csvRows.push([]);

            csvRows.push(['VEHICLE BREAKDOWN']);
            csvRows.push(['Vehicle ID', 'Vehicle Name', 'Total Fuel Cost (INR)', 'Total Maintenance Cost (INR)', 'Total Operational Cost (INR)']);

            vehicles.forEach(v => {
                const vFuel = allFuel.filter(f => f.vehicle_id === v.id).reduce((sum, item) => sum + (Number(item.quantity_liters) * Number(item.cost_per_liter)), 0);
                const vMaint = allMaint.filter(m => m.vehicle_id === v.id).reduce((sum, item) => sum + Number(item.cost), 0);
                csvRows.push([v.id, `"${v.vehicle_name}"`, vFuel.toFixed(2), vMaint.toFixed(2), (vFuel + vMaint).toFixed(2)]);
            });
            csvRows.push([]);
        } else {
            csvRows.push(['Metric', 'Value (INR)']);
            csvRows.push(['Total Fuel Cost', vehicleStats.totalFuel.toFixed(2)]);
            csvRows.push(['Total Maintenance Cost', vehicleStats.totalMaintenance.toFixed(2)]);
            csvRows.push(['Total Operational Cost', (vehicleStats.totalFuel + vehicleStats.totalMaintenance).toFixed(2)]);
            csvRows.push([]);
            csvRows.push(['Month', 'Est. Fuel Cost', 'Est. Maintenance Cost']);
            chartData.forEach(row => csvRows.push([row.name, row.fuel.toFixed(2), row.maintenance.toFixed(2)]));
        }

        const csvContent = csvRows.map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `fleet_analytics_report_${selectedVehicle}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="page6">
            <div className="page6-header">
                <div>
                    <h1 className="page6-title">Fleet Analytics & Costs</h1>
                    <p className="page6-subtitle">Analyze fuel and maintenance expenses</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        className="page6-select"
                        value={selectedVehicle}
                        onChange={e => setSelectedVehicle(e.target.value)}
                    >
                        <option value="all">All Vehicles</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.id} - {v.vehicle_name}</option>
                        ))}
                    </select>

                    <button className="page6-btn-secondary" onClick={() => setModalOpen(true)}>
                        <HiPlus /> Log Fuel
                    </button>

                    <button className="page6-btn-primary" onClick={handleDownloadReport}>
                        <HiTrendingUp /> Generate Report
                    </button>
                </div>
            </div>

            <div className="page6-grid">
                <div className="page6-card">
                    <h3 className="page6-card-title">Total Fuel Cost</h3>
                    <p className="page6-card-value">₹{vehicleStats.totalFuel.toLocaleString()}</p>
                    <span className="badge badge-success">Active Tracking</span>
                </div>
                <div className="page6-card">
                    <h3 className="page6-card-title">Total Maintenance</h3>
                    <p className="page6-card-value">₹{vehicleStats.totalMaintenance.toLocaleString()}</p>
                    <span className="badge badge-warning">Needs Review</span>
                </div>
                <div className="page6-card">
                    <h3 className="page6-card-title">Total Operational Cost</h3>
                    <p className="page6-card-value">₹{(vehicleStats.totalFuel + vehicleStats.totalMaintenance).toLocaleString()}</p>
                    <span className="badge badge-info">{selectedVehicle === 'all' ? 'Fleet-wide' : 'Vehicle Total'}</span>
                </div>
            </div>

            <div className="page6-card page6-chart-card">
                <h3 className="page6-card-title">6-Month Trend Overlay</h3>
                {loading ? (
                    <div className="page6-loading">Loading chart...</div>
                ) : (
                    <div className="page6-chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, undefined]}
                                />
                                <Line type="monotone" dataKey="fuel" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="maintenance" stroke="var(--warning)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="page6-modal">
                    <div className="page6-modal-content">
                        <div className="page6-modal-header">
                            <h2>Log Fuel & Expense</h2>
                            <button className="page6-modal-close" onClick={() => setModalOpen(false)}><HiX /></button>
                        </div>
                        <form onSubmit={handleCreateFuelLog} className="page6-form">
                            <div className="page6-form-group">
                                <label>Vehicle</label>
                                <select className="page6-input" required value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}>
                                    <option value="" disabled>Select a vehicle</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.id} - {v.vehicle_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="page6-form-group">
                                <label>Fuel Type</label>
                                <select className="page6-input" required value={formData.fuel_type} onChange={e => setFormData({ ...formData, fuel_type: e.target.value })}>
                                    <option value="diesel">Diesel</option>
                                    <option value="petrol">Petrol</option>
                                    <option value="electric">Electric (Charge)</option>
                                    <option value="cng">CNG</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className="page6-form-group" style={{ flex: 1 }}>
                                    <label>Quantity (Liters/Units)</label>
                                    <input className="page6-input" type="number" step="0.01" required value={formData.quantity_liters} onChange={e => setFormData({ ...formData, quantity_liters: e.target.value })} />
                                </div>
                                <div className="page6-form-group" style={{ flex: 1 }}>
                                    <label>Cost Per Unit (INR)</label>
                                    <input className="page6-input" type="number" step="0.01" required value={formData.cost_per_liter} onChange={e => setFormData({ ...formData, cost_per_liter: e.target.value })} />
                                </div>
                            </div>
                            <div className="page6-form-group">
                                <label>Odometer Reading (KM)</label>
                                <input className="page6-input" type="number" value={formData.odometer_km} onChange={e => setFormData({ ...formData, odometer_km: e.target.value })} />
                            </div>
                            <div className="page6-form-group">
                                <label>Date</label>
                                <input className="page6-input" type="date" required value={formData.fueled_at} onChange={e => setFormData({ ...formData, fueled_at: e.target.value })} />
                            </div>
                            <div className="page6-modal-actions">
                                <button type="button" className="page6-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="page6-btn-primary">Save Fuel Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FuelAndAnalytics;
