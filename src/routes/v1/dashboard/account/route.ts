import { FieldValue } from "firebase-admin/firestore";
import { authenticateDashboardUser } from "@/lib/server/user-auth";
import { errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export async function POST(request: Request) {
  try {
    const userId = await authenticateDashboardUser(request);
    const db = getAdminDb();
    const reference = db.collection("users").doc(userId);
    const profile = await reference.get();
    if (!profile.exists) {
      await reference.set({ plan: "free", createdAt: FieldValue.serverTimestamp() });
    }
    return Response.json({ user_id: userId, plan: profile.get("plan") ?? "free" }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}