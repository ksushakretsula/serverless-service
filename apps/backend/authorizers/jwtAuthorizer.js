import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";

export const handler = async (event) => {
	try {
		const token = event.authorizationToken;

		if (!token) throw new Error("No token provided");

		const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;

		const decoded = jwt.verify(actualToken, JWT_SECRET);
		console.log("Decoded JWT:", decoded);

		return {
			principalId: decoded.userId || "user",
			policyDocument: {
				Version: "2012-10-17",
				Statement: [
					{
						Action: "execute-api:Invoke",
						Effect: "Allow",
						// Resource: event.methodArn,
						Resource: `arn:aws:execute-api:us-east-1:*:*/*/*/*`
					},
				],
			},
			context: {
				userId: decoded.userId,
				role: decoded.role,
				scope: decoded.scope.join(","),
			},
		};
	} catch (err) {
		console.error("JWT verification failed:", err);
		return {
			principalId: "user",
			policyDocument: {
				Version: "2012-10-17",
				Statement: [
					{
						Action: "execute-api:Invoke",
						Effect: "Deny",
						Resource: event.methodArn,
					},
				],
			},
		};
	}
};
