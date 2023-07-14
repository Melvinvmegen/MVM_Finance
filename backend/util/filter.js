export function setFilters(query) {
  const per_page = +query.perPage || 0;
  const page = +query.currentPage || 1;
  const offset = (page - 1) * per_page;
  const options = {};

  Object.keys(query).forEach(function (key) {
    const value = query[key];
    if (!value) return;
    if (key === "currentPage" || key === "perPage" || key === "force") return;
    options[`${key}`] = Number.isInteger(+value) ? +value : value;
  });

  return { per_page, offset, options };
}
