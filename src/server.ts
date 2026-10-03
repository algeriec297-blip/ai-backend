import cors from "cors";
import express, { type NextFunction, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { GET as getAnalysis } from "@/routes/v1/analysis/[id]/route";
import { POST as analyze } from "@/routes/v1/analyze/route";
import { POST as createDashboardAccount } from "@/routes/v1/dashboard/account/route";
import { GET as getDashboardAnalyses } from "@/routes/v1/dashboard/analyses/route";
import { GET as getDashboardSummary } from "@/routes/v1/dashboard/summary/route";
import { GET as health } from "@/routes/v1/health/route";
import { DELETE as revokeKey } from "@/routes/v1/keys/[id]/route";
import { GET as getKeys, POST as createKey } from "@/routes/v1/keys/route";
import { GET as getUsage } from "@/routes/v1/usage/route";
import { safeErrorDetails } from "@/lib/shared/errors";

type RouteHandler = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => Promise<Response> | Response;

const app = express();
const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) callback(null, true);
    else callback(new Error("CORS_ORIGIN_DENIED"));
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  maxAge: 600,
}));
app.use(express.json({ limit: "4kb", strict: true }));

function toWebRequest(request: ExpressRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(",") : value);
  }
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  headers.delete("host");
  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : JSON.stringify(request.body ?? {});
  const url = new URL(request.originalUrl, `${request.protocol}://${request.get("host") ?? "localhost"}`);
  return new Request(url, { method, headers, body });
}

function dispatch(handler: RouteHandler) {
  return async (request: ExpressRequest, response: ExpressResponse, next: NextFunction) => {
    try {
      const webRequest = toWebRequest(request);
      const result = await handler(webRequest, {
        params: Promise.resolve({
          id: typeof request.params.id === "string" ? request.params.id : request.params.id?.[0] ?? "",
        }),
      });
      result.headers.forEach((value, name) => {
        if (name.toLowerCase() !== "content-length") response.setHeader(name, value);
      });
      response.status(result.status).send(Buffer.from(await result.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  };
}

app.get("/api/v1/health", dispatch(() => health()));
app.post("/api/v1/analyze", dispatch((request) => analyze(request)));
app.get("/api/v1/analysis/:id", dispatch((request, context) => getAnalysis(request, context)));
app.get("/api/v1/usage", dispatch((request) => getUsage(request)));
app.get("/api/v1/keys", dispatch((request) => getKeys(request)));
app.post("/api/v1/keys", dispatch((request) => createKey(request)));
app.delete("/api/v1/keys/:id", dispatch((request, context) => revokeKey(request, context)));
app.post("/api/v1/dashboard/account", dispatch((request) => createDashboardAccount(request)));
app.get("/api/v1/dashboard/summary", dispatch((request) => getDashboardSummary(request)));
app.get("/api/v1/dashboard/analyses", dispatch((request) => getDashboardAnalyses(request)));

app.use((_request, response) => {
  response.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found." } });
});

app.use((error: unknown, _request: ExpressRequest, response: ExpressResponse, _next: NextFunction) => {
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    response.status(413).json({ error: { code: "INVALID_URL", message: "The request body is too large." } });
    return;
  }
  if (error instanceof Error && error.message === "CORS_ORIGIN_DENIED") {
    response.status(403).json({ error: { code: "CORS_ORIGIN_DENIED", message: "This browser origin is not allowed." } });
    return;
  }
  console.error("Backend middleware failed", {
    method: _request.method,
    path: _request.path,
    code: "INTERNAL_ERROR",
    ...safeErrorDetails(error),
  });
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
});

const server = app.listen(port, host, () => {
  console.log(`Business Qualification API listening on ${host}:${port}`);
});
server.requestTimeout = 120_000;
server.headersTimeout = 65_000;

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}