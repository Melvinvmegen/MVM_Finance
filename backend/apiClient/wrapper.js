/**
 * @param {API.ServerInstance} app
 * @param {string} method
 * @param {string} path
 * @param {Function} handler
 */
export function bind(app, method, path, handler, options) {
  const baseMethod = { download: "get", upload: "post" }[method] || method;
  return app[baseMethod](
    path,
    async function (/** @type {API.This["request"]} */ request, /** @type {API.This["reply"]} */ reply) {
      const thus = {
        request,
        reply,
        log: request.log,
        user: request.user,
      };
      switch (method) {
        case "get":
          return await handler.apply(thus, [...Object.values(request.params), request.query]);
        case "download":
          var response = await handler.apply(thus, [...Object.values(request.params), request.query]);
          return reply
            .type(response?.type || options?.type || "application/octet-stream")
            .header(
              "Content-Disposition",
              "attachment" +
                (response?.filename || options?.filename
                  ? "; filename=" + encodeURIComponent(response?.filename || options?.filename)
                  : "")
            )
            .send(response?.stream || response?.buffer || response?.body || response);
        case "upload":
          return await handler.apply(thus, [
            ...Object.values(request.params),
            await request.file(options),
            request.query,
          ]);
        default:
          return await handler.apply(thus, [...Object.values(request.params), request.body, request.query]);
      }
    }
  );
}

/**
 * @template {API.ServerInstance & { $get?: Function, $post?: Function, $put?: Function, $patch?: Function, $delete?: Function }} T
 * @param {T} app
 * @returns {T}
 */
export default function (app) {
  app.$get = function (/** @type {string} */ path, /** @type {Function} */ handler) {
    return bind(this, "get", path, handler);
  };
  app.$post = function (/** @type {string} */ path, /** @type {Function} */ handler) {
    return bind(this, "post", path, handler);
  };
  app.$put = function (/** @type {string} */ path, /** @type {Function} */ handler) {
    return bind(this, "put", path, handler);
  };
  app.$patch = function (/** @type {string} */ path, /** @type {Function} */ handler) {
    return bind(this, "patch", path, handler);
  };
  app.$delete = function (/** @type {string} */ path, /** @type {Function} */ handler) {
    return bind(this, "delete", path, handler);
  };
  app.$download = function (/** @type {string} */ path, /** @type {Function} */ handler, /** @type {any} */ options) {
    return bind(this, "download", path, handler, options);
  };
  app.$upload = function (/** @type {string} */ path, /** @type {Function} */ handler, /** @type {any} */ options) {
    return bind(this, "upload", path, handler, options);
  };
  return app;
}
