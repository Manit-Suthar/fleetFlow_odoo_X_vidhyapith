import { useState, useEffect } from 'react';
import {
    HiOutlineTruck,
    HiOutlineUserGroup,
    HiOutlineMap,
    HiOutlineCurrencyDollar,
    HiOutlineArrowSmRight,
    HiOutlinePlusCircle,
    HiOutlineRefresh
} from 'react-icons/hi';
import api from '../utils/api';
import './DashboardPage.css';

function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dashboard/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Vehicles',
            value: stats?.vehicles?.total || 0,
            sub: `${stats?.vehicles?.available || 0} available`,
            icon: HiOutlineTruck,
            color: 'accent',
        },
        {
            label: 'Active Drivers',
            value: stats?.drivers?.total || 0,
            sub: `${stats?.drivers?.on_trip || 0} on trip`,
            icon: HiOutlineUserGroup,
            color: 'success',
        },
        {
            label: 'Trips Today',
            value: stats?.trips?.today || 0,
            sub: `${stats?.trips?.in_progress || 0} in progress`,
            icon: HiOutlineMap,
            color: 'info',
        },
        {
            label: 'Revenue',
            value: `₹${Number(stats?.revenue?.total_revenue || 0).toLocaleString()}`,
            sub: 'from paid invoices',
            icon: HiOutlineCurrencyDollar,
            color: 'warning',
        },
    ];

    const getStatusBadge = (status) => {
        const map = {
            completed: 'badge-success',
            'in-progress': 'badge-info',
            scheduled: 'badge-warning',
            cancelled: 'badge-danger',
        };
        return map[status] || 'badge-primary';
    };

    if (loading) {
        return (
            <div className="dash-loading">
                <div className="dash-loading__spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dash">
            {/* Header */}
            <div className="dash__header">
                <div>
                    <h1 className="dash__title">Command Center</h1>
                    <p className="dash__subtitle">
                        Welcome back, {user?.name || 'User'}. Here's your fleet overview.
                    </p>
                </div>
                <div className="dash__actions">
                    <button className="dash__btn dash__btn--ghost" onClick={fetchStats}>
                        <HiOutlineRefresh /> Refresh
                    </button>
                    <button className="dash__btn dash__btn--primary">
                        <HiOutlinePlusCircle /> Add Vehicle
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="dash__stats">
                {statCards.map((card, i) => (
                    <div key={i} className={`dash__stat dash__stat--${card.color}`}>
                        <div className="dash__stat-top">
                            <div>
                                <p className="dash__stat-label">{card.label}</p>
                                <h2 className="dash__stat-value">{card.value}</h2>
                            </div>
                            <div className={`dash__stat-icon dash__stat-icon--${card.color}`}>
                                <card.icon />
                            </div>
                        </div>
                        <p className="dash__stat-sub">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="dash__grid">
                {/* Recent Trips */}
                <div className="dash__card dash__card--wide">
                    <div className="dash__card-header">
                        <h3>Recent Trips</h3>
                        <button className="dash__card-action">
                            View all <HiOutlineArrowSmRight />
                        </button>
                    </div>
                    <div className="dash__table-wrap">
                        <table className="dash__table">
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>Vehicle</th>
                                    <th>Driver</th>
                                    <th>Distance</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentTrips?.length > 0 ? (
                                    stats.recentTrips.map((trip) => (
                                        <tr key={trip.id}>
                                            <td>
                                                <span className="dash__route">
                                                    {trip.origin} → {trip.destination}
                                                </span>
                                            </td>
                                            <td>{trip.vehicle_name || '—'}</td>
                                            <td>{trip.driver_name || '—'}</td>
                                            <td>{trip.distance_km ? `${trip.distance_km} km` : '—'}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(trip.status)}`}>
                                                    {trip.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="dash__empty">
                                            No trips yet. Create your first trip to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Maintenance Alerts */}
                <div className="dash__card">
                    <div className="dash__card-header">
                        <h3>Maintenance Alerts</h3>
                    </div>
                    <div className="dash__alerts">
                        {stats?.maintenance?.length > 0 ? (
                            stats.maintenance.map((item) => (
                                <div key={item.id} className="dash__alert">
                                    <div className="dash__alert-indicator"></div>
                                    <div>
                                        <p className="dash__alert-title">{item.service_type}</p>
                                        <p className="dash__alert-meta">
                                            {item.vehicle_name} · {item.license_plate}
                                        </p>
                                        <p className="dash__alert-due">
                                            Due: {new Date(item.next_service).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="dash__empty-state">No upcoming maintenance</p>
                        )}
                    </div>
                </div>

                {/* Fleet Status */}
                <div className="dash__card">
                    <div className="dash__card-header">
                        <h3>Fleet Status</h3>
                    </div>
                    <div className="dash__fleet">
                        {[
                            { label: 'Available', count: stats?.vehicles?.available || 0, color: 'success' },
                            { label: 'In Trip', count: stats?.vehicles?.in_trip || 0, color: 'info' },
                            { label: 'Maintenance', count: stats?.vehicles?.in_maintenance || 0, color: 'warning' },
                        ].map((item, i) => (
                            <div key={i} className="dash__fleet-row">
                                <div className="dash__fleet-bar-bg">
                                    <div
                                        className={`dash__fleet-bar dash__fleet-bar--${item.color}`}
                                        style={{
                                            width: `${stats?.vehicles?.total > 0
                                                ? (item.count / stats.vehicles.total) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                                <div className="dash__fleet-meta">
                                    <span className={`dash__fleet-dot dash__fleet-dot--${item.color}`}></span>
                                    <span>{item.label}</span>
                                    <span className="dash__fleet-count">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dash__card dash__card--wide">
                    <div className="dash__card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="dash__quick-actions">
                        {[
                            { icon: HiOutlineTruck, label: 'Add Vehicle' },
                            { icon: HiOutlineMap, label: 'Create Trip' },
                            { icon: HiOutlineUserGroup, label: 'Add Driver' },
                            { icon: HiOutlineCurrencyDollar, label: 'New Invoice' },
                        ].map((action, i) => (
                            <button key={i} className="dash__quick-btn">
                                <action.icon className="dash__quick-icon" />
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
