import type { Express } from "express";

/**
 * The imported Manus OAuth callback depended on a private platform service.
 * Keep an explicit endpoint so old bookmarks fail truthfully instead of
 * redirecting or pretending authentication succeeded.
 */
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (_req, res) => {
    res.status(410).json({
      error: "oauth_provider_removed",
      message: "This deployment uses local accounts. Sign in at /login.",
    });
  });
}
