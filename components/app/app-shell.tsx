import { ReactNode } from "react";
import Link from "next/link";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AppShell({
  title,
  description,
  children,
  actions,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex min-h-screen">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white">
            <div className="flex min-h-16 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="lg:hidden">
                  <Link
                    href="/dashboard"
                    className="mb-2 inline-flex text-sm font-medium text-zinc-500"
                  >
                    Leadflow Pro
                  </Link>
                </div>

                <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-900">
                  {title}
                </h1>

                {description ? (
                  <p className="mt-1 text-sm text-zinc-500">{description}</p>
                ) : null}
              </div>

              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
