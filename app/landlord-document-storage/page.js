import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
export const metadata = { title: MARKETING_PAGES["landlord-document-storage"].title, description: MARKETING_PAGES["landlord-document-storage"].description, alternates: { canonical: "/landlord-document-storage" } };
export default function Page() { return <FeatureLanding page={MARKETING_PAGES["landlord-document-storage"]} />; }
