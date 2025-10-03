import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { noContentResponse, errorResponse } from "../../utils/responses.js";
import { productKeySchema } from "../../validation/productSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateProductKey = validatePathParameters(productKeySchema);

export const deleteProduct = async (event) => {
    try {
        const { category, id } = validateProductKey(event);

        if (!id || !category) {
            return errorResponse({ message: "Both id and category are required" }, 400);
        }

        // Check if product exists first
        const existingProduct = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { category, id },
        }));

        if (!existingProduct.Item) {
            return notFoundResponse('Product not found');
        }

        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { category, id },
        }));

        return noContentResponse();
    } catch (error) {
        console.error('Error deleting product:', error);
        return errorResponse(error);
    }
};
