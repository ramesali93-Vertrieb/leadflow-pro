"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: ["/dashboard"],
  },
  {
    href: "/leads",
    label: "Leads",
    match: ["/leads"],
  },
];

function isActivePath(pathname: string, matchList: string[]) {
  return matchList.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900">
          Leadflow Pro
        </Link>
      </div>

      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const active = isActivePath(pathname, item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
