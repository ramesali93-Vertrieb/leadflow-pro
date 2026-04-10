"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
  },
  {
    href: "/leads",
    label: "Leads",
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
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link"
          style={{
            marginTop: "8px",
            textAlign: "left",
            width: "100%",
            border: "1px solid #27272a",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}
