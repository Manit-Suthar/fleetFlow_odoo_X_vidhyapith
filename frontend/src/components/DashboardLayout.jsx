import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './DashboardLayout.css';

function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className="layout__main">
                <Navbar />
                <main className="layout__content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
