/** Base URL for the Nest API (e.g. https://api.example.com/api). In dev, leave empty to use Vite proxy. */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? '';
}

export async function fetchHealth(): Promise<{ status: string }> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json() as Promise<{ status: string }>;
}
