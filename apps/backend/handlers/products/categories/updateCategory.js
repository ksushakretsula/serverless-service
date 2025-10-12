import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../../lib/dynamodb.js";
import { deleteCategory } from "./deleteCategory.js";
import { getCategory } from "./getCategory.js";
import { createCategory } from "./createCategory.js";

/**
 * Update or create a category aggregate in DynamoDB
 * @param {*} category Category name
 * @param {*} aggregate JSON object with totalAvailability and productIDs
 * @returns {Promise<Object|null>} - Updated or created category aggregate, or null if deleted
 */
export const updateCategory = async (category, aggregate) => {
    if (!aggregate.productIDs || aggregate.productIDs.length === 0) {
        await deleteCategory(category);
        console.log(`Deleted category aggregate for '${category}' because no products remain.`);
        return null;
    }

    const existing = await getCategory(category);

    if (!existing) {
        return await createCategory(category, aggregate);
    }

    const now = new Date().toISOString();
    const item = {
        category,
        id: "CATEGORY",
        totalAvailability: aggregate.totalAvailability,
        productIDs: aggregate.productIDs,
        createdAt: existing.createdAt,
        updatedAt: now,
    };

    await docClient.send(new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: item
    }));
    return item;
};
