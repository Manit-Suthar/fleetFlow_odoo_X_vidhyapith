import { useState, useRef, useEffect } from 'react';
import StatusPill from './StatusPill';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import './MaintenanceTable.css';

export default function MaintenanceTable({ data, onComplete, loading }) {
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatCost = (cost) => {
    if (!cost) return '--';
    return Number(cost).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="mt-table-skeleton">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mt-table-skeleton__row" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="mt-table-empty">
        <p className="mt-table-empty__text">No maintenance records found</p>
      </div>
    );
  }

  return (
    <div className="mt-table-wrap">
      <table className="mt-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Service Type</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Scheduled</th>
            <th>Completed</th>
            <th>Performed By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id}
              className="mt-table__row"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <td>
                <div className="mt-table__vehicle">
                  <span className="mt-table__vehicle-name">{row.vehicle_name}</span>
                  <span className="mt-table__vehicle-plate">{row.license_plate}</span>
                </div>
              </td>
              <td>{row.service_type}</td>
              <td className="mt-table__cost">{formatCost(row.cost)}</td>
              <td><StatusPill status={row.status} /></td>
              <td>{formatDate(row.scheduled_date)}</td>
              <td>{formatDate(row.completed_date)}</td>
              <td className="mt-table__performer">{row.performed_by || '--'}</td>
              <td className="mt-table__actions" ref={openMenu === row.id ? menuRef : null}>
                <button
                  className="mt-table__menu-btn"
                  onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)}
                  aria-label="Row actions"
                >
                  <HiOutlineDotsVertical />
                </button>
                {openMenu === row.id && (
                  <div className="mt-table__dropdown">
                    {row.status !== 'Completed' && row.status !== 'Cancelled' && (
                      <button
                        className="mt-table__dropdown-item"
                        onClick={() => { onComplete(row.id); setOpenMenu(null); }}
                      >
                        Mark Complete
                      </button>
                    )}
                    {(row.status === 'Completed' || row.status === 'Cancelled') && (
                      <span className="mt-table__dropdown-item mt-table__dropdown-item--disabled">
                        No actions available
                      </span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
