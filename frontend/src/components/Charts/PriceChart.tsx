import React, { useEffect, useState } from 'react';
import '../styles/Charts.css';

interface ChartData {
  timestamp: string;
  price: number;
}

interface PriceChartProps {
  symbol: string;
  data: ChartData[];
  height?: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  data,
  height = 300,
}) => {
  const [svgData, setSvgData] = useState('');

  useEffect(() => {
    if (!data || data.length === 0) return;

    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;
    const width = 800;
    const padding = 40;

    let path = `M 0 ${height - padding}`;
    data.forEach((d, i) => {
      const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
      const y =
        height -
        padding -
        ((d.price - minPrice) / range) * (height - 2 * padding);
      path += ` L ${x} ${y}`;
    });

    setSvgData(path);
  }, [data, height]);

  return (
    <div className="price-chart">
      <h3>{symbol} Price History</h3>
      <svg width="100%" height={height} viewBox={`0 0 800 ${height}`}>
        <defs>
          <linearGradient
            id="gradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`h-${i}`}
            x1="40"
            x2="760"
            y1={(i * height) / 5}
            y2={(i * height) / 5}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        ))}

        {/* Price line */}
        <path d={svgData} stroke="#667eea" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
};
