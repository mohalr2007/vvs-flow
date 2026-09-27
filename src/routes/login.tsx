import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/dashboard/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Owner sign in — VVS Flow" },
      { name: "description", content: "Sign in to the Ekström VVS operations dashboard." },
      { property: "og:title", content: "Owner sign in — VVS Flow" },
      { property: "og:description", content: "Sign in to the Ekström VVS operations dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
