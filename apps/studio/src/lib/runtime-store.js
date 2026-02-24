const projectsById = new Map();
const projectIdBySlug = new Map();
const scenariosByProjectId = new Map();

function clone(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

export function upsertProject(project) {
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

export function getProjectByRef(projectRef) {
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

export function upsertScenario({ projectId, scenario, version }) {
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

export function getScenarioByProjectRef(projectRef) {
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

export function __resetRuntimeStore() {
  projectsById.clear();
  projectIdBySlug.clear();
  scenariosByProjectId.clear();
}
