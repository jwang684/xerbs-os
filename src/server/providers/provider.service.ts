import type { ProviderProfile } from "@/db/schema";

import { assertOwnerOrAdmin, isOwnerOrAdmin, type AuthContext } from "../auth/authz";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../http/errors";
import { validate } from "../http/validate";
import {
  providerRepository,
  type ListProvidersResult,
} from "./provider.repository";
import {
  createProviderSchema,
  listProvidersQuerySchema,
  providerIdParamSchema,
  updateProviderSchema,
} from "./provider.schema";

/**
 * Provider profile business logic.
 *
 * Authorization:
 *   - create: owner/admin only; the target user must be a member of the org.
 *   - update: owner/admin (any profile); practitioner (only their own).
 *   - read/list: any member (staff included).
 *
 * One profile per organization member (unique org + user); the organization is
 * always the caller's active organization.
 */
export const providerService = {
  async create(ctx: AuthContext, input: unknown): Promise<ProviderProfile> {
    assertOwnerOrAdmin(ctx);
    const data = validate(createProviderSchema, input);

    const isMember = await providerRepository.isMember(
      ctx.organizationId,
      data.userId,
    );
    if (!isMember) {
      throw new BadRequestError("User is not a member of this organization");
    }

    const existing = await providerRepository.findByUser(
      ctx.organizationId,
      data.userId,
    );
    if (existing) {
      throw new ConflictError(
        "A provider profile already exists for this member",
      );
    }

    return providerRepository.create(ctx.organizationId, data);
  },

  async get(ctx: AuthContext, id: string): Promise<ProviderProfile> {
    const providerId = validate(providerIdParamSchema, id);
    const profile = await providerRepository.findById(
      ctx.organizationId,
      providerId,
    );
    if (!profile) {
      throw new NotFoundError("Provider not found");
    }
    return profile;
  },

  async update(
    ctx: AuthContext,
    id: string,
    input: unknown,
  ): Promise<ProviderProfile> {
    const providerId = validate(providerIdParamSchema, id);
    const data = validate(updateProviderSchema, input);

    const existing = await providerRepository.findById(
      ctx.organizationId,
      providerId,
    );
    if (!existing) {
      throw new NotFoundError("Provider not found");
    }

    // Owner/admin may edit any profile; a practitioner may edit only their own.
    const canEdit =
      isOwnerOrAdmin(ctx.role) ||
      (ctx.role === "practitioner" && existing.userId === ctx.userId);
    if (!canEdit) {
      throw new ForbiddenError("You may not edit this provider profile");
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    const updated = await providerRepository.update(
      ctx.organizationId,
      providerId,
      data,
    );
    if (!updated) {
      throw new NotFoundError("Provider not found");
    }
    return updated;
  },

  async list(ctx: AuthContext, query: unknown): Promise<ListProvidersResult> {
    const { isActive, limit, offset } = validate(
      listProvidersQuerySchema,
      query,
    );
    return providerRepository.list(ctx.organizationId, {
      isActive,
      limit,
      offset,
    });
  },
};
