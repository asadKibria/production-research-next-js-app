"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InsightsData } from "@/app/lib/admin-stats";

const DONUT_COLORS = ["#3b2a30", "#6b5560", "#a98a79", "#846a75", "#d2bcaf"];

export function DashboardCharts({ data }: { data: InsightsData }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ChartPanel title="রেসপন্স ট্রেন্ড" subtitle="সাপ্তাহিক সঞ্চিত রেসপন্স">
        {data.totalResponsesCount === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.responseVolumeByWeek} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b2a30" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b2a30" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e5e0" vertical={false} />
              <XAxis dataKey="week" stroke="#4a3e3c" fontSize={11} tickLine={false} />
              <YAxis stroke="#4a3e3c" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                name="রেসপন্স"
                stroke="#3b2a30"
                strokeWidth={2}
                fill="url(#volumeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      <ChartPanel title="ডিজাইন পারফরম্যান্স" subtitle="প্রতি প্রোডাক্টে গড় রেটিং (৫ এর মধ্যে)">
        {data.productRanking.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.productRanking} margin={{ left: -20, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e5e0" vertical={false} />
              <XAxis dataKey="title" stroke="#4a3e3c" fontSize={10} tickLine={false} hide />
              <YAxis domain={[0, 5]} stroke="#4a3e3c" fontSize={11} tickLine={false} />
              <Tooltip formatter={(v) => Number(v).toFixed(2)} labelFormatter={(l) => l} />
              <Bar dataKey="avgRating" name="গড় রেটিং" fill="#6b5560" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      <ChartPanel title="বয়স অনুযায়ী বিভাজন" subtitle="কাস্টমারদের বয়সভিত্তিক অংশ">
        {data.ageDistribution.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.ageDistribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.ageDistribution.map((entry, idx) => (
                  <Cell key={entry.label} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
        {data.ageDistribution.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {data.ageDistribution.map((entry, idx) => (
              <span key={entry.label} className="flex items-center gap-1.5 text-xs text-ink-700">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                />
                {entry.label}
              </span>
            ))}
          </div>
        ) : null}
      </ChartPanel>

      <ChartPanel title="শীর্ষ জেলা" subtitle="জেলা অনুযায়ী কাস্টমার সংখ্যা">
        {data.districtBreakdown.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.districtBreakdown.slice(0, 6)}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e5e0" horizontal={false} />
              <XAxis type="number" stroke="#4a3e3c" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={70} stroke="#4a3e3c" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="কাস্টমার" fill="#a98a79" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>
    </div>
  );
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="text-xs text-ink-700">{subtitle}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-ink-700">
      এখনো কোনো ডেটা নেই
    </div>
  );
}
