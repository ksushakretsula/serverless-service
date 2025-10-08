import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, ORDERS_TABLE } from "../../lib/dynamodb.js";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridge } from "../../lib/eventbridge.js";
import { successResponse, errorResponse, notFoundResponse } from "../../utils/responses.js";
import { orderKeySchema } from "../../utils/validationSchemas/orderSchemas.js";
import { validatePathParameters } from "../../utils/validation.js";

const validateOrderKey = validatePathParameters(orderKeySchema);

export const deleteOrder = async (event) => {
    try {
        const { id } = validateOrderKey(event);

        if (!id) {
            return errorResponse({ message: "Order ID is required" }, 400);
        }

        // Check if order exists first
        const existingOrderResult = await docClient.send(new GetCommand({
            TableName: ORDERS_TABLE,
            Key: { id },
        }));

        const existingOrder = existingOrderResult.Item;

        if (!existingOrder) {
            return notFoundResponse('Order not found');
        }

        await docClient.send(new DeleteCommand({
            TableName: ORDERS_TABLE,
            Key: { id },
        }));

        // --- Emit EventBridge event ---
        const eventParams = {
            Entries: [
                {
                    Source: "order.service",
                    DetailType: "order.deleted",
                    Detail: JSON.stringify({
                        orderId: id,
                        productId: existingOrder.productId,
                        category: existingOrder.category,
                        quantity: existingOrder.quantity,
                        total: existingOrder.total,
                    }),
                },
            ],
        };

        await eventBridge.send(new PutEventsCommand(eventParams));

        return successResponse({
            message: "Order deleted successfully",
            deletedOrder: existingOrder,
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return errorResponse(error);
    }
};
