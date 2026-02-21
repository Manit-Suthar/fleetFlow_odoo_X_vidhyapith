import './KpiCard.css';

export default function KpiCard({ icon, label, value, unit, accentColor }) {
  const style = accentColor ? { '--kpi-accent': accentColor } : {};

  return (
    <div className="kpi-card" style={style}>
      <div className="kpi-card__icon-wrap">
        {icon}
      </div>
      <div className="kpi-card__content">
        <span className="kpi-card__label">{label}</span>
        <span className="kpi-card__value">
          {value}
          {unit && <span className="kpi-card__unit">{unit}</span>}
        </span>
      </div>
    </div>
  );
}
