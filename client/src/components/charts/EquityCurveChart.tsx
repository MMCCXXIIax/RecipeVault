import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EquityPoint {
  date: string;
  equity: number;
}

interface EquityCurveChartProps {
  data: EquityPoint[];
  initialCapital?: number;
  height?: number;
}

export function EquityCurveChart({ data, initialCapital = 100000, height = 400 }: EquityCurveChartProps) {
  const chartData = {
    labels: data.map(point => new Date(point.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio Value',
        data: data.map(point => point.equity),
        fill: true,
        borderColor: 'hsl(142, 71%, 45%)',
        backgroundColor: 'hsla(142, 71%, 45%, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'hsl(142, 71%, 45%)',
        pointHoverBorderColor: 'hsl(0, 0%, 100%)',
        pointHoverBorderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Initial Capital',
        data: data.map(() => initialCapital),
        fill: false,
        borderColor: 'hsl(215, 15%, 75%)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(220, 30%, 15%)',
        borderColor: 'hsl(217, 20%, 20%)',
        borderWidth: 1,
        titleColor: 'hsl(210, 20%, 98%)',
        bodyColor: 'hsl(215, 15%, 75%)',
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const change = value - initialCapital;
            const changePercent = ((change / initialCapital) * 100).toFixed(2);
            return [
              `Portfolio: $${value.toLocaleString()}`,
              `P&L: ${change >= 0 ? '+' : ''}$${change.toLocaleString()}`,
              `Return: ${change >= 0 ? '+' : ''}${changePercent}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'hsl(217, 20%, 20%)',
        },
        ticks: {
          color: 'hsl(215, 15%, 75%)',
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'hsl(217, 20%, 20%)',
        },
        ticks: {
          color: 'hsl(215, 15%, 75%)',
          callback: function(value) {
            return '$' + (value as number).toLocaleString();
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Line data={chartData} options={options} />
    </div>
  );
}
