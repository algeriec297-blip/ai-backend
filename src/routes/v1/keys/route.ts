import { createHash, randomBytes, randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { authenticateDashboardUser } from "@/lib/server/user-auth";
import { ApiError, errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export async function GET(request: Request) {
  try {
    const userId = await authenticateDashboardUser(request);
    const keys = await getAdminDb().collection("apiKeys").where("userId", "==", userId).limit(100).get();
    return Response.json({
      data: keys.docs.map((document) => {
        const value = document.data();
        return {
          id: document.id,
          name: value.name,
          prefix: value.prefix,
          plan: value.plan,
          revoked: Boolean(value.revokedAt),
          created_at: value.createdAt?.toDate?.().toISOString() ?? null,
          last_used_at: value.lastUsedAt?.toDate?.().toISOString() ?? null,
        };
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await authenticateDashboardUser(request);
    const text = await request.text();
    if (text.length > 2048) throw new ApiError("INVALID_URL", "The key name is too long.");
    let name = "";
    try {
      const body = JSON.parse(text) as { name?: unknown };
      if (typeof body.name === "string") name = body.name.trim().slice(0, 80);
    } catch {
      throw new ApiError("INVALID_URL", "Request JSON must be valid.");
    }
    if (!name) throw new ApiError("INVALID_URL", "A non-empty API key name is required.");

    const db = getAdminDb();
    const profile = await db.collection("users").doc(userId).get();
    const plan = profile.get("plan") ?? "free";
    const secret = `bqa_live_${randomBytes(32).toString("base64url")}`;
    const id = randomUUID();
    await db.collection("apiKeys").doc(id).set({
      userId,
      keyHash: createHash("sha256").update(secret).digest("hex"),
      prefix: `${secret.slice(0, 13)}...${secret.slice(-4)}`,
      name,
      plan,
      revokedAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return Response.json({ id, name, key: secret, warning: "Copy this key now. It will not be shown again." }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}