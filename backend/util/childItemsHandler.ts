import { prisma } from "../util/prisma.js";

const updateCreateOrDestroyChildItems = async function (model: string, old_child_items: any[], new_child_items: any[]) {
  if (!new_child_items) {
    for (let old of old_child_items) {
      // @ts-ignore
      await prisma[model].delete({
        where: { id: old.id },
      });
    }
    return;
  }

  for (let old of old_child_items) {
    const is_kept = new_child_items.find((child) => old.id === child.id);
    if (!is_kept) {
      // @ts-ignore
      await prisma[model].delete({
        where: { id: old.id },
      });
    }
  }
  for (let new_child of new_child_items) {
    // @ts-ignore
    await prisma[model].upsert({
      where: { id: new_child.id || 0 },
      update: new_child,
      create: new_child,
    });
  }
};

export { updateCreateOrDestroyChildItems };
