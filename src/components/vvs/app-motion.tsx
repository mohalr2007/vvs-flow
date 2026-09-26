import type { ReactNode } from "react";

export function AppMotion({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  return <div key={routeKey} className="page-enter">{children}</div>;
}