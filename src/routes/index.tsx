import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ekström VVS — Plumbing in Västerås" },
      { name: "description", content: "Book a plumber in Västerås with clear estimates and real available times." },
      { property: "og:title", content: "Ekström VVS — Plumbing in Västerås" },
      { property: "og:description", content: "Book a plumber in Västerås with clear estimates and real available times." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
