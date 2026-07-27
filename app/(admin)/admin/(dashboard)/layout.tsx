import Link from "next/link";
import Image from "next/image";
import { logoutAdmin } from "@/app/lib/actions/auth";

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
      <aside className="flex w-60 shrink-0 flex-col border-r border-cream-200 bg-plum-950 px-4 py-6">
        <Image
          src="/brand/logo-light.png"
          alt="Hizjaab"
          width={110}
          height={44}
          className="h-9 w-auto object-contain"
        />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-cream-100 transition-colors hover:bg-plum-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin} className="mt-auto">
          <button
            type="submit"
            className="w-full rounded-lg border border-plum-700 px-3 py-2.5 text-sm font-medium text-cream-100 transition-colors hover:bg-plum-900"
          >
            লগ আউট
          </button>
        </form>
      </aside>
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
