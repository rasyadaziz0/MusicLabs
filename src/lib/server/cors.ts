import { NextRequest, NextResponse } from 'next/server';

type CorsConfig = {
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  allowedOriginsEnvKey?: string;
};

type CorsDecision = {
  corsHeaders: Record<string, string>;
  response?: NextResponse;
};

const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const DEFAULT_ALLOWED_HEADERS = ['Content-Type', 'Authorization'];
const DEFAULT_ENV_KEY = 'ALLOWED_ORIGINS';

function parseOriginList(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function resolveAllowedOrigins(envKey: string) {
  const configuredOrigins = parseOriginList(process.env[envKey]);
  const appUrlOrigins = parseOriginList(process.env.NEXT_PUBLIC_APP_URL);
  const serverUrlOrigins = parseOriginList(process.env.APP_URL);
  const combined = new Set<string>([
    ...configuredOrigins,
    ...appUrlOrigins,
    ...serverUrlOrigins,
  ]);

  if (process.env.NODE_ENV !== 'production') {
    DEFAULT_DEV_ORIGINS.forEach((origin) => combined.add(origin));
  }

  return combined;
}

function getRequestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function buildCorsHeaders(
  origin: string,
  methods: string[],
  headers: string[],
  allowCredentials: boolean
) {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods.join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    Vary: 'Origin',
  };

  if (allowCredentials) {
    corsHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  return corsHeaders;
}

export function enforceCors(
  request: NextRequest,
  config: CorsConfig = {}
): CorsDecision {
  const envKey = config.allowedOriginsEnvKey ?? DEFAULT_ENV_KEY;
  const allowedOrigins = resolveAllowedOrigins(envKey);
  const methods = config.allowedMethods ?? DEFAULT_ALLOWED_METHODS;
  const headers = config.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS;
  const allowCredentials = config.allowCredentials ?? false;
  const origin = getRequestOrigin(request);

  if (!origin) {
    // Allow direct browser navigation in development
    if (process.env.NODE_ENV !== 'production') {
      return { corsHeaders: {} };
    }
    return {
      corsHeaders: {},
      response: NextResponse.json({ error: 'Forbidden origin' }, { status: 403 }),
    };
  }

  if (!allowedOrigins.has(origin)) {
    return {
      corsHeaders: {},
      response: NextResponse.json({ error: 'Forbidden origin' }, { status: 403 }),
    };
  }

  const corsHeaders = buildCorsHeaders(origin, methods, headers, allowCredentials);

  if (request.method === 'OPTIONS') {
    return {
      corsHeaders,
      response: new NextResponse(null, { status: 200, headers: corsHeaders }),
    };
  }

  return { corsHeaders };
}
