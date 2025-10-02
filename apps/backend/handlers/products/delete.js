import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { noContentResponse, errorResponse } from "../../utils/responses.js";
import { productIdSchema } from "../../validation/productSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateProductId = validatePathParameters(productIdSchema);

export const deleteProduct = async (event) => {
    try {
        const { id } = validateProductId(event);

        // Check if product exists first
        const existingProduct = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { id },
        }));

        if (!existingProduct.Item) {
            return notFoundResponse('Product not found');
        }

        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id },
        }));

        return noContentResponse();
    } catch (error) {
        console.error('Error deleting product:', error);
        return errorResponse(error);
    }
};
