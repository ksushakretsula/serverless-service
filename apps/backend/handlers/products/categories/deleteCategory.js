import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../../lib/dynamodb.js";
import { getCategory } from "./getCategory.js";

/**
 * Deletes the category aggregate item from the PRODUCTS_TABLE.
 * @param {*} category Category name
 * @returns {Promise<void>}
 */
export const deleteCategory = async (category) => {
    const existing = await getCategory(category);

    if (!existing) {
        return notFoundResponse('Product not found');
    }

    await docClient.send(new DeleteCommand({
        TableName: PRODUCTS_TABLE,
        Key: { category, id: "CATEGORY" },
    }));
    console.log(`Deleted category aggregate for '${category}'.`);
};
