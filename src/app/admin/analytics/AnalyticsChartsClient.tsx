"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Props = { chartData: { name: string; views: number; avgSec: number }[] }

export function AnalyticsChartsClient({ chartData }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Top Documents by Views</h3>
      </div>
      <div className="card-p">
        {chartData.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "hsl(var(--text-muted))" }}>No views yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(215 16% 47%)" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxShadow: "var(--shadow-md)"
                }}
                labelStyle={{ color: "hsl(var(--text-subtle))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--text))" }}
              />
              <Bar dataKey="views" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
