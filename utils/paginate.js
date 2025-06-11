/**
 *
 * @param {*} obj
 * @param {*} path
 * @returns
 */
function getNestedValue(obj, path) {
  return path
    .split(".")
    .reduce(
      (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
      obj
    );
}

/**
 * 
 * @param {*} data Your arrau of data
 * @param {*} options {page = 1,
    limit = 10,
    sortBy = null,
    order = "asc",
    filterFn = null
    }
 * @returns 
 */
function paginate(data, options = {}) {
  let {
    page = 1,
    limit = 10,
    sortBy = null,
    order = "asc",
    filterFn = null,
  } = options;

  const res = {};
  let resultData = Array.isArray(data) ? [...data] : [];

  // Filter
  if (filterFn && typeof filterFn === "function") {
    resultData = resultData.filter(filterFn);
  }

  const totalItems = resultData.length;

  if (limit <= 0) {
    res.error = "Limit must be greater than 0.";
    return res;
  }

  const totalPages = Math.ceil(totalItems / limit);

  if (page <= 0 || page > totalPages) {
    res.error = "Page not found.";
    res.data = [];
    res.paginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: false,
      hasPrevious: false,
    };
    return res;
  }

  // Sort (supports nested keys)
  if (sortBy) {
    resultData.sort((a, b) => {
      const valA = getNestedValue(a, sortBy);
      const valB = getNestedValue(b, sortBy);

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "string" && typeof valB === "string") {
        return order === "desc"
          ? valB.localeCompare(valA)
          : valA.localeCompare(valB);
      }

      return order === "desc" ? valB - valA : valA - valB;
    });
  }

  const start = (page - 1) * limit;
  const end = start + limit;

  // Slice data
  res.data = resultData.slice(start, end);

  // Meta info
  res.paginationMeta = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
  };

  return res;
}

module.exports = paginate;
