"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserSupabaseClient();

  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase.auth]);

  if (isChecking || !isAllowed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#09090b",
          color: "#f4f4f5",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        Zugriff wird geprüft...
      </div>
    );
  }

  return <>{children}</>;
}
