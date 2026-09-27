// Thin compatibility layer so the Figma design code (written for react-router-dom)
// runs unchanged on TanStack Router.
import { Link as TLink, useNavigate as useTNavigate, useParams as useTParams, useRouterState, useRouter } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string; children?: ReactNode };

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <TLink to={to as never} {...(rest as object)}>
      {children}
    </TLink>
  );
}

export function useNavigate() {
  const navigate = useTNavigate();
  const router = useRouter();
  return (to: string | number) => {
    if (typeof to === "number") return router.history.go(to);
    void navigate({ to: to as never });
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const p = useTParams({ strict: false }) as Record<string, string | undefined>;
  return { ...p, id: p["jobId"] ?? p["projectId"] ?? p["id"] } as unknown as T;
}

export function useLocation() {
  return useRouterState({ select: (s) => s.location });
}
