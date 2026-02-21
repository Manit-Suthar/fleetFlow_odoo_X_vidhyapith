import { NavLink, useNavigate } from 'react-router-dom';
import {
    HiOutlineViewGrid,
    HiOutlineTruck,
    HiOutlineMap,
    HiOutlineUsers,
    HiOutlineCreditCard,
    HiOutlineDocumentReport,
    HiOutlineCog,
    HiOutlineLogout,
    HiOutlineChevronLeft,
    HiOutlineChevronRight
} from 'react-icons/hi';
import { useState } from 'react';
import './Sidebar.css';

const navItems = [
    { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { path: '/vehicles', icon: HiOutlineTruck, label: 'Vehicles' },
    { path: '/trips', icon: HiOutlineMap, label: 'Trips' },
    { path: '/drivers', icon: HiOutlineUsers, label: 'Drivers' },
    { path: '/finance', icon: HiOutlineCreditCard, label: 'Finance' },
    { path: '/reports', icon: HiOutlineDocumentReport, label: 'Reports' },
    { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                <div className="sidebar__logo">
                    <span className="sidebar__logo-icon">🚛</span>
                    {!collapsed && <span className="sidebar__logo-text">FleetFlow</span>}
                </div>
                <button
                    className="sidebar__toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle sidebar"
                >
                    {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
                </button>
            </div>

            <nav className="sidebar__nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon className="sidebar__link-icon" />
                        {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar__footer">
                <button className="sidebar__link sidebar__logout" onClick={handleLogout} title="Logout">
                    <HiOutlineLogout className="sidebar__link-icon" />
                    {!collapsed && <span className="sidebar__link-label">Logout</span>}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
