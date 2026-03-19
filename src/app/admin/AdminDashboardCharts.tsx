"use client"

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

type Props = { chartData: { date: string; views: number }[] }

export function AdminDashboardCharts({ chartData }: Props) {
  if (chartData.length === 0) return null

  return (
    <div className="rounded-xl border p-5" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
      <p className="text-sm font-medium mb-4" style={{ color: "hsl(0 0% 60%)" }}>Document Views — Last 30 Days</p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(0 0% 70%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(0 0% 70%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(0 0% 35%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 35%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 15%)", borderRadius: "8px", fontSize: "12px" }}
            labelStyle={{ color: "hsl(0 0% 60%)" }}
            itemStyle={{ color: "hsl(0 0% 85%)" }}
          />
          <Area type="monotone" dataKey="views" stroke="hsl(0 0% 65%)" strokeWidth={1.5} fill="url(#viewsGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
