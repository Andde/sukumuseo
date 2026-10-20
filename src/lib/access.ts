export const ACCESS_COOKIE = "sukumuseo_access";

// The access code lives in the ACCESS_CODE environment variable (.env.local
// locally, project settings in hosting). If it is unset, nobody gets in.
export function getAccessCode(): string | null {
  return process.env.ACCESS_CODE || null;
}
