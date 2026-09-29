import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashThemeProvider } from "@/figma/context/DashTheme";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) throw redirect({ to: "/login" });
      return { user: data.user };
    } catch (e) {
      if (typeof e === "object" && e !== null && "to" in e) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <DashThemeProvider>
      <Outlet />
    </DashThemeProvider>
  ),
});
