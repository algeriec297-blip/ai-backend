import { authenticateDashboardUser } from "@/lib/server/user-auth";
import { errorResponse } from "@/lib/shared/errors";
import { getAdminDb } from "@/lib/server/firebase-admin";

export async function GET(request: Request) {
  try {
    const userId = await authenticateDashboardUser(request);
    const analyses = await getAdminDb().collection("analyses").where("userId", "==", userId).limit(100).get();
    const documents = [...analyses.docs].sort((left, right) =>
      String(right.get("analyzed_at") ?? "").localeCompare(String(left.get("analyzed_at") ?? "")),
    );
    return Response.json({
      data: documents.map((document) => {
        const analysis = { ...document.data() };
        delete analysis.userId;
        delete analysis.apiKeyId;
        delete analysis.createdAt;
        return analysis;
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}