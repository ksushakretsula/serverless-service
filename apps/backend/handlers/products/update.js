import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { updateProductSchema, productKeySchema } from "../../utils/validationSchemas/productSchemas.js";
import { validateBody, validatePathParameters } from "../../utils/validation.js";
import { getChangedFields } from "../../utils/comparison.js";

const validateUpdateProduct = validateBody(updateProductSchema);
const validateProductKey = validatePathParameters(productKeySchema);

export const updateProduct = async (event) => {
    try {
        const { category, id } = validateProductKey(event);

        if (!id || !category) {
            return errorResponse({ message: "Both id and category are required" }, 400);
        }
        const validatedData = validateUpdateProduct(event);

        // Check if product exists first
        const existingResult = await docClient.send(new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { category, id },
        }));

        if (!existingResult.Item) {
            return notFoundResponse('Product not found');
        }

        const existingProduct = existingResult.Item;

        const changedFields = getChangedFields(validatedData, existingProduct);

        // If no fields changed, return early
        if (Object.keys(changedFields).length === 0) {
            return successResponse({
                message: 'No changes detected - product remains unchanged',
                product: existingProduct
            });
        }

        // Build update expression based on changed fields
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (changedFields.name !== undefined) {
            updateExpressions.push('#n = :n');
            expressionAttributeNames['#n'] = 'name';
            expressionAttributeValues[':n'] = changedFields.name;
        }

        if (changedFields.price !== undefined) {
            updateExpressions.push('price = :p');
            expressionAttributeValues[':p'] = changedFields.price;
        }

        if (changedFields.category !== undefined) {
            updateExpressions.push('category = :c');
            expressionAttributeValues[':c'] = changedFields.category;
        }

        if (changedFields.available !== undefined) {
            updateExpressions.push('available = :a');
            expressionAttributeValues[':a'] = changedFields.available;
        }

        // Always update the updatedAt timestamp when changes occur
        updateExpressions.push('updatedAt = :u');
        expressionAttributeValues[':u'] = new Date().toISOString();

        const result = await docClient.send(new UpdateCommand({
            TableName: PRODUCTS_TABLE,
            Key: { category, id },
            UpdateExpression: `set ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW",
        }));

        return successResponse({
            message: 'Product updated successfully',
            changedFields: Object.keys(changedFields),
            product: result.Attributes
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return errorResponse(error);
    }
};
