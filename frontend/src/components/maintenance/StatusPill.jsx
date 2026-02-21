import './StatusPill.css';

const STATUS_MAP = {
    'Completed': { className: 'status-pill--success', label: 'Completed' },
    'Scheduled': { className: 'status-pill--info', label: 'Scheduled' },
    'In Progress': { className: 'status-pill--warning', label: 'In Progress' },
    'Cancelled': { className: 'status-pill--danger', label: 'Cancelled' },
    'available': { className: 'status-pill--success', label: 'Available' },
    'in-trip': { className: 'status-pill--info', label: 'In Trip' },
    'maintenance': { className: 'status-pill--warning', label: 'Maintenance' },
};

export default function StatusPill({ status }) {
    const config = STATUS_MAP[status] || { className: 'status-pill--muted', label: status || 'Unknown' };

    return (
        <span className={`status-pill ${config.className}`}>
            <span className="status-pill__dot" />
            {config.label}
        </span>
    );
}
