import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
// Removed buttonVariants import as it's not used

interface ChartProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  hideTooltip?: boolean;
  hideLegend?: boolean;
  chartData: any[];
  dataKey: string;
  xAxisKey: string;
  children?: React.ReactNode;
}

function Chart({
  className,
  // Removed hideTooltip as it's not used
  hideLegend = false,
  chartData,
  dataKey,
  xAxisKey,
  children,
  ...props // Keep ...props for div attributes
}: ChartProps) {
  return (
    <div className={cn('w-full h-80', className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8885c5" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8885c5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey={xAxisKey}
            stroke="#888"
            className="text-xs"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888"
            className="text-xs"
            tickLine={false}
            axisLine={false}
            unit=" "
          />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border))',
            }}
            labelClassName="!text-xs"
            formatter={(value: number, name: string) => {
              if (typeof value === 'number') {
                return [new Intl.NumberFormat('en-US').format(value), name];
              }
              return [value, name];
            }}
            labelFormatter={(label: string) => label}
            cursor={false}
          />
          {!hideLegend && <Legend content={(props: any) => <ChartTooltip {...props} />} />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#8885c5"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUv)"
          />
          {children}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey?: string;
    nameKey?: string;
    color?: string;
  }>;
  label?: string;
  // Removed viewBox as it's not used
}

function ChartTooltip({
  active,
  payload,
  label,
}: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  // Removed nameKey as it's not used
  const valueFormatter = (value: number) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return value;
  };

  return (
    <div className="rounded-lg border bg-popover p-2 shadow-sm">
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-primary">{label}</span>
        </div>
        {payload.map((item, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="grid flex-1 grid-cols-2">
              <span className="text-xs font-medium">{item.name}</span>
              <span className="text-xs font-medium tabular-nums text-right">
                {valueFormatter(item.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Chart, ChartTooltip };