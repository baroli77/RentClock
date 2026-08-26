import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
export const metadata = { title: MARKETING_PAGES["eicr-reminders"].title, description: MARKETING_PAGES["eicr-reminders"].description, alternates: { canonical: "/eicr-reminders" } };
export default function Page() { return <FeatureLanding page={MARKETING_PAGES["eicr-reminders"]} />; }
