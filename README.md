# Serverless Demo - Shop Service

A simple Serverless Framework project with AWS Lambda. The service includes a `hello_world` endpoint and full CRUD operations on `products` stored in DynamoDB.

- **Framework:** Serverless Framework
- **Runtime:** AWS Lambda
- **API Gateway:** AWS API Gateway
- **Region:** us-east-1

## Usage

### Task 3. Validation & Authorization

Updates in the project:

1. npm workspaces
2. Validation
3. Authorizer (JWT Token)

    Run test:

    ```bash
    ./apps/backend/auth_test.sh
    ```

    Output should look similar to:

    ```text
    Fetching JWT token...
    Using token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJsb2NhbC11c2VyIiwicm9sZSI6ImFkbWluIiwic2NvcGUiOlsiY3JlYXRlIiwidXBkYXRlIiwiZGVsZXRlIl0sImlhdCI6MTc1OTQwNjQ1MSwiZXhwIjoxNzU5NDEwMDUxfQ.oVagsizIyHJ_VFd0abD3Uxjqaa32PWRW2D1mA7B-zNY
    Creating a new product...
    Created product with ID: cae0b8b9-a12c-4404-8a57-96208cb54245
    Retrieving the created product...
    {
    "available": 10,
    "updatedAt": "2025-10-02T12:00:52.541Z",
    "category": "Auth",
    "createdAt": "2025-10-02T12:00:52.527Z",
    "price": 299.5,
    "id": "cae0b8b9-a12c-4404-8a57-96208cb54245",
    "name": "Auth_Test"
    }

    Updating the product...
    {
    "message": "Product updated successfully",
    "changedFields": [
        "name",
        "price",
        "category",
        "available"
    ],
    "product": {
        "available": 5,
        "updatedAt": "2025-10-02T12:00:55.276Z",
        "category": "Auth updated",
        "createdAt": "2025-10-02T12:00:52.527Z",
        "id": "cae0b8b9-a12c-4404-8a57-96208cb54245",
        "price": 15,
        "name": "Auth_Test new"
    }
    }

    Listing all products...
    [
    {
        "available": 10,
        "updatedAt": "2025-10-02T11:56:53.192Z",
        "category": "Auth",
        "createdAt": "2025-10-02T11:56:53.192Z",
        "price": 299.5,
        "id": "32f831a6-bcf0-40ff-8cff-32becc5f2831",
        "name": "Auth_Test"
    },
    {
        "available": 5,
        "updatedAt": "2025-10-02T12:00:55.276Z",
        "category": "Auth updated",
        "createdAt": "2025-10-02T12:00:52.527Z",
        "id": "cae0b8b9-a12c-4404-8a57-96208cb54245",
        "price": 15,
        "name": "Auth_Test new"
    }
    ]

    Deleting the product...
    Product deleted.
    ```

4. Filtering

    TODO

5. Integrate Authorizer into frontend

    TODO

### Task 2. Product Endpoints

The service allows full CRUD operations on `products` stored in DynamoDB. Each product has the following fields:

- `id` (string, UUID)
- `name` (string)
- `price` (number)
- `category` (string)
- `available` (boolean)

API base URL: <https://swbm3u0ur0.execute-api.us-east-1.amazonaws.com/dev/products>.

#### Frontend UI

A minimal UI is provided in the `apps/frontend/` folder. You can run it locally to interact with all product endpoints.

```bash
cd apps/frontend
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

#### Testing from the Terminal

A test script is included to quickly verify all endpoints:

```bash
cd apps/backend
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
cd apps/backend
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
