'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseCategory[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ExpenseCategory }> }) {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium">{entry.name}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{formatCurrency(entry.value)}</p>
      </div>
    );
  }
  return null;
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Nenhuma despesa no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => {
                  const item = data.find((d) => d.name === value);
                  const pct = item ? ((item.value / total) * 100).toFixed(1) : '0';
                  return (
                    <span className="text-xs">
                      {value} ({pct}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
