interface D1Result<T> {
  results: T[];
  success: boolean;
  meta?: { changes?: number };
}

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

interface D1Database {
  prepare(query: string): D1Statement;
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>;
}

interface Env {
  DB?: D1Database;
  FIREBASE_PROJECT_ID?: string;
  ADMIN_EMAIL?: string;
  ADMIN_BACKUP_EMAIL?: string;
  ADMIN_BOOTSTRAP_SECRET?: string;
  APP_ENV?: string;
}

interface ProductRow {
  id: string;
  active: number;
  data_json: string;
}

interface AdminSessionRow {
  token_hash: string;
  admin_id: string;
  expires_at: string;
  revoked_at: string | null;
  email: string;
  is_active: number;
  role: "main_admin" | "employee_admin";
}

interface FirebaseClaims {
  aud: string;
  iss: string;
  sub: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: boolean;
}

const ALLOWED_ORIGINS = new Set([
  "https://maxorabd.com",
  "https://www.maxorabd.com",
  "https://admin.maxorabd.com",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:5173",
  "http://localhost:5173"
]);

const PUBLIC_PRODUCT_FIELDS = [
  "name", "description", "category", "category_id", "category_slug",
  "sub_category", "subcategory_id", "subcategory_slug",
  "child_category", "childcategory_id", "child_category_id",
  "childcategory_slug", "child_category_slug",
  "product_type", "product_type_id", "product_type_slug",
  "colors", "sku", "image_url", "images", "product_link",
  "selling_price", "regular_price", "discount", "final_price",
  "stock", "badge", "featured", "active",
  "created_at", "updated_at", "meta_title", "meta_description",
  "meta_keywords", "slug", "brand", "brand_id", "brand_slug",
  "og_image", "is_hot_deal", "is_flash_sale", "is_new_arrival",
  "is_best_seller", "flash_sale_price", "flash_sale_start",
  "flash_sale_end", "sold_count", "video_url", "rating", "rating_count"
] as const;

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

let cachedKeys: JsonWebKey[] | null = null;
let keysExpireAt = 0;

function json(
  data: unknown,
  status = 200,
  origin: string | null = null
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return new Response(JSON.stringify(data), { status, headers });
}

function isSafePublicImageUrl(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048 ||
    /[\u0000-\u001F\u007F\\]/.test(value)
  ) return false;

  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizePublicImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSafePublicImageUrl);
}

function sanitizePublicColors(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> =>
      !!item && typeof item === "object" && !Array.isArray(item)
    )
    .map((item) => {
      const color: Record<string, unknown> = {};

      for (const key of ["name", "code", "stock", "image_url"] as const) {
        const field = item[key];

        if (
          (key === "stock" &&
            typeof field === "number" &&
            Number.isFinite(field)) ||
          (key !== "stock" &&
            typeof field === "string" &&
            field.length <= 2048 &&
            (key !== "image_url" || isSafePublicImageUrl(field)))
        ) {
          color[key] = field;
        }
      }

      return color;
    });
}

function publicProduct(row: ProductRow): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(row.data_json);
  } catch {
    return { id: row.id };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { id: row.id };
  }

  const product = parsed as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const key of PUBLIC_PRODUCT_FIELDS) {
    if (key in product) {
      safe[key] = key === "images"
        ? sanitizePublicImages(product[key])
        : key === "colors"
          ? sanitizePublicColors(product[key])
          : product[key];
    }
  }

  safe.id = row.id;
  return safe;
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Base64Url(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToBase64Url(new Uint8Array(digest));
}

async function deriveAdminPasswordHash(
  password: string,
  salt: Uint8Array,
  iterations = 310000
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    key,
    256
  );

  return bytesToBase64Url(new Uint8Array(bits));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i++) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }

  return difference === 0;
}

async function verifyAdminPassword(
  password: string,
  salt: Uint8Array,
  expectedHash: string,
  iterations: number
): Promise<boolean> {
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) {
    return false;
  }

  const actual = await deriveAdminPasswordHash(password, salt, iterations);
  return constantTimeEqual(
    new TextEncoder().encode(actual),
    new TextEncoder().encode(expectedHash)
  );
}
function adminSessionCookieName(env: Env): string {
  return env.APP_ENV === "local"
    ? "maxora_admin_session"
    : "__Host-maxora_admin_session";
}

function serializeAdminSessionCookie(env: Env, token: string, maxAge: number): string {
  const secure = env.APP_ENV === "local" ? "" : "; Secure";
  return `${adminSessionCookieName(env)}=${token}; Path=/${secure}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const item = part.trim();
    if (item.startsWith(name + "=")) {
      return item.slice(name.length + 1) || null;
    }
  }

  return null;
}

async function verifyAdminSession(
  request: Request,
  env: Env
): Promise<AdminSessionRow | null> {
  if (!env.DB) return null;

  const token = getCookieValue(request, adminSessionCookieName(env));
  if (!token || !/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;

  const tokenHash = await sha256Base64Url(token);

  const row = await env.DB.prepare(
    `SELECT s.token_hash, s.admin_id, s.expires_at, s.revoked_at,
            u.email, u.is_active, u.role
     FROM admin_sessions s
     INNER JOIN admin_users u ON u.id = s.admin_id
     WHERE s.token_hash = ?
     LIMIT 1`
  ).bind(tokenHash).first<AdminSessionRow>();

  if (!row || row.revoked_at !== null || row.is_active !== 1) {
    return null;
  }

  const expiresAt = Date.parse(row.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return row;
}
async function getFirebaseKeys(): Promise<JsonWebKey[]> {
  if (cachedKeys && Date.now() < keysExpireAt) return cachedKeys;

  const response = await fetch(JWKS_URL, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) throw new Error("Firebase signing keys unavailable");

  const data = await response.json() as {
    keys?: JsonWebKey[];
  };

  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new Error("Invalid Firebase signing keys");
  }

  const cacheControl = response.headers.get("Cache-Control") || "";
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 3600);

  cachedKeys = data.keys;
  keysExpireAt = Date.now() + Math.min(maxAge, 86400) * 1000;

  return cachedKeys;
}

async function verifyAdminToken(request: Request, env: Env): Promise<boolean> {
  try {
    const projectId = env.FIREBASE_PROJECT_ID;
    const adminEmail = env.ADMIN_EMAIL?.toLowerCase();

    if (!projectId || !adminEmail) return false;

    const authorization = request.headers.get("Authorization") || "";
    const match = authorization.match(/^Bearer ([^\s]+)$/);

    if (!match) return false;

    const parts = match[1].split(".");
    if (parts.length !== 3) return false;

    const header = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(parts[0]))
    ) as { alg?: string; kid?: string };

    const claims = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(parts[1]))
    ) as FirebaseClaims;

    if (header.alg !== "RS256" || !header.kid) return false;

    const now = Math.floor(Date.now() / 1000);

    if (
      claims.aud !== projectId ||
      claims.iss !== `https://securetoken.google.com/${projectId}` ||
      !claims.sub ||
      claims.sub.length > 128 ||
      !claims.exp ||
      claims.exp <= now ||
      !claims.iat ||
      claims.iat > now + 300 ||
      claims.exp - claims.iat > 3600 ||
      claims.email?.toLowerCase() !== adminEmail ||
      claims.email_verified !== true
    ) return false;

    const keys = await getFirebaseKeys();
    const jwk = keys.find((key) => (key as JsonWebKey & { kid?: string }).kid === header.kid);

    if (!jwk) return false;

    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      },
      false,
      ["verify"]
    );

    const signedContent = new TextEncoder().encode(
      `${parts[0]}.${parts[1]}`
    );

    const rawSignature = base64UrlToBytes(parts[2]);
    const signature = new Uint8Array(rawSignature.byteLength);
    signature.set(rawSignature);

    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature.buffer,
      signedContent
    );
  } catch {
    return false;
  }
}

async function hasRequestAdminPermission(
  request: Request,
  env: Env
): Promise<boolean> {
  if (!env.DB) return false;

  const path = new URL(request.url).pathname;
  const method = request.method.toUpperCase();
  let permission = "";

  if (path === "/api/admin/products" || /^\/api\/admin\/products\/[^/]+$/.test(path)) {
    permission = method === "GET" ? "products.read"
      : method === "POST" ? "products.create"
      : method === "PUT" ? "products.update"
      : method === "DELETE" ? "products.delete" : "";
  } else if (path === "/api/admin/dashboard" && method === "GET") {
    permission = "dashboard.read";
  } else if (path === "/api/admin/traffic/live" && method === "GET") {
    permission = "traffic.read";
  } else if (path === "/api/admin/customers" && method === "GET") {
    permission = "customers.read";
  } else if (/^\/api\/admin\/orders(?:\/[^/]+)?$/.test(path)) {
    permission = method === "GET" ? "orders.read"
      : method === "PUT" ? "orders.update"
      : method === "DELETE" ? "orders.delete" : "";
  } else if (/^\/api\/admin\/(categories|subcategories|brands|product-types|child-categories)(?:\/.*)?$/.test(path)) {
    permission = "taxonomy.manage";
  }

  if (!permission) return false;

  const session = await verifyAdminSession(request, env);
  if (session) {
    if (session.role === "main_admin") return true;
    return Boolean(await env.DB.prepare(
      "SELECT 1 AS allowed FROM admin_permissions WHERE admin_id = ? AND permission_key = ? LIMIT 1"
    ).bind(session.admin_id, permission).first());
  }

  if (!await verifyAdminToken(request, env)) return false;

  const ownerEmail = env.ADMIN_EMAIL || "";
  const owner = await env.DB.prepare(
    "SELECT id, role, is_active FROM admin_users WHERE email = ? COLLATE NOCASE LIMIT 1"
  ).bind(ownerEmail).first<{ id: string; role: string; is_active: number }>();

  return Boolean(owner && owner.is_active === 1 && owner.role === "main_admin");
}
function validNumber(value: unknown, integer = false): boolean {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    (!integer || Number.isInteger(value));
}

function extractProduct(body: unknown, existingId?: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  const product = body as Record<string, unknown>;
  const id = existingId || product.id;

  if (
    typeof id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,160}$/.test(id) ||
    typeof product.name !== "string" ||
    !product.name.trim() ||
    product.name.length > 500
  ) return null;

  if (
    product.selling_price !== undefined &&
    !validNumber(product.selling_price)
  ) return null;

  if (
    product.regular_price !== undefined &&
    product.regular_price !== null &&
    !validNumber(product.regular_price)
  ) return null;

  if (
    product.stock !== undefined &&
    !validNumber(product.stock, true)
  ) return null;

  // Discount is a fixed monetary amount, not a percentage.
  const discount = product.discount ?? 0;

  if (!validNumber(discount)) return null;

 if (
    typeof product.selling_price === "number" &&
    typeof discount === "number" &&
    discount > product.selling_price
  ) return null;

  // Accept Boolean and numeric active values.
  let active: boolean;

  if (product.active === undefined) {
    active = true;
  } else if (
    product.active === true ||
    product.active === 1 ||
    product.active === "1"
  ) {
    active = true;
  } else if (
    product.active === false ||
    product.active === 0 ||
    product.active === "0"
  ) {
    active = false;
  } else {
    return null;
  }

  const now = new Date().toISOString();

  const data: Record<string, unknown> = {
    ...product,
    id,
    name: product.name.trim(),
    active,
    discount,
    stock: product.stock ?? 0,
    updated_at: now
  };

  if (!data.created_at) data.created_at = now;

  const textOrNull = (value: unknown): string | null =>
    typeof value === "string" ? value : null;

  const numericOrNull = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? value : null;

  return {
    id,
    data,
    sku: textOrNull(data.sku),
    slug: textOrNull(data.slug),
    name: data.name as string,
    categoryId: textOrNull(data.category_id),
    categorySlug: textOrNull(data.category_slug),
    active: data.active === true ? 1 : 0,
    status: textOrNull(data.status),
    sellingPrice: numericOrNull(data.selling_price),
    regularPrice: numericOrNull(data.regular_price),
    stock: data.stock as number,
    createdAt: textOrNull(data.created_at),
    updatedAt: now,
    dataJson: JSON.stringify(data)
  };
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return json({ error: "Origin not allowed" }, 403, origin);
      }

      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "null",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Origin not allowed" }, 403);
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "maxora-api",
        databaseConfigured: Boolean(env.DB)
      }, 200, origin);
    }

    if (!env.DB) {
      return json({
        error: "Database is not configured",
        code: "D1_NOT_CONFIGURED"
      }, 503, origin);
    }

    try {
      const authPaths = [
        "/api/admin/bootstrap",
        "/api/admin/login",
        "/api/admin/change-password",
        "/api/admin/session",
        "/api/admin/logout",
      ];

      if (authPaths.includes(url.pathname)) {
        if (
          ["POST"].includes(request.method) &&
          (!origin || !ALLOWED_ORIGINS.has(origin))
        ) {
          return json({ error: "Valid Origin required" }, 403, origin);
        }

        if (url.pathname === "/api/admin/bootstrap" && request.method === "POST") {
          if (!env.ADMIN_BOOTSTRAP_SECRET || !env.ADMIN_EMAIL) {
            return json({ error: "Bootstrap is not configured" }, 503, origin);
          }

          const length = Number(request.headers.get("Content-Length") || 0);
          if (length > 8192) return json({ error: "Request too large" }, 413, origin);

          let body: Record<string, unknown>;
          try {
            body = await request.json() as Record<string, unknown>;
          } catch {
            return json({ error: "Invalid JSON" }, 400, origin);
          }

          const suppliedSecret = String(body.bootstrapSecret || "");
          const secretMatches = constantTimeEqual(
            new TextEncoder().encode(suppliedSecret),
            new TextEncoder().encode(env.ADMIN_BOOTSTRAP_SECRET)
          );

          const email = String(body.email || "").trim().toLowerCase();
          const password = String(body.password || "");

          if (!secretMatches) {
            return json({ error: "Invalid bootstrap credentials" }, 401, origin);
          }

          if (email !== env.ADMIN_EMAIL.trim().toLowerCase()) {
            return json({ error: "Invalid bootstrap credentials" }, 401, origin);
          }

          if (password.length < 12 || password.length > 128) {
            return json({ error: "Password must be 12 to 128 characters" }, 400, origin);
          }

          const existing = await env.DB.prepare(
            "SELECT id FROM admin_users LIMIT 1"
          ).first<{ id: string }>();

          if (existing) {
            return json({ error: "Bootstrap already completed" }, 409, origin);
          }

          const salt = randomBytes(16);
          const iterations = 310000;
          const passwordHash = await deriveAdminPasswordHash(password, salt, iterations);
          const now = new Date().toISOString();

          const created = await env.DB.prepare(
            `INSERT INTO admin_users
             (id, email, password_hash, password_salt, password_iterations,
              is_active, created_at, updated_at, password_changed_at, role)
             SELECT ?, ?, ?, ?, ?, 1, ?, ?, ?, 'main_admin'
             WHERE NOT EXISTS (SELECT 1 FROM admin_users)`
          ).bind(
            crypto.randomUUID(),
            email,
            passwordHash,
            bytesToBase64Url(salt),
            iterations,
            now,
            now,
            now
          ).run();

          if (!created.success || (created.meta?.changes ?? 0) !== 1) {
            return json({ error: "Admin account could not be created" }, 409, origin);
          }

          return json({ success: true, message: "Initial admin account created" }, 201, origin);
        }

        if (url.pathname === "/api/admin/login" && request.method === "POST") {
          const length = Number(request.headers.get("Content-Length") || 0);
          if (length > 8192) return json({ error: "Request too large" }, 413, origin);

          let body: Record<string, unknown>;
          try {
            body = await request.json() as Record<string, unknown>;
          } catch {
            return json({ error: "Invalid JSON" }, 400, origin);
          }

          const email = String(body.email || "").trim().toLowerCase();
          const password = String(body.password || "");

          if (!email || email.length > 254 || password.length > 128) {
            return json({ error: "Invalid email or password" }, 401, origin);
          }

          const ip = request.headers.get("CF-Connecting-IP") || "local";
          const attemptKey = await sha256Base64Url(`${email}:${ip}`);
          const attempt = await env.DB.prepare(
            "SELECT attempts, blocked_until FROM admin_login_attempts WHERE attempt_key = ?"
          ).bind(attemptKey).first<{ attempts: number; blocked_until: string | null }>();

          if (attempt?.blocked_until && Date.parse(attempt.blocked_until) > Date.now()) {
            return json({ error: "Too many attempts. Try again later." }, 429, origin);
          }

          const primaryAdminEmail = (env.ADMIN_EMAIL || "").trim().toLowerCase();
          const backupAdminEmail = (env.ADMIN_BACKUP_EMAIL || "").trim().toLowerCase();
          const isMainAdminAlias = Boolean(
            email && (email === primaryAdminEmail || email === backupAdminEmail)
          );

          const admin = isMainAdminAlias
            ? await env.DB.prepare(
                `SELECT id, email, password_hash, password_salt, password_iterations, is_active, role
                 FROM admin_users WHERE role = 'main_admin' LIMIT 1`
              ).first<{
                  id: string;
                  email: string;
                  password_hash: string;
                  password_salt: string;
                  password_iterations: number;
                  is_active: number;
                  role: "main_admin" | "employee_admin";
                }>()
            : await env.DB.prepare(
                `SELECT id, email, password_hash, password_salt, password_iterations, is_active, role
                 FROM admin_users WHERE email = ? COLLATE NOCASE LIMIT 1`
              ).bind(email).first<{
            id: string;
            email: string;
            password_hash: string;
            password_salt: string;
            password_iterations: number;
            is_active: number;
            role: "main_admin" | "employee_admin";
          }>();

          const valid = Boolean(
            admin &&
            admin.is_active === 1 &&
            await verifyAdminPassword(
              password,
              base64UrlToBytes(admin.password_salt),
              admin.password_hash,
              admin.password_iterations
            )
          );

          if (!valid || !admin) {
            await env.DB.prepare(
              `INSERT INTO admin_login_attempts
               (attempt_key, attempts, window_started_at, blocked_until)
               VALUES (?, 1, datetime('now'), NULL)
               ON CONFLICT(attempt_key) DO UPDATE SET
                 attempts = CASE
                   WHEN window_started_at <= datetime('now', '-15 minutes') THEN 1
                   ELSE attempts + 1
                 END,
                 window_started_at = CASE
                   WHEN window_started_at <= datetime('now', '-15 minutes') THEN datetime('now')
                   ELSE window_started_at
                 END,
                 blocked_until = CASE
                   WHEN (CASE
                     WHEN window_started_at <= datetime('now', '-15 minutes') THEN 1
                     ELSE attempts + 1
                   END) >= 5 THEN datetime('now', '+15 minutes')
                   ELSE NULL
                 END`
            ).bind(attemptKey).run();

            return json({ error: "Invalid email or password" }, 401, origin);
          }

          await env.DB.prepare(
            "DELETE FROM admin_login_attempts WHERE attempt_key = ?"
          ).bind(attemptKey).run();

          const token = bytesToBase64Url(randomBytes(32));
          const tokenHash = await sha256Base64Url(token);
          const now = new Date();
          const expires = new Date(now.getTime() + 12 * 60 * 60 * 1000);

          const saved = await env.DB.prepare(
            `INSERT INTO admin_sessions
             (token_hash, admin_id, created_at, expires_at, revoked_at, last_seen_at)
             VALUES (?, ?, ?, ?, NULL, ?)`
          ).bind(
            tokenHash,
            admin.id,
            now.toISOString(),
            expires.toISOString(),
            now.toISOString()
          ).run();

          if (!saved.success) {
            return json({ error: "Could not create admin session" }, 500, origin);
          }

          const loginPermissions = admin.role === "main_admin"
            ? ["dashboard.read", "traffic.read", "products.read", "products.create", "products.update", "products.delete", "orders.read", "orders.update", "orders.delete", "customers.read", "reports.read", "taxonomy.manage", "settings.manage", "employees.manage"]
            : ((await env.DB.prepare(
                "SELECT permission_key FROM admin_permissions WHERE admin_id = ?"
              ).bind(admin.id).all<{ permission_key: string }>()).results || [])
                .map((row) => row.permission_key);

          const response = json({
            success: true,
            authenticated: true,
            email: admin.email,
            role: admin.role,
            permissions: loginPermissions,
            expiresAt: expires.toISOString()
          }, 200, origin);

          response.headers.append(
            "Set-Cookie",
            serializeAdminSessionCookie(env, token, 43200)
          );

          return response;
        }

        if (url.pathname === "/api/admin/change-password" && request.method === "POST") {
          const session = await verifyAdminSession(request, env);
          if (!session) {
            return json({ error: "Authentication required" }, 401, origin);
          }

          let body: { currentPassword?: unknown; newPassword?: unknown };
          try {
            body = await request.json() as typeof body;
          } catch {
            return json({ error: "Invalid request body" }, 400, origin);
          }

          const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
          const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

          if (newPassword.length < 12 || newPassword.length > 128) {
            return json({ error: "New password must be 12 to 128 characters long" }, 400, origin);
          }
          if (currentPassword.length === 0 || currentPassword.length > 128) {
            return json({ error: "Current password is required" }, 400, origin);
          }
          if (currentPassword === newPassword) {
            return json({ error: "New password must be different" }, 400, origin);
          }
          if (!env.DB) {
            return json({ error: "Database unavailable" }, 503, origin);
          }

          const admin = await env.DB.prepare(
            `SELECT password_hash, password_salt, password_iterations
             FROM admin_users WHERE id = ? AND is_active = 1 LIMIT 1`
          ).bind(session.admin_id).first<{
            password_hash: string;
            password_salt: string;
            password_iterations: number;
          }>();

          if (!admin || !(await verifyAdminPassword(
            currentPassword,
            base64UrlToBytes(admin.password_salt),
            admin.password_hash,
            admin.password_iterations
          ))) {
            return json({ error: "Current password is incorrect" }, 403, origin);
          }

          const salt = randomBytes(16);
          const iterations = 310000;
          const passwordHash = await deriveAdminPasswordHash(newPassword, salt, iterations);
          const now = new Date().toISOString();

          await env.DB.batch([
            env.DB.prepare(
              `UPDATE admin_users
               SET password_hash = ?, password_salt = ?, password_iterations = ?,
                   password_changed_at = ?, updated_at = ?
               WHERE id = ? AND is_active = 1`
            ).bind(passwordHash, bytesToBase64Url(salt), iterations, now, now, session.admin_id),
            env.DB.prepare(
              "UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL"
            ).bind(now, session.admin_id)
          ]);

          const response = json({ success: true, reLoginRequired: true }, 200, origin);
          response.headers.append(
            "Set-Cookie",
            serializeAdminSessionCookie(env, "", 0)
          );
          return response;
        }
        if (url.pathname === "/api/admin/session" && request.method === "GET") {
          const session = await verifyAdminSession(request, env);

          if (!session) {
            return json({ authenticated: false }, 401, origin);
          }

          const sessionPermissions = session.role === "main_admin"
            ? ["dashboard.read", "traffic.read", "products.read", "products.create", "products.update", "products.delete", "orders.read", "orders.update", "orders.delete", "customers.read", "reports.read", "taxonomy.manage", "settings.manage", "employees.manage"]
            : ((await env.DB.prepare(
                "SELECT permission_key FROM admin_permissions WHERE admin_id = ?"
              ).bind(session.admin_id).all<{ permission_key: string }>()).results || [])
                .map((row) => row.permission_key);

          return json({
            authenticated: true,
            email: session.email,
            role: session.role,
            permissions: sessionPermissions,
            expiresAt: session.expires_at
          }, 200, origin);
        }

        if (url.pathname === "/api/admin/logout" && request.method === "POST") {
          const token = getCookieValue(request, adminSessionCookieName(env));

          if (token && /^[A-Za-z0-9_-]{40,100}$/.test(token)) {
            const tokenHash = await sha256Base64Url(token);

            await env.DB.prepare(
              "UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL"
            ).bind(new Date().toISOString(), tokenHash).run();
          }

          const response = json({ success: true, authenticated: false }, 200, origin);

          response.headers.append(
            "Set-Cookie",
            serializeAdminSessionCookie(env, "", 0)
          );

          return response;
        }

        return json({ error: "Method not allowed" }, 405, origin);
      }

      const employeeRoute = url.pathname.match(/^\/api\/admin\/employees(?:\/([^/]+))?(?:\/(permissions|revoke-sessions))?$/);
      const employeeAuditRoute = url.pathname === "/api/admin/audit-logs";

      if (employeeRoute || employeeAuditRoute) {
        const actor = await verifyAdminSession(request, env);
        if (!actor || actor.role !== "main_admin") {
          return json({ error: "Main Admin access required" }, 403, origin);
        }

        const allowedPermissions = new Set([
          "dashboard.read",
          "traffic.read",
          "products.read",
          "products.create",
          "products.update",
          "products.delete",
          "orders.read",
          "orders.update",
          "orders.delete",
          "customers.read",
          "taxonomy.manage"
        ]);

        const audit = (
          action: string,
          targetId: string | null,
          details: Record<string, unknown>
        ) => env.DB!.prepare(
          `INSERT INTO admin_audit_logs
           (id, actor_admin_id, target_admin_id, action, details_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          actor.admin_id,
          targetId,
          action,
          JSON.stringify(details),
          new Date().toISOString()
        );

        if (employeeAuditRoute && request.method === "GET") {
          const result = await env.DB.prepare(
            `SELECT l.id, l.actor_admin_id, l.target_admin_id, l.action,
                    l.details_json, l.created_at, a.email AS actor_email,
                    t.email AS target_email
             FROM admin_audit_logs l
             LEFT JOIN admin_users a ON a.id = l.actor_admin_id
             LEFT JOIN admin_users t ON t.id = l.target_admin_id
             ORDER BY l.created_at DESC LIMIT 200`
          ).all<Record<string, unknown>>();

          return json({ success: true, logs: result.results || [] }, 200, origin);
        }

        if (employeeRoute) {
          const employeeId = employeeRoute[1]
            ? decodeURIComponent(employeeRoute[1])
            : null;
          const action = employeeRoute[2];

          if (!employeeId && request.method === "GET") {
            const result = await env.DB.prepare(
              `SELECT id, email, is_active, role, created_at, updated_at,
                      password_changed_at
               FROM admin_users
               WHERE role = 'employee_admin'
               ORDER BY created_at DESC LIMIT 500`
            ).all<Record<string, unknown>>();

            const employees = result.results || [];
            const permissionRows = await env.DB.prepare(
              `SELECT p.admin_id, p.permission_key
               FROM admin_permissions p
               INNER JOIN admin_users u ON u.id = p.admin_id
               WHERE u.role = 'employee_admin'`
            ).all<{ admin_id: string; permission_key: string }>();

            return json({
              success: true,
              employees: employees.map((employee) => ({
                ...employee,
                permissions: (permissionRows.results || [])
                  .filter((p) => p.admin_id === employee.id)
                  .map((p) => p.permission_key)
              }))
            }, 200, origin);
          }

          if (!employeeId && request.method === "POST") {
            let body: Record<string, unknown>;
            try {
              body = await request.json() as Record<string, unknown>;
            } catch {
              return json({ error: "Invalid JSON" }, 400, origin);
            }

            const email = typeof body.email === "string"
              ? body.email.trim().toLowerCase() : "";
            const password = typeof body.password === "string" ? body.password : "";

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
              return json({ error: "Valid employee email is required" }, 400, origin);
            }
            if (password.length < 12 || password.length > 128) {
              return json({ error: "Password must be 12 to 128 characters" }, 400, origin);
            }

            const existing = await env.DB.prepare(
              "SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE LIMIT 1"
            ).bind(email).first<{ id: string }>();

            if (existing) return json({ error: "Email already exists" }, 409, origin);

            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            const salt = randomBytes(16);
            const iterations = 310000;
            const passwordHash = await deriveAdminPasswordHash(password, salt, iterations);

            const results = await env.DB.batch([
              env.DB.prepare(
                `INSERT INTO admin_users
                 (id, email, password_hash, password_salt, password_iterations,
                  is_active, created_at, updated_at, password_changed_at, role)
                 VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 'employee_admin')`
              ).bind(
                id, email, passwordHash, bytesToBase64Url(salt),
                iterations, now, now, now
              ),
              audit("employee.created", id, { email })
            ]);

            if (
              !results[0]?.success ||
              (results[0]?.meta?.changes ?? 0) !== 1 ||
              results.some((result) => !result.success)
            ) {
              return json({ error: "Employee account creation or audit logging failed" }, 500, origin);
            }

            return json({ success: true, employee: { id, email, role: "employee_admin", is_active: 1, permissions: [] } }, 201, origin);
          }

          if (!employeeId) return json({ error: "Employee ID required" }, 400, origin);

          const target = await env.DB.prepare(
            "SELECT id, email, role, is_active FROM admin_users WHERE id = ? LIMIT 1"
          ).bind(employeeId).first<{
            id: string; email: string; role: string; is_active: number;
          }>();

          if (!target || target.role !== "employee_admin") {
            return json({ error: "Employee not found" }, 404, origin);
          }

          if (action === "permissions" && request.method === "PUT") {
            let body: { permissions?: unknown };
            try {
              body = await request.json() as typeof body;
            } catch {
              return json({ error: "Invalid JSON" }, 400, origin);
            }

            if (!Array.isArray(body.permissions) ||
                body.permissions.some((p) => typeof p !== "string" || !allowedPermissions.has(p)) ||
                new Set(body.permissions).size !== body.permissions.length) {
              return json({ error: "Invalid permissions list" }, 400, origin);
            }

            const now = new Date().toISOString();
            const statements = [
              env.DB.prepare("DELETE FROM admin_permissions WHERE admin_id = ?")
                .bind(employeeId),
              ...body.permissions.map((permission) => env.DB.prepare(
                `INSERT INTO admin_permissions
                 (admin_id, permission_key, granted_by, created_at)
                 VALUES (?, ?, ?, ?)`
              ).bind(employeeId, permission, actor.admin_id, now)),
              audit("employee.permissions_updated", employeeId, {
                permissions: body.permissions
              })
            ];

            const results = await env.DB.batch(statements);
            if (results.some((result) => !result.success)) {
              return json({ error: "Permission update failed" }, 500, origin);
            }

            return json({ success: true, permissions: body.permissions }, 200, origin);
          }

          if (action === "revoke-sessions" && request.method === "POST") {
            const now = new Date().toISOString();

            const results = await env.DB.batch([
              env.DB.prepare(
                "UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL"
              ).bind(now, employeeId),
              audit("employee.sessions_revoked", employeeId, {})
            ]);

            if (
              !results[0]?.success ||
              !results[1]?.success
            ) {
              return json({ error: "Session revocation or audit logging failed" }, 500, origin);
            }

            return json({ success: true }, 200, origin);
          }

          if (request.method === "PUT" && !action) {
            let body: Record<string, unknown>;
            try {
              body = await request.json() as Record<string, unknown>;
            } catch {
              return json({ error: "Invalid JSON" }, 400, origin);
            }

            const updates: string[] = [];
            const values: unknown[] = [];
            const details: Record<string, unknown> = {};

            if (typeof body.is_active === "boolean") {
              updates.push("is_active = ?");
              values.push(body.is_active ? 1 : 0);
              details.is_active = body.is_active;
            }

            if (typeof body.password === "string") {
              if (body.password.length < 12 || body.password.length > 128) {
                return json({ error: "Password must be 12 to 128 characters" }, 400, origin);
              }

              const salt = randomBytes(16);
              const iterations = 310000;
              const hash = await deriveAdminPasswordHash(body.password, salt, iterations);

              updates.push(
                "password_hash = ?",
                "password_salt = ?",
                "password_iterations = ?",
                "password_changed_at = ?"
              );
              values.push(hash, bytesToBase64Url(salt), iterations, new Date().toISOString());
              details.password_reset = true;
            }

            if (updates.length === 0) {
              return json({ error: "No valid employee changes supplied" }, 400, origin);
            }

            const now = new Date().toISOString();
            updates.push("updated_at = ?");
            values.push(now, employeeId);

            const statements = [
              env.DB.prepare(
                `UPDATE admin_users SET ${updates.join(", ")}
                 WHERE id = ? AND role = 'employee_admin'`
              ).bind(...values)
            ];

            const mustRevokeSessions =
              body.is_active === false || typeof body.password === "string";

            if (mustRevokeSessions) {
              statements.push(
                env.DB.prepare(
                  "UPDATE admin_sessions SET revoked_at = ? WHERE admin_id = ? AND revoked_at IS NULL"
                ).bind(now, employeeId)
              );
              details.sessions_revoked = true;
            }

            statements.push(audit("employee.updated", employeeId, details));

            const results = await env.DB.batch(statements);

            if (
              !results[0]?.success ||
              (results[0]?.meta?.changes ?? 0) !== 1 ||
              results.some((result) => !result.success)
            ) {
              return json({ error: "Employee update, session revocation, or audit logging failed" }, 500, origin);
            }

            return json({ success: true }, 200, origin);
          }
          return json({ error: "Method not allowed" }, 405, origin);
        }
      }
      if (request.method === "GET" && url.pathname === "/api/products") {
        const rawLimit = Number(url.searchParams.get("limit") || 20);
        const rawOffset = Number(url.searchParams.get("offset") || 0);

        const limit = Number.isFinite(rawLimit)
          ? Math.min(50, Math.max(1, Math.floor(rawLimit)))
          : 20;

        const offset = Number.isFinite(rawOffset)
          ? Math.min(10000, Math.max(0, Math.floor(rawOffset)))
          : 0;

        const result = await env.DB.prepare(
          `SELECT id, active, data_json FROM products
           WHERE active = 1
           ORDER BY created_at DESC, id DESC
           LIMIT ? OFFSET ?`
        ).bind(limit + 1, offset).all<ProductRow>();

        const rows = result.results || [];
        const hasMore = rows.length > limit;

        return json({
          success: true,
          products: rows.slice(0, limit).map(publicProduct),
          pagination: {
            limit,
            offset,
            hasMore,
            nextOffset: hasMore ? offset + limit : null
          }
        }, 200, origin);
      }

      const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);

      if (request.method === "GET" && productMatch) {
        const id = decodeURIComponent(productMatch[1]);

        const row = await env.DB.prepare(
          `SELECT id, active, data_json FROM products
           WHERE id = ? AND active = 1 LIMIT 1`
        ).bind(id).first<ProductRow>();

        if (!row) return json({ error: "Product not found" }, 404, origin);

        return json({ product: publicProduct(row) }, 200, origin);
      }

      if (
        request.method === "GET" &&
        url.pathname === "/api/catalog/version"
      ) {
        const meta = await env.DB.prepare(
          "SELECT version, updated_at FROM catalog_meta WHERE id = 'catalog'"
        ).first<{ version: number; updated_at: string }>();

        return json({
          version: meta?.version ?? 1,
          updated_at: meta?.updated_at ?? null
        }, 200, origin);
      }

      const isAdminProductRoute =
        url.pathname === "/api/admin/products" ||
        /^\/api\/admin\/products\/[^/]+$/.test(url.pathname);

      if (isAdminProductRoute) {
        if (!["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
          return json({ error: "Method not allowed" }, 405, origin);
        }

        if (!await hasRequestAdminPermission(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        if (request.method === "GET") {
          const result = await env.DB.prepare(
            "SELECT id, active, data_json FROM products ORDER BY created_at DESC LIMIT 1000"
          ).all<ProductRow>();

          const products = (result.results || []).map((row) =>
            publicProduct(row)
          );

          return json({ success: true, products }, 200, origin);
        }

        if (!await hasRequestAdminPermission(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        if (request.method === "POST") {
          if (url.pathname !== "/api/admin/products") {
            return json({ error: "Invalid route" }, 404, origin);
          }

          const body = await request.json();
          const product = extractProduct(body);

          if (!product) {
            return json({ error: "Invalid product data" }, 400, origin);
          }

          const existing = await env.DB.prepare(
            "SELECT id FROM products WHERE id = ?"
          ).bind(product.id).first<{ id: string }>();

          if (existing) {
            return json({ error: "Product ID already exists" }, 409, origin);
          }

          await env.DB.batch([
            env.DB.prepare(
              `INSERT INTO products
              (id, sku, slug, name, category_id, category_slug, active,
               status, selling_price, regular_price, stock, created_at,
               updated_at, data_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              product.id, product.sku, product.slug, product.name,
              product.categoryId, product.categorySlug, product.active,
              product.status, product.sellingPrice, product.regularPrice,
              product.stock, product.createdAt, product.updatedAt,
              product.dataJson
            ),
            env.DB.prepare(
              "DELETE FROM deleted_products WHERE product_id = ?"
            ).bind(product.id),
            env.DB.prepare(
              "INSERT INTO catalog_meta (id, version, updated_at) VALUES ('catalog', 2, ?) ON CONFLICT(id) DO UPDATE SET version = catalog_meta.version + 1, updated_at = excluded.updated_at"
            ).bind(new Date().toISOString())
          ]);

          return json({
            success: true,
            product: publicProduct({
              id: product.id,
              active: product.active,
              data_json: product.dataJson
            })
          }, 201, origin);
        }

        const match = url.pathname.match(/^\/api\/admin\/products\/([^/]+)$/);

        if (!match) return json({ error: "Invalid product route" }, 404, origin);

        const id = decodeURIComponent(match[1]);

        if (!/^[a-zA-Z0-9_-]{1,160}$/.test(id)) {
          return json({ error: "Invalid product ID" }, 400, origin);
        }

        const existing = await env.DB.prepare(
          "SELECT id, active, data_json FROM products WHERE id = ?"
        ).bind(id).first<ProductRow>();

        if (!existing) return json({ error: "Product not found" }, 404, origin);

           if (request.method === "PUT") {
  const body = await request.json();

  const bodyRecord =
    body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};

  const existingData =
    JSON.parse(existing.data_json) as Record<string, unknown>;

  const productInput = {
    ...existingData,
    ...bodyRecord,
    id,
    active: Object.prototype.hasOwnProperty.call(bodyRecord, "active")
      ? bodyRecord.active
      : (existingData.active ?? (existing.active === 1))
  };

  const product = extractProduct(productInput, id);


          if (!product) {
            return json({ error: "Invalid product data" }, 400, origin);
          }

          product.data.created_at =
            (JSON.parse(existing.data_json) as Record<string, unknown>).created_at ||
            product.createdAt;

          product.dataJson = JSON.stringify(product.data);

          await env.DB.batch([
            env.DB.prepare(
              `UPDATE products SET sku=?, slug=?, name=?, category_id=?,
               category_slug=?, active=?, status=?, selling_price=?,
               regular_price=?, stock=?, created_at=?, updated_at=?,
               data_json=? WHERE id=?`
            ).bind(
              product.sku, product.slug, product.name, product.categoryId,
              product.categorySlug, product.active, product.status,
              product.sellingPrice, product.regularPrice, product.stock,
              product.data.created_at, product.updatedAt,
              product.dataJson, id
            ),
            env.DB.prepare(
              "DELETE FROM deleted_products WHERE product_id = ?"
            ).bind(id),
            env.DB.prepare(
              "INSERT INTO catalog_meta (id, version, updated_at) VALUES ('catalog', 2, ?) ON CONFLICT(id) DO UPDATE SET version = catalog_meta.version + 1, updated_at = excluded.updated_at"
            ).bind(new Date().toISOString())
          ]);

          return json({
            success: true,
            product: publicProduct({
              id,
              active: product.active,
              data_json: product.dataJson
            })
          }, 200, origin);
        }

        if (request.method === "DELETE") {
          const existingProduct = await env.DB.prepare(
            "SELECT id FROM products WHERE id = ? LIMIT 1"
          ).bind(id).first();

          if (!existingProduct) {
            return json({ success: false, error: "Product not found" }, 404, origin);
          }

          const now = new Date().toISOString();

          await env.DB.batch([
            env.DB.prepare(
              "UPDATE products SET active = 0, updated_at = ?, data_json = json_set(data_json, '$.active', false, '$.updated_at', ?) WHERE id = ?"
            ).bind(now, now, id),
            env.DB.prepare(
              `INSERT INTO deleted_products (product_id, deleted_at, reason)
               VALUES (?, ?, 'admin_delete')
               ON CONFLICT(product_id) DO UPDATE SET
               deleted_at = excluded.deleted_at, reason = excluded.reason`
            ).bind(id, now),
            env.DB.prepare(
              "INSERT INTO catalog_meta (id, version, updated_at) VALUES ('catalog', 2, ?) ON CONFLICT(id) DO UPDATE SET version = catalog_meta.version + 1, updated_at = excluded.updated_at"
            ).bind(now)
          ]);

          return json({ success: true, deleted: true, id }, 200, origin);
        }
      }

      // Customer Checkout: D1 is the source of truth.
      if (request.method === "POST" && url.pathname === "/api/orders") {
        const body = await request.json() as Record<string, any>;
        const orderInput = body.order && typeof body.order === "object"
          ? body.order as Record<string, any>
          : body;

        const orderId = String(body.id || orderInput.id || "").trim();
        const phone = String(orderInput.phone || body.phone || "").trim();
        const customerName = String(orderInput.customer_name || body.customer_name || "Customer").trim();
        const itemsInput = Array.isArray(body.items)
          ? body.items
          : Array.isArray(orderInput.items) ? orderInput.items : [];

        if (!/^[a-zA-Z0-9_-]{1,160}$/.test(orderId)) {
          return json({ success: false, error: "Invalid order ID" }, 400, origin);
        }
        if (!phone || !itemsInput.length || itemsInput.length > 50) {
          return json({ success: false, error: "Customer phone and valid order items are required" }, 400, origin);
        }

        const existing = await env.DB.prepare(
          "SELECT id, customer_id, data_json, updated_at FROM orders WHERE id = ? LIMIT 1"
        ).bind(orderId).first<{ id: string; customer_id: string | null; data_json: string; updated_at: string | null }>();

        if (existing) {
          let saved: Record<string, any> = {};
          try { saved = JSON.parse(existing.data_json || "{}"); } catch {}
          const savedItems = await env.DB.prepare(
            "SELECT id, product_id, product_name, sku, quantity, unit_price, line_total, buying_price, image_url, selected_color, slug, data_json FROM order_items WHERE order_id = ?"
          ).bind(orderId).all<Record<string, any>>();
          const items = (savedItems.results || []).map((item) => {
            let extra: Record<string, any> = {};
            try { extra = JSON.parse(String(item.data_json || "{}")); } catch {}
            return { ...extra, id: item.id, product_id: item.product_id,
              product_name: item.product_name, sku: item.sku,
              quantity: item.quantity, unit_price: item.unit_price,
              line_total: item.line_total, buying_price: item.buying_price,
              image_url: item.image_url, selected_color: item.selected_color,
              slug: item.slug };
          });
          return json({ success: true, duplicate: true, order: { ...saved, id: orderId, items } }, 200, origin);
        }

        const parsedItems: Record<string, any>[] = [];
        const quantities = new Map<string, number>();
        let subtotal = 0;

        for (const raw of itemsInput) {
          const productId = String(raw?.product_id || "").trim();
          const quantity = Number(raw?.quantity);
          if (!productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
            return json({ success: false, error: "Invalid product or quantity" }, 400, origin);
          }

          const product = await env.DB.prepare(
            "SELECT id, sku, name, active, selling_price, stock, data_json FROM products WHERE id = ? LIMIT 1"
          ).bind(productId).first<Record<string, any>>();

          if (!product || Number(product.active) !== 1) {
            return json({ success: false, error: `Product unavailable: ${productId}` }, 409, origin);
          }

          let productData: Record<string, any> = {};
          try { productData = JSON.parse(String(product.data_json || "{}")); } catch {}

          const discount = Math.max(0, Number(productData.discount || 0));
          const price = Math.max(0, Number(product.selling_price || 0));
          const unitPrice = Math.max(0, price - discount);
          const lineTotal = unitPrice * quantity;
          const selectedColor = String(raw.selected_color || "");
          const colors = Array.isArray(productData.colors) ? productData.colors : [];
          const matchedColor = colors.find((c: any) => String(c?.name || "") === selectedColor);
          const images = Array.isArray(productData.images) ? productData.images : [];
          const imageUrl = String(
            matchedColor?.image_url || productData.image_url || images[0] || ""
          );

          subtotal += lineTotal;
          quantities.set(productId, (quantities.get(productId) || 0) + quantity);

          parsedItems.push({
            id: `item-${crypto.randomUUID()}`,
            order_id: orderId,
            product_id: productId,
            product_name: String(product.name || ""),
            sku: String(product.sku || ""),
            quantity,
            unit_price: unitPrice,
            line_total: lineTotal,
            buying_price: Number(productData.buying_price || 0),
            image_url: imageUrl,
            selected_color: selectedColor,
            selected_color_code: String(raw.selected_color_code || matchedColor?.code || ""),
            slug: String(productData.slug || ""),
            data_json: JSON.stringify({
              selected_color_code: String(raw.selected_color_code || matchedColor?.code || "")
            })
          });
        }

        // Validate aggregated quantities per product before checkout.
        // The conditional stock deduction inside the atomic D1 batch remains
        // the final protection against concurrent checkouts.
        const productIds = Array.from(quantities.keys());
        const stockRows = await env.DB.prepare(
          `SELECT id, stock, active FROM products WHERE id IN (${productIds.map(() => "?").join(",")})`
        ).bind(...productIds).all<{ id: string; stock: number; active: number }>();

        const stockById = new Map(
          (stockRows.results || []).map((row) => [row.id, row])
        );

        for (const [productId, requestedQuantity] of quantities.entries()) {
          const productStock = stockById.get(productId);
          if (!productStock || Number(productStock.active) !== 1) {
            return json({ success: false, error: `Product unavailable: ${productId}`, code: "PRODUCT_UNAVAILABLE" }, 409, origin);
          }
          if (Number(productStock.stock) < requestedQuantity) {
            return json({
              success: false,
              error: `Insufficient stock for product: ${productId}`,
              code: "INSUFFICIENT_STOCK",
              available_stock: Number(productStock.stock),
              requested_quantity: requestedQuantity
            }, 409, origin);
          }
        }

        const settingsRows = await env.DB.prepare(
          "SELECT setting_key, value_json FROM store_settings WHERE setting_key IN ('delivery_inside_dhaka','delivery_sub_dhaka','delivery_outside_dhaka','free_delivery_enabled','free_delivery_threshold')"
        ).all<{ setting_key: string; value_json: string }>();

        const settings: Record<string, any> = {};
        for (const row of settingsRows.results || []) {
          try { settings[row.setting_key] = JSON.parse(row.value_json); }
          catch { settings[row.setting_key] = row.value_json; }
        }

        const deliveryArea = String(orderInput.delivery_area || body.delivery_area || "inside_dhaka");
        const freeEnabled = settings.free_delivery_enabled === true;
        const threshold = Number(settings.free_delivery_threshold || 2500);
        let deliveryCharge = Number(settings.delivery_outside_dhaka ?? 130);

        if (deliveryArea === "inside_dhaka") {
          deliveryCharge = Number(settings.delivery_inside_dhaka ?? 70);
        } else if (deliveryArea === "sub_dhaka") {
          deliveryCharge = Number(settings.delivery_sub_dhaka ?? 100);
        }
        if (freeEnabled && subtotal >= threshold) deliveryCharge = 0;

        const total = subtotal + deliveryCharge;
        const now = new Date().toISOString();
        const orderNumber = String(body.order_number || orderInput.order_number ||
          `MX-${now.slice(0,10).replace(/-/g,"")}-${crypto.randomUUID().slice(0,5).toUpperCase()}`);
        const customerId = `cust-${phone.replace(/[^0-9]/g, "")}`;
        const paymentMethod = String(orderInput.payment_method || "Cash on Delivery");
        const paymentStatus = "Pending";
        const paymentGateway = String(orderInput.payment_gateway ||
          (paymentMethod.toLowerCase().includes("online") ? "uddoktapay" : "cod"));

        const newOrder: Record<string, any> = {
          id: orderId,
          order_number: orderNumber,
          customer_id: customerId,
          customer_name: customerName,
          phone,
          customer_phone: phone,
          alt_phone: String(orderInput.alt_phone || ""),
          email: String(orderInput.email || ""),
          district: String(orderInput.district || ""),
          area: String(orderInput.area || ""),
          address: String(orderInput.address || ""),
          thana: String(orderInput.thana || orderInput.area || ""),
          delivery_area: deliveryArea,
          delivery_charge: deliveryCharge,
          subtotal,
          discount: 0,
          total,
          total_amount: total,
          status: "Pending",
          order_status: "Pending",
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          payment_gateway: paymentGateway,
          transaction_id: String(orderInput.transaction_id || ""),
          payment_details: orderInput.payment_details || null,
          note: String(orderInput.note || ""),
          created_at: now,
          updated_at: now,
          items: parsedItems.map(({ data_json, ...item }) => item),
          timeline: [{ status: "Pending", timestamp: now,
            note: "Order placed by customer", by: "Customer" }]
        };

        const statements: D1Statement[] = [
          env.DB.prepare(
            "INSERT INTO idempotency_keys (idempotency_key, operation, result_json, created_at) VALUES (?, 'create_order', ?, ?)"
          ).bind(`order:${orderId}`, JSON.stringify(newOrder), now)
        ];

        for (const [productId, quantity] of quantities.entries()) {
          statements.push(env.DB.prepare(
            `INSERT INTO stock_movements (id, order_id, product_id, movement_type, quantity, created_at, data_json)
             SELECT ?, ?, CASE WHEN EXISTS (
               SELECT 1 FROM products WHERE id = ? AND active = 1 AND stock >= ?
             ) THEN ? ELSE NULL END, 'order', ?, ?, '{}'
            `
          ).bind(crypto.randomUUID(), orderId, productId, quantity, productId, quantity, now));

          statements.push(env.DB.prepare(
            "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND active = 1 AND stock >= ?"
          ).bind(quantity, now, productId, quantity));
        }

        statements.push(env.DB.prepare(
          `INSERT INTO orders (
            id, order_number, customer_id, customer_name, customer_phone,
            alt_phone, email, district, area, address, delivery_area, status,
            payment_status, payment_gateway, payment_method, transaction_id,
            subtotal, discount, delivery_charge, total, created_at, updated_at,
            note, data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`
        ).bind(
          orderId, orderNumber, customerId, customerName, phone,
          newOrder.alt_phone, newOrder.email, newOrder.district, newOrder.area,
          newOrder.address, deliveryArea, paymentStatus, paymentGateway,
          paymentMethod, newOrder.transaction_id, subtotal, deliveryCharge,
          total, now, now, newOrder.note, JSON.stringify(newOrder)
        ));

        for (const item of parsedItems) {
          statements.push(env.DB.prepare(
            `INSERT INTO order_items (
              id, order_id, product_id, product_name, sku, quantity,
              unit_price, line_total, buying_price, image_url, selected_color,
              slug, data_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            item.id, orderId, item.product_id, item.product_name, item.sku,
            item.quantity, item.unit_price, item.line_total, item.buying_price,
            item.image_url, item.selected_color, item.slug, item.data_json
          ));
        }

        statements.push(env.DB.prepare(
          `INSERT INTO customers (
            id, name, phone, alt_phone, email, district, area, address,
            total_orders, total_spent, created_at, updated_at, data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, phone=excluded.phone, alt_phone=excluded.alt_phone,
            email=excluded.email, district=excluded.district, area=excluded.area,
            address=excluded.address, total_orders=customers.total_orders+1,
            total_spent=customers.total_spent+excluded.total_spent,
            updated_at=excluded.updated_at`
        ).bind(
          customerId, customerName, phone, newOrder.alt_phone, newOrder.email,
          newOrder.district, newOrder.area, newOrder.address, total, now, now,
          JSON.stringify({ id: customerId, name: customerName, phone })
        ));

        statements.push(env.DB.prepare(
          "UPDATE idempotency_keys SET result_json = ? WHERE idempotency_key = ?"
        ).bind(JSON.stringify(newOrder), `order:${orderId}`));

        try {
          await env.DB.batch(statements);
          return json({ success: true, order: newOrder }, 201, origin);
        } catch (writeError) {
          const savedOrder = await env.DB.prepare(
            "SELECT id, customer_id, data_json, updated_at FROM orders WHERE id = ? LIMIT 1"
          ).bind(orderId).first<{ id: string; customer_id: string | null; data_json: string; updated_at: string | null }>();

          if (savedOrder) {
            let saved: Record<string, any> = {};
            try { saved = JSON.parse(savedOrder.data_json || "{}"); } catch {}
            return json({ success: true, duplicate: true, order: saved }, 200, origin);
          }

          console.error("[ORDER_D1_WRITE_FAILED]", orderId, writeError);
          return json({
            success: false,
            error: "Order could not be saved. Please retry.",
            code: "ORDER_D1_WRITE_FAILED"
          }, 409, origin);
        }
      }
      // MAXORA_D1_ADMIN_DASHBOARD: D1-only admin aggregates.
    if (url.pathname === "/api/admin/dashboard") {
      if (request.method !== "GET") {
        return json({ success: false, error: "Method not allowed" }, 405, origin);
      }
      if (!await hasRequestAdminPermission(request, env)) {
        return json({ success: false, error: "Unauthorized" }, 401, origin);
      }
      if (!env.DB) {
        return json({ success: false, error: "D1 database unavailable" }, 503, origin);
      }

      const today = new Date().toISOString().slice(0, 10);
      const month = today.slice(0, 7);

      const totalsRow = await env.DB.prepare(`
        SELECT
          (SELECT COALESCE(SUM(total), 0) FROM orders
            WHERE substr(created_at, 1, 10) = ?
            AND LOWER(COALESCE(status, '')) <> 'cancelled') AS today_sales,
          (SELECT COUNT(*) FROM orders
            WHERE substr(created_at, 1, 10) = ?
            AND LOWER(COALESCE(status, '')) <> 'cancelled') AS today_orders,
          (SELECT COALESCE(SUM(total), 0) FROM orders
            WHERE substr(created_at, 1, 7) = ?
            AND LOWER(COALESCE(status, '')) <> 'cancelled') AS monthly_sales,
          (SELECT COUNT(*) FROM orders
            WHERE substr(created_at, 1, 7) = ?
            AND LOWER(COALESCE(status, '')) <> 'cancelled') AS monthly_orders,
          (SELECT COALESCE(SUM(total), 0) FROM orders
            WHERE LOWER(COALESCE(status, '')) <> 'cancelled') AS total_sales,
          (SELECT COUNT(*) FROM orders) AS total_orders,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'pending') AS pending,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'confirmed') AS confirmed,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'processing') AS processing,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'shipped') AS shipped,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'delivered') AS delivered,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'cancelled') AS cancelled,
          (SELECT COUNT(*) FROM orders WHERE LOWER(status) = 'returned') AS returned,
          (SELECT COUNT(*) FROM products WHERE active = 1) AS products,
          (SELECT COUNT(*) FROM customers) AS customers,
          (SELECT COALESCE(SUM(stock), 0) FROM products) AS total_stock,
          (SELECT COALESCE(SUM(COALESCE(oi.buying_price, 0) * COALESCE(oi.quantity, 1)), 0)
            FROM order_items oi
            INNER JOIN orders o ON o.id = oi.order_id
            WHERE LOWER(COALESCE(o.status, '')) NOT IN ('cancelled', 'returned')) AS total_expenses
      `).bind(today, today, month, month).first<Record<string, number | null>>();

      if (!totalsRow) {
        return json({ success: false, error: "Dashboard aggregation failed" }, 500, origin);
      }

      const totalSales = Number(totalsRow.total_sales || 0);
      const totalExpenses = Number(totalsRow.total_expenses || 0);

      return json({
        success: true,
        totals: {
          today_sales: Number(totalsRow.today_sales || 0),
          today_orders: Number(totalsRow.today_orders || 0),
          monthly_sales: Number(totalsRow.monthly_sales || 0),
          monthly_orders: Number(totalsRow.monthly_orders || 0),
          total_sales: totalSales,
          total_orders: Number(totalsRow.total_orders || 0),
          pending: Number(totalsRow.pending || 0),
          confirmed: Number(totalsRow.confirmed || 0),
          processing: Number(totalsRow.processing || 0),
          shipped: Number(totalsRow.shipped || 0),
          delivered: Number(totalsRow.delivered || 0),
          cancelled: Number(totalsRow.cancelled || 0),
          returned: Number(totalsRow.returned || 0),
          products: Number(totalsRow.products || 0),
          customers: Number(totalsRow.customers || 0),
          total_stock: Number(totalsRow.total_stock || 0),
          total_expenses: totalExpenses,
          profit: Math.max(0, totalSales - totalExpenses),
          traffic: null
        }
      }, 200, origin);
    }

    if (url.pathname === "/api/admin/traffic/live") {
      if (request.method !== "GET") {
        return json({ success: false, error: "Method not allowed" }, 405, origin);
      }
      if (!await hasRequestAdminPermission(request, env)) {
        return json({ success: false, error: "Unauthorized" }, 401, origin);
      }
      return json({
        success: true,
        available: false,
        traffic: null,
        message: "Live traffic tracking is not configured yet."
      }, 200, origin);
    }

    // MAXORA_D1_ADMIN_CUSTOMERS: D1-only customer listing.
    if (url.pathname === "/api/admin/customers") {
      if (request.method !== "GET") {
        return json({ success: false, error: "Method not allowed" }, 405, origin);
      }
      if (!await hasRequestAdminPermission(request, env)) {
        return json({ success: false, error: "Unauthorized" }, 401, origin);
      }
      if (!env.DB) {
        return json({ success: false, error: "D1 database unavailable" }, 503, origin);
      }

      const result = await env.DB.prepare(`
        SELECT id, name, phone, alt_phone, email, district, area, address,
               total_orders, total_spent, created_at, updated_at, data_json
        FROM customers
        ORDER BY updated_at DESC
        LIMIT 1000
      `).all<Record<string, unknown>>();

      const customers = (result.results || []).map((row) => {
        let extra: Record<string, unknown> = {};
        try { extra = JSON.parse(String(row.data_json || "{}")); } catch {}
        return { ...extra, ...row, id: row.id };
      });

      return json({ success: true, customers }, 200, origin);
    }

    // Admin Orders: D1 is the source of truth.
      const adminOrdersMatch = url.pathname.match(/^\/api\/admin\/orders(?:\/([^/]+))?$/);

      if (adminOrdersMatch) {
        if (!["GET", "PUT", "DELETE"].includes(request.method)) {
          return json({ success: false, error: "Method not allowed" }, 405, origin);
        }

        if (!await hasRequestAdminPermission(request, env)) {
          return json({ success: false, error: "Unauthorized" }, 401, origin);
        }

        if (request.method === "GET") {
          const statusFilter = url.searchParams.get("status");
          const orderResult = statusFilter
            ? await env.DB.prepare(
                `SELECT id, order_number, customer_id, customer_name,
                 customer_phone, alt_phone, email, district, area, address,
                 delivery_area, status, payment_status, payment_gateway,
                 payment_method, transaction_id, subtotal, discount,
                 delivery_charge, total, created_at, updated_at, note, data_json
                 FROM orders WHERE LOWER(status) = LOWER(?)
                 ORDER BY created_at DESC LIMIT 500`
              ).bind(statusFilter).all<Record<string, unknown>>()
            : await env.DB.prepare(
                `SELECT id, order_number, customer_id, customer_name,
                 customer_phone, alt_phone, email, district, area, address,
                 delivery_area, status, payment_status, payment_gateway,
                 payment_method, transaction_id, subtotal, discount,
                 delivery_charge, total, created_at, updated_at, note, data_json
                 FROM orders ORDER BY created_at DESC LIMIT 500`
              ).all<Record<string, unknown>>();

          const itemQuery = statusFilter
            ? env.DB.prepare(
                `SELECT id, order_id, product_id, product_name, sku, quantity,
                 unit_price, line_total, buying_price, image_url, selected_color,
                 slug, data_json FROM order_items
                 WHERE order_id IN (
                   SELECT id FROM orders
                   WHERE LOWER(status) = LOWER(?)
                   ORDER BY created_at DESC LIMIT 500
                 )`
              ).bind(statusFilter)
            : env.DB.prepare(
                `SELECT id, order_id, product_id, product_name, sku, quantity,
                 unit_price, line_total, buying_price, image_url, selected_color,
                 slug, data_json FROM order_items
                 WHERE order_id IN (
                   SELECT id FROM orders
                   ORDER BY created_at DESC LIMIT 500
                 )`
              );
          const itemResult = await itemQuery.all<Record<string, unknown>>();

          const itemsByOrder = new Map<string, Record<string, unknown>[]>();
          for (const item of itemResult.results || []) {
            const orderId = String(item.order_id || "");
            let itemData: Record<string, unknown> = {};
            try {
              itemData = JSON.parse(String(item.data_json || "{}"));
            } catch {
              itemData = {};
            }
            const mappedItem = {
              ...itemData,
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name,
              sku: item.sku,
              quantity: item.quantity,
              unit_price: item.unit_price,
              price: item.unit_price,
              line_total: item.line_total,
              buying_price: item.buying_price,
              image_url: item.image_url,
              selected_color: item.selected_color,
              slug: item.slug
            };
            const list = itemsByOrder.get(orderId) || [];
            list.push(mappedItem);
            itemsByOrder.set(orderId, list);
          }

          const orders = (orderResult.results || []).map((row) => {
            let data: Record<string, unknown> = {};
            try {
              data = JSON.parse(String(row.data_json || "{}"));
            } catch {
              data = {};
            }
            return {
              ...data,
              id: row.id,
              order_number: row.order_number,
              customer_id: row.customer_id,
              customer_name: row.customer_name,
              customer_phone: row.customer_phone,
              alt_phone: row.alt_phone,
              email: row.email,
              district: row.district,
              area: row.area,
              address: row.address,
              delivery_area: row.delivery_area,
              status: row.status,
              order_status: row.status,
              payment_status: row.payment_status,
              payment_gateway: row.payment_gateway,
              payment_method: row.payment_method,
              transaction_id: row.transaction_id,
              subtotal: row.subtotal,
              discount: row.discount,
              delivery_charge: row.delivery_charge,
              total: row.total,
              created_at: row.created_at,
              updated_at: row.updated_at,
              note: row.note,
              items: itemsByOrder.get(String(row.id)) || []
            };
          });

          return json({ success: true, orders }, 200, origin);
        }

        const orderId = adminOrdersMatch[1]
          ? decodeURIComponent(adminOrdersMatch[1])
          : "";

        if (!orderId || !/^[a-zA-Z0-9_-]{1,160}$/.test(orderId)) {
          return json({ success: false, error: "Invalid order ID" }, 400, origin);
        }

        const existingOrder = await env.DB.prepare(
          "SELECT id, customer_id, data_json, updated_at FROM orders WHERE id = ? LIMIT 1"
        ).bind(orderId).first<{ id: string; customer_id: string | null; data_json: string; updated_at: string | null }>();

        if (!existingOrder) {
          return json({ success: false, error: "Order not found" }, 404, origin);
        }

        if (request.method === "PUT") {
          const body = await request.json() as Record<string, any>;
          const now = new Date().toISOString();

          let previous: Record<string, any> = {};
          try { previous = JSON.parse(existingOrder.data_json || "{}"); } catch {}

          const oldItemsResult = await env.DB.prepare(
            "SELECT id, product_id, product_name, sku, quantity, unit_price, line_total, buying_price, image_url, selected_color, slug, data_json FROM order_items WHERE order_id = ?"
          ).bind(orderId).all<Record<string, any>>();

          const oldItems = oldItemsResult.results || [];
          const oldQty = new Map<string, number>();
          for (const item of oldItems) {
            const pid = String(item.product_id || "");
            if (pid) oldQty.set(pid, (oldQty.get(pid) || 0) + Number(item.quantity || 0));
          }

          const itemsInput = Array.isArray(body.items)
            ? body.items
            : oldItems.map((item) => ({
                ...item,
                price: item.unit_price
              }));

          if (itemsInput.length > 50) {
            return json({ success: false, error: "Maximum 50 order items allowed" }, 400, origin);
          }

          const oldById = new Map(oldItems.map((item) => [String(item.id), item]));
          const newItems: Record<string, any>[] = [];
          const newQty = new Map<string, number>();
          let subtotal = 0;

          for (const raw of itemsInput) {
            const productId = String(raw?.product_id || "").trim();
            const quantity = Number(raw?.quantity);

            if (!productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
              return json({ success: false, error: "Invalid product or quantity" }, 400, origin);
            }

            const product = await env.DB.prepare(
              "SELECT id, sku, name, active, selling_price, stock, data_json FROM products WHERE id = ? LIMIT 1"
            ).bind(productId).first<Record<string, any>>();

            if (!product) {
              return json({ success: false, error: `Product not found: ${productId}` }, 409, origin);
            }

            const oldItem = oldById.get(String(raw.id || ""));
            const oldProductQuantity = oldQty.get(productId) || 0;
            const productData = (() => {
              try { return JSON.parse(String(product.data_json || "{}")); }
              catch { return {}; }
            })();

            if (Number(product.active) !== 1 && (!oldItem || String(oldItem.product_id) !== productId)) {
              return json({ success: false, error: `Product unavailable: ${productId}` }, 409, origin);
            }

            const standardPrice = Math.max(
              0,
              Number(product.selling_price || 0) - Number(productData.discount || 0)
            );

            const suppliedPrice = raw.unit_price ?? raw.price;
            const unitPrice = suppliedPrice === undefined
              ? (oldItem ? Number(oldItem.unit_price) : standardPrice)
              : Number(suppliedPrice);

            if (!Number.isFinite(unitPrice) || unitPrice < 0 ||
                unitPrice > Number(product.selling_price || 0)) {
              return json({
                success: false,
                error: `Invalid item price for ${productId}`,
                code: "INVALID_ITEM_PRICE"
              }, 400, origin);
            }

            if (!oldItem && Number(product.active) !== 1) {
              return json({ success: false, error: "Cannot add an inactive product" }, 409, origin);
            }

            const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
            subtotal += lineTotal;
            newQty.set(productId, (newQty.get(productId) || 0) + quantity);

            const selectedColor = String(raw.selected_color ?? oldItem?.selected_color ?? "");
            const colors = Array.isArray(productData.colors) ? productData.colors : [];
            const matchedColor = colors.find((c: any) => String(c?.name || "") === selectedColor);
            const images = Array.isArray(productData.images) ? productData.images : [];

            newItems.push({
              id: oldItem ? String(oldItem.id) : `item-${crypto.randomUUID()}`,
              order_id: orderId,
              product_id: productId,
              product_name: String(product.name || ""),
              sku: String(product.sku || ""),
              quantity,
              unit_price: unitPrice,
              line_total: lineTotal,
              buying_price: Number(productData.buying_price ?? oldItem?.buying_price ?? 0),
              image_url: String(raw.image_url ?? oldItem?.image_url ?? matchedColor?.image_url ?? productData.image_url ?? images[0] ?? ""),
              selected_color: selectedColor,
              slug: String(raw.slug ?? oldItem?.slug ?? productData.slug ?? ""),
              data_json: JSON.stringify({
                ...(oldItem ? (() => {
                  try { return JSON.parse(String(oldItem.data_json || "{}")); } catch { return {}; }
                })() : {}),
                selected_color_code: String(raw.selected_color_code ?? matchedColor?.code ?? "")
              })
            });
          }

          subtotal = Math.round(subtotal * 100) / 100;
          const discount = Number(body.discount ?? previous.discount ?? 0);
          const deliveryCharge = Number(body.delivery_charge ?? previous.delivery_charge ?? 0);

          if (!Number.isFinite(discount) || discount < 0 || discount > subtotal ||
              !Number.isFinite(deliveryCharge) || deliveryCharge < 0) {
            return json({ success: false, error: "Invalid discount or delivery charge" }, 400, origin);
          }

          const total = Math.round((subtotal - discount + deliveryCharge) * 100) / 100;
          const status = String(body.status ?? body.order_status ?? previous.status ?? "Pending");
          const isTerminalStatus = ["cancelled", "returned"].includes(status.trim().toLowerCase());
          const stockWasReleased = previous.stock_released === true;
          const stockShouldBeReserved = !isTerminalStatus;
          const paymentStatus = String(body.payment_status ?? previous.payment_status ?? "Pending");
          const customerPhone = String(body.customer_phone ?? body.phone ?? previous.customer_phone ?? previous.phone ?? "");
          const customerName = String(body.customer_name ?? previous.customer_name ?? "");
          const customerId = `cust-${customerPhone.replace(/[^0-9]/g, "")}`;

          const merged: Record<string, any> = {
            ...previous,
            ...body,
            id: orderId,
            customer_id: customerId,
            customer_name: customerName,
            customer_phone: customerPhone,
            phone: customerPhone,
            status,
            order_status: status,
            payment_status: paymentStatus,
            subtotal,
            discount,
            delivery_charge: deliveryCharge,
            total,
            total_amount: total,
            items: newItems.map(({ data_json, ...item }) => item),
            stock_released: !stockShouldBeReserved,
            updated_at: now
          };

          const session = await verifyAdminSession(request, env);
          let actorAdminId: string | null = session?.admin_id || null;

          if (!actorAdminId) {
            const owner = await env.DB.prepare(
              "SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE AND role = 'main_admin' AND is_active = 1 LIMIT 1"
            ).bind(env.ADMIN_EMAIL || "").first<{ id: string }>();
            actorAdminId = owner?.id || null;
          }

          const statements: D1Statement[] = [
            env.DB.prepare(
              `INSERT INTO idempotency_keys
               (idempotency_key, operation, result_json, created_at)
               VALUES (?, CASE WHEN EXISTS (
                 SELECT 1 FROM orders WHERE id = ? AND updated_at IS ?
               ) THEN 'admin_order_update' ELSE NULL END, ?, ?)`
            ).bind(
              `admin_order_update:${orderId}:${existingOrder.updated_at ?? "legacy"}`,
              orderId, existingOrder.updated_at ?? null,
              JSON.stringify({ order_id: orderId }), now
            )
          ];

          // Reconcile stock using only the quantity difference.
          const changedProductIds = new Set([...oldQty.keys(), ...newQty.keys()]);

          for (const productId of changedProductIds) {
            const oldReservedQty = stockWasReleased ? 0 : (oldQty.get(productId) || 0);
            const newReservedQty = stockShouldBeReserved ? (newQty.get(productId) || 0) : 0;
            const difference = newReservedQty - oldReservedQty;
            if (difference === 0) continue;

            const movementType = `admin_edit_${difference > 0 ? "deduct" : "restore"}_${crypto.randomUUID()}`;

            if (difference > 0) {
              const guardType = `admin_edit_guard_${crypto.randomUUID()}`;
              statements.push(env.DB.prepare(
                `INSERT INTO stock_movements
                 (id, order_id, product_id, movement_type, quantity, created_at, data_json)
                 SELECT ?, ?, CASE WHEN EXISTS (
                   SELECT 1 FROM products WHERE id = ? AND active = 1 AND stock >= ?
                 ) THEN ? ELSE NULL END, ?, ?, ?, ?`
              ).bind(
                crypto.randomUUID(), orderId, productId, difference,
                productId, guardType, difference, now,
                JSON.stringify({ reason: "admin_order_edit_stock_guard" })
              ));
              statements.push(env.DB.prepare(
                "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND active = 1 AND stock >= ?"
              ).bind(difference, now, productId, difference));
            } else {
              statements.push(env.DB.prepare(
                "UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?"
              ).bind(Math.abs(difference), now, productId));
            }

            statements.push(env.DB.prepare(
              `INSERT INTO stock_movements
               (id, order_id, product_id, movement_type, quantity, created_at, data_json)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              crypto.randomUUID(), orderId, productId, movementType,
              Math.abs(difference), now,
              JSON.stringify({ reason: "admin_order_edit", previous_quantity: oldQty.get(productId) || 0, new_quantity: newQty.get(productId) || 0 })
            ));
          }

          statements.push(env.DB.prepare(
            "DELETE FROM order_items WHERE order_id = ?"
          ).bind(orderId));

          for (const item of newItems) {
            statements.push(env.DB.prepare(
              `INSERT INTO order_items (
                id, order_id, product_id, product_name, sku, quantity,
                unit_price, line_total, buying_price, image_url, selected_color,
                slug, data_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              item.id, orderId, item.product_id, item.product_name, item.sku,
              item.quantity, item.unit_price, item.line_total, item.buying_price,
              item.image_url, item.selected_color, item.slug, item.data_json
            ));
          }

          statements.push(env.DB.prepare(
            `UPDATE orders SET
             customer_id=?, customer_name=?, customer_phone=?, alt_phone=?,
             email=?, district=?, area=?, address=?, delivery_area=?,
             status=?, payment_status=?, payment_gateway=?, payment_method=?,
             transaction_id=?, subtotal=?, discount=?, delivery_charge=?,
             total=?, updated_at=?, note=?, data_json=?
             WHERE id=?`
          ).bind(
            customerId, customerName, customerPhone,
            merged.alt_phone ?? null, merged.email ?? null,
            merged.district ?? null, merged.area ?? null,
            merged.address ?? null, merged.delivery_area ?? null,
            status, paymentStatus, merged.payment_gateway ?? null,
            merged.payment_method ?? null, merged.transaction_id ?? null,
            subtotal, discount, deliveryCharge, total, now,
            merged.note ?? null, JSON.stringify(merged), orderId
          ));

          // Upsert the current customer and recalculate persisted order statistics.
          statements.push(env.DB.prepare(
            `INSERT INTO customers (
              id, name, phone, alt_phone, email, district, area, address,
              total_orders, total_spent, created_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              (SELECT COUNT(*) FROM orders WHERE customer_id=?),
              (SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id=?),
              ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name, phone=excluded.phone,
              alt_phone=excluded.alt_phone, email=excluded.email,
              district=excluded.district, area=excluded.area,
              address=excluded.address,
              total_orders=excluded.total_orders,
              total_spent=excluded.total_spent,
              updated_at=excluded.updated_at`
          ).bind(
            customerId, customerName, customerPhone,
            merged.alt_phone ?? null, merged.email ?? null,
            merged.district ?? null, merged.area ?? null,
            merged.address ?? null, customerId, customerId, now, now
          ));

          const oldCustomerId = existingOrder.customer_id || previous.customer_id || null;

          if (oldCustomerId && oldCustomerId !== customerId) {
            statements.push(env.DB.prepare(
              `UPDATE customers SET
               total_orders=(SELECT COUNT(*) FROM orders WHERE customer_id=?),
               total_spent=(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id=?),
               updated_at=? WHERE id=?`
            ).bind(oldCustomerId, oldCustomerId, now, oldCustomerId));
          }

          statements.push(env.DB.prepare(
            `INSERT INTO admin_audit_logs
             (id, actor_admin_id, action, details_json, created_at)
             VALUES (?, ?, 'order.updated', ?, ?)`
          ).bind(
            crypto.randomUUID(), actorAdminId,
            JSON.stringify({
              order_id: orderId,
              reason: String(body.edit_reason || body.reason || "Admin order edit"),
              before: { order: previous, items: oldItems },
              after: { order: merged, items: newItems }
            }),
            now
          ));

          try {
            await env.DB.batch(statements);
          } catch (error) {
            console.error("[ADMIN_ORDER_UPDATE_FAILED]", orderId, error);
            return json({
              success: false,
              error: "Order edit failed. No changes were committed.",
              code: "ORDER_UPDATE_FAILED"
            }, 409, origin);
          }

          return json({ success: true, order: merged }, 200, origin);
        }
        if (request.method !== "DELETE") {
          return json({ success: false, error: "Method not allowed" }, 405, origin);
        }

        const now = new Date().toISOString();
        const oldItemsResult = await env.DB.prepare(
          "SELECT id, product_id, product_name, sku, quantity, unit_price, line_total FROM order_items WHERE order_id = ?"
        ).bind(orderId).all<Record<string, any>>();
        const oldItems = oldItemsResult.results || [];
        const previous = (() => {
          try { return JSON.parse(existingOrder.data_json || "{}"); }
          catch { return {}; }
        })();

        const customerId = existingOrder.customer_id || previous.customer_id || null;
        const quantities = new Map<string, number>();
        for (const item of oldItems) {
          const productId = String(item.product_id || "");
          const quantity = Number(item.quantity || 0);
          if (productId && Number.isSafeInteger(quantity) && quantity > 0) {
            quantities.set(productId, (quantities.get(productId) || 0) + quantity);
          }
        }

        const session = await verifyAdminSession(request, env);
        let actorAdminId: string | null = session?.admin_id || null;
        if (!actorAdminId) {
          const owner = await env.DB.prepare(
            "SELECT id FROM admin_users WHERE email = ? COLLATE NOCASE AND role = 'main_admin' AND is_active = 1 LIMIT 1"
          ).bind(env.ADMIN_EMAIL || "").first<{ id: string }>();
          actorAdminId = owner?.id || null;
        }

        const deleteStatements: D1Statement[] = [];
        if (previous.stock_released !== true) {
        for (const [productId, quantity] of quantities.entries()) {
          const movementType = "admin_delete_restore";
          deleteStatements.push(env.DB.prepare(
            "UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?"
          ).bind(quantity, now, productId));
          deleteStatements.push(env.DB.prepare(
            `INSERT INTO stock_movements
             (id, order_id, product_id, movement_type, quantity, created_at, data_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            crypto.randomUUID(), orderId, productId, movementType, quantity, now,
            JSON.stringify({ reason: "admin_order_delete_stock_restore" })
          ));
        }
        }

        deleteStatements.push(env.DB.prepare(
          `INSERT INTO admin_audit_logs
           (id, actor_admin_id, action, details_json, created_at)
           VALUES (?, ?, 'order.deleted', ?, ?)`
        ).bind(
          crypto.randomUUID(), actorAdminId,
          JSON.stringify({
            order_id: orderId,
            reason: "Admin deleted order",
            before: { order: previous, items: oldItems }
          }),
          now
        ));

        deleteStatements.push(env.DB.prepare(
          "DELETE FROM order_items WHERE order_id = ?"
        ).bind(orderId));
        deleteStatements.push(env.DB.prepare(
          "DELETE FROM orders WHERE id = ?"
        ).bind(orderId));

        if (customerId) {
          deleteStatements.push(env.DB.prepare(
            `UPDATE customers SET
             total_orders=(SELECT COUNT(*) FROM orders WHERE customer_id=?),
             total_spent=(SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id=?),
             updated_at=?
             WHERE id=?`
          ).bind(customerId, customerId, now, customerId));
        }

        try {
          await env.DB.batch(deleteStatements);
        } catch (error) {
          console.error("[ADMIN_ORDER_DELETE_FAILED]", orderId, error);
          return json({
            success: false,
            error: "Order deletion failed. No changes were committed.",
            code: "ORDER_DELETE_FAILED"
          }, 409, origin);
        }

        return json({ success: true, deleted: true, id: orderId }, 200, origin);
      }
      // Public category, subcategory and brand reads from local D1 products.
      if (request.method === "GET" && url.pathname === "/api/categories") {
        const stored = await env.DB.prepare(
          "SELECT id, slug, name, active, display_order, icon, image_url, meta_title, meta_description, data_json FROM categories ORDER BY display_order ASC, name ASC"
        ).all<Record<string, unknown>>();

        let categories: Record<string, unknown>[] = (stored.results || []).map((row) => {
          let data: Record<string, unknown> = {};
          try { data = JSON.parse(String(row.data_json || "{}")) as Record<string, unknown>; } catch { data = {}; }
          return { ...data, ...row, data_json: undefined };
        });

        if (categories.length === 0) {
          const rows = await env.DB.prepare(`
            SELECT json_extract(data_json, '$.category_id') AS category_id,
                   json_extract(data_json, '$.category') AS name,
                   json_extract(data_json, '$.category_slug') AS slug
            FROM products
            WHERE trim(COALESCE(json_extract(data_json, '$.category'), '')) <> ''
            GROUP BY lower(trim(json_extract(data_json, '$.category')))
            ORDER BY name ASC
          `).all<{ category_id: string | null; name: string; slug: string | null }>();

          categories = (rows.results || []).map((row, index) => {
            const slug = row.slug || row.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return { id: row.category_id || `cat-${slug || index}`, name: row.name, slug, icon: "", image_url: "", display_order: index + 1, active: 1 };
          });
        }

        const activeOnly = url.searchParams.get("activeOnly") === "true";
        return json({ success: true, categories: activeOnly ? categories.filter((item) => item.active === 1) : categories }, 200, origin);
      }

      if (request.method === "GET" && url.pathname === "/api/subcategories") {
        const tableExists = await env.DB.prepare(
          "SELECT 1 AS found FROM sqlite_master WHERE type='table' AND name='subcategories' LIMIT 1"
        ).first<{ found: number }>();

        let subcategories: Record<string, unknown>[] = [];

        if (tableExists) {
          const rows = await env.DB.prepare(`
            SELECT id, category_id, category_slug, name, slug, active, display_order,
                   meta_title, meta_description, data_json
            FROM subcategories
            ORDER BY category_slug ASC, display_order ASC, name ASC
          `).all<Record<string, unknown>>();

          subcategories = (rows.results || []).map((row) => {
            let data: Record<string, unknown> = {};
            try { data = JSON.parse(String(row.data_json || "{}")) as Record<string, unknown>; } catch { data = {}; }
            return { ...data, ...row, data_json: undefined };
          });
        }

        if (subcategories.length === 0) {
          const rows = await env.DB.prepare(`
            SELECT id, category_id, category_slug, slug, name,
                   active, display_order, meta_title, meta_description, data_json
            FROM child_categories
            WHERE category_id IS NOT NULL
              AND trim(COALESCE(category_slug, '')) <> ''
            ORDER BY category_slug ASC, display_order ASC, name ASC
          `).all<Record<string, unknown>>();

          subcategories = (rows.results || []).map((row) => ({
            ...row,
            id: `subcat-${row.category_slug}-${row.slug}`
          }));
        }

        const activeOnly = url.searchParams.get("activeOnly") === "true";
        return json({ success: true, subcategories: activeOnly ? subcategories.filter((item) => item.active === 1) : subcategories }, 200, origin);
      }

      if (request.method === "GET" && url.pathname === "/api/brands") {
        const tableExists = await env.DB.prepare(
          "SELECT 1 AS found FROM sqlite_master WHERE type='table' AND name='brands' LIMIT 1"
        ).first<{ found: number }>();

        let brands: Record<string, unknown>[] = [];

        if (tableExists) {
          const rows = await env.DB.prepare(`
            SELECT id, name, slug, active, display_order, created_at, updated_at, data_json
            FROM brands ORDER BY display_order ASC, name ASC
          `).all<Record<string, unknown>>();

          brands = (rows.results || []).map((row) => {
            let data: Record<string, unknown> = {};
            try { data = JSON.parse(String(row.data_json || "{}")) as Record<string, unknown>; } catch { data = {}; }
            return { ...data, ...row, data_json: undefined };
          });
        }

        if (brands.length === 0) {
          const rows = await env.DB.prepare(`
            SELECT MIN(trim(json_extract(data_json, '$.brand'))) AS name
            FROM products
            WHERE trim(COALESCE(json_extract(data_json, '$.brand'), '')) <> ''
              AND lower(trim(json_extract(data_json, '$.brand'))) <> 'unbranded'
            GROUP BY lower(trim(json_extract(data_json, '$.brand')))
            ORDER BY name ASC
          `).all<{ name: string }>();

          brands = (rows.results || []).map((row, index) => {
            const slug = row.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return { id: `brand-${slug || index}`, name: row.name, slug: slug || `brand-${index}`, active: 1, display_order: index + 1 };
          });
        }

        const activeOnly = url.searchParams.get("activeOnly") === "true";
        return json({ success: true, brands: activeOnly ? brands.filter((item) => item.active === 1) : brands }, 200, origin);
      }
      // Product Types and Child Categories: public D1 reads
      const taxonomyConfig = {
        "/api/product-types": {
          table: "product_types",
          responseKey: "productTypes"
        },
        "/api/child-categories": {
          table: "child_categories",
          responseKey: "childCategories"
        }
      } as const;

      const publicTaxonomy = taxonomyConfig[url.pathname as keyof typeof taxonomyConfig];

      if (request.method === "GET" && publicTaxonomy) {
        const rows = await env.DB.prepare(
          `SELECT id, active, data_json FROM ${publicTaxonomy.table}
           ORDER BY display_order ASC, name ASC`
        ).all<{ id: string; active: number; data_json: string }>();

        const items = (rows.results || []).map((row) => {
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(row.data_json) as Record<string, unknown>;
          } catch {
            data = {};
          }
          return { ...data, id: row.id, active: row.active };
        });

        const activeOnly = url.searchParams.get("activeOnly") === "true";
        const filtered = activeOnly
          ? items.filter((item) => item.active === 1)
          : items;

        return json({
          [publicTaxonomy.responseKey]: filtered
        }, 200, origin);
      }

      // Admin taxonomy writes: Firebase ID Token is mandatory.
      const taxonomyAdminMatch = url.pathname.match(
        /^\/api\/admin\/(product-types|child-categories)(?:\/([^/]+))?$/
      );

      if (taxonomyAdminMatch) {
        if (!["POST", "DELETE"].includes(request.method)) {
          return json({ error: "Method not allowed" }, 405, origin);
        }
        if (!await hasRequestAdminPermission(request, env)) {
          return json({ error: "Unauthorized" }, 401, origin);
        }

        const isProductType = taxonomyAdminMatch[1] === "product-types";
        const table = isProductType ? "product_types" : "child_categories";

        if (request.method === "POST") {
          if (taxonomyAdminMatch[2]) {
            return json({ error: "Invalid taxonomy route" }, 404, origin);
          }

          const body = await request.json() as Record<string, unknown>;
          const id = String(body.id || "").trim();
          const name = String(body.name || "").trim();
          const slug = String(body.slug || "").trim();

          if (
            !/^[a-zA-Z0-9_-]{1,160}$/.test(id) ||
            !name || name.length > 200 ||
            !slug || slug.length > 200
          ) {
            return json({ error: "Invalid taxonomy data" }, 400, origin);
          }

          const displayOrder = Number(body.display_order ?? 1);
          if (!Number.isFinite(displayOrder)) {
            return json({ error: "Invalid display_order" }, 400, origin);
          }

          const now = new Date().toISOString();
          const active = body.active === false || body.active === 0 ||
            String(body.active) === "0" ? 0 : 1;
          const data = {
            ...body,
            id, name, slug, active,
            display_order: displayOrder,
            created_at: body.created_at || now,
            updated_at: now
          };

          const existing = await env.DB.prepare(
            `SELECT data_json FROM ${table} WHERE id = ?`
          ).bind(id).first<{ data_json: string }>();

          let oldData: Record<string, unknown> = {};
          try {
            oldData = existing?.data_json
              ? JSON.parse(existing.data_json) as Record<string, unknown>
              : {};
          } catch {
            oldData = {};
          }

          const statements: D1Statement[] = [];

          if (isProductType) {
            statements.push(env.DB.prepare(
              `INSERT INTO product_types (
                id, category_id, category_slug, subcategory_id, subcategory_slug,
                name, slug, image_url, meta_title, meta_description,
                display_order, active, created_at, updated_at, data_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                category_id=excluded.category_id,
                category_slug=excluded.category_slug,
                subcategory_id=excluded.subcategory_id,
                subcategory_slug=excluded.subcategory_slug,
                name=excluded.name,
                slug=excluded.slug,
                image_url=excluded.image_url,
                meta_title=excluded.meta_title,
                meta_description=excluded.meta_description,
                display_order=excluded.display_order,
                active=excluded.active,
                updated_at=excluded.updated_at,
                data_json=excluded.data_json`
            ).bind(
              id, body.category_id || null, body.category_slug || null,
              body.subcategory_id || null, body.subcategory_slug || null,
              name, slug, body.image_url || null,
              body.meta_title || null, body.meta_description || null,
              displayOrder, active, data.created_at, now, JSON.stringify(data)
            ));

            const oldSlug = String(oldData.slug || "");
            const oldName = String(oldData.name || "");
            if (existing && (oldSlug !== slug || oldName !== name)) {
              statements.push(env.DB.prepare(
                `UPDATE products
                 SET data_json=json_set(data_json,
                   '$.product_type', ?, '$.product_type_id', ?, '$.product_type_slug', ?),
                   updated_at=?
                 WHERE lower(trim(coalesce(json_extract(data_json,'$.product_type_id'),'')))=lower(?)
                    OR lower(trim(coalesce(json_extract(data_json,'$.product_type_slug'),'')))=lower(?)
                    OR lower(trim(coalesce(json_extract(data_json,'$.product_type'),'')))=lower(?)`
              ).bind(name, id, slug, now, id, oldSlug || slug, oldName || name));

              statements.push(env.DB.prepare(
                `UPDATE child_categories
                 SET product_type_id=?, product_type_slug=?, product_type_name=?,
                     updated_at=?,
                     data_json=json_set(data_json,
                       '$.product_type_id', '$ID', '$.product_type_slug', '$SLUG',
                       '$.product_type_name', '$NAME', '$.updated_at', '$NOW')
                 WHERE product_type_id=? OR product_type_slug=?`
                  .replace("'$ID'", "?").replace("'$SLUG'", "?")
                  .replace("'$NAME'", "?").replace("'$NOW'", "?")
              ).bind(id, slug, name, now, id, slug, name, now, id, oldSlug || slug));
            }
          } else {
            statements.push(env.DB.prepare(
              `INSERT INTO child_categories (
                id, category_id, category_slug, subcategory_id, subcategory_slug,
                product_type_id, product_type_slug, product_type_name,
                name, slug, image_url, meta_title, meta_description,
                display_order, active, created_at, updated_at, data_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                category_id=excluded.category_id,
                category_slug=excluded.category_slug,
                subcategory_id=excluded.subcategory_id,
                subcategory_slug=excluded.subcategory_slug,
                product_type_id=excluded.product_type_id,
                product_type_slug=excluded.product_type_slug,
                product_type_name=excluded.product_type_name,
                name=excluded.name,
                slug=excluded.slug,
                image_url=excluded.image_url,
                meta_title=excluded.meta_title,
                meta_description=excluded.meta_description,
                display_order=excluded.display_order,
                active=excluded.active,
                updated_at=excluded.updated_at,
                data_json=excluded.data_json`
            ).bind(
              id, body.category_id || null, body.category_slug || null,
              body.subcategory_id || null, body.subcategory_slug || null,
              body.product_type_id || null, body.product_type_slug || null,
              body.product_type_name || null, name, slug,
              body.image_url || null, body.meta_title || null,
              body.meta_description || null, displayOrder, active,
              data.created_at, now, JSON.stringify(data)
            ));

            const oldSlug = String(oldData.slug || "");
            const oldName = String(oldData.name || "");
            if (existing && (oldSlug !== slug || oldName !== name)) {
              statements.push(env.DB.prepare(
                `UPDATE products
                 SET data_json=json_set(data_json,
                   '$.child_category', ?, '$.child_category_id', ?,
                   '$.childcategory_id', ?, '$.child_category_slug', ?,
                   '$.childcategory_slug', ?),
                   updated_at=?
                 WHERE lower(trim(coalesce(json_extract(data_json,'$.child_category_id'),'')))=lower(?)
                    OR lower(trim(coalesce(json_extract(data_json,'$.childcategory_id'),'')))=lower(?)
                    OR lower(trim(coalesce(json_extract(data_json,'$.child_category_slug'),'')))=lower(?)
                    OR lower(trim(coalesce(json_extract(data_json,'$.childcategory_slug'),'')))=lower(?)
                    OR lower(trim(coalesce(json_extract(data_json,'$.child_category'),'')))=lower(?)`
              ).bind(
                name, id, id, slug, slug, now,
                id, id, oldSlug || slug, oldSlug || slug, oldName || name
              ));
            }
          }

          statements.push(env.DB.prepare(
            "UPDATE catalog_meta SET version=version+1, updated_at=? WHERE id='catalog'"
          ).bind(now));

          await env.DB.batch(statements);

          return json({
            success: true,
            [isProductType ? "productType" : "childCategory"]: data
          }, 200, origin);
        }

        const id = decodeURIComponent(taxonomyAdminMatch[2] || "");
        if (!id || !/^[a-zA-Z0-9_-]{1,160}$/.test(id)) {
          return json({ error: "Invalid taxonomy ID" }, 400, origin);
        }

        const existing = await env.DB.prepare(
          `SELECT data_json FROM ${table} WHERE id=?`
        ).bind(id).first<{ data_json: string }>();
        if (!existing) {
          return json({ error: "Taxonomy record not found" }, 404, origin);
        }

        let oldData: Record<string, unknown> = {};
        try {
          oldData = JSON.parse(existing.data_json) as Record<string, unknown>;
        } catch {
          oldData = {};
        }

        const now = new Date().toISOString();
        const statements: D1Statement[] = [
          env.DB.prepare(
            `UPDATE ${table}
             SET active=0, updated_at=?,
                 data_json=json_set(data_json,'$.active',0,'$.updated_at',?)
             WHERE id=?`
          ).bind(now, now, id)
        ];

        if (isProductType) {
          const oldSlug = String(oldData.slug || "");
          const oldName = String(oldData.name || "");
          statements.push(env.DB.prepare(
            `UPDATE products
             SET data_json=json_set(data_json,
               '$.product_type','Standard Product',
               '$.product_type_id','',
               '$.product_type_slug',''),
               updated_at=?
             WHERE lower(trim(coalesce(json_extract(data_json,'$.product_type_id'),'')))=lower(?)
                OR lower(trim(coalesce(json_extract(data_json,'$.product_type_slug'),'')))=lower(?)
                OR lower(trim(coalesce(json_extract(data_json,'$.product_type'),'')))=lower(?)`
          ).bind(now, id, oldSlug, oldName));

          statements.push(env.DB.prepare(
            `UPDATE child_categories
             SET product_type_id='', product_type_slug='', product_type_name='',
                 updated_at=?,
                 data_json=json_set(data_json,
                   '$.product_type_id','', '$.product_type_slug','',
                   '$.product_type_name','', '$.updated_at',?)
             WHERE product_type_id=? OR product_type_slug=?`
          ).bind(now, now, id, oldSlug));
        } else {
          const oldSlug = String(oldData.slug || "");
          const oldName = String(oldData.name || "");
          statements.push(env.DB.prepare(
            `UPDATE products
             SET data_json=json_set(data_json,
               '$.child_category','',
               '$.child_category_id','',
               '$.childcategory_id','',
               '$.child_category_slug','',
               '$.childcategory_slug',''),
               updated_at=?
             WHERE lower(trim(coalesce(json_extract(data_json,'$.child_category_id'),'')))=lower(?)
                OR lower(trim(coalesce(json_extract(data_json,'$.childcategory_id'),'')))=lower(?)
                OR lower(trim(coalesce(json_extract(data_json,'$.child_category_slug'),'')))=lower(?)
                OR lower(trim(coalesce(json_extract(data_json,'$.childcategory_slug'),'')))=lower(?)
                OR lower(trim(coalesce(json_extract(data_json,'$.child_category'),'')))=lower(?)`
          ).bind(now, id, id, oldSlug, oldSlug, oldName));
        }

        statements.push(env.DB.prepare(
          "UPDATE catalog_meta SET version=version+1, updated_at=? WHERE id='catalog'"
        ).bind(now));

        await env.DB.batch(statements);
        return json({ success: true, deleted: true, id }, 200, origin);
      }      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("UNIQUE constraint failed")) {
        return json({ error: "Product ID already exists" }, 409, origin);
      }

      return json({
        error: "Database request failed",
        code: "DATABASE_ERROR"
      }, 500, origin);
    }
  }
};
