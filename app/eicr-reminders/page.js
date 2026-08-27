import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({ ...MARKETING_PAGES["eicr-reminders"], path: "/eicr-reminders" });
export default function Page() { return <FeatureLanding page={MARKETING_PAGES["eicr-reminders"]} />; }
