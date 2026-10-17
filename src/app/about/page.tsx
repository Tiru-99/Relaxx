import type { Metadata } from "next";
import { PageSection } from "@/components/layout/PageSection";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageSection
      narrow
      title="About Still Grove"
      lede="Still Grove is a home for small, unhurried games inspired by the natural world. No scores to chase, no timers, no ads. Just places to wander, listen and breathe."
    />
  );
}
