import type { UseQueryResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ErrorState } from "./primitives";
import { PageSkeleton } from "./owner-ui";

export function QueryState<T>({ q, children, skeleton }: { q: UseQueryResult<T>; children: (data: T) => React.ReactNode; skeleton?: React.ReactNode }) {
  if (q.isPending) return <>{skeleton ?? <PageSkeleton />}</>;
  if (q.isError) return <div className="space-y-3"><ErrorState message={q.error instanceof Error ? q.error.message : "Data could not be loaded. Nothing has been changed."} /><Button variant="outline" size="sm" onClick={() => q.refetch()}>Try again</Button></div>;
  return <>{children(q.data as T)}</>;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Nothing has been changed.");
