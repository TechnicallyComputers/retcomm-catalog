/**
 * RetComM catalog submission API (Cloudflare Worker).
 *
 * Routes:
 *   GET  /api/health
 *   GET  /auth/login
 *   GET  /auth/callback
 *   GET  /auth/me
 *   POST /auth/logout
 *   POST /api/probe
 *   POST /api/submit
 */

const SESSION_COOKIE = "retcomm_submit_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch (err) {
      console.error(err);
      return json({ error: err.message || "Internal error" }, 500, request, env);
    }
  },
};

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (request.method === "OPTIONS") {
    return cors(new Response(null, { status: 204 }), request, env);
  }

  if (path === "/api/health" && request.method === "GET") {
    return json({ ok: true }, 200, request, env);
  }

  if (path === "/auth/login" && request.method === "GET") {
    return startLogin(url, env, request);
  }
  if (path === "/auth/callback" && request.method === "GET") {
    return finishLogin(url, env, request);
  }
  if (path === "/auth/me" && request.method === "GET") {
    return me(request, env);
  }
  if (path === "/auth/logout" && request.method === "POST") {
    return logout(request, env);
  }
  if (path === "/api/probe" && request.method === "POST") {
    return probe(request, env);
  }
  if (path === "/api/submit" && request.method === "POST") {
    return submit(request, env);
  }

  return json({ error: "Not found" }, 404, request, env);
}

/* ── CORS / JSON ─────────────────────────────────────────────── */

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const pages = (env.PAGES_ORIGIN || "").replace(/\/$/, "");
  const extras = (env.EXTRA_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allow = new Set([
    pages,
    `${pages}/retcomm-catalog`,
    "http://localhost:8787",
    "http://127.0.0.1:8787",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:4173",
    ...extras,
  ]);
  if (origin && allow.has(origin)) return origin;
  // GitHub project Pages path origins are just the host; allow host match.
  if (origin && pages && origin === pages) return origin;
  if (origin.endsWith(".github.io") && pages && origin === pages) return origin;
  return pages || origin || "*";
}

function cors(res, request, env) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin(request, env));
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  headers.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers });
}

function json(body, status, request, env, extraHeaders = {}) {
  return cors(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
    }),
    request,
    env
  );
}

/* ── Session (HMAC-signed) ───────────────────────────────────── */

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function b64url(bytes) {
  let bin = "";
  const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlJson(obj) {
  return b64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function fromB64url(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function signSession(payload, env) {
  const body = b64urlJson(payload);
  const key = await hmacKey(env.SESSION_SECRET);
  const sig = b64url(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  );
  return `${body}.${sig}`;
}

async function verifySession(token, env) {
  if (!token || !env.SESSION_SECRET) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const key = await hmacKey(env.SESSION_SECRET);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    fromB64url(sig),
    new TextEncoder().encode(body)
  );
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function cookieAttrs(request) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  // Cross-site Pages → Worker needs SameSite=None; Secure. Local wrangler uses Lax.
  const parts = [
    "Path=/",
    "HttpOnly",
    secure ? "SameSite=None" : "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SEC}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function setSessionCookie(token, env, request) {
  return `${SESSION_COOKIE}=${token}; ${cookieAttrs(request)}`;
}

function clearSessionCookie(env, request) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const parts = ["Path=/", "HttpOnly", "Max-Age=0"];
  parts.push(secure ? "SameSite=None" : "SameSite=Lax");
  if (secure) parts.push("Secure");
  return `${SESSION_COOKIE}=; ${parts.join("; ")}`;
}

function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

async function requireUser(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await verifySession(token, env);
  if (!session?.login) {
    const err = new Error("GitHub login required");
    err.status = 401;
    throw err;
  }
  return session;
}

/* ── Auth ────────────────────────────────────────────────────── */

function pagesReturnUrl(env, next) {
  const base = (env.PAGES_ORIGIN || "").replace(/\/$/, "");
  const path = env.PAGES_PATH || "/retcomm-catalog/submit/";
  const url = new URL(path, base + "/");
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

async function startLogin(url, env, request) {
  if (!env.GITHUB_CLIENT_ID) {
    return json({ error: "GITHUB_CLIENT_ID not configured" }, 500, request, env);
  }
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const returnTo = url.searchParams.get("return_to") || pagesReturnUrl(env);
  const statePayload = await signSession(
    {
      state,
      return_to: returnTo,
      exp: Math.floor(Date.now() / 1000) + 600,
    },
    env
  );

  const gh = new URL("https://github.com/login/oauth/authorize");
  gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  gh.searchParams.set(
    "redirect_uri",
    `${url.origin}/auth/callback`
  );
  gh.searchParams.set("scope", "read:user");
  gh.searchParams.set("state", statePayload);

  return cors(
    new Response(null, {
      status: 302,
      headers: { Location: gh.toString() },
    }),
    request,
    env
  );
}

async function finishLogin(url, env, request) {
  const code = url.searchParams.get("code");
  const stateTok = url.searchParams.get("state");
  const state = await verifySession(stateTok, env);
  if (!code || !state?.state) {
    return json({ error: "Invalid OAuth state" }, 400, request, env);
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/auth/callback`,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return json(
      { error: "OAuth token exchange failed", detail: tokenJson },
      400,
      request,
      env
    );
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenJson.access_token}`,
      "User-Agent": "retcomm-catalog-submit",
    },
  });
  if (!userRes.ok) {
    return json({ error: "Failed to load GitHub user" }, 400, request, env);
  }
  const user = await userRes.json();
  const login = String(user.login || "");

  if (await isBanned(login, env)) {
    const dest = new URL(state.return_to || pagesReturnUrl(env));
    dest.searchParams.set("error", "banned");
    return cors(
      new Response(null, { status: 302, headers: { Location: dest.toString() } }),
      request,
      env
    );
  }

  const session = await signSession(
    {
      login,
      id: user.id,
      name: user.name || login,
      avatar: user.avatar_url || "",
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
    },
    env
  );

  const dest = new URL(state.return_to || pagesReturnUrl(env));
  dest.searchParams.set("logged_in", "1");

  return cors(
    new Response(null, {
      status: 302,
      headers: {
        Location: dest.toString(),
        "Set-Cookie": setSessionCookie(session, env, request),
      },
    }),
    request,
    env
  );
}

async function me(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await verifySession(token, env);
  if (!session?.login) {
    return json({ user: null }, 200, request, env);
  }
  if (await isBanned(session.login, env)) {
    return json(
      { user: null, error: "banned" },
      200,
      request,
      env,
      { "Set-Cookie": clearSessionCookie(env, request) }
    );
  }
  return json(
    {
      user: {
        login: session.login,
        name: session.name,
        avatar: session.avatar,
      },
    },
    200,
    request,
    env
  );
}

async function logout(request, env) {
  return json(
    { ok: true },
    200,
    request,
    env,
    { "Set-Cookie": clearSessionCookie(env, request) }
  );
}

/* ── Ban list ────────────────────────────────────────────────── */

async function isBanned(login, env) {
  const needle = String(login || "").toLowerCase();
  if (!needle) return true;

  const fromEnv = (env.BANNED_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.includes(needle)) return true;

  const url = env.BANNED_USERS_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "retcomm-catalog-submit", Accept: "application/json" },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const users = (data.users || []).map((u) => String(u).toLowerCase());
    return users.includes(needle);
  } catch {
    return false;
  }
}

/* ── Probe GitHub repo ───────────────────────────────────────── */

function parseRepoSlug(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  let slug = raw;
  const m = raw.match(
    /github\.com[/:]([^/]+)\/([^/#?]+)/i
  );
  if (m) slug = `${m[1]}/${m[2]}`;
  slug = slug.replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(slug)) return null;
  return slug;
}

function guessPlatform(text) {
  const t = text.toLowerCase();
  if (/\b(snes|super.?nintendo|snesrecomp)\b/.test(t)) return "snes";
  if (/\b(gba|game.?boy.?advance|gbarecomp)\b/.test(t)) return "gba";
  if (/\b(psx|playstation|ps1|psxrecomp)\b/.test(t)) return "psx";
  if (/\b(n64|nintendo.?64)\b/.test(t)) return "n64";
  if (/\b(genesis|megadrive|sega.?genesis|segagenesis)\b/.test(t)) {
    return "genesis";
  }
  return "";
}

function slugifyId(name, platform) {
  let s = String(name || "")
    .replace(/Recomp$/i, "")
    .replace(/Decomp$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  if (platform && !s.endsWith(`-${platform}`)) s = `${s}-${platform}`;
  return s;
}

function displayNameFromRepo(repoName) {
  return String(repoName || "")
    .replace(/Recomp$/i, "")
    .replace(/Decomp$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function extractDigests(text) {
  const out = {
    crc32: new Set(),
    md5: new Set(),
    sha1: new Set(),
    sha256: new Set(),
    disc_serials: new Set(),
    sizes: new Set(),
    filenames: new Set(),
    sources: [],
  };
  if (!text) return out;

  const lower = text;

  // Labeled digests
  const labeled = [
    [/sha-?256\s*[:=]\s*`?([a-f0-9]{64})`?/gi, "sha256"],
    [/sha-?1\s*[:=]\s*`?([a-f0-9]{40})`?/gi, "sha1"],
    [/md5\s*[:=]\s*`?([a-f0-9]{32})`?/gi, "md5"],
    [/crc-?32\s*[:=]\s*`?(0x)?([a-f0-9]{8})`?/gi, "crc32"],
  ];
  for (const [re, key] of labeled) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(lower))) {
      const hex = (m[2] || m[1] || "").toLowerCase().replace(/^0x/, "");
      if (hex) out[key].add(hex);
    }
  }

  // Markdown tables / bare hex near baserom context
  if (/baserom|rom.?identity|expected|checksum|hash/i.test(text)) {
    for (const m of text.matchAll(/\b([a-fA-F0-9]{64})\b/g)) {
      out.sha256.add(m[1].toLowerCase());
    }
    for (const m of text.matchAll(/\b([a-fA-F0-9]{40})\b/g)) {
      out.sha1.add(m[1].toLowerCase());
    }
    for (const m of text.matchAll(/\b([a-fA-F0-9]{32})\b/g)) {
      out.md5.add(m[1].toLowerCase());
    }
    for (const m of text.matchAll(/\b(?:0x)?([a-fA-F0-9]{8})\b/g)) {
      // skip years / small numbers that look like CRC only near CRC labels already handled
      if (/crc/i.test(text)) out.crc32.add(m[1].toLowerCase());
    }
  }

  for (const m of text.matchAll(
    /\b((?:SLUS|SLES|SLPS|SCUS|SCES|SCPS|SLPM)-?\d{4,5})\b/gi
  )) {
    const serial = m[1].toUpperCase().replace(/^(SLUS|SLES|SLPS|SCUS|SCES|SCPS|SLPM)(\d)/, "$1-$2");
    out.disc_serials.add(serial.includes("-") ? serial : serial.replace(/([A-Z]+)(\d+)/, "$1-$2"));
  }

  for (const m of text.matchAll(
    /[`'"]([A-Za-z0-9][^`'"]+\.(?:sfc|smc|gba|z64|n64|md|gen|bin|cue|iso|chd))[`'"]/gi
  )) {
    out.filenames.add(m[1]);
  }

  for (const m of text.matchAll(
    /\b(\d{3,4})\s*MiB\b/gi
  )) {
    out.sizes.add(Number(m[1]) * 1024 * 1024);
  }
  for (const m of text.matchAll(
    /\b(\d{6,})\s*(?:bytes|byte)\b/gi
  )) {
    out.sizes.add(Number(m[1]));
  }

  return out;
}

function mergeDigestSets(...parts) {
  const keys = [
    "crc32",
    "md5",
    "sha1",
    "sha256",
    "disc_serials",
    "sizes",
    "filenames",
  ];
  const out = Object.fromEntries(keys.map((k) => [k, []]));
  const sources = [];
  for (const p of parts) {
    if (!p) continue;
    if (p.sources) sources.push(...p.sources);
    for (const k of keys) {
      const vals = p[k];
      if (!vals) continue;
      const iter = vals instanceof Set ? vals : vals;
      for (const v of iter) {
        if (!out[k].includes(v)) out[k].push(v);
      }
    }
  }
  out.sources = sources;
  return out;
}

function inferAssetGlobs(assetNames) {
  const globs = { linux: "", windows: "", macos: "" };
  const names = assetNames || [];
  const has = (re) => names.some((n) => re.test(n));
  if (has(/linux/i)) globs.linux = "*linux*";
  if (has(/windows|win64|win32|\.exe/i)) globs.windows = "*windows*";
  if (has(/macos|osx|darwin/i)) globs.macos = "*macos*";
  // Fallbacks commonly used in this catalog
  if (!globs.linux && names.length) globs.linux = "*linux*";
  if (!globs.windows && names.length) globs.windows = "*windows*";
  if (!globs.macos && names.length) globs.macos = "*macos*";
  return globs;
}

function inferLaunch(repoName, assetGlobs) {
  const base = repoName.replace(/[^A-Za-z0-9._-]/g, "");
  return {
    linux: assetGlobs.linux ? base : "",
    windows: assetGlobs.windows ? `${base}.exe` : "",
    macos: assetGlobs.macos ? base : "",
  };
}

async function ghApi(path, env, opts = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "retcomm-catalog-submit",
    ...(opts.headers || {}),
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`https://api.github.com${path}`, { ...opts, headers });
  return res;
}

async function fetchRepoText(slug, path, env) {
  const res = await ghApi(
    `/repos/${slug}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
    env
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.encoding === "base64" && data.content) {
    try {
      return atob(data.content.replace(/\n/g, ""));
    } catch {
      return null;
    }
  }
  if (data.download_url) {
    const t = await fetch(data.download_url, {
      headers: { "User-Agent": "retcomm-catalog-submit" },
    });
    if (t.ok) return await t.text();
  }
  return null;
}

async function probe(request, env) {
  const session = await requireUser(request, env);
  if (await isBanned(session.login, env)) {
    return json({ error: "You are banned from submitting" }, 403, request, env);
  }

  const body = await request.json().catch(() => ({}));
  const slug = parseRepoSlug(body.repo);
  if (!slug) {
    return json({ error: "Invalid GitHub repo (use owner/repo or URL)" }, 400, request, env);
  }

  const repoRes = await ghApi(`/repos/${slug}`, env);
  if (!repoRes.ok) {
    return json(
      { error: `GitHub repo not found or inaccessible: ${slug}` },
      404,
      request,
      env
    );
  }
  const repo = await repoRes.json();

  let release = null;
  let allowPrerelease = false;
  let assets = [];

  const latestRes = await ghApi(`/repos/${slug}/releases/latest`, env);
  if (latestRes.ok) {
    release = await latestRes.json();
  } else {
    const listRes = await ghApi(`/repos/${slug}/releases?per_page=5`, env);
    if (listRes.ok) {
      const list = await listRes.json();
      const pre = list.find((r) => !r.draft);
      if (pre) {
        release = pre;
        allowPrerelease = !!pre.prerelease;
      }
    }
  }
  if (release?.assets) {
    assets = release.assets.map((a) => a.name);
  }

  const readmeRes = await ghApi(`/repos/${slug}/readme`, env);
  let readme = "";
  if (readmeRes.ok) {
    const rd = await readmeRes.json();
    if (rd.content) {
      try {
        readme = atob(rd.content.replace(/\n/g, ""));
      } catch {
        readme = "";
      }
    }
  }
  const discMd = (await fetchRepoText(slug, "DISC.md", env)) || "";
  const digests = mergeDigestSets(
    { ...extractDigests(readme), sources: readme ? ["README"] : [] },
    { ...extractDigests(discMd), sources: discMd ? ["DISC.md"] : [] }
  );

  const blob = `${repo.name} ${repo.description || ""} ${readme.slice(0, 2000)}`;
  const platform = guessPlatform(blob);
  const asset_glob = inferAssetGlobs(assets);
  const install_dir_name = repo.name;
  const draft = {
    id: slugifyId(repo.name, platform || "game"),
    name: displayNameFromRepo(repo.name),
    kind: /decomp/i.test(repo.name + (repo.description || "")) ? "decomp" : "recomp",
    platform: platform || "",
    description: repo.description || "",
    homepage: repo.html_url,
    rom_identity: {
      crc32: digests.crc32,
      md5: digests.md5,
      sha1: digests.sha1,
      sha256: digests.sha256,
      disc_serials: digests.disc_serials,
      sizes: digests.sizes,
      filenames: digests.filenames,
    },
    rom_extensions: [],
    release: {
      github: slug,
      allow_prerelease: allowPrerelease,
      asset_glob,
    },
    install_dir_name,
    launch: inferLaunch(install_dir_name, asset_glob),
    romm: { platforms: [] },
    notes: digests.sources.length
      ? `Digests auto-extracted from ${digests.sources.join(", ")}.`
      : "Fill rom_identity from the project's baserom / gate docs.",
  };

  // Drop allow_prerelease if false to match most catalog entries
  if (!allowPrerelease) delete draft.release.allow_prerelease;

  return json(
    {
      draft,
      meta: {
        submitter: session.login,
        repo: slug,
        release_tag: release?.tag_name || null,
        assets,
        digest_sources: digests.sources,
        field_sources: {
          "release.github": "repo",
          homepage: "repo",
          description: "repo",
          name: "guessed",
          id: "guessed",
          platform: platform ? "guessed" : "missing",
          rom_identity: digests.sources.length ? digests.sources.join("+") : "missing",
          "release.asset_glob": assets.length ? "release assets" : "default",
          launch: "guessed",
        },
      },
    },
    200,
    request,
    env
  );
}

/* ── Submit ──────────────────────────────────────────────────── */

function validateManifest(m) {
  const errors = [];
  if (!m || typeof m !== "object") return ["Manifest required"];
  if (!m.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id)) {
    errors.push("id must be a lowercase slug (e.g. megaman-x-snes)");
  }
  if (!m.name) errors.push("name is required");
  if (!m.kind || !["recomp", "decomp"].includes(m.kind)) {
    errors.push('kind must be "recomp" or "decomp"');
  }
  if (!m.platform) errors.push("platform is required");
  if (!m.release?.github || !parseRepoSlug(m.release.github)) {
    errors.push("release.github must be owner/repo");
  }
  const glob = m.release?.asset_glob || {};
  if (!glob.linux && !glob.windows && !glob.macos) {
    errors.push("release.asset_glob needs at least one OS pattern");
  }
  if (!m.install_dir_name) errors.push("install_dir_name is required");
  const launch = m.launch || {};
  if (!launch.linux && !launch.windows && !launch.macos) {
    errors.push("launch needs at least one OS binary name");
  }
  const id = m.rom_identity || {};
  const hasIdentity =
    (id.crc32 && id.crc32.length) ||
    (id.md5 && id.md5.length) ||
    (id.sha1 && id.sha1.length) ||
    (id.sha256 && id.sha256.length) ||
    (id.disc_serials && id.disc_serials.length);
  if (!hasIdentity) {
    errors.push(
      "rom_identity needs at least one digest or disc_serial (ownership check)"
    );
  }
  return errors;
}

function normalizeManifest(m) {
  const ri = m.rom_identity || {};
  const emptyArr = (v) => (Array.isArray(v) ? v : []);
  const out = {
    id: String(m.id || "").trim(),
    name: String(m.name || "").trim(),
    kind: m.kind === "decomp" ? "decomp" : "recomp",
    platform: String(m.platform || "").trim(),
    description: String(m.description || "").trim(),
    homepage: String(m.homepage || "").trim(),
    rom_identity: {
      crc32: emptyArr(ri.crc32).map((s) => String(s).toLowerCase()),
      md5: emptyArr(ri.md5).map((s) => String(s).toLowerCase()),
      sha1: emptyArr(ri.sha1).map((s) => String(s).toLowerCase()),
      sha256: emptyArr(ri.sha256).map((s) => String(s).toLowerCase()),
      disc_serials: emptyArr(ri.disc_serials).map(String),
      sizes: emptyArr(ri.sizes).map(Number).filter((n) => n > 0),
      filenames: emptyArr(ri.filenames).map(String),
    },
    rom_extensions: emptyArr(m.rom_extensions).map(String),
    release: {
      github: parseRepoSlug(m.release?.github) || String(m.release?.github || ""),
      asset_glob: {
        linux: String(m.release?.asset_glob?.linux || ""),
        windows: String(m.release?.asset_glob?.windows || ""),
        macos: String(m.release?.asset_glob?.macos || ""),
      },
    },
    install_dir_name: String(m.install_dir_name || m.id || "").trim(),
    launch: {
      linux: String(m.launch?.linux || ""),
      windows: String(m.launch?.windows || ""),
      macos: String(m.launch?.macos || ""),
    },
  };
  if (m.release?.allow_prerelease) out.release.allow_prerelease = true;
  if (m.romm && (m.romm.platforms?.length || m.romm.igdb_ids?.length)) {
    out.romm = {};
    if (m.romm.platforms?.length) out.romm.platforms = m.romm.platforms;
    if (m.romm.igdb_ids?.length) out.romm.igdb_ids = m.romm.igdb_ids;
  }
  if (m.saves && Object.keys(m.saves).length) out.saves = m.saves;
  if (m.author_notes) out.author_notes = String(m.author_notes);
  if (m.notes) out.notes = String(m.notes);
  if (m.bios_identity === null) out.bios_identity = null;
  else if (m.bios_identity && typeof m.bios_identity === "object") {
    out.bios_identity = m.bios_identity;
  }
  // Drop empty homepage
  if (!out.homepage) delete out.homepage;
  if (!out.description) delete out.description;
  return out;
}

async function submit(request, env) {
  const session = await requireUser(request, env);
  if (await isBanned(session.login, env)) {
    return json({ error: "You are banned from submitting" }, 403, request, env);
  }

  const body = await request.json().catch(() => ({}));
  const manifest = normalizeManifest(body.manifest || body);
  const submitter_note = String(body.submitter_note || "").slice(0, 2000);
  const errors = validateManifest(manifest);
  if (errors.length) {
    return json({ error: "Validation failed", errors }, 400, request, env);
  }

  if (!env.GITHUB_TOKEN) {
    return json(
      { error: "Server missing GITHUB_TOKEN; cannot open approval issue" },
      500,
      request,
      env
    );
  }

  const catalogRepo = env.CATALOG_REPO || "TechnicallyComputers/retcomm-catalog";
  const approvers = await resolveApprovers(env, catalogRepo);
  // GitHub allows at most 10 assignees per issue.
  const assignees = approvers.logins.slice(0, 10);

  const title = `[catalog submission] ${manifest.id} from @${session.login}`;
  const jsonBlock = JSON.stringify(manifest, null, 2);
  const notifyLine = approvers.logins.length
    ? approvers.logins.map((l) => `@${l}`).join(" ")
    : "_no human contributors resolved_";
  const issueBody = [
    `## Catalog title submission`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Submitter** | @${session.login} |`,
    `| **Proposed id** | \`${manifest.id}\` |`,
    `| **Source** | https://github.com/${manifest.release.github} |`,
    `| **Platform** | ${manifest.platform} |`,
    `| **Notify** | ${notifyLine} |`,
    ``,
    submitter_note ? `### Note from submitter\n\n${submitter_note}\n` : "",
    `### Proposed \`titles/${manifest.id}.json\``,
    ``,
    "```json",
    jsonBlock,
    "```",
    ``,
    `### Maintainer checklist`,
    ``,
    `- [ ] Digests match the game's ownership gate / No-Intro / Redump`,
    `- [ ] Release asset globs match real assets`,
    `- [ ] Launch binary names verified`,
    `- [ ] Add label \`approved\` to merge into the catalog and publish \`catalog.zip\` (use \`approved-update\` only to overwrite an existing id)`,
    ``,
    `_Submitted via the catalog submission form._`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  const issueRes = await ghApi(`/repos/${catalogRepo}/issues`, env, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: ["catalog-submission"],
      assignees,
    }),
  });

  let issue = null;
  let issueWarning = null;
  if (!issueRes.ok) {
    const detail = await issueRes.text();
    // Retry without assignees/labels if they fail (label missing, can't assign)
    const retry = await ghApi(`/repos/${catalogRepo}/issues`, env, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body: issueBody }),
    });
    if (!retry.ok) {
      return json(
        {
          error: "Failed to create GitHub issue",
          detail: await retry.text(),
          first: detail,
        },
        502,
        request,
        env
      );
    }
    issue = await retry.json();
    issueWarning = "Issue created without labels/assignees; check token permissions and label exists.";
  } else {
    issue = await issueRes.json();
  }

  const emailResult = await sendApproverEmail(env, {
    submitter: session.login,
    manifest,
    issueUrl: issue.html_url,
    submitter_note,
    emails: approvers.emails,
    logins: approvers.logins,
  });

  return json(
    {
      ok: true,
      issue_url: issue.html_url,
      issue_number: issue.number,
      approvers: approvers.logins,
      email: emailResult,
      warning: issueWarning,
    },
    200,
    request,
    env
  );
}

/** Human contributors from submit/contributors.json ∪ GitHub collaborators (bots excluded). */
async function resolveApprovers(env, catalogRepo) {
  const byLogin = new Map(); // lower -> { login, email }

  const remember = (login, email = "") => {
    const raw = String(login || "").trim();
    if (!raw || isBotLogin(raw)) return;
    const key = raw.toLowerCase();
    const prev = byLogin.get(key);
    byLogin.set(key, {
      // Keep first-seen login casing (contributors.json is loaded first).
      login: prev?.login || raw,
      email: String(email || "").trim() || prev?.email || "",
    });
  };

  // 1) Repo file (source of truth for emails + explicit human list)
  const contributorsUrl =
    env.CONTRIBUTORS_URL ||
    `https://raw.githubusercontent.com/${catalogRepo}/main/submit/contributors.json`;
  try {
    const res = await fetch(contributorsUrl, {
      headers: {
        "User-Agent": "retcomm-catalog-submit",
        Accept: "application/json",
      },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (res.ok) {
      const data = await res.json();
      for (const c of data.contributors || []) {
        if (c.bot || c.type === "Bot") continue;
        remember(c.login, c.email);
      }
    }
  } catch (err) {
    console.error("contributors.json fetch failed", err);
  }

  // 2) Live collaborators with repo access (humans only)
  try {
    const collabRes = await ghApi(
      `/repos/${catalogRepo}/collaborators?affiliation=all&per_page=100`,
      env
    );
    if (collabRes.ok) {
      const collabs = await collabRes.json();
      for (const c of collabs) {
        if (c.type && c.type !== "User") continue;
        if (c.login && isBotLogin(c.login)) continue;
        remember(c.login);
      }
    }
  } catch (err) {
    console.error("collaborators fetch failed", err);
  }

  // 3) Optional extras from Worker env (comma-separated), not required
  for (const login of (env.EXTRA_APPROVER_LOGINS || "").split(",")) {
    remember(login.trim());
  }
  for (const email of (env.EXTRA_APPROVER_EMAILS || "").split(",")) {
    const e = email.trim();
    if (e && e.includes("@")) {
      // Email-only extras (no login) — attach under synthetic key
      const key = `email:${e.toLowerCase()}`;
      if (![...byLogin.values()].some((v) => v.email.toLowerCase() === e.toLowerCase())) {
        byLogin.set(key, { login: "", email: e });
      }
    }
  }

  const people = [...byLogin.values()];
  const logins = [
    ...new Set(people.map((p) => p.login).filter(Boolean)),
  ];
  const emails = [
    ...new Set(
      people
        .map((p) => p.email)
        .filter((e) => e && e.includes("@") && !e.endsWith("@users.noreply.github.com"))
    ),
  ];
  return { logins, emails, people };
}

function isBotLogin(login) {
  const l = String(login).toLowerCase();
  return (
    l.endsWith("[bot]") ||
    l.endsWith("-bot") ||
    l === "github-actions" ||
    l === "dependabot" ||
    l === "renovate" ||
    l === "ghost"
  );
}

async function sendApproverEmail(
  env,
  { submitter, manifest, issueUrl, submitter_note, emails, logins }
) {
  const to = [...new Set((emails || []).filter(Boolean))];
  if (!to.length) {
    return {
      sent: false,
      reason:
        "No contributor emails resolved (add email fields in submit/contributors.json). Issue assignees still notified on GitHub.",
      logins: logins || [],
    };
  }
  if (!env.RESEND_API_KEY) {
    return {
      sent: false,
      reason:
        "RESEND_API_KEY not set (GitHub issue still created; assignees get GitHub notifications)",
      to,
      logins: logins || [],
    };
  }

  const from = env.FROM_EMAIL || "RetComM Catalog <onboarding@resend.dev>";
  const subject = `[RetComM catalog] New submission: ${manifest.id} (@${submitter})`;
  const text = [
    `New catalog submission from GitHub user @${submitter}`,
    ``,
    `Title id: ${manifest.id}`,
    `Name: ${manifest.name}`,
    `Platform: ${manifest.platform}`,
    `Source: https://github.com/${manifest.release.github}`,
    `Issue: ${issueUrl}`,
    submitter_note ? `\nSubmitter note:\n${submitter_note}` : "",
    ``,
    `Manifest:`,
    JSON.stringify(manifest, null, 2),
  ].join("\n");

  const html = `
    <p>New catalog submission from GitHub user <strong>@${escapeHtml(submitter)}</strong></p>
    <ul>
      <li><strong>Title id:</strong> ${escapeHtml(manifest.id)}</li>
      <li><strong>Name:</strong> ${escapeHtml(manifest.name)}</li>
      <li><strong>Platform:</strong> ${escapeHtml(manifest.platform)}</li>
      <li><strong>Source:</strong> <a href="https://github.com/${escapeHtml(manifest.release.github)}">${escapeHtml(manifest.release.github)}</a></li>
      <li><strong>Approval issue:</strong> <a href="${escapeHtml(issueUrl)}">${escapeHtml(issueUrl)}</a></li>
    </ul>
    ${submitter_note ? `<p><strong>Note:</strong> ${escapeHtml(submitter_note)}</p>` : ""}
    <pre style="background:#f4f4f4;padding:12px;overflow:auto">${escapeHtml(JSON.stringify(manifest, null, 2))}</pre>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    return { sent: false, reason: await res.text(), to, logins: logins || [] };
  }
  const data = await res.json();
  return { sent: true, id: data.id, to, logins: logins || [] };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
