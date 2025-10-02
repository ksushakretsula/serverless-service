import jwt from "jsonwebtoken";

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

		return {
			statusCode: 200,
			body: JSON.stringify({ token }),
			headers: {
				"Content-Type": "application/json"
			},
		};
	} catch (err) {
		console.error(err);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: "Failed to generate token" }),
		};
	}
};
