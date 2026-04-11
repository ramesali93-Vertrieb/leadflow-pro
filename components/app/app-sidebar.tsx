"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "◫",
  },
  {
    href: "/leads",
    label: "Leads",
    icon: "◉",
  },
  {
    href: "/leads/import",
    label: "Import",
    icon: "⇪",
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand">
          Leadflow Pro
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link${active ? " active" : ""}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-link sidebar-logout"
          >
            <span className="sidebar-link-icon">↗</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <nav className="mobile-nav">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link${active ? " active" : ""}`}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="mobile-nav-link mobile-nav-logout"
        >
          <span className="mobile-nav-icon">↗</span>
          <span className="mobile-nav-label">Logout</span>
        </button>
      </nav>
    </>
  );
}
