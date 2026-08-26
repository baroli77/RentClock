import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
export const metadata = { title: MARKETING_PAGES["gas-safety-certificate-reminders"].title, description: MARKETING_PAGES["gas-safety-certificate-reminders"].description, alternates: { canonical: "/gas-safety-certificate-reminders" } };
export default function Page() { return <FeatureLanding page={MARKETING_PAGES["gas-safety-certificate-reminders"]} />; }
