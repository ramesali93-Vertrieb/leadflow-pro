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
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-zinc-800 bg-zinc-950">
            <div className="flex min-h-16 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="lg:hidden">
                  <Link
                    href="/dashboard"
                    className="mb-2 inline-flex text-sm font-medium text-zinc-400"
                  >
                    Leadflow Pro
                  </Link>
                </div>

                <h1 className="truncate text-3xl font-semibold tracking-tight text-white">
                  {title}
                </h1>

                {description ? (
                  <p className="mt-1 text-sm text-zinc-400">{description}</p>
                ) : null}
              </div>

              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
