// Called once when a Next.js server instance starts, before it takes requests.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { warmUp } = await import('./server/warmup');
  await warmUp();
}
