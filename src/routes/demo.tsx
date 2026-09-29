import { createFileRoute } from "@tanstack/react-router";
import Page from "@/figma/pages/client/Demo";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Guide — VVS Flow · Ekström VVS" },
      { name: "description", content: "Walk through the VVS Flow booking and operations experience. Built for the Lovable Challenge 2026." },
      { property: "og:title", content: "Demo Guide — VVS Flow · Lovable Challenge" },
      { property: "og:description", content: "From inquiry to confirmed booking — with zero back-and-forth for the owner. Ekström VVS, Västerås, Sweden." },
    ],
  }),
  component: Page,
});
