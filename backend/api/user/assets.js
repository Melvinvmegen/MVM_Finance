import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { prisma, Models } from "../../utils/prisma.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/assets", getAssets);
  app.$get("/assets/:id", getAsset);
  app.$post("/assets", createAsset);
  app.$put("/assets/:id", updateAsset);
  app.$delete("/assets/:id", deleteAsset);
  app.$get("/assets/asset-types", getAssetTypes);
}

/**
 * @this {API.This}
 * @param {{ force: string, sortBy: string }} params
 * @returns {Promise<Models.asset[]>}
 */
export async function getAssets(params) {
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";
  const result = await getOrSetCache(
    `user_${this.request.user?.id}_assets`,
    async () => {
      const count = await prisma.asset.count();
      const rows = await prisma.asset.findMany({
        where: {
          ...options,
          user_id: this.request.user?.id || null,
        },
        orderBy: orderBy || { amount: "desc" },
        include: {
          asset_type: true,
        },
        skip: offset,
        take: per_page,
      });

      return { rows, count };
    },
    force
  );

  return result;
}

/**
 * @this {API.This}
 * @param {number} id
 * @returns {Promise<Models.asset>}
 */
export async function getAsset(id) {
  const asset = await getOrSetCache(`user_${this.request.user?.id}_asset_${id}`, async () => {
    const asset = await prisma.asset.findFirst({
      where: {
        id: +id,
        user_id: this.request.user?.id || null,
      },
    });
    if (!asset) throw new AppError("Asset not found!");
    return asset;
  });

  return asset;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.assetUncheckedCreateInput} body
 * @returns {Promise<Models.asset>}
 */
export async function createAsset(body) {
  const asset = await prisma.asset.create({
    data: {
      ...body,
      user_id: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_assets`);
  return asset;
}

/**
 * @this {API.This}
 * @param {number} id
 * @param {Models.Prisma.assetUncheckedUpdateInput} body
 * @returns
 */
export async function updateAsset(id, body) {
  let asset = await prisma.asset.findFirst({
    where: {
      id: +id,
      user_id: this.request.user?.id || null,
    },
  });

  if (!asset) throw new AppError("Asset not found!");

  asset = await prisma.asset.update({
    where: {
      id: +id,
    },
    data: {
      ...body,
      user_id: this.request.user?.id || null,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_assets`);
  await invalidateCache(`user_${this.request.user?.id}_asset_${asset.id}`);
  return asset;
}

/**
 * @this {API.This}
 * @param {string} id
 */
export async function deleteAsset(id) {
  await prisma.asset.delete({
    where: {
      id: +id,
      user_id: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_assets`);
}

/**
 * @this {API.This}
 * @returns {Promise<Models.asset_type[]>}
 */
export async function getAssetTypes() {
  const asset_types = await getOrSetCache(
    `user_${this.request.user?.id}_asset_types`,
    async () => {
      const asset_types = await prisma.asset_type.findMany({
        orderBy: { created_at: "desc" },
      });

      return asset_types;
    },
    false
  );

  return asset_types;
}
