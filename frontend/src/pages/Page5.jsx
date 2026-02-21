import { useState, useEffect } from 'react';
import { HiPlus, HiX } from 'react-icons/hi';
import api from '../utils/api';
import './Page5.css';

function CustomStatusDropdown({ currentStatus, onStatusChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const statuses = ['Scheduled', 'In Progress', 'Completed'];

    const getBadgeClass = (status) => {
        return `badge badge-${status === 'Completed' ? 'success' : status === 'Scheduled' ? 'primary' : 'warning'}`;
    };

    return (
        <div className="custom-dropdown-container">
            <button
                className={`${getBadgeClass(currentStatus)} custom-dropdown-button`}
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            >
                {currentStatus || 'Scheduled'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            {isOpen && (
                <div className="custom-dropdown-menu">
                    {statuses.map(s => (
                        <div
                            key={s}
                            className={`custom-dropdown-item ${currentStatus === s ? 'active' : ''}`}
                            onClick={() => {
                                onStatusChange(s);
                                setIsOpen(false);
                            }}
                        >
                            <span className={`badge-dot bg-${s === 'Completed' ? 'success' : s === 'Scheduled' ? 'primary' : 'warning'}`}></span>
                            {s}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MaintenanceLogs() {
    const [data, setData] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
    const [searchCategory, setSearchCategory] = useState('vehicle_id');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ vehicle_id: '', service_type: '', description: '', cost: '', service_date: '', next_service: '' });

    useEffect(() => {
        fetchData();
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const res = await api.get('/maintenance/vehicles');
            setVehicles(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, vehicle_id: res.data[0].id }));
            }
        } catch (err) {
            console.error('Error fetching vehicles:', err);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/maintenance');
            setData(res.data);
        } catch (err) {
            console.error('Error fetching maintenance:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredData = data.filter(row => {
        if (!searchTerm) return true;
        if (searchCategory === 'vehicle_id') {
            return String(row.vehicle_id) === String(searchTerm);
        }
        if (searchCategory === 'id') {
            return String(row.id).includes(searchTerm);
        }
        if (searchCategory === 'status') {
            return row.status.toLowerCase() === searchTerm.toLowerCase();
        }
        if (searchCategory === 'service_type') {
            return (row.service_type || '').toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const openAddModal = () => {
        setEditId(null);
        setFormData({ vehicle_id: vehicles.length > 0 ? vehicles[0].id : '', service_type: '', description: '', cost: '', service_date: '', next_service: '' });
        setModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditId(row.id);
        const formattedDate = row.service_date ? new Date(row.service_date).toISOString().split('T')[0] : '';
        setFormData({
            vehicle_id: row.vehicle_id,
            service_type: row.service_type || '',
            description: row.description || '',
            cost: row.cost || '',
            service_date: formattedDate,
            next_service: row.next_service ? new Date(row.next_service).toISOString().split('T')[0] : ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            try {
                await api.delete(`/maintenance/${id}`);
                fetchData();
            } catch (err) {
                console.error('Error deleting:', err);
                alert('Failed to delete record.');
            }
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/maintenance/${editId}`, formData);
            } else {
                await api.post('/maintenance', formData);
            }
            setModalOpen(false);
            setEditId(null);
            fetchData();
        } catch (err) {
            console.error('Error saving:', err);
            const msg = err.response?.data?.error || err.message;
            alert(`Failed to ${editId ? 'update' : 'add'} record.\n\nDetails: ` + msg);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.patch(`/maintenance/${id}/status`, { status: newStatus });
            fetchData();
        } catch (err) {
            console.error('Error updating status:', err);
            const msg = err.response?.data?.error || err.message;
            alert('Failed to update status.\n\nDetails: ' + msg);
        }
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
        return <span style={{ marginLeft: '4px' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div className="page5">
            <div className="page5-header">
                <div>
                    <h1 className="page5-title">Maintenance & Service Logs</h1>
                    <p className="page5-subtitle">Track vehicle service history and upcoming jobs</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        className="page5-input"
                        style={{ width: '150px', padding: '8px 12px' }}
                        value={searchCategory}
                        onChange={(e) => {
                            setSearchCategory(e.target.value);
                            setSearchTerm('');
                        }}
                    >
                        <option value="vehicle_id">Vehicle</option>
                        <option value="id">Log ID</option>
                        <option value="service_type">Service Type</option>
                        <option value="status">Status</option>
                    </select>

                    {searchCategory === 'status' ? (
                        <select
                            className="page5-input"
                            style={{ width: '200px', padding: '8px 12px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>
                    ) : searchCategory === 'vehicle_id' ? (
                        <select
                            className="page5-input"
                            style={{ width: '200px', padding: '8px 12px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        >
                            <option value="">All Vehicles</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.id} - {v.vehicle_name}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={searchCategory === 'id' ? 'number' : 'text'}
                            className="page5-input"
                            style={{ width: '200px', padding: '8px 12px' }}
                            placeholder={`Search by ${searchCategory.replace('_', ' ')}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    )}

                    <button className="page5-btn-primary" onClick={openAddModal}>
                        <HiPlus /> Add Record
                    </button>
                </div>
            </div>

            <div className="page5-card">
                {loading ? (
                    <div className="page5-loading">Loading records...</div>
                ) : data.length === 0 ? (
                    <div className="page5-empty">No records exist. Start by adding one.</div>
                ) : sortedData.length === 0 ? (
                    <div className="page5-empty">No records found matching your search.</div>
                ) : (
                    <div className="page5-table-container">
                        <table className="page5-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>Log ID <SortIcon column="id" /></th>
                                    <th onClick={() => handleSort('vehicle_id')} style={{ cursor: 'pointer' }}>Vehicle ID <SortIcon column="vehicle_id" /></th>
                                    <th onClick={() => handleSort('service_type')} style={{ cursor: 'pointer' }}>Service Type <SortIcon column="service_type" /></th>
                                    <th onClick={() => handleSort('cost')} style={{ cursor: 'pointer' }}>Cost (INR) <SortIcon column="cost" /></th>
                                    <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon column="status" /></th>
                                    <th onClick={() => handleSort('service_date')} style={{ cursor: 'pointer' }}>Scheduled Date <SortIcon column="service_date" /></th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map(row => (
                                    <tr key={row.id}>
                                        <td>#{row.id}</td>
                                        <td>{row.vehicle_id}</td>
                                        <td>{row.service_type || 'General Service'}</td>
                                        <td>₹{Number(row.cost).toLocaleString()}</td>
                                        <td>
                                            <CustomStatusDropdown
                                                currentStatus={row.status}
                                                onStatusChange={(newStatus) => handleStatusChange(row.id, newStatus)}
                                            />
                                        </td>
                                        <td>{row.service_date ? new Date(row.service_date).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <button className="action-btn edit-btn" onClick={() => openEditModal(row)}>Edit</button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete(row.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="page5-modal">
                    <div className="page5-modal-content">
                        <div className="page5-modal-header">
                            <h2>{editId ? 'Edit Service Record' : 'Schedule Service'}</h2>
                            <button className="page5-modal-close" onClick={() => setModalOpen(false)}><HiX /></button>
                        </div>
                        <form onSubmit={handleCreateOrUpdate} className="page5-form">
                            <div className="page5-form-group">
                                <label>Vehicle</label>
                                <select className="page5-input" required value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}>
                                    <option value="" disabled>Select a vehicle</option>
                                    {vehicles.map(v => {
                                        const isMaintenance = v.status === 'maintenance';
                                        return (
                                            <option key={v.id} value={v.id} disabled={isMaintenance && !editId}>
                                                {v.id} - {v.vehicle_name} {isMaintenance ? '(In Shop)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="page5-form-group">
                                <label>Service Type</label>
                                <input className="page5-input" type="text" required value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} />
                            </div>
                            <div className="page5-form-group">
                                <label>Description</label>
                                <input className="page5-input" type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="page5-form-group">
                                <label>Cost Estimation</label>
                                <input className="page5-input" type="number" required value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
                            </div>
                            <div className="page5-form-group">
                                <label>Service Date</label>
                                <input className="page5-input" type="date" required value={formData.service_date} onChange={e => setFormData({ ...formData, service_date: e.target.value })} />
                            </div>
                            <div className="page5-modal-actions">
                                <button type="button" className="page5-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="page5-btn-primary">Save Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MaintenanceLogs;
