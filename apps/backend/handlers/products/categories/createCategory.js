import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../../lib/dynamodb.js";

/**
 * Creates a new category aggregate item in the PRODUCTS_TABLE.
 * @param {*} category Category name
 * @param {*} aggregate JSON object with totalAvailability and productIDs
 * @returns {Promise<Object>} - Created category aggregate item
 */
export const createCategory = async (category, aggregate) => {
    const now = new Date().toISOString();
    const item = {
        category,
        id: "CATEGORY",
        totalAvailability: aggregate.totalAvailability,
        productIDs: aggregate.productIDs,
        createdAt: now,
        updatedAt: now,
    };

    await docClient.send(new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: item
    }));
    return item;
};
