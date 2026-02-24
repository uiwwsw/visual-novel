import { e as executeAsync, r as requireRole, R as Role, A as ApiError, E as ErrorCode } from '../../chunks/permissions_BskKVdUi.mjs';
import { c as createProject } from '../../chunks/routes_CcMLnfyp.mjs';
import { r as readJson, a as readActorContext } from '../../chunks/request-context_BJEMX495.mjs';
import { i as isSupabaseEnabled, h as createProjectRecord, e as upsertProject } from '../../chunks/runtime-store_CjBgLr-g.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;

async function POST({ request }) {
  const body = await readJson(request);

  const result = await executeAsync(async () => {
    const actor = await readActorContext(request);
    requireRole(actor.userRole, Role.EDITOR);

    if (isSupabaseEnabled()) {
      const row = await createProjectRecord({
        organizationId: actor.organizationId,
        userId: actor.userId,
        name: body.name,
        slug: body.slug
      });
      if (!row?.id) {
        throw new ApiError(500, ErrorCode.INTEGRATION_FAILED, "Supabase did not return created project.");
      }
      return {
        status: 201,
        body: {
          ok: true,
          project: row
        }
      };
    }

    const created = createProject({
      userRole: actor.userRole,
      name: body.name,
      slug: body.slug
    });
    upsertProject(created.body.project);
    return created;
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
