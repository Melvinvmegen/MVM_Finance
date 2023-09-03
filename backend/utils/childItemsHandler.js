import { prisma } from "./prisma.js";

const updateCreateOrDestroyChildItems = async function (model, old_child_items, new_child_items) {
  if (!new_child_items) {
    for (let old of old_child_items) {
      // @ts-ignore
      await prisma[model].delete({
        where: { id: old.id },
      });
    }
    return;
  }

  for (let old_child of old_child_items) {
    const is_kept = new_child_items.find((new_child) => old_child.id === new_child.id);
    if (!is_kept) {
      // @ts-ignore
      await prisma[model].delete({
        where: { id: old_child.id },
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
