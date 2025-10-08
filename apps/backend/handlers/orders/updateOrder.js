import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, ORDERS_TABLE, PRODUCTS_TABLE } from "../../lib/dynamodb.js";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridge } from "../../lib/eventbridge.js";
import { successResponse, errorResponse, notFoundResponse } from "../../utils/responses.js";
import { updateOrderSchema, orderKeySchema } from "../../utils/validationSchemas/orderSchemas.js";
import { validateBody, validatePathParameters } from "../../utils/validation.js";

const validateUpdateOrder = validateBody(updateOrderSchema);
const validateOrderKey = validatePathParameters(orderKeySchema);

export const updateOrder = async (event) => {
    try {
        const { id } = validateOrderKey(event);

        if (!id) {
            return errorResponse({ message: "Order ID is required" }, 400);
        }

        const { quantity } = validateUpdateOrder(event);

        // Check if order exists first
        const existingResult = await docClient.send(
            new GetCommand({
                TableName: ORDERS_TABLE,
                Key: { id },
            })
        );

        const existingOrder = existingResult.Item;
        if (!existingOrder) {
            return notFoundResponse("Order not found");
        }

        if (quantity === existingOrder.quantity) {
            return successResponse({
                message: "No changes detected - quantity remains unchanged",
                order: existingOrder,
            });
        }

        // Get associated product to verify stock
        const productResult = await docClient.send(
            new GetCommand({
                TableName: PRODUCTS_TABLE,
                Key: {
                    category: existingOrder.category,
                    id: existingOrder.productId,
                },
            })
        );

        const product = productResult.Item;
        if (!product) {
            return errorResponse("Associated product not found", 404);
        }

        const quantityDiff = quantity - existingOrder.quantity; // how much we're increasing or decreasing
        if (quantityDiff > 0 && product.available < quantityDiff) {
            return errorResponse(
                `Not enough stock available. Only ${product.available} left.`,
                400
            );
        }

        const newTotal = parseFloat((existingOrder.unitPrice * quantity).toFixed(2));

        const result = await docClient.send(
            new UpdateCommand({
                TableName: ORDERS_TABLE,
                Key: { id },
                UpdateExpression: "SET quantity = :q, total = :t, updatedAt = :u",
                ExpressionAttributeValues: {
                    ":q": quantity,
                    ":t": newTotal,
                    ":u": new Date().toISOString(),
                },
                ReturnValues: "ALL_NEW",
            })
        );

        // --- Emit EventBridge event ---
        const eventParams = {
            Entries: [
                {
                    Source: "order.service",
                    DetailType: "order.updated",
                    Detail: JSON.stringify({
                        orderId: id,
                        productId: existingOrder.productId,
                        category: existingOrder.category,
                        quantity: quantity,
                        oldQuantity: existingOrder.quantity,
                        quantityDiff: quantityDiff,
                        total: newTotal,
                    }),
                },
            ],
        };

        await eventBridge.send(new PutEventsCommand(eventParams));

        return successResponse({
            message: "Order quantity updated successfully",
            order: result.Attributes,
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return errorResponse(error);
    }
};
