import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { queryParamsSchema } from "../../validation/productSchemas.js";
import { validateQueryParameters } from "../../utils/validation.js";

const validateQueryParams = validateQueryParameters(queryParamsSchema);

export const listProducts = async (event) => {
    try {
        const queryParams = validateQueryParams(event);
        let items = [];

        const filterExpressions = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};

        // Filter by category
        if (queryParams.category) {
            expressionAttributeNames["#cat"] = "category";
            expressionAttributeValues[":category"] = queryParams.category;
            filterExpressions.push("#cat = :category");
        }

        // Filter by name (contains, case-insensitive)
        if (queryParams.name) {
            filterExpressions.push("contains(#name, :name)");
            expressionAttributeNames["#name"] = "name";
            expressionAttributeValues[":name"] = queryParams.name;
        }

        // Filter by price range
        if (queryParams.minPrice !== undefined) {
            filterExpressions.push("price >= :minPrice");
            expressionAttributeValues[":minPrice"] = Number(queryParams.minPrice);
        }
        if (queryParams.maxPrice !== undefined) {
            filterExpressions.push("price <= :maxPrice");
            expressionAttributeValues[":maxPrice"] = Number(queryParams.maxPrice);
        }

        // Filter by availability status
        if (queryParams.availableStatus === "inStock") {
            filterExpressions.push("available > :zero");
            expressionAttributeValues[":zero"] = 0;
        } else if (queryParams.availableStatus === "outOfStock") {
            filterExpressions.push("available = :zero");
            expressionAttributeValues[":zero"] = 0;
        }

        // Filter by minAvailable
        if (queryParams.minAvailable !== undefined) {
            filterExpressions.push("available >= :minAvailable");
            expressionAttributeValues[":minAvailable"] = Number(queryParams.minAvailable);
        }

        // Decide between Query (with category) and Scan
        if (queryParams.category) {
            const params = {
                TableName: TABLE_NAME,
                KeyConditionExpression: "#cat = :category",
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
            };

            if (filterExpressions.length > 1) {
                // Exclude category from filter since it's in KeyConditionExpression
                const otherFilters = filterExpressions.filter(f => f !== "#cat = :category");
                if (otherFilters.length) params.FilterExpression = otherFilters.join(" AND ");
            }

            const result = await docClient.send(new QueryCommand(params));
            items = result.Items || [];
        } else {
            // Scan fallback
            const scanParams = {
                TableName: TABLE_NAME,
                ExpressionAttributeNames: Object.keys(expressionAttributeNames).length ? expressionAttributeNames : undefined,
                ExpressionAttributeValues: Object.keys(expressionAttributeValues).length ? expressionAttributeValues : undefined,
                FilterExpression: filterExpressions.length ? filterExpressions.join(" AND ") : undefined,
            };

            const scanResult = await docClient.send(new ScanCommand(scanParams));
            items = scanResult.Items || [];
        }

        // Apply sorting by createdAt
        const sortOrder = queryParams.sortOrder || "desc";
        items.sort((a, b) => {
            const da = new Date(a.createdAt || 0);
            const db = new Date(b.createdAt || 0);
            return sortOrder === "desc" ? db - da : da - db;
        });

        return successResponse(items);
    } catch (error) {
        console.error("Error listing products:", error);
        return errorResponse(error);
    }
};
