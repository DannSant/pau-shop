// Where to go after signing in. Normally this travels in the navigation state,
// but signing in with Google leaves the site and reloads it, so the
// destination is also kept in sessionStorage for the trip.
const NEXT_KEY = "auth:next";

// Pages that only make sense before signing in are never a destination.
export const SIGN_IN_PAGES = ["/login", "/signup", "/complete-profile"];

// Only paths inside this site ("/checkout"), never "//other-site.com".
const isSafePath = (path: unknown): path is string =>
  typeof path === "string" &&
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !SIGN_IN_PAGES.includes(path.split(/[?#]/)[0]);

export function rememberNext(path: string | undefined) {
  try {
    if (isSafePath(path)) sessionStorage.setItem(NEXT_KEY, path);
    else sessionStorage.removeItem(NEXT_KEY);
  } catch {
    // storage blocked: fall back to the default destination
  }
}

// Called once the user has arrived somewhere after signing in.
export function clearRememberedNext() {
  try {
    sessionStorage.removeItem(NEXT_KEY);
  } catch {
    // ignore
  }
}

// The page to show after sign-in: the page the user came from, else the one
// stored before going to Google, else the cart (if it has items) or home.
// Read-only, so it's safe to call while rendering.
export function authDestination(fromPath: string | undefined, cartEmpty: boolean) {
  if (isSafePath(fromPath)) return fromPath;

  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(NEXT_KEY);
  } catch {
    // ignore
  }
  return isSafePath(stored) ? stored : cartEmpty ? "/" : "/cart";
}
