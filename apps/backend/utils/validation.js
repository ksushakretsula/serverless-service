export const validate = (schema, options = {}) => {
    const opts = { abortEarly: false, convert: false, allowUnknown: false, ...options };
    return (input) => {
        const { error, value } = schema.validate(input, opts);

        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new Error(JSON.stringify(validationErrors));
        }

        return value;
    };
};

export const validateBody = (schema) => {
    const validator = validate(schema);
    return (event) => {
        try {
            const body = JSON.parse(event.body || '{}');
            return validator(body);
        } catch (parseError) {
            let errorMessage = parseError.message;

            // If the message itself looks like JSON, try to parse it
            try {
                const parsedMsg = JSON.parse(errorMessage);
                if (Array.isArray(parsedMsg)) {
                    // convert array of objects to human readable string
                    errorMessage = parsedMsg
                        // .map(e => `${e.field}: ${e.message}`)
                        .map(e => `${e.message}`)
                        .join('; ');
                }
            } catch (_) {
                // leave original message if it’s not valid JSON
            }

            throw new Error(JSON.stringify([{
                field: 'body',
                message: `Invalid data: ${errorMessage}`
            }]));
        }
    };
};

export const validatePathParameters = (schema) => {
    const validator = validate(schema);
    return (event) => validator(event.pathParameters || {});
};

export const validateQueryParameters = (schema) => {
    const validator = validate(schema);
    return (event) => validator(event.queryStringParameters || {});
};
