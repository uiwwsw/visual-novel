import { A as ApiError, E as ErrorCode } from './permissions_BskKVdUi.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
function runtimeEnv() {
  return import.meta && Object.assign(__vite_import_meta_env__, { _: process.env._ }) ? Object.assign(__vite_import_meta_env__, { _: process.env._ }) : process.env;
}
function requiredEnv(name) {
  const value = runtimeEnv()[name];
  if (!value) {
    throw new ApiError(500, ErrorCode.CONFIG_MISSING, `Missing environment variable: ${name}`);
  }
  return value;
}
function canUseSupabase() {
  const env = runtimeEnv();
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
async function supabaseFetch(path, { method = "GET", body, select } = {}) {
  const url = new URL(`/rest/v1/${path}`, requiredEnv("SUPABASE_URL"));
  if (select) {
    url.searchParams.set("select", select);
  }
  const response = await fetch(url, {
    method,
    headers: {
      apikey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      Authorization: `Bearer ${requiredEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  if (!response.ok) {
    const details = await response.text();
    throw new ApiError(500, ErrorCode.INTEGRATION_FAILED, "Supabase request failed.", {
      path,
      status: response.status,
      details
    });
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function createProjectRecord({ organizationId, userId, name, slug }) {
  if (!canUseSupabase()) {
    return null;
  }
  if (!organizationId || !userId) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "x-org-id and x-user-id headers are required.");
  }
  if (!name || !slug) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project name and slug are required.");
  }
  const rows = await supabaseFetch("projects", {
    method: "POST",
    body: {
      organization_id: organizationId,
      name,
      slug,
      created_by: userId,
      updated_by: userId
    }
  });
  return rows?.[0] ?? null;
}
async function getScenarioRecord(projectId) {
  if (!canUseSupabase()) {
    return null;
  }
  if (!projectId) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "projectId is required.");
  }
  const rows = await supabaseFetch(
    `scenarios?project_id=eq.${encodeURIComponent(projectId)}&deleted_at=is.null&limit=1`,
    {
      select: "id,project_id,version_no"
    }
  );
  return rows?.[0] ?? null;
}
async function createScenarioRecord({ projectId, userId, content }) {
  if (!canUseSupabase()) {
    return null;
  }
  if (!projectId || !userId) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "projectId and x-user-id are required.");
  }
  const rows = await supabaseFetch("scenarios", {
    method: "POST",
    body: {
      project_id: projectId,
      schema_version: "1.0.0",
      content_jsonb: content ?? {},
      entry_node_id: "n_start",
      updated_by: userId,
      version_no: 1
    }
  });
  return rows?.[0] ?? null;
}
async function updateScenarioVersion({
  scenarioId,
  expectedVersion,
  nextVersion,
  userId,
  content
}) {
  if (!canUseSupabase()) {
    return null;
  }
  if (!scenarioId || !userId || !Number.isInteger(expectedVersion) || !Number.isInteger(nextVersion)) {
    throw new ApiError(
      400,
      ErrorCode.INVALID_REQUEST,
      "scenarioId, x-user-id, expectedVersion and nextVersion are required."
    );
  }
  const rows = await supabaseFetch(
    `scenarios?id=eq.${scenarioId}&version_no=eq.${expectedVersion}`,
    {
      method: "PATCH",
      body: {
        version_no: nextVersion,
        updated_by: userId,
        content_jsonb: content ?? {}
      }
    }
  );
  return rows?.[0] ?? null;
}
function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
async function getProjectRecordByRef(projectRef) {
  if (!canUseSupabase()) {
    return null;
  }
  if (!projectRef) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "projectRef is required.");
  }
  const encodedRef = encodeURIComponent(projectRef);
  const idPath = `projects?id=eq.${encodedRef}&deleted_at=is.null&limit=1`;
  const slugPath = `projects?slug=eq.${encodedRef}&deleted_at=is.null&limit=1`;
  const path = isUuid(projectRef) ? idPath : slugPath;
  const rows = await supabaseFetch(path, { select: "id,name,slug,status" });
  return rows?.[0] ?? null;
}
async function getLatestScenarioContent(projectId) {
  if (!canUseSupabase()) {
    return null;
  }
  if (!projectId) {
    throw new ApiError(400, ErrorCode.INVALID_REQUEST, "projectId is required.");
  }
  const rows = await supabaseFetch(
    `scenarios?project_id=eq.${encodeURIComponent(projectId)}&deleted_at=is.null&order=version_no.desc&limit=1`,
    { select: "id,project_id,version_no,content_jsonb,updated_at" }
  );
  return rows?.[0] ?? null;
}
function isSupabaseEnabled() {
  return canUseSupabase();
}

const projectsById = new Map();
const projectIdBySlug = new Map();
const scenariosByProjectId = new Map();

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function upsertProject(project) {
  if (!project?.id) {
    return null;
  }
  const normalized = {
    id: String(project.id),
    name: project.name ?? `Project ${project.id}`,
    slug: project.slug ?? String(project.id)
  };
  projectsById.set(normalized.id, normalized);
  projectIdBySlug.set(normalized.slug, normalized.id);
  return clone(normalized);
}

function getProjectByRef(projectRef) {
  if (!projectRef) {
    return null;
  }
  const ref = String(projectRef);
  const id = projectsById.has(ref) ? ref : projectIdBySlug.get(ref);
  if (!id) {
    return null;
  }
  return clone(projectsById.get(id));
}

function upsertScenario({ projectId, scenario, version }) {
  if (!projectId || !scenario) {
    return null;
  }
  if (!projectsById.has(projectId)) {
    upsertProject({ id: projectId, slug: String(projectId), name: `Project ${projectId}` });
  }
  const next = {
    projectId,
    version: Number.isInteger(version) ? version : 1,
    scenario: clone(scenario),
    updatedAt: new Date().toISOString()
  };
  scenariosByProjectId.set(projectId, next);
  return clone(next);
}

function getScenarioByProjectRef(projectRef) {
  const project = getProjectByRef(projectRef);
  if (!project?.id) {
    return null;
  }
  const scenario = scenariosByProjectId.get(project.id);
  if (!scenario) {
    return null;
  }
  return {
    project,
    scenario: clone(scenario.scenario),
    version: scenario.version,
    updatedAt: scenario.updatedAt
  };
}

export { getProjectRecordByRef as a, getLatestScenarioContent as b, getScenarioRecord as c, createScenarioRecord as d, upsertProject as e, upsertScenario as f, getScenarioByProjectRef as g, createProjectRecord as h, isSupabaseEnabled as i, updateScenarioVersion as u };
