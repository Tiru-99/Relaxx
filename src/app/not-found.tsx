import Link from "next/link";
import { PageSection } from "@/components/layout/PageSection";

export default function NotFound() {
  return (
    <PageSection centered title="This path is overgrown." lede="The page you looked for has wandered off.">
      <Link href="/" className="mt-5 inline-block text-accent">
        Return to the grove
      </Link>
    </PageSection>
  );
}
