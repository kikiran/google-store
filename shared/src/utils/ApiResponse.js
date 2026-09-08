const SUCCESS_CODES = new Set([200, 201, 204]);

function send(res, status, payload) {
  if (status === 204) {
    res.status(204).end();
    return;
  }
  res.status(status).json(payload);
}

export function success(res, data = null, message = 'OK', meta = undefined, status = 200) {
  const body = { success: true, data };
  if (message) body.message = message;
  if (meta !== undefined) body.meta = meta;
  if (!SUCCESS_CODES.has(status)) status = 200;
  send(res, status, body);
  return res;
}

export function created(res, data = null, message = 'Created', meta = undefined) {
  return success(res, data, message, meta, 201);
}

export function noContent(res) {
  return send(res, 204, null);
}

export function fail(res, status, code, message, details = undefined) {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details !== undefined) body.error.details = details;
  send(res, status, body);
  return res;
}

export default { success, created, noContent, fail };