import { HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import './Navbar.css';

function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const initials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <header className="navbar">
            <div className="navbar__search">
                <HiOutlineSearch className="navbar__search-icon" />
                <input
                    className="navbar__search-input"
                    type="text"
                    placeholder="Search vehicles, drivers, trips..."
                />
            </div>

            <div className="navbar__actions">
                <button className="navbar__icon-btn" title="Notifications">
                    <HiOutlineBell />
                    <span className="navbar__badge">3</span>
                </button>

                <div className="navbar__divider" />

                <div className="navbar__user">
                    <div className="navbar__avatar">
                        {initials(user?.name)}
                    </div>
                    <div className="navbar__user-info">
                        <span className="navbar__user-name">{user?.name || 'User'}</span>
                        <span className="navbar__user-role">{(user?.role || 'dispatcher').replace(/_/g, ' ')}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
