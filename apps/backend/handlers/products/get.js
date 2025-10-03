import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { productKeySchema } from "../../validation/productSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateProductKey = validatePathParameters(productKeySchema);

export const getProduct = async (event) => {
    try {
        const { category, id } = validateProductKey(event);

        if (!id || !category) {
            return errorResponse({ message: "Both id and category are required" }, 400);
        }

        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { category, id },
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
