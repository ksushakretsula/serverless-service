import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { queryParamsSchema } from "../../validation/productSchemas.js";
import { validateQueryParameters } from "../../utils/validation.js";

const validateQueryParams = validateQueryParameters(queryParamsSchema);

export const listProducts = async (event) => {
    try {
        const queryParams = validateQueryParams(event);

        // If category is provided, using Query; otherwise fallback to Scan
        if (queryParams.category) {
            const params = {
                TableName: TABLE_NAME,
                KeyConditionExpression: "#cat = :category",
                ExpressionAttributeNames: { "#cat": "category" },
                ExpressionAttributeValues: { ":category": queryParams.category },
            };

            // Filter for availability range
            const filterExpressions = [];
            const expressionAttributeValues = { ...params.ExpressionAttributeValues };

            if (queryParams.available === true) filterExpressions.push("available > :minAvailable");
            if (queryParams.available === false) {
                filterExpressions.push("available = :zero");
                expressionAttributeValues[":zero"] = 0;
            }
            if (queryParams.minAvailable !== undefined) {
                filterExpressions.push("available >= :minAvailable");
                expressionAttributeValues[":minAvailable"] = queryParams.minAvailable;
            }
            if (queryParams.maxAvailable !== undefined) {
                filterExpressions.push("available <= :maxAvailable");
                expressionAttributeValues[":maxAvailable"] = queryParams.maxAvailable;
            }

            if (filterExpressions.length > 0) {
                params.FilterExpression = filterExpressions.join(" AND ");
                params.ExpressionAttributeValues = expressionAttributeValues;
            }

            const result = await docClient.send(new QueryCommand(params));
            return successResponse(result.Items);
        }

        // If no category, fallback to Scan (inefficient, but covers all products)
        const scanParams = { TableName: TABLE_NAME };
        const scanResult = await docClient.send(new ScanCommand(scanParams));
        return successResponse(scanResult.Items);
    } catch (error) {
        console.error("Error listing products:", error);
        return errorResponse(error);
    }
};
