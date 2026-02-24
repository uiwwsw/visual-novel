import { e as executeAsync, A as ApiError, E as ErrorCode } from '../../../../../chunks/permissions_BskKVdUi.mjs';
import { i as isSupabaseEnabled, g as getScenarioByProjectRef, a as getProjectRecordByRef, b as getLatestScenarioContent } from '../../../../../chunks/runtime-store_CjBgLr-g.mjs';
export { renderers } from '../../../../../renderers.mjs';

const prerender = false;

const fallbackScenario = {
  meta: { title: 'Sample VN', schemaVersion: '1.0.0' },
  entryNodeId: 'n_start',
  nodes: [
    {
      id: 'n_start',
      type: 'scene',
      next: 'n_end',
      data: { speaker: 'Narrator', text: 'Fallback scenario loaded.' }
    },
    {
      id: 'n_end',
      type: 'ending',
      data: { title: 'Fallback Ending' }
    }
  ]
};

async function GET({ params }) {
  const result = await executeAsync(async () => {
    if (!params?.id) {
      throw new ApiError(400, ErrorCode.INVALID_REQUEST, 'Project ID is required.');
    }

    if (!isSupabaseEnabled()) {
      const runtime = getScenarioByProjectRef(params.id);
      if (runtime) {
        return {
          status: 200,
          body: {
            ok: true,
            project: runtime.project,
            scenario: runtime.scenario,
            version: runtime.version,
            updatedAt: runtime.updatedAt
          }
        };
      }
      return {
        status: 200,
        body: {
          ok: true,
          project: {
            id: params.id,
            slug: params.id,
            name: `Project ${params.id}`
          },
          scenario: fallbackScenario,
          version: 1
        }
      };
    }

    const project = await getProjectRecordByRef(params.id);
    if (!project) {
      throw new ApiError(404, ErrorCode.INVALID_REQUEST, 'Project not found.');
    }

    const scenario = await getLatestScenarioContent(project.id);
    if (!scenario?.content_jsonb) {
      throw new ApiError(404, ErrorCode.INVALID_REQUEST, 'Scenario not found.');
    }

    return {
      status: 200,
      body: {
        ok: true,
        project: {
          id: project.id,
          slug: project.slug,
          name: project.name
        },
        scenario: scenario.content_jsonb,
        version: scenario.version_no,
        updatedAt: scenario.updated_at
      }
    };
  }, {});

  return Response.json(result.body, {
    status: result.status,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
