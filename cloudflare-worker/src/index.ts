interface Env {
  NVIDIA_API_KEY: string;
  NVIDIA_BASE_URL?: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://libshen.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const withCors = (request: Request, res: Response) => {
  const origin = request.headers.get('Origin') || '';
  const headers = new Headers(res.headers);
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

const json = (request: Request, status: number, payload: unknown) => {
  const res = new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
  return withCors(request, res);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');

    if (request.method === 'OPTIONS') {
      return withCors(request, new Response(null, { status: 204 }));
    }

    if (request.method !== 'POST') {
      return json(request, 405, { error: 'Method Not Allowed' });
    }

    if (path !== '/v1/chat/completions') {
      return json(request, 404, { error: 'Not Found' });
    }

    const apiKey = (env.NVIDIA_API_KEY || '').trim();
    if (!apiKey) {
      return json(request, 500, { error: 'Server misconfigured: missing NVIDIA_API_KEY' });
    }

    let bodyText = '';
    try {
      bodyText = await request.text();
      JSON.parse(bodyText);
    } catch {
      return json(request, 400, { error: 'Invalid JSON body' });
    }

    const baseUrl = (env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com').replace(/\/+$/, '');
    const upstream = `${baseUrl}/v1/chat/completions`;

    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: bodyText,
    });

    const headers = new Headers();
    const contentType = upstreamRes.headers.get('Content-Type');
    if (contentType) headers.set('Content-Type', contentType);

    const res = new Response(upstreamRes.body, { status: upstreamRes.status, headers });
    return withCors(request, res);
  },
};

