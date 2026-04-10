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
    <div className="app-root">
      <div className="app-layout">
        <AppSidebar />

        <div className="app-main">
          <header className="app-header">
            <div className="app-header-row">
              <div>
                <div className="mobile-brand">
                  <Link href="/dashboard">Leadflow Pro</Link>
                </div>

                <h1 className="app-title">{title}</h1>

                {description ? (
                  <p className="app-description">{description}</p>
                ) : null}
              </div>

              {actions ? <div>{actions}</div> : null}
            </div>
          </header>

          <main className="app-content">
            <div className="app-container">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
