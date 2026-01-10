import { getInsightsData } from "./actions";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { agencyScore } = await getInsightsData();
  return <HomeClient agencyScore={agencyScore} />;
}
