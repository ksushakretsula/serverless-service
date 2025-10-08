import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, ORDERS_TABLE } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { orderKeySchema } from "../../utils/validationSchemas/orderSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateOrderKey = validatePathParameters(orderKeySchema);

export const getOrder = async (event) => {
    try {
        const { id } = validateOrderKey(event);

        if (!id) {
            return errorResponse({ message: "Order ID is required" }, 400);
        }

        const result = await docClient.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: { id },
        }));

        if (!result.Item) {
            return notFoundResponse("Order not found", 404);
        }

        return successResponse(result.Item);
    } catch (error) {
        console.error("Error getting order:", error);
        return errorResponse(error);
    }
};
