/**
 * Small helper so every endpoint answers with the same JSON shape:
 *   { success, message, data }
 * `data` is omitted when there is nothing meaningful to return.
 */
export const sendResponse = (res, statusCode, message, data) => {
    const body = { success: statusCode < 400, message };

    if (data !== undefined) {
        body.data = data;
    }

    return res.status(statusCode).json(body);
};
