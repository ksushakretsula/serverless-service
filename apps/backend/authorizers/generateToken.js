import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "../utils/responses.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";

export const handler = async (event) => {
	try {
		// Example payload - you can expand with user info
		const payload = {
			userId: "local-user",
			role: "admin",
			scope: ["create", "update", "delete"]
		};

		// Token valid for 1 hour
		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

		return successResponse({ token });
	} catch (error) {
		return errorResponse(error);
	}
};
