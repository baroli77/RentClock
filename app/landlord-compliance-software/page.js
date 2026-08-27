import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
export const metadata = { title: MARKETING_PAGES["landlord-compliance-software"].title, description: MARKETING_PAGES["landlord-compliance-software"].description, alternates: { canonical: "/landlord-compliance-software" } };
export default function Page() { return <FeatureLanding page={MARKETING_PAGES["landlord-compliance-software"]} />; }
