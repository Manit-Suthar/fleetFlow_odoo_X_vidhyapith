import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './CostTrendChart.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="trend-tooltip">
        <p className="trend-tooltip__label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="trend-tooltip__row" style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CostTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="trend-chart-card trend-chart-card--empty">
        <h3 className="trend-chart-card__title">Cost Trend (12 Months)</h3>
        <p className="trend-chart-card__empty-text">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="trend-chart-card">
      <h3 className="trend-chart-card__title">Cost Trend (12 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#8A8A8A', fontSize: 11 }}
            axisLine={{ stroke: '#2A2A2A' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8A8A8A', fontSize: 11 }}
            axisLine={{ stroke: '#2A2A2A' }}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '0.8rem', color: '#8A8A8A' }}
          />
          <Line
            type="monotone"
            dataKey="fuelCost"
            name="Fuel Cost"
            stroke="#C48A2E"
            strokeWidth={2}
            dot={{ r: 3, fill: '#C48A2E' }}
            activeDot={{ r: 5, stroke: '#C48A2E', strokeWidth: 2, fill: '#0A0A0A' }}
          />
          <Line
            type="monotone"
            dataKey="maintenanceCost"
            name="Maintenance Cost"
            stroke="#42A5F5"
            strokeWidth={2}
            dot={{ r: 3, fill: '#42A5F5' }}
            activeDot={{ r: 5, stroke: '#42A5F5', strokeWidth: 2, fill: '#0A0A0A' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
