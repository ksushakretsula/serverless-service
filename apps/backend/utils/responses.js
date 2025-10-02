const defaultHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token'
};

export const successResponse = (body, statusCode = 200) => ({
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify(body),
});

export const errorResponse = (error, statusCode = 500) => {
    let errorMessage = error.message || 'Internal Server Error';
    let status = statusCode;

    try {
        const parsedError = JSON.parse(errorMessage);
        if (Array.isArray(parsedError)) {
            errorMessage = { errors: parsedError };
            status = 400;
        }
    } catch {
        errorMessage = { error: errorMessage };
    }

    return {
        statusCode: status,
        headers: defaultHeaders,
        body: JSON.stringify(errorMessage),
    };
};

export const noContentResponse = () => ({
    statusCode: 204,
    headers: defaultHeaders,
    body: "",
});

export const notFoundResponse = (message = 'Resource not found') => ({
    statusCode: 404,
    headers: defaultHeaders,
    body: JSON.stringify({ error: message }),
});
