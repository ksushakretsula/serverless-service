import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE } from "../../../lib/dynamodb.js";
import { successResponse, errorResponse, notFoundResponse } from "../../../utils/responses.js";

/**
 * HTTP handler to fetch a category aggregate (GET /categories/{category})
 * @param {*} event - Lambda event
 * @returns {Promise<Object>} - HTTP response
 */
export const getCategoryAggregate = async (event) => {
    try {
        const category = event.pathParameters?.category;
        if (!category) {
            return errorResponse({ message: "Category is required" }, 400);
        }

        const result = await docClient.send(
            new GetCommand({
                TableName: PRODUCTS_TABLE,
                Key: { category, id: "CATEGORY" },
            })
        );

        if (!result.Item) {
            return notFoundResponse(`Aggregate for category "${category}" not found`);
        }

        return successResponse({
            ...result.Item,
            productIDs: Array.isArray(result.Item.productIDs)
                ? result.Item.productIDs
                : [...(result.Item.productIDs || [])],
        });
    } catch (error) {
        console.error("Error fetching category aggregate:", error);
        return errorResponse(error);
    }
};

/**
 * Fetch a category aggregate from DynamoDB
 * @param {string} category - Category name
 * @returns {Promise<Object|null>} - Category aggregate or null if not found
 */
export const getCategory = async (category) => {
    if (!category) throw new Error("Category is required");

    const result = await docClient.send(new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { category, id: "CATEGORY" },
    }));

    if (!result.Item) return null;

    // Ensure productIDs is always an array
    const item = {
        ...result.Item,
        productIDs: Array.isArray(result.Item.productIDs)
            ? result.Item.productIDs
            : [...(result.Item.productIDs || [])],
    };

    return item;
};
