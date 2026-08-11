import crypto from "crypto";
import { siteUrl } from "@/lib/search-console";

const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const MICROSOFT_ADS_SCOPE = "openid offline_access https://ads.microsoft.com/msads.manage";

function encryptionKey() {
  const configured = process.env.GROWTH_TOKEN_ENCRYPTION_KEY;
  if (configured) {
    const key = Buffer.from(configured, "base64");
    if (key.length !== 32) throw new Error("GROWTH_TOKEN_ENCRYPTION_KEY must be a 32-byte base64 value.");
    return key;
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return crypto.createHash("sha256").update(`rentclock-growth-ads-v1:${process.env.SUPABASE_SERVICE_ROLE_KEY}`).digest();
  }
  throw new Error("A server-side growth token encryption key has not been configured.");
}

export function encryptGrowthToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptGrowthToken(payload) {
  const [iv, tag, encrypted] = String(payload || "").split(".");
  if (!iv || !tag || !encrypted) throw new Error("Saved advertising token is invalid.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
}

export function googleAdsConfig() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials are not configured.");
  return {
    clientId,
    clientSecret,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    redirectUri: `${siteUrl()}/api/seo/search-console/callback`,
  };
}

export function googleAdsAuthorizationUrl(state) {
  const { clientId, redirectUri } = googleAdsConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_ADS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleAdsCode(code) {
  const { clientId, clientSecret, redirectUri } = googleAdsConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const data = await response.json();
  if (!response.ok || !data.refresh_token) throw new Error(data.error_description || "Google did not provide a refresh token.");
  return data;
}

export async function listGoogleAdsCustomers(accessToken) {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) return { customers: [], verified: false, reason: "Google Ads developer token is not configured" };
  const response = await fetch("https://googleads.googleapis.com/v25/customers:listAccessibleCustomers", {
    headers: { Authorization: `Bearer ${accessToken}`, "developer-token": developerToken },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Google Ads could not list accessible customers.");
  const customers = (data.resourceNames || []).map((name) => String(name).replace("customers/", ""));
  return { customers, verified: true, reason: null };
}

export function microsoftAdsConfig() {
  const clientId = process.env.MICROSOFT_ADS_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_ADS_CLIENT_SECRET || "";
  if (!clientId) throw new Error("Microsoft Advertising client ID is not configured.");
  return { clientId, clientSecret, developerToken: process.env.MICROSOFT_ADS_DEVELOPER_TOKEN || "", redirectUri: `${siteUrl()}/api/growth/connections/microsoft/callback` };
}

export function microsoftAdsAuthorizationUrl(state) {
  const { clientId, redirectUri } = microsoftAdsConfig();
  const params = new URLSearchParams({ client_id: clientId, response_type: "code", redirect_uri: redirectUri, response_mode: "query", scope: MICROSOFT_ADS_SCOPE, state, prompt: "select_account" });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeMicrosoftAdsCode(code) {
  const { clientId, clientSecret, redirectUri } = microsoftAdsConfig();
  const body = new URLSearchParams({ client_id: clientId, scope: MICROSOFT_ADS_SCOPE, code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  if (clientSecret) body.set("client_secret", clientSecret);
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json();
  if (!response.ok || !data.refresh_token) throw new Error(data.error_description || "Microsoft did not provide a refresh token.");
  return data;
}

export async function verifyMicrosoftAds(accessToken) {
  const developerToken = process.env.MICROSOFT_ADS_DEVELOPER_TOKEN;
  if (!developerToken) return { verified: false, reason: "Microsoft Advertising developer token is not configured" };
  const response = await fetch("https://clientcenter.api.bingads.microsoft.com/CustomerManagement/v13/User/Query", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, DeveloperToken: developerToken, "Content-Type": "application/json" },
    body: JSON.stringify({ UserId: null }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.Message || data?.message || "Microsoft Advertising connection could not be verified.");
  return { verified: true, reason: null, userName: [data?.User?.FirstName, data?.User?.LastName].filter(Boolean).join(" ") || null };
}

export function advertisingSetupStatus(connections = []) {
  const byProvider = Object.fromEntries(connections.map((item) => [item.provider, item]));
  const googleOAuthReady = Boolean((process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID) && (process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET));
  const microsoftOAuthReady = Boolean(process.env.MICROSOFT_ADS_CLIENT_ID);
  return {
    google: {
      connected: Boolean(byProvider.google),
      connectedAt: byProvider.google?.connected_at || null,
      accountId: byProvider.google?.account_id || null,
      customerId: byProvider.google?.customer_id || null,
      accountName: byProvider.google?.account_name || null,
      verified: Boolean(byProvider.google?.metadata?.verified),
      oauthReady: googleOAuthReady,
      developerTokenReady: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    },
    microsoft: {
      connected: Boolean(byProvider.microsoft),
      connectedAt: byProvider.microsoft?.connected_at || null,
      accountId: byProvider.microsoft?.account_id || process.env.MICROSOFT_ADS_ACCOUNT_ID || null,
      customerId: byProvider.microsoft?.customer_id || process.env.MICROSOFT_ADS_CUSTOMER_ID || null,
      accountName: byProvider.microsoft?.account_name || null,
      verified: Boolean(byProvider.microsoft?.metadata?.verified),
      oauthReady: microsoftOAuthReady,
      developerTokenReady: Boolean(process.env.MICROSOFT_ADS_DEVELOPER_TOKEN),
      clientSecretReady: Boolean(process.env.MICROSOFT_ADS_CLIENT_SECRET),
    },
  };
}
