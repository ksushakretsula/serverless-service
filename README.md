# Serverless Demo - Shop Service

A simple Serverless Framework project with AWS Lambda. The service includes a `hello_world` endpoint and full CRUD operations on `products` stored in DynamoDB.

- **Framework:** Serverless Framework
- **Runtime:** AWS Lambda
- **API Gateway:** AWS API Gateway
- **Region:** us-east-1

## Usage

### Task 2. Product Endpoints

The service allows full CRUD operations on `products` stored in DynamoDB. Each product has the following fields:

- `id` (string, UUID)
- `name` (string)
- `price` (number)
- `category` (string)
- `available` (boolean)

API base URL: <https://swbm3u0ur0.execute-api.us-east-1.amazonaws.com/dev/products>.

#### Frontend UI

A minimal UI is provided in the `frontend/` folder. You can run it locally to interact with all product endpoints.

```bash
cd frontend
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

#### Testing from the Terminal

A test script is included to quickly verify all endpoints:

```bash
cd shop
chmod +x test.sh
./test.sh
```

### Task 1. Hello World Endpoint

Returns a greeting message along with current timestamp and API version information.

**URL:** [https://5pdf17uwii.execute-api.us-east-1.amazonaws.com/hello_world](https://5pdf17uwii.execute-api.us-east-1.amazonaws.com/hello_world)

**Method:** `GET`

**Response:**

```json
{
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    },
    "body": {
        "message": "Hello World!",
        "timestamp": "Thu, 25 Sep 2025 20:25:06 GMT",
        "version": "1.0.0"
    }
}
```

**Response Fields:**

- `message`: "Hello World!"
- `timestamp`: Current time in GMT format
- `version`: Static version number

#### Call the API Endpoint from CLI

```bash
curl https://5pdf17uwii.execute-api.us-east-1.amazonaws.com/hello_world
```

#### Local Development

Run the Lambda function locally:

```bash
cd shop
sls invoke local -f hello_world
```

#### Expected local output

```text
Request completed in 0 ms

{
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    },
    "body": {
        "message": "Hello World!",
        "timestamp": "Thu, 25 Sep 2025 20:25:06 GMT",
        "version": "1.0.0"
    }
}
```
