import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../../utils/responses.js";
import { updateCategory } from "./updateCategory.js";

/**
 * Extract unique categories from DynamoDB stream records
 * @param {*} records Records from DynamoDB stream event
 * @returns {string[]} Unique categories
 */
const extractCategories = (records) =>
    [...new Set(
        records
            .map((r) => r.dynamodb?.NewImage?.category?.S || r.dynamodb?.OldImage?.category?.S)
            .filter(Boolean)
    )];

/**
 * Fetch all products in a given category
 * @param {*} category Category name
 * @returns {Promise<Array>} List of products in the category
 */
const getProductsByCategory = async (category) => {
    const command = new QueryCommand({
        TableName: PRODUCTS_TABLE,
        KeyConditionExpression: "#category = :category",
        ExpressionAttributeNames: { "#category": "category" },
        ExpressionAttributeValues: { ":category": category },
    });

    const result = await docClient.send(command);
    return (result.Items ?? []).filter((item) => item.id !== "CATEGORY");
};

/**
 * Compute aggregate data for a category from its products
 * @param {*} products List of products in the category
 * @returns {Object} JSON object with totalAvailability and productIDs
 */
const computeCategoryAggregate = (products) => ({
    totalAvailability: products.reduce((sum, p) => sum + (p.available ?? 0), 0),
    productIDs: products.map(p => p.id),
});

/**
 * Lambda handler to process DynamoDB stream events and update category aggregates
 * @param {*} event DynamoDB stream event
 * @returns {Object} API response
 */
export const handler = async (event) => {
    try {
        console.log("Received event:", JSON.stringify(event, null, 2));
        const categories = extractCategories(event.Records);
        if (categories.length === 0)
            return successResponse({ message: "No relevant changes" });

        await Promise.all(
            categories.map(async (category) => {
                const products = await getProductsByCategory(category);
                const aggregate = computeCategoryAggregate(products);
                await updateCategory(category, aggregate);
            })
        );

        return successResponse({
            message: `Updated categories: ${categories.join(", ")}`,
        });
    } catch (error) {
        console.error("Error updating category aggregates:", error);
        return errorResponse(error);
    }
};
