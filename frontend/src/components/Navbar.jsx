import { HiOutlineBell, HiOutlineSearch } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import './Navbar.css';

function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <header className="navbar">
            <div className="navbar__search">
                <HiOutlineSearch className="navbar__search-icon" />
                <input
                    type="text"
                    placeholder="Search vehicles, drivers, trips..."
                    className="navbar__search-input"
                />
            </div>

            <div className="navbar__actions">
                <button className="navbar__icon-btn" aria-label="Notifications">
                    <HiOutlineBell />
                    <span className="navbar__badge">3</span>
                </button>

                <div className="navbar__user">
                    <div className="navbar__avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="navbar__user-info">
                        <span className="navbar__user-name">{user?.name || 'User'}</span>
                        <span className="navbar__user-role">{user?.role || 'viewer'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
