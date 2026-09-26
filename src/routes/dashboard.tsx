import { createFileRoute, redirect } from "@tanstack/react-router";
import { OwnerShell } from "@/components/vvs/owner-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: OwnerShell,
});
