const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const serverOnly = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'APIFY_API_TOKEN',
] as const;

const serverOptional = [
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }
  if (typeof window === 'undefined') {
    for (const key of serverOnly) {
      if (!process.env[key]) missing.push(key);
    }
    for (const key of serverOptional) {
      if (!process.env[key]) {
        console.warn(`[env] Optional env var ${key} is not set. Some features may be degraded.`);
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
