const config = {
	enableCORS: true,
	logLevel: 'info'
};

exports.hello_world = async (event) => {
	const startTime = Date.now();

	try {
		const now = new Date();
		const ukrainianTime = new Date(now.setHours(now.getHours() + 3));

		const response = {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				...(config.enableCORS && { 'Access-Control-Allow-Origin': '*' })
			},
			body: JSON.stringify({
				message: "Hello World!",
				timestamp: ukrainianTime.toUTCString(),
				version: '1.0.0'
			}),
		};

		console.log(`Request completed in ${Date.now() - startTime} ms`);
		return response;

	} catch (error) {
		console.error('Request failed:', error);

		return {
			statusCode: 500,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				error: 'Internal Server Error'
			}),
		};
	}
}
