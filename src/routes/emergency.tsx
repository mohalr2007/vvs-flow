import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Emergency";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency plumbing — Ekström VVS" },
      { name: "description", content: "Same-day emergency plumbing help in Västerås." },
      { property: "og:title", content: "Emergency plumbing — Ekström VVS" },
      { property: "og:description", content: "Same-day emergency plumbing help in Västerås." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
