import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { getWeeklyMemeTrends } from "@/lib/content/meme-trends";

export async function GET() {
  try {
    await requireApiUser();
    const trends = await getWeeklyMemeTrends(12);

    return jsonOk(trends);
  } catch (error) {
    return jsonError(error, 400);
  }
}
