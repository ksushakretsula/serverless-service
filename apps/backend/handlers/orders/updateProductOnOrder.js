import { docClient } from "../../lib/dynamodb.js";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { successResponse, errorResponse } from "../../utils/responses.js";

export const updateProductOnOrder = async (event) => {
    console.log("Received EventBridge event:", JSON.stringify(event, null, 2));

    try {
        // EventBridge delivers events under event.detail if directly triggered,
        // but if using SQS as intermediary, they may appear in event.Records.
        const records = event.Records ? event.Records.map(r => JSON.parse(r.body)) : [event];

        for (const record of records) {
            const { "detail-type": detailType, detail } = record;

            if (!detail) {
                console.warn("Skipping record with missing detail:", record);
                continue;
            }

            const { category, productId, quantity, quantityDiff } = detail;
            if (!category || !productId) {
                console.warn("Missing required fields in event detail:", detail);
                continue;
            }

            // Decide how much to adjust stock
            let stockChange = 0;

            if (detailType === "order.created") {
                stockChange = -quantity; // decrease
            } else if (detailType === "order.updated") {
                stockChange = -quantityDiff; // can increase or decrease
            } else if (detailType === "order.deleted") {
                stockChange = quantity; // restore stock
            } else {
                console.warn("Unknown event type:", detailType);
                continue;
            }

            // Construct UpdateCommand
            const params = {
                TableName: process.env.PRODUCTS_TABLE,
                Key: { category, id: productId },
                UpdateExpression: "ADD available :diff",
                ExpressionAttributeValues: {
                    ":diff": stockChange,
                    ":minAvailable": stockChange < 0 ? -stockChange : 0
                },
                ConditionExpression: "available >= :minAvailable",
            };

            try {
                const result = await docClient.send(new UpdateCommand(params));
                console.log(
                    `Product ${productId} (${category}) stock updated by ${stockChange}:`,
                    result.Attributes
                );
            } catch (err) {
                console.error(
                    `Error updating product ${productId} (${category}):`,
                    err.message
                );
            }
        }

        return successResponse({ message: "Processed all order events successfully" }, 200);
    } catch (error) {
        console.error("Error processing EventBridge event:", error);
        return errorResponse(error);
    }
};
