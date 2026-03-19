"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
type Props = { chartData: { name: string; views: number; avgSec: number }[] }
export function AnalyticsChartsClient({ chartData }: Props) {
  return (
    <div className="rounded-xl border p-5 space-y-3" style={{ background: "hsl(0 0% 5.5%)", borderColor: "hsl(0 0% 11%)" }}>
      <h3 className="text-sm font-medium">Top Documents by Views</h3>
      {chartData.length === 0 ? <p className="text-sm" style={{ color: "hsl(0 0% 35%)" }}>No views yet.</p> : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(0 0% 35%)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(0 0% 50%)" }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 15%)", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "hsl(0 0% 60%)" }} itemStyle={{ color: "hsl(0 0% 85%)" }} />
            <Bar dataKey="views" fill="hsl(0 0% 55%)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
