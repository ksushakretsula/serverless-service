import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { queryParamsSchema } from "../../validation/productSchemas.js";
import { validateQueryParameters } from "../../utils/validation.js";

const validateQueryParams = validateQueryParameters(queryParamsSchema);

export const listProducts = async (event) => {
    try {
        const queryParams = validateQueryParams(event);

        let scanParams = { TableName: TABLE_NAME };

        // Build filter expression if query parameters are provided
        if (Object.keys(queryParams).length > 0) {
            const filterExpressions = [];
            const expressionAttributeValues = {};
            const expressionAttributeNames = {};

            if (queryParams.category) {
                filterExpressions.push('#cat = :category');
                expressionAttributeNames['#cat'] = 'category';
                expressionAttributeValues[':category'] = queryParams.category;
            }

            // Filter by available products (available > 0)
            if (queryParams.available === true) {
                filterExpressions.push('available > :minAvailable');
                expressionAttributeValues[':minAvailable'] = 0;
            } else if (queryParams.available === false) {
                filterExpressions.push('available = :zero');
                expressionAttributeValues[':zero'] = 0;
            }

            // Filter by minimum available quantity
            if (queryParams.minAvailable !== undefined) {
                filterExpressions.push('available >= :minAvailable');
                expressionAttributeValues[':minAvailable'] = queryParams.minAvailable;
            }

            // Filter by maximum available quantity
            if (queryParams.maxAvailable !== undefined) {
                filterExpressions.push('available <= :maxAvailable');
                expressionAttributeValues[':maxAvailable'] = queryParams.maxAvailable;
            }

            if (filterExpressions.length > 0) {
                scanParams.FilterExpression = filterExpressions.join(' AND ');
                scanParams.ExpressionAttributeValues = expressionAttributeValues;
                if (Object.keys(expressionAttributeNames).length > 0) {
                    scanParams.ExpressionAttributeNames = expressionAttributeNames;
                }
            }
        }

        const result = await docClient.send(new ScanCommand(scanParams));
        return successResponse(result.Items);
    } catch (error) {
        console.error('Error listing products:', error);
        return errorResponse(error);
    }
};
