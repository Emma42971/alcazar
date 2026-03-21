"use client"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

export function AdminDashboardCharts({ chartData }: { chartData: { date: string; views: number }[] }) {
  if (chartData.length === 0) return null
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Document Views — Last 30 Days</h3>
      </div>
      <div className="card-p pt-2">
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(152 57% 40%)" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(152 57% 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 9% 64%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 64%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "white", border: "1px solid hsl(220 13% 91%)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.06)" }}
              labelStyle={{ color: "hsl(222 39% 13%)", fontWeight: 600, marginBottom: "2px" }}
              itemStyle={{ color: "hsl(152 57% 40%)" }}
            />
            <Area type="monotone" dataKey="views" stroke="hsl(152 57% 40%)" strokeWidth={2} fill="url(#grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
