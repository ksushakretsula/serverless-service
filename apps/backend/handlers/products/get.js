import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { productIdSchema } from "../../validation/productSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateProductId = validatePathParameters(productIdSchema);

export const getProduct = async (event) => {
    try {
        const { id } = validateProductId(event);

        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { id },
        }));

        if (!result.Item) {
            return notFoundResponse('Product not found');
        }

        return successResponse(result.Item);
    } catch (error) {
        console.error('Error getting product:', error);
        return errorResponse(error);
    }
};
