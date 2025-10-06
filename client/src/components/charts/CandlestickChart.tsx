import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend);

interface CandlestickData {
  x: string | Date;
  o: number; // Open
  h: number; // High  
  l: number; // Low
  c: number; // Close
}

interface CandlestickChartProps {
  data: CandlestickData[];
  symbol: string;
  height?: number;
}

// Custom candlestick plugin since chartjs-chart-financial might not be available
const candlestickPlugin: Plugin = {
  id: 'candlestick',
  afterDatasetsDraw: (chart) => {
    const { ctx, data, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
    
    if (!data.datasets[0] || !data.datasets[0].data) return;
    
    const dataset = data.datasets[0].data as unknown as CandlestickData[];
    const candleWidth = (right - left) / dataset.length * 0.6;
    
    ctx.save();
    
    dataset.forEach((candle, index) => {
      if (!candle || typeof candle !== 'object') return;
      
      const xPos = x.getPixelForValue(index);
      const openY = y.getPixelForValue(candle.o);
      const highY = y.getPixelForValue(candle.h);
      const lowY = y.getPixelForValue(candle.l);
      const closeY = y.getPixelForValue(candle.c);
      
      const isGreen = candle.c >= candle.o;
      const color = isGreen ? '#22c55e' : '#ef4444';
      
      // Draw the wick (high-low line)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xPos, highY);
      ctx.lineTo(xPos, lowY);
      ctx.stroke();
      
      // Draw the body (open-close rectangle)
      ctx.fillStyle = color;
      const bodyHeight = Math.abs(closeY - openY);
      const bodyTop = Math.min(openY, closeY);
      
      if (bodyHeight < 1) {
        // Draw a line for doji candles
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xPos - candleWidth / 2, openY);
        ctx.lineTo(xPos + candleWidth / 2, openY);
        ctx.stroke();
      } else {
        ctx.fillRect(xPos - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    });
    
    ctx.restore();
  }
};

ChartJS.register(candlestickPlugin);

export function CandlestickChart({ data, symbol, height = 400 }: CandlestickChartProps) {
  const chartRef = useRef<ChartJS>(null);

  const chartData = {
    labels: data.map((_, index) => index),
    datasets: [
      {
        label: symbol,
        data: data,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
      },
    ],
  };

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const candle = data[index];
            return new Date(candle.x).toLocaleDateString();
          },
          label: (context) => {
            const index = context.dataIndex;
            const candle = data[index];
            return [
              `Open: $${candle.o.toFixed(2)}`,
              `High: $${candle.h.toFixed(2)}`,
              `Low: $${candle.l.toFixed(2)}`,
              `Close: $${candle.c.toFixed(2)}`,
            ];
          },
        },
        backgroundColor: 'hsl(220, 30%, 15%)',
        borderColor: 'hsl(217, 20%, 20%)',
        borderWidth: 1,
        titleColor: 'hsl(210, 20%, 98%)',
        bodyColor: 'hsl(215, 15%, 75%)',
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
          callback: function(value, index) {
            if (index % Math.ceil(data.length / 6) === 0) {
              const candle = data[value as number];
              return candle ? new Date(candle.x).toLocaleDateString() : '';
            }
            return '';
          },
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
            return '$' + (value as number).toFixed(2);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div style={{ height }} className="relative">
      <Chart 
        ref={chartRef as any}
        type="line" 
        data={chartData} 
        options={options} 
        plugins={[candlestickPlugin]}
      />
    </div>
  );
}
