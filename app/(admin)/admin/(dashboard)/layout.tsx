import Image from "next/image";
import { logoutAdmin } from "@/app/lib/actions/auth";
import { AdminNav } from "./AdminNav";

// Admin pages read live data on every request. Without this Next.js prerenders
// them at build time, so the dashboard would keep serving the (empty) numbers
// that existed when the deploy was built.
export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "ড্যাশবোর্ড" },
  { href: "/admin/products", label: "প্রোডাক্ট" },
  { href: "/admin/questions", label: "ডিফল্ট প্রশ্ন" },
  { href: "/admin/responses", label: "রেসপন্স" },
  { href: "/admin/analytics", label: "অ্যানালিটিক্স" },
  { href: "/admin/announcement", label: "ঘোষণা" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-cream-200 bg-plum-950 px-4 py-6 lg:flex">
        <Image
          src="/brand/logo-light.png"
          alt="Hizjaab"
          width={110}
          height={44}
          priority
          className="h-9 w-auto object-contain"
        />
        <AdminNav items={NAV_ITEMS} />
        <form action={logoutAdmin} className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-lg border border-plum-700 px-3 py-2.5 text-sm font-medium text-cream-100 transition-colors hover:bg-plum-900"
          >
            লগ আউট
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Mobile top bar — the sidebar is a drawer below `lg` */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-cream-200 bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <AdminNav items={NAV_ITEMS} />
            <span className="font-display text-base font-semibold text-plum-900">Hizjaab</span>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="rounded-lg border border-cream-200 px-3 py-1.5 text-xs font-medium text-ink-700"
            >
              লগ আউট
            </button>
          </form>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
