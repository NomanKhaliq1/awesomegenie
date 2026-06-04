type RequiredServerEnv =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY";

type RequiredBrowserEnv =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export function getRequiredServerEnv(key: RequiredServerEnv): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }

  return normalizePrivateKey(key, value);
}

export function getRequiredBrowserEnv(key: RequiredBrowserEnv): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required public environment variable: ${key}`);
  }

  return value;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function normalizePrivateKey(key: string, value: string): string {
  if (key !== "SUPABASE_SERVICE_ROLE_KEY") {
    return value;
  }

  return value.trim();
}
