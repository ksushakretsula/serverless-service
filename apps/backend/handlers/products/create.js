import { v4 as uuidv4 } from "uuid";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { createProductSchema } from "../../utils/validationSchemas/productSchemas.js";
import { validateBody } from "../../utils/validation.js";

const validateCreateProduct = validateBody(createProductSchema);

export const createProduct = async (event) => {
    try {
        const validatedData = validateCreateProduct(event);

        const item = {
            id: uuidv4(),
            category: validatedData.category,
            name: validatedData.name,
            price: validatedData.price,
            available: validatedData.available ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: item }));

        return successResponse(item, 201);
    } catch (error) {
        // console.error('Error creating product:', error);
        return errorResponse(error);
    }
};
