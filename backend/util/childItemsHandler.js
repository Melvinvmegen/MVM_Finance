exports.updateCreateOrDestroyChildItems = async function(knex, model, old_child_items, new_child_items) {
  if (!new_child_items) {
    for (let old of old_child_items) {
      await knex(`${model}`).where({ id: old.id }).del()
    }
    return
  }

  for (let old of old_child_items) {
    const is_kept = new_child_items.find((child) => old.id === child.id);
    if (!is_kept) {
      await knex(`${model}`).where({ id: old.id }).del()
    }
  }
  for (let new_child of new_child_items) {
    const existing = old_child_items.find((old) => old.id === new_child.id);
    delete new_child.markedForDestruction
    if (existing) {
      await knex(`${model}`).where('id', existing.id).update(new_child)
    } else {
      await knex(`${model}`).insert(new_child)
    }
  }
}