export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "CoFounder Outreach";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/favicon.svg";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => "/login";
