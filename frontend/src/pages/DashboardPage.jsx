import { useState, useEffect } from 'react';
import {
    HiOutlineTruck,
    HiOutlineUsers,
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
            color: 'primary',
        },
        {
            label: 'Active Drivers',
            value: stats?.drivers?.total || 0,
            sub: `${stats?.drivers?.on_trip || 0} on trip`,
            icon: HiOutlineUsers,
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
            <div className="dashboard-loading">
                <div className="dashboard-loading__spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">
                        Welcome back, {user?.name || 'User'} 👋
                    </h1>
                    <p className="dashboard__subtitle">
                        Here's what's happening with your fleet today
                    </p>
                </div>
                <div className="dashboard__header-actions">
                    <button className="dashboard__btn dashboard__btn--outline" onClick={fetchStats}>
                        <HiOutlineRefresh /> Refresh
                    </button>
                    <button className="dashboard__btn dashboard__btn--primary">
                        <HiOutlinePlusCircle /> Add Vehicle
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="dashboard__stats">
                {statCards.map((card, i) => (
                    <div key={i} className={`dashboard__stat-card dashboard__stat-card--${card.color}`}>
                        <div className="dashboard__stat-card-top">
                            <div>
                                <p className="dashboard__stat-label">{card.label}</p>
                                <h2 className="dashboard__stat-value">{card.value}</h2>
                            </div>
                            <div className={`dashboard__stat-icon dashboard__stat-icon--${card.color}`}>
                                <card.icon />
                            </div>
                        </div>
                        <p className="dashboard__stat-sub">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="dashboard__grid">
                {/* Recent Trips */}
                <div className="dashboard__card dashboard__card--wide">
                    <div className="dashboard__card-header">
                        <h3>Recent Trips</h3>
                        <button className="dashboard__card-link">
                            View all <HiOutlineArrowSmRight />
                        </button>
                    </div>
                    <div className="dashboard__table-wrap">
                        <table className="dashboard__table">
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
                                                <span className="dashboard__route">
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
                                        <td colSpan="5" className="dashboard__empty">
                                            No trips yet. Create your first trip to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Maintenance Alerts */}
                <div className="dashboard__card">
                    <div className="dashboard__card-header">
                        <h3>Maintenance Alerts</h3>
                    </div>
                    <div className="dashboard__alerts">
                        {stats?.maintenance?.length > 0 ? (
                            stats.maintenance.map((item) => (
                                <div key={item.id} className="dashboard__alert-item">
                                    <div className="dashboard__alert-dot"></div>
                                    <div>
                                        <p className="dashboard__alert-title">{item.service_type}</p>
                                        <p className="dashboard__alert-sub">
                                            {item.vehicle_name} • {item.license_plate}
                                        </p>
                                        <p className="dashboard__alert-date">
                                            Due: {new Date(item.next_service).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="dashboard__empty-alert">
                                <p>🎉 No upcoming maintenance</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fleet Overview */}
                <div className="dashboard__card">
                    <div className="dashboard__card-header">
                        <h3>Fleet Overview</h3>
                    </div>
                    <div className="dashboard__fleet-stats">
                        <div className="dashboard__fleet-item">
                            <div className="dashboard__fleet-bar">
                                <div
                                    className="dashboard__fleet-fill dashboard__fleet-fill--success"
                                    style={{
                                        width: `${stats?.vehicles?.total > 0
                                            ? (stats.vehicles.available / stats.vehicles.total) * 100
                                            : 0}%`
                                    }}
                                ></div>
                            </div>
                            <div className="dashboard__fleet-label">
                                <span className="dashboard__fleet-dot dashboard__fleet-dot--success"></span>
                                Available
                                <span className="dashboard__fleet-count">{stats?.vehicles?.available || 0}</span>
                            </div>
                        </div>
                        <div className="dashboard__fleet-item">
                            <div className="dashboard__fleet-bar">
                                <div
                                    className="dashboard__fleet-fill dashboard__fleet-fill--info"
                                    style={{
                                        width: `${stats?.vehicles?.total > 0
                                            ? (stats.vehicles.in_trip / stats.vehicles.total) * 100
                                            : 0}%`
                                    }}
                                ></div>
                            </div>
                            <div className="dashboard__fleet-label">
                                <span className="dashboard__fleet-dot dashboard__fleet-dot--info"></span>
                                In Trip
                                <span className="dashboard__fleet-count">{stats?.vehicles?.in_trip || 0}</span>
                            </div>
                        </div>
                        <div className="dashboard__fleet-item">
                            <div className="dashboard__fleet-bar">
                                <div
                                    className="dashboard__fleet-fill dashboard__fleet-fill--warning"
                                    style={{
                                        width: `${stats?.vehicles?.total > 0
                                            ? (stats.vehicles.in_maintenance / stats.vehicles.total) * 100
                                            : 0}%`
                                    }}
                                ></div>
                            </div>
                            <div className="dashboard__fleet-label">
                                <span className="dashboard__fleet-dot dashboard__fleet-dot--warning"></span>
                                Maintenance
                                <span className="dashboard__fleet-count">{stats?.vehicles?.in_maintenance || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard__card dashboard__card--wide">
                    <div className="dashboard__card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="dashboard__actions-grid">
                        <button className="dashboard__action-btn">
                            <HiOutlineTruck className="dashboard__action-icon" />
                            <span>Add Vehicle</span>
                        </button>
                        <button className="dashboard__action-btn">
                            <HiOutlineMap className="dashboard__action-icon" />
                            <span>Create Trip</span>
                        </button>
                        <button className="dashboard__action-btn">
                            <HiOutlineUsers className="dashboard__action-icon" />
                            <span>Add Driver</span>
                        </button>
                        <button className="dashboard__action-btn">
                            <HiOutlineCurrencyDollar className="dashboard__action-icon" />
                            <span>New Invoice</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
