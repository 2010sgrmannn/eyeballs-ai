export async function register() {
  // Only validate env in the Node.js runtime, not Edge (where middleware runs).
  // Edge runtime doesn't have access to server-only env vars.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env');
    validateEnv();
  }
}
