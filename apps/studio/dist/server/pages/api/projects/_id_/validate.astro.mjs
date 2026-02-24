import { e as executeAsync, A as ApiError, E as ErrorCode, r as requireRole, R as Role } from '../../../../chunks/permissions_BskKVdUi.mjs';
import { r as readJson, a as readActorContext } from '../../../../chunks/request-context_BJEMX495.mjs';
export { renderers } from '../../../../renderers.mjs';

function issue(code, severity, message, nodeId = null, hint = "") {
  return { code, severity, message, nodeId, hint };
}

function byId(nodes) {
  const map = new Map();
  for (const n of nodes) {
    map.set(n.id, n);
  }
  return map;
}

function getOutgoingNodeIds(node) {
  if (!node) {
    return [];
  }
  if (node.type === "scene" && node.next) {
    return [node.next];
  }
  if (node.type === "jump" && node.data?.to) {
    return [node.data.to];
  }
  if (node.type === "choice") {
    return (node.data?.options ?? []).map((o) => o.to).filter(Boolean);
  }
  if (node.type === "condition") {
    return (node.data?.branches ?? []).map((b) => b.to).filter(Boolean);
  }
  return [];
}

function collectReachable(entryNodeId, nodesById) {
  const visited = new Set();
  const queue = [entryNodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);
    const node = nodesById.get(current);
    if (!node) {
      continue;
    }
    for (const nextId of getOutgoingNodeIds(node)) {
      if (!visited.has(nextId)) {
        queue.push(nextId);
      }
    }
  }
  return visited;
}

function validateDsl(expression, nodeId) {
  const issues = [];
  if (!expression || expression === "default") {
    return issues;
  }

  // Validate "in": RHS must look like array literal or identifier.
  const inMatch = expression.match(/\bin\b\s*(.+)$/);
  if (inMatch) {
    const rhs = inMatch[1].trim();
    const isArrayLiteral = rhs.startsWith("[") && rhs.endsWith("]");
    const isIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rhs);
    if (!isArrayLiteral && !isIdentifier) {
      issues.push(
        issue(
          "DSL_E006",
          "error",
          "`in` right-hand side must be an array literal or array variable.",
          nodeId,
          "Use e.g. `x in [1,2,3]` or `x in visitedPlaces`."
        )
      );
    }
  }

  // Numeric comparison with quoted numeric string should fail.
  if (/"\d+"\s*(>=|>|<=|<)\s*\d+/.test(expression) || /\d+\s*(>=|>|<=|<)\s*"\d+"/.test(expression)) {
    issues.push(
      issue(
        "DSL_E005",
        "error",
        "Type mismatch in numeric comparison.",
        nodeId,
        "Compare number with number only."
      )
    );
  }

  return issues;
}

function validateScenario(scenario) {
  const issues = [];
  const nodes = scenario?.nodes ?? [];

  if (!scenario?.meta) {
    issues.push(issue("SCHEMA_E001", "error", "Missing meta object.", null, "Add meta with schemaVersion/title."));
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    issues.push(issue("SCHEMA_E002", "error", "Nodes must be a non-empty array.", null, "Add at least one node."));
    return issues;
  }

  const nodesById = byId(nodes);
  const entryNodeId = scenario.entryNodeId ?? scenario.entry_node_id;
  if (!entryNodeId) {
    issues.push(issue("GRAPH_E001", "error", "Entry node is required.", null, "Set entryNodeId."));
  }

  // Dangling edges.
  for (const node of nodes) {
    const outgoing = getOutgoingNodeIds(node);
    for (const nextId of outgoing) {
      if (!nodesById.has(nextId)) {
        issues.push(
          issue(
            "GRAPH_E002",
            "error",
            `Dangling edge points to missing node: ${nextId}`,
            node.id,
            "Fix node link target."
          )
        );
      }
    }
  }

  // Choice overflow.
  for (const node of nodes) {
    if (node.type === "choice" && (node.data?.options?.length ?? 0) > 8) {
      issues.push(
        issue(
          "RULE_E001",
          "error",
          "Choice options exceed max limit (8).",
          node.id,
          "Reduce options to 8 or less."
        )
      );
    }
  }

  // Scene text speed validation.
  for (const node of nodes) {
    if (node.type !== "scene") {
      continue;
    }
    const rawSpeed = node.data?.textSpeed;
    if (rawSpeed == null || rawSpeed === "") {
      continue;
    }
    const speed = Number(rawSpeed);
    if (!Number.isFinite(speed) || speed < 0 || speed > 96) {
      issues.push(
        issue(
          "RULE_E002",
          "error",
          "Scene textSpeed must be a number between 0 and 96.",
          node.id,
          "Set textSpeed to 0~96 ms per character, or remove it."
        )
      );
    }
  }

  // Condition DSL checks.
  for (const node of nodes) {
    if (node.type !== "condition") {
      continue;
    }
    const branches = node.data?.branches ?? [];
    for (const branch of branches) {
      issues.push(...validateDsl(branch.when, node.id));
    }
  }

  // Reachability and ending check if entry exists.
  if (entryNodeId) {
    const reachable = collectReachable(entryNodeId, nodesById);
    const endings = nodes.filter((n) => n.type === "ending");
    const reachableEndings = endings.filter((n) => reachable.has(n.id));

    if (endings.length > 0 && reachableEndings.length === 0) {
      issues.push(
        issue(
          "GRAPH_E003",
          "error",
          "No reachable ending node from entry.",
          null,
          "Connect at least one ending from reachable path."
        )
      );
    }
  }

  return issues;
}

const prerender = false;

async function POST({ request, params }) {
  const body = await readJson(request);

  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project ID is required.");
    }
    const actor = await readActorContext(request);
    requireRole(actor.userRole, Role.EDITOR);

    const issues = validateScenario(body.scenario ?? {});
    const errors = issues.filter((i) => i.severity === "error");

    if (errors.length > 0) {
      throw new ApiError(
        422,
        ErrorCode.SCENARIO_VALIDATION_FAILED,
        "Scenario validation failed.",
        {
          projectId: params.id,
          issueCount: issues.length,
          errors
        }
      );
    }

    return {
      status: 200,
      body: {
        ok: true,
        projectId: params.id,
        issueCount: issues.length,
        issues
      }
    };
  }, {});

  return Response.json(result.body, { status: result.status });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
