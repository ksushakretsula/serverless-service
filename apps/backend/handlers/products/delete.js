import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { productKeySchema } from "../../utils/validationSchemas/productSchemas.js";
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
            TableName: PRODUCTS_TABLE,
            Key: { category, id },
        }));

        if (!existingProduct.Item) {
            return notFoundResponse('Product not found');
        }

        await docClient.send(new DeleteCommand({
            TableName: PRODUCTS_TABLE,
            Key: { category, id },
        }));

        return successResponse({ message: "Product deleted successfully" });
    } catch (error) {
        console.error('Error deleting product:', error);
        return errorResponse(error);
    }
};
