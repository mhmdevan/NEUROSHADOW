import { generateLogs } from "@/lib/mockData";
import { safeJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  return safeJson(generateLogs());
}
