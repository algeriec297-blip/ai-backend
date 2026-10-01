import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
let credential;
let app;

try {
  if (clientEmail && privateKey) {
    if (!projectId) {
      throw new Error("Firebase project ID, client email, and private key are all required.");
    }
    credential = cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  } else if (serviceAccountJson && !(clientEmail || privateKey)) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("Firebase service account fields are incomplete.");
    }
    credential = cert({
      projectId: projectId || serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    });
  } else if (serviceAccountJson && (clientEmail || privateKey)) {
    throw new Error("Set both separate Firebase Admin fields or clear the partial fields before using service-account JSON.");
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_USE_APPLICATION_DEFAULT_CREDENTIALS === "true") {
    credential = applicationDefault();
  } else {
    throw new Error("No Firebase Admin credential method is configured.");
  }

  app = initializeApp({ credential, projectId });
} catch (error) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "configuration-error";
  console.log(`Firebase Admin initialization: failed (${code})`);
  process.exitCode = 1;
}

if (app) {
  let firstUserId;
  try {
    const result = await getAuth(app).listUsers(1);
    firstUserId = result.users[0]?.uid;
    console.log("Firebase Auth: connected");
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "connection-error";
    console.log(`Firebase Auth: failed (${code})`);
    process.exitCode = 1;
  }

  try {
    const db = getFirestore(app);
    await db.listCollections();
    console.log("Firestore: connected");
    if (firstUserId) {
      const month = new Date().toISOString().slice(0, 7);
      const [profile, monthlyUsage, recentAnalyses, analysisCount, apiKeys] = await Promise.all([
        db.collection("users").doc(firstUserId).get(),
        db.collection("monthlyUsage").doc(`${firstUserId}_${month}`).get(),
        db.collection("analyses").where("userId", "==", firstUserId).limit(100).get(),
        db.collection("analyses").where("userId", "==", firstUserId).count().get(),
        db.collection("apiKeys").where("userId", "==", firstUserId).limit(100).get(),
      ]);
      void profile;
      void monthlyUsage;
      void recentAnalyses;
      void analysisCount;
      void apiKeys;
      console.log("Dashboard Firestore queries: passed");
    } else {
      console.log("Dashboard Firestore queries: skipped (no Firebase users found)");
    }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "connection-error";
    console.log(`Firestore: failed (${code})`);
    process.exitCode = 1;
  }
}

try {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (!apiKey || !authDomain) {
    console.log("Firebase Web Auth: skipped (frontend-only configuration not provided)");
  } else {
    const endpoint = new URL("https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri");
    endpoint.searchParams.set("key", apiKey);
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "integration-check@example.invalid",
        continueUri: `https://${authDomain}/__/auth/handler`,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const rawCode = result?.error?.message;
      const safeCode = typeof rawCode === "string" && /^[A-Z_0-9-]+$/.test(rawCode)
        ? rawCode
        : `HTTP_${response.status}`;
      console.log(`Firebase Web Auth: failed (${safeCode})`);
      process.exitCode = 1;
    } else {
      const methods = Array.isArray(result?.signinMethods) ? result.signinMethods : [];
      const emailPasswordEnabled = methods.includes("password");
      if (emailPasswordEnabled) {
        console.log("Firebase Email/Password: enabled");
      } else {
        console.log("Firebase Web Auth: connected; provider list is hidden or empty, so verify Email/Password in Firebase Console.");
      }
    }
  }
} catch {
  console.log("Firebase Web Auth: configuration check failed.");
  process.exitCode = 1;
}

try {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  if (!apiKey) throw new Error("Gemini API key is missing.");
  const endpoint = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`);
  endpoint.searchParams.set("key", apiKey);
  const response = await fetch(endpoint, { method: "GET", redirect: "error" });
  if (!response.ok) throw new Error("Gemini model endpoint rejected the request.");
  console.log("Gemini model: accessible (no generation request sent)");
} catch {
  console.log("Gemini: connection failed; check the API key, model name, and project access.");
  process.exitCode = 1;
}