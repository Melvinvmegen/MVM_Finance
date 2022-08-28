exports.setFilters = function (query, alias) {
  const per_page = query.perPage || 0
  const page = query.currentPage || 1
  const offset = (page - 1) * per_page;
  const options = {}

  Object.keys(query).forEach(function (key) {
    // We filter out every key which can't be filtered
    if (!query[key]) return
    if (key === 'currentPage' || key === 'perPage' || key === 'force') return
    options[`${alias}.${key}`] = query[key]
  })
  
  return { per_page, offset, options }
}