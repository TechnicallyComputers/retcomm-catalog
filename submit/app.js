import { CONFIG } from "./config.js";
import { hashRomFile } from "./hash.js";

const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  fieldSources: {},
  platformDefaults: null,
};

async function api(path, opts = {}) {
  const res = await fetch(`${CONFIG.API_BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers: {
      Accept: "application/json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error ||
      (data.errors && data.errors.join("; ")) ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function showBanner(kind, html) {
  const el = $("banner");
  el.className = `banner ${kind}`;
  el.innerHTML = html;
}

function hideBanner() {
  const el = $("banner");
  el.className = "banner hidden";
  el.textContent = "";
}

function setLoggedIn(user) {
  state.user = user;
  const slot = $("userSlot");
  const actions = $("authActions");
  const root = $("appRoot");
  if (!user) {
    root.classList.add("locked");
    slot.innerHTML = `<span>Sign in with GitHub to probe repos and submit.</span>`;
    actions.innerHTML = `<button type="button" class="primary" id="loginBtn">Sign in with GitHub</button>`;
    $("loginBtn").onclick = () => {
      const returnTo = window.location.href.split("?")[0] + window.location.hash;
      window.location.href = `${CONFIG.API_BASE}/auth/login?return_to=${encodeURIComponent(returnTo)}`;
    };
    $("submitBtn").disabled = true;
    return;
  }
  root.classList.remove("locked");
  slot.innerHTML = `
    <img src="${user.avatar}" alt="" width="36" height="36" />
    <div>
      <strong>@${user.login}</strong>
      <div class="hint" style="margin:0">${user.name || ""}</div>
    </div>`;
  actions.innerHTML = `<button type="button" id="logoutBtn">Sign out</button>`;
  $("logoutBtn").onclick = async () => {
    await api("/auth/logout", { method: "POST" });
    setLoggedIn(null);
  };
  $("submitBtn").disabled = false;
}

function csvGet(id) {
  return $(id)
    .value.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function csvSet(id, arr) {
  $(id).value = (arr || []).join(", ");
}

function numCsvGet(id) {
  return csvGet(id)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function applyPlatformDefaults(platform) {
  const d = state.platformDefaults?.[platform];
  if (!d) return;
  if (!$("f_rom_extensions").value && d.rom_extensions) {
    csvSet("f_rom_extensions", d.rom_extensions);
  }
  if (!$("f_romm_platforms").value && d.romm_platforms) {
    csvSet("f_romm_platforms", d.romm_platforms);
  }
}

function readManifest() {
  const manifest = {
    id: $("f_id").value.trim(),
    name: $("f_name").value.trim(),
    kind: $("f_kind").value,
    platform: $("f_platform").value,
    description: $("f_description").value.trim(),
    homepage: $("f_homepage").value.trim(),
    rom_identity: {
      crc32: csvGet("f_crc32").map((s) => s.toLowerCase()),
      md5: csvGet("f_md5").map((s) => s.toLowerCase()),
      sha1: csvGet("f_sha1").map((s) => s.toLowerCase()),
      sha256: csvGet("f_sha256").map((s) => s.toLowerCase()),
      disc_serials: csvGet("f_disc_serials"),
      sizes: numCsvGet("f_sizes"),
      filenames: csvGet("f_filenames"),
    },
    rom_extensions: csvGet("f_rom_extensions"),
    release: {
      github: $("f_release_github").value.trim(),
      asset_glob: {
        linux: $("f_glob_linux").value.trim(),
        windows: $("f_glob_windows").value.trim(),
        macos: $("f_glob_macos").value.trim(),
      },
    },
    install_dir_name: $("f_install_dir_name").value.trim(),
    launch: {
      linux: $("f_launch_linux").value.trim(),
      windows: $("f_launch_windows").value.trim(),
      macos: $("f_launch_macos").value.trim(),
    },
  };
  if ($("f_allow_prerelease").checked) {
    manifest.release.allow_prerelease = true;
  }
  const romm = csvGet("f_romm_platforms");
  if (romm.length) manifest.romm = { platforms: romm };
  const notes = $("f_notes").value.trim();
  if (notes) manifest.notes = notes;
  if (!manifest.description) delete manifest.description;
  if (!manifest.homepage) delete manifest.homepage;
  return manifest;
}

function fillForm(draft, meta = {}) {
  state.fieldSources = meta.field_sources || {};
  for (const el of document.querySelectorAll("[data-src]")) {
    const key = el.getAttribute("data-src");
    el.textContent = state.fieldSources[key]
      ? `← ${state.fieldSources[key]}`
      : "";
  }

  $("f_id").value = draft.id || "";
  $("f_name").value = draft.name || "";
  $("f_kind").value = draft.kind || "recomp";
  $("f_platform").value = draft.platform || "";
  $("f_description").value = draft.description || "";
  $("f_homepage").value = draft.homepage || "";
  $("f_release_github").value = draft.release?.github || "";
  $("f_install_dir_name").value = draft.install_dir_name || "";
  $("f_glob_linux").value = draft.release?.asset_glob?.linux || "";
  $("f_glob_windows").value = draft.release?.asset_glob?.windows || "";
  $("f_glob_macos").value = draft.release?.asset_glob?.macos || "";
  $("f_allow_prerelease").checked = !!draft.release?.allow_prerelease;
  $("f_launch_linux").value = draft.launch?.linux || "";
  $("f_launch_windows").value = draft.launch?.windows || "";
  $("f_launch_macos").value = draft.launch?.macos || "";

  const ri = draft.rom_identity || {};
  csvSet("f_crc32", ri.crc32);
  csvSet("f_md5", ri.md5);
  csvSet("f_sha1", ri.sha1);
  csvSet("f_sha256", ri.sha256);
  csvSet("f_disc_serials", ri.disc_serials);
  csvSet("f_sizes", ri.sizes);
  csvSet("f_filenames", ri.filenames);
  csvSet("f_rom_extensions", draft.rom_extensions);
  csvSet("f_romm_platforms", draft.romm?.platforms);
  $("f_notes").value = draft.notes || "";

  applyPlatformDefaults(draft.platform);

  const chips = $("assetChips");
  chips.innerHTML = "";
  for (const a of meta.assets || []) {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = a;
    chips.appendChild(span);
  }

  const parts = [];
  if (meta.release_tag) parts.push(`release ${meta.release_tag}`);
  if (meta.digest_sources?.length) {
    parts.push(`digests from ${meta.digest_sources.join(", ")}`);
  }
  $("metaLine").textContent = parts.length
    ? `Auto-filled: ${parts.join(" · ")}. Edit anything before submitting.`
    : "Draft loaded. Fill missing fields before submitting.";

  refreshPreview();
}

function refreshPreview() {
  $("preview").textContent = JSON.stringify(readManifest(), null, 2);
}

function mergeUnique(id, values) {
  const cur = new Set(csvGet(id));
  for (const v of values) cur.add(v);
  csvSet(id, [...cur]);
}

async function onRomFile(file) {
  if (!file) return;
  $("romHashStatus").textContent = `Hashing ${file.name}…`;
  try {
    const h = await hashRomFile(file);
    mergeUnique("f_crc32", [h.crc32]);
    mergeUnique("f_md5", [h.md5]);
    mergeUnique("f_sha1", [h.sha1]);
    mergeUnique("f_sha256", [h.sha256]);
    mergeUnique("f_sizes", [String(h.hashed_size)]);
    mergeUnique("f_filenames", [h.filename]);
    $("romHashStatus").textContent = h.header_stripped
      ? `Hashed ${file.name} (stripped 512-byte SMC header). Digests merged into the form.`
      : `Hashed ${file.name}. Digests merged into the form. File was not uploaded.`;
    refreshPreview();
  } catch (err) {
    $("romHashStatus").textContent = `Hash failed: ${err.message}`;
  }
}

async function init() {
  // Load platform defaults from this repo (static)
  try {
    state.platformDefaults = await fetch("./platform-defaults.json").then((r) =>
      r.json()
    );
  } catch {
    state.platformDefaults = {};
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "banned") {
    showBanner(
      "danger",
      "This GitHub account is banned from catalog submissions."
    );
  } else if (params.get("logged_in") === "1") {
    showBanner("ok", "Signed in with GitHub.");
    history.replaceState({}, "", window.location.pathname);
  }

  try {
    const me = await api("/auth/me");
    if (me.error === "banned") {
      showBanner(
        "danger",
        "This GitHub account is banned from catalog submissions."
      );
      setLoggedIn(null);
    } else {
      setLoggedIn(me.user);
    }
  } catch (err) {
    setLoggedIn(null);
    showBanner(
      "warn",
      `API unreachable at <code>${CONFIG.API_BASE}</code>. Deploy the Worker and update <code>submit/config.js</code>. (${err.message})`
    );
  }

  for (const id of [
    "f_id",
    "f_name",
    "f_kind",
    "f_platform",
    "f_description",
    "f_homepage",
    "f_release_github",
    "f_install_dir_name",
    "f_glob_linux",
    "f_glob_windows",
    "f_glob_macos",
    "f_allow_prerelease",
    "f_launch_linux",
    "f_launch_windows",
    "f_launch_macos",
    "f_crc32",
    "f_md5",
    "f_sha1",
    "f_sha256",
    "f_disc_serials",
    "f_sizes",
    "f_filenames",
    "f_rom_extensions",
    "f_romm_platforms",
    "f_notes",
  ]) {
    $(id).addEventListener("input", refreshPreview);
    $(id).addEventListener("change", refreshPreview);
  }

  $("f_platform").addEventListener("change", () => {
    applyPlatformDefaults($("f_platform").value);
    refreshPreview();
  });

  $("probeBtn").onclick = async () => {
    hideBanner();
    $("probeBtn").disabled = true;
    try {
      const data = await api("/api/probe", {
        method: "POST",
        body: JSON.stringify({ repo: $("repoInput").value }),
      });
      fillForm(data.draft, data.meta);
      showBanner(
        "ok",
        "Repo probed. Review highlighted/auto-filled fields, complete gaps, then submit."
      );
    } catch (err) {
      showBanner("danger", err.message);
    } finally {
      $("probeBtn").disabled = false;
    }
  };

  $("submitBtn").onclick = async () => {
    hideBanner();
    $("submitBtn").disabled = true;
    try {
      const data = await api("/api/submit", {
        method: "POST",
        body: JSON.stringify({
          manifest: readManifest(),
          submitter_note: $("f_submitter_note").value.trim(),
        }),
      });
      const emailNote = data.email?.sent
        ? ` Email sent to ${data.email.to.join(", ")}.`
        : data.email?.reason
          ? ` Email: ${data.email.reason}.`
          : "";
      showBanner(
        "ok",
        `Submitted. Approval issue: <a href="${data.issue_url}" target="_blank" rel="noopener">${data.issue_url}</a>.${emailNote}`
      );
    } catch (err) {
      const extra =
        err.data?.errors?.length > 0
          ? `<ul>${err.data.errors.map((e) => `<li>${e}</li>`).join("")}</ul>`
          : "";
      showBanner("danger", `${err.message}${extra}`);
    } finally {
      $("submitBtn").disabled = !state.user;
    }
  };

  $("downloadBtn").onclick = () => {
    const m = readManifest();
    const blob = new Blob([JSON.stringify(m, null, 2) + "\n"], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${m.id || "title"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  $("copyBtn").onclick = async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(readManifest(), null, 2) + "\n"
    );
    showBanner("ok", "JSON copied to clipboard.");
  };

  const drop = $("romDrop");
  const fileInput = $("romFile");
  fileInput.addEventListener("change", () => onRomFile(fileInput.files?.[0]));
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    drop.classList.add("drag");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
    onRomFile(e.dataTransfer.files?.[0]);
  });

  refreshPreview();
}

init();
