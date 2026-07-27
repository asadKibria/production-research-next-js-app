"use client";

import { useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InsightsData } from "@/app/lib/admin-stats";

const COLORS = ["#3b2a30", "#6b5560", "#a98a79", "#846a75", "#d2bcaf", "#593f30"];

export function AnalyticsCharts({ data }: { data: InsightsData }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="প্রোডাক্ট র‍্যাঙ্কিং" filename="product-ranking.png">
        <ResponsiveContainer width="100%" height={Math.max(220, data.productRanking.length * 40)}>
          <BarChart data={data.productRanking} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e5e0" />
            <XAxis type="number" domain={[0, 5]} stroke="#4a3e3c" fontSize={12} />
            <YAxis
              type="category"
              dataKey="title"
              width={140}
              stroke="#4a3e3c"
              fontSize={12}
            />
            <Tooltip formatter={(v) => Number(v).toFixed(2)} />
            <Bar dataKey="avgRating" fill="#3b2a30" radius={[0, 6, 6, 0]} name="গড় রেটিং" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="প্রতি প্রোডাক্টে গড় রেটিং" filename="average-rating-per-product.png">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.productRanking}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e5e0" />
            <XAxis dataKey="title" stroke="#4a3e3c" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis domain={[0, 5]} stroke="#4a3e3c" fontSize={12} />
            <Tooltip formatter={(v) => Number(v).toFixed(2)} />
            <Bar dataKey="avgRating" fill="#6b5560" radius={[6, 6, 0, 0]} name="গড় রেটিং" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="ক্রয়ের আগ্রহ (Purchase Intent)" filename="purchase-intent.png">
        {data.purchaseIntentBreakdown.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data.purchaseIntentBreakdown}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={110}
                label={(entry: { name?: string }) => entry.name ?? ""}
              >
                {data.purchaseIntentBreakdown.map((entry, idx) => (
                  <Cell key={entry.label} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="মূল্য বিশ্লেষণ (Price Opinion)" filename="price-analysis.png">
        {data.priceByProduct.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.priceByProduct}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e5e0" />
              <XAxis dataKey="title" stroke="#4a3e3c" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis stroke="#4a3e3c" fontSize={12} />
              <Tooltip formatter={(v) => `৳ ${Math.round(Number(v))}`} />
              <Bar dataKey="average" fill="#a98a79" radius={[6, 6, 0, 0]} name="গড় মূল্য" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function EmptyState() {
  return <p className="py-16 text-center text-sm text-ink-700">এখনো কোনো ডেটা নেই</p>;
}

function ChartCard({
  title,
  filename,
  children,
}: {
  title: string;
  filename: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleExport() {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    exportSvgAsPng(svg, filename);
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-full border border-cream-200 px-3 py-1 text-xs font-medium text-ink-700 hover:border-plum-700"
        >
          PNG এক্সপোর্ট
        </button>
      </div>
      <div ref={containerRef} className="mt-4">
        {children}
      </div>
    </div>
  );
}

function exportSvgAsPng(svgEl: SVGSVGElement, filename: string) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const bbox = svgEl.getBoundingClientRect();
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = bbox.width * scale;
    canvas.height = bbox.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.scale(scale, scale);
    ctx.fillStyle = "#fbfaf7";
    ctx.fillRect(0, 0, bbox.width, bbox.height);
    ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  };
  img.src = url;
}
