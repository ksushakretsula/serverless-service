import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { productKeySchema } from "../../utils/validationSchemas/productSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateProductKey = validatePathParameters(productKeySchema);

export const getProduct = async (event) => {
    try {
        const { category, id } = validateProductKey(event);

        if (!id || !category) {
            return errorResponse({ message: "Both id and category are required" }, 400);
        }

        const result = await docClient.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
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
