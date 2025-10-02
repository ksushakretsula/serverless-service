import { v4 as uuidv4 } from "uuid";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { createProductSchema } from "../../validation/productSchemas.js";
import { validateBody } from "../../utils/validation.js";

const validateCreateProduct = validateBody(createProductSchema);

export const createProduct = async (event) => {
    try {
        const validatedData = validateCreateProduct(event);

        const item = {
            id: uuidv4(),
            name: validatedData.name,
            price: validatedData.price,
            category: validatedData.category,
            available: validatedData.available ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

        return successResponse(item, 201);
    } catch (error) {
        // console.error('Error creating product:', error);
        return errorResponse(error);
    }
};
