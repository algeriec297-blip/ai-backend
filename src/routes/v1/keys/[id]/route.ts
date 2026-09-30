import { FieldValue } from "firebase-admin/firestore";
import { authenticateDashboardUser } from "@/lib/server/user-auth";
import { ApiError, errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await authenticateDashboardUser(request);
    const { id } = await context.params;
    const reference = getAdminDb().collection("apiKeys").doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists || snapshot.get("userId") !== userId) {
      throw new ApiError("FETCH_FAILED", "API key was not found.", 404);
    }
    await reference.update({ revokedAt: FieldValue.serverTimestamp() });
    return Response.json({ id, revoked: true });
  } catch (error) {
    return errorResponse(error);
  }
}