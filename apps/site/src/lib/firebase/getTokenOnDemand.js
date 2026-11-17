/** Load the Firebase App Check client only for a protected user action. */
export async function getAppCheckTokenOnDemand() {
  if (!import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY) return null;

  try {
    const { getAppCheckToken } = await import("./client");
    return await getAppCheckToken();
  } catch {
    // Keep the existing fail-open client behavior if App Check is unavailable.
    return null;
  }
}
