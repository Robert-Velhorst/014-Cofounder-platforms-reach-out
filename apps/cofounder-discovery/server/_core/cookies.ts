import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  // Express resolves protocol through the configured trust-proxy boundary.
  // Reading raw forwarding headers here would bypass that policy entirely.
  return req.protocol === "https";
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}
