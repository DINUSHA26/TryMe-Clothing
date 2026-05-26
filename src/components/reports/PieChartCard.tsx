"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getChartColors } from "@/lib/utils/chartHelpers";

interface PieChartCardProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  description?: string;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = payload[0].payload.total || data.value;
    const percentage = total > 0 ? ((data.value as number) / total) * 100 : 0;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-medium text-foreground">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percentage: <span className="font-medium text-foreground">{percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
}

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) {
    return null; // Don't show label for slices < 5%
  }

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PieChartCard({
  data,
  title,
  description,
  colors,
  height = 300,
  showLegend = true,
  showPercentage = true,
}: PieChartCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartColors = colors || getChartColors(data.length);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Add total to each data point for tooltip
  const dataWithTotal = data.map((item) => ({ ...item, total }));

  return (
    <Card>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              label={showPercentage ? renderCustomLabel : false}
              labelLine={false}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {showLegend && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            {dataWithTotal.map((entry, index) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
              const color = chartColors[index % chartColors.length];
              return (
                <div key={index} className="flex items-center gap-1.5 min-w-[120px] sm:min-w-[auto]">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground font-medium">
                    {entry.name} <span className="text-foreground">({percentage}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
