import { ApiError, ErrorCode, createProject, executeAsync, requireRole, Role } from "../../../lib/platform-api.js";
import { readActorContext, readJson } from "../../../lib/request-context.js";
import { upsertProject } from "../../../lib/runtime-store.js";
import { createProjectRecord, isSupabaseEnabled } from "../../../lib/supabase-repository.js";

export const prerender = false;

export async function POST({ request }) {
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
