import { authenticateApiKey } from "@/lib/server/api-auth";
import { ApiError, errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const principal = await authenticateApiKey(request);
    const { id } = await context.params;
    const snapshot = await getAdminDb().collection("analyses").doc(id).get();
    if (!snapshot.exists || snapshot.get("userId") !== principal.userId) {
      throw new ApiError("FETCH_FAILED", "Analysis was not found.", 404);
    }
    const analysis = { ...(snapshot.data() ?? {}) };
    delete analysis.userId;
    delete analysis.apiKeyId;
    delete analysis.createdAt;
    return Response.json(analysis);
  } catch (error) {
    return errorResponse(error);
  }
}