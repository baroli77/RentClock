import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({ ...MARKETING_PAGES["landlord-compliance-software"], path: "/landlord-compliance-software" });
export default function Page() { return <FeatureLanding page={{ ...MARKETING_PAGES["landlord-compliance-software"], path: "/landlord-compliance-software" }} />; }
