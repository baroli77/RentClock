import FeatureLanding from "@/components/FeatureLanding";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({ ...MARKETING_PAGES["gas-safety-certificate-reminders"], path: "/gas-safety-certificate-reminders" });
export default function Page() { return <FeatureLanding page={{ ...MARKETING_PAGES["gas-safety-certificate-reminders"], path: "/gas-safety-certificate-reminders" }} />; }
