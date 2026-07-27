import { getInsightsData } from "@/app/lib/admin-stats";
import { AnalyticsCharts } from "./AnalyticsCharts";

export default async function AnalyticsPage() {
  const data = await getInsightsData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">অ্যানালিটিক্স</h1>
        <p className="mt-1 text-sm text-ink-700">সম্পন্ন হওয়া সব রেসপন্সের ভিত্তিতে</p>
      </div>
      <AnalyticsCharts data={data} />
    </div>
  );
}
