import { NavLink, useNavigate } from 'react-router-dom';
import {
    HiOutlineViewGrid,
    HiOutlineTruck,
    HiOutlineMap,
    HiOutlineCog,
    HiOutlineLogout,
    HiOutlineMenuAlt2,
    HiOutlineX,
    HiOutlineClipboardList,
    HiOutlineCurrencyDollar,
    HiOutlineUserGroup,
    HiOutlineChartBar,
    HiOutlineShieldCheck
} from 'react-icons/hi';
import { useState, useEffect } from 'react';
import './Sidebar.css';

const navItems = [
    { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Command Center' },
    { path: '/vehicles', icon: HiOutlineTruck, label: 'Vehicle Registry' },
    { path: '/trips', icon: HiOutlineMap, label: 'Trip Dispatcher' },
    { path: '/maintenance', icon: HiOutlineClipboardList, label: 'Maintenance Logs' },
    { path: '/expenses', icon: HiOutlineCurrencyDollar, label: 'Expense & Fuel' },
    { path: '/drivers', icon: HiOutlineUserGroup, label: 'Driver Profiles' },
    { path: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

function Sidebar({ collapsed, setCollapsed }) {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const roleLabel = (role) => (role || 'dispatcher').replace(/_/g, ' ');

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            {/* Toggle button — always visible */}
            <button
                className="sidebar__toggle"
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <HiOutlineMenuAlt2 /> : <HiOutlineX />}
            </button>

            {/* Brand */}
            <div className="sidebar__brand">
                <HiOutlineShieldCheck className="sidebar__brand-icon" />
                {!collapsed && <span className="sidebar__brand-text">FleetFlow</span>}
            </div>

            {/* Navigation */}
            <nav className="sidebar__nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        title={item.label}
                    >
                        <item.icon className="sidebar__link-icon" />
                        {!collapsed && <span className="sidebar__link-text">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Account card */}
            <div className="sidebar__account">
                <div className="sidebar__avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                    <div className="sidebar__account-info">
                        <span className="sidebar__account-name">{user?.name || 'User'}</span>
                        <span className="sidebar__account-role">{roleLabel(user?.role)}</span>
                    </div>
                )}
                {!collapsed && (
                    <button className="sidebar__logout-btn" onClick={handleLogout} title="Logout">
                        <HiOutlineLogout />
                    </button>
                )}
            </div>

            {collapsed && (
                <button className="sidebar__logout-collapsed" onClick={handleLogout} title="Logout">
                    <HiOutlineLogout />
                </button>
            )}
        </aside>
    );
}

export default Sidebar;
