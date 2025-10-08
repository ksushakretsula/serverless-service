import { docClient } from "../../lib/dynamodb.js";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { eventBridge } from "../../lib/eventbridge.js";
import { successResponse, errorResponse } from "../../utils/responses.js";
import { createOrderSchema } from "../../utils/validationSchemas/orderSchemas.js";
import { v4 as uuidv4 } from "uuid";
import { ORDERS_TABLE, PRODUCTS_TABLE } from "../../lib/dynamodb.js";
import { validateBody } from "../../utils/validation.js";

const validateCreateOrder = validateBody(createOrderSchema);

export const createOrder = async (event) => {
    try {
        const validatedData = validateCreateOrder(event);

        const { category, productId, quantity } = validatedData;

        // --- Get product ---
        const productRes = await docClient.send(
            new GetCommand({
                TableName: PRODUCTS_TABLE,
                Key: { category, id: productId },
            })
        );

        const product = productRes.Item;
        if (!product) {
            return errorResponse("Product not found", 404);
        }

        if (product.available < quantity) {
            return errorResponse("Not enough stock available", 400);
        }

        // --- Compute order data ---
        const orderId = uuidv4();
        const total = parseFloat((product.price * quantity).toFixed(2));
        const orderItem = {
            id: orderId,
            productId,
            category,
            productName: product.name,
            unitPrice: product.price,
            quantity,
            total,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // --- Save order to OrdersTable ---
        await docClient.send(
            new PutCommand({
                TableName: ORDERS_TABLE,
                Item: orderItem,
            })
        );

        // --- Publish event to EventBridge ---
        const eventParams = {
            Entries: [
                {
                    Source: "order.service",
                    DetailType: "order.created",
                    Detail: JSON.stringify({
                        orderId,
                        productId,
                        category,
                        quantity,
                    }),
                },
            ],
        };

        await eventBridge.send(new PutEventsCommand(eventParams));

        return successResponse(orderItem, 201);
    } catch (err) {
        return errorResponse("Failed to create order", 500);
    }
};
