import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import './CostDonutChart.css';

const COLORS = ['#C48A2E', '#42A5F5'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="donut-tooltip">
        <p className="donut-tooltip__label">{payload[0].name}</p>
        <p className="donut-tooltip__value">
          {Number(payload[0].value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
        </p>
      </div>
    );
  }
  return null;
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="donut-legend">
      {payload.map((entry, index) => (
        <li key={index} className="donut-legend__item">
          <span className="donut-legend__dot" style={{ background: entry.color }} />
          <span className="donut-legend__text">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default function CostDonutChart({ fuelCost, maintenanceCost }) {
  const data = [
    { name: 'Fuel Cost', value: fuelCost || 0 },
    { name: 'Maintenance Cost', value: maintenanceCost || 0 },
  ];

  const total = fuelCost + maintenanceCost;

  if (total === 0) {
    return (
      <div className="donut-chart-card donut-chart-card--empty">
        <h3 className="donut-chart-card__title">Cost Distribution</h3>
        <p className="donut-chart-card__empty-text">No cost data available</p>
      </div>
    );
  }

  return (
    <div className="donut-chart-card">
      <h3 className="donut-chart-card__title">Cost Distribution</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
