export type OAuthProvider = "google" | "github";

const OAUTH_STATE_KEY = "oauth_state";

function getRedirectUri() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/auth/callback";
  }

  return process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;
}

function getClientId(provider: OAuthProvider) {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  }

  return process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
}

function createState(provider: OAuthProvider) {
  const nonce = Math.random().toString(36).slice(2, 12);
  const state = `${provider}:${nonce}`;
  sessionStorage.setItem(OAUTH_STATE_KEY, state);
  return state;
}

export function consumeAndValidateOAuthState(returnedState: string | null): OAuthProvider | null {
  const expected = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);

  if (!expected || !returnedState || expected !== returnedState) {
    return null;
  }

  const [provider] = expected.split(":");
  if (provider === "google" || provider === "github") {
    return provider;
  }

  return null;
}

export function getOAuthRedirectUri() {
  return getRedirectUri();
}

export function getOAuthAuthorizeUrl(provider: OAuthProvider) {
  const clientId = getClientId(provider);
  if (!clientId) {
    return null;
  }

  const redirectUri = getRedirectUri();
  const state = createState(provider);

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}
