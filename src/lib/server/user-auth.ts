import { ApiError } from "@/lib/shared/errors";
import { getAdminAuth } from "@/lib/server/firebase-admin";

export async function authenticateDashboardUser(request: Request): Promise<string> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/)?.[1];
  if (!token) throw new ApiError("UNAUTHORIZED", "A signed-in Firebase user is required.");
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new ApiError("UNAUTHORIZED", "The Firebase ID token is invalid or expired.");
  }
}