import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ApiError } from "@/lib/shared/errors";

function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const hasServiceAccountFields = Boolean(clientEmail || privateKey);
  const useApplicationDefaultCredentials = process.env.FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS === "true";

  if (clientEmail && privateKey) {
    if (!projectId) {
      throw new ApiError("FIREBASE_NOT_CONFIGURED", "Firebase project ID, client email, and private key must all be set.");
    }
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  }

  if (rawServiceAccount && hasServiceAccountFields) {
    throw new ApiError("FIREBASE_NOT_CONFIGURED", "Set both separate Firebase Admin fields or clear the partial fields before using service-account JSON.");
  }

  if (!rawServiceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !useApplicationDefaultCredentials) {
    throw new ApiError("FIREBASE_NOT_CONFIGURED", "Firebase is not configured on this server.");
  }

  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error("Missing required service account fields");
      }
      const resolvedProjectId = projectId ?? serviceAccount.project_id;
      return initializeApp({
        credential: cert({
          projectId: resolvedProjectId,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
        }),
        projectId: resolvedProjectId,
      });
    } catch {
      throw new ApiError("FIREBASE_NOT_CONFIGURED", "Firebase service account configuration is invalid.");
    }
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

export function getAdminDb() {
  return getFirestore(getFirebaseApp());
}

export function getAdminAuth() {
  return getAuth(getFirebaseApp());
}