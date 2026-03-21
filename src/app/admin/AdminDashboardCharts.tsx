"use client"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Props = { chartData: { date: string; views: number }[] }

export function AdminDashboardCharts({ chartData }: Props) {
  if (chartData.length === 0) return null
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Document Views</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Last 30 days</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", boxShadow: "var(--shadow-md)" }}
            labelStyle={{ color: "var(--text-secondary)", fontWeight: 500 }}
            itemStyle={{ color: "var(--blue)" }}
          />
          <Area type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} fill="url(#viewsGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
