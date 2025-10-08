import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, ORDERS_TABLE } from "../../lib/dynamodb.js";
import { successResponse, errorResponse } from "../../utils/responses.js";

export const listOrders = async () => {
	try {
		const result = await docClient.send(new ScanCommand({
			TableName: ORDERS_TABLE,
		}));

		const orders = result.Items || [];
		orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		return successResponse(orders);
	} catch (error) {
		console.error("Error listing orders:", error);
		return errorResponse(error);
	}
};
