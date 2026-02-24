import { e as executeAsync, A as ApiError, E as ErrorCode, r as requireRole, R as Role } from '../../../../chunks/permissions_BskKVdUi.mjs';
import { s as saveScenario } from '../../../../chunks/routes_CcMLnfyp.mjs';
import { r as readJson, a as readActorContext } from '../../../../chunks/request-context_BJEMX495.mjs';
import { i as isSupabaseEnabled, c as getScenarioRecord, d as createScenarioRecord, u as updateScenarioVersion, e as upsertProject, f as upsertScenario } from '../../../../chunks/runtime-store_CjBgLr-g.mjs';
export { renderers } from '../../../../renderers.mjs';

const prerender = false;

async function POST({ request, params }) {
  const body = await readJson(request);

  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, "Project ID is required.");
    }
    const actor = await readActorContext(request);
    requireRole(actor.userRole, Role.EDITOR);

    if (isSupabaseEnabled()) {
      let scenario = await getScenarioRecord(params.id);
      if (!scenario) {
        scenario = await createScenarioRecord({
          projectId: params.id,
          userId: actor.userId,
          content: body.content
        });
      }

      const requestedVersion = body.requestedVersion ?? scenario.version_no;
      if (requestedVersion !== scenario.version_no) {
        throw new ApiError(409, ErrorCode.VERSION_CONFLICT, "Scenario version conflict.", {
          requestedVersion,
          currentVersion: scenario.version_no
        });
      }

      const nextVersion = scenario.version_no + 1;
      const updated = await updateScenarioVersion({
        scenarioId: scenario.id,
        expectedVersion: scenario.version_no,
        nextVersion,
        userId: actor.userId,
        content: body.content
      });
      if (!updated) {
        throw new ApiError(409, ErrorCode.VERSION_CONFLICT, "Scenario version conflict.", {
          requestedVersion,
          currentVersion: scenario.version_no
        });
      }

      return {
        status: 200,
        body: {
          ok: true,
          nextVersion
        }
      };
    }

    const saved = saveScenario({
      userRole: actor.userRole,
      projectId: params.id,
      requestedVersion: body.requestedVersion,
      currentVersion: body.currentVersion
    });
    upsertProject({ id: params.id, slug: params.id, name: `Project ${params.id}` });
    if (body.content && typeof body.content === "object") {
      upsertScenario({
        projectId: params.id,
        scenario: body.content,
        version: saved.body.nextVersion
      });
    }
    return saved;
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
