# Serverless Demo - Shop Service

A simple Serverless Framework project with AWS Lambda. The service includes a `hello_world` endpoint and full CRUD operations on `products` stored in DynamoDB.

- **Framework:** Serverless Framework
- **Runtime:** AWS Lambda
- **API Gateway:** AWS API Gateway
- **Region:** us-east-1

## Usage

### Task 4. EventBridge

The Orders module (./apps/backend/habdlers/orders) is integrated with AWS EventBridge to ensure that any change in order state (creation, update, or deletion) automatically synchronizes product stock levels in the Products table.

To test this run:

```bash
chmod +x ./apps/backend/tests/order_test.sh
./apps/backend/tests/order_test.sh
```

Output should look similar to:

```text
Fetching JWT token...
Populating test products...
Created product: name=Test_Product1 id=c1e4e7d2-fe62-4e26-b965-c417bf180ae1 category=Test
Created product: name=Test_Product2 id=14b50c20-7910-4d8f-ab74-24c01c9a85fb category=Test

Created product IDs:
c1e4e7d2-fe62-4e26-b965-c417bf180ae1
14b50c20-7910-4d8f-ab74-24c01c9a85fb

Recording original stock...

Creating orders...
Stock updated correctly for Test:c1e4e7d2-fe62-4e26-b965-c417bf180ae1 after create (0)
Stock updated correctly for Test:14b50c20-7910-4d8f-ab74-24c01c9a85fb after create (0)

Updating first order quantity...
Before update - order quantity: 1, product stock: 0
Update failed as expected (HTTP 400). Verifying no changes to order and stock...
Update response: {"error":"Internal Server Error"}
OK: Order quantity unchanged (1)
OK: Product stock unchanged (0)

Deleting orders...
Stock restored correctly for Test:c1e4e7d2-fe62-4e26-b965-c417bf180ae1 after delete (1)
Stock restored correctly for Test:14b50c20-7910-4d8f-ab74-24c01c9a85fb after delete (3)
Order tests completed successfully!
```

### Task 3. Validation & Authorization

Updates in the project:

1. npm workspaces
2. Validation
3. Authorizer (JWT Token)

    Run test:

    ```bash
    chmod +x ./apps/backend/tests/auth_test.sh
    ./apps/backend/tests/auth_test.sh
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

4. Filtering (Query)

    I changed KeySchema from using simple primary key (just `id`) to use composite primary key. I used `category` as the partition key and `id` as the sort key:

    ```yaml
    KeySchema:
    - AttributeName: category
        KeyType: HASH
    - AttributeName: id
        KeyType: RANGE
    AttributeDefinitions:
    - AttributeName: category
        AttributeType: S
    - AttributeName: id
        AttributeType: S
    ```

    Run test:

    ```bash
    chmod +x ./apps/backend/tests/query_test.sh
    ./apps/backend/tests/query_test.sh
    ```

    Output should look similar to:

    ```text
    Fetching JWT token...
    Using token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJsb2NhbC11c2VyIiwicm9sZSI6ImFkbWluIiwic2NvcGUiOlsiY3JlYXRlIiwidXBkYXRlIiwiZGVsZXRlIl0sImlhdCI6MTc1OTQxMjMyMSwiZXhwIjoxNzU5NDE1OTIxfQ.WgGhXgGhtfHp4wdl32UhwhSNcWdbNRE4A5xkLEARtmo
    Populating test products...
    Created product: {"id":"71571208-06c8-490b-b9fb-386789dacc7e","name":"Auth_Test1","category":"Auth","available":1}
    Created product: {"id":"f0b5b8e9-dcf0-41a9-b0ff-e65bfb247524","name":"Auth_Test2","category":"Auth","available":5}
    Created product: {"id":"31be6a23-b8e5-4bb5-844c-d6674d6db99d","name":"Test_Product1","category":"Test","available":1}
    Created product: {"id":"dcd5923e-6423-44c3-8cd3-1bc16f8f1b2f","name":"Test_Product2","category":"Test","available":3}
    Created product: {"id":"b743965d-acaa-441a-998a-802d2cd4e999","name":"Test_Product3","category":"Test","available":15}
    Created product: {"id":"2ef7425a-0c33-46dd-aa63-6fb24c5279af","name":"Test_Product4","category":"Test","available":30}
    Created product: {"id":"099a8bbb-5faf-466f-a1dd-8ef653282f11","name":"Test_Product5","category":"Test","available":100}
    Created product: {"id":"fc06d280-ee5b-4eed-91b9-e85a52cf6c70","name":"Test_Query","category":"Query","available":2}
    Listing all products...
    [
    {
        "available": 1,
        "updatedAt": "2025-10-02T13:38:42.571Z",
        "category": "Auth",
        "createdAt": "2025-10-02T13:38:42.555Z",
        "price": 100.5,
        "id": "71571208-06c8-490b-b9fb-386789dacc7e",
        "name": "Auth_Test1"
    },
    {
        "available": 5,
        "updatedAt": "2025-10-02T13:38:42.870Z",
        "category": "Auth",
        "createdAt": "2025-10-02T13:38:42.870Z",
        "price": 200,
        "id": "f0b5b8e9-dcf0-41a9-b0ff-e65bfb247524",
        "name": "Auth_Test2"
    },
    {
        "available": 2,
        "updatedAt": "2025-10-02T13:38:44.602Z",
        "category": "Query",
        "createdAt": "2025-10-02T13:38:44.602Z",
        "price": 1000,
        "id": "fc06d280-ee5b-4eed-91b9-e85a52cf6c70",
        "name": "Test_Query"
    },
    {
        "available": 100,
        "updatedAt": "2025-10-02T13:38:44.399Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:44.399Z",
        "price": 500,
        "id": "099a8bbb-5faf-466f-a1dd-8ef653282f11",
        "name": "Test_Product5"
    },
    {
        "available": 30,
        "updatedAt": "2025-10-02T13:38:44.000Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:44.000Z",
        "price": 45.76,
        "id": "2ef7425a-0c33-46dd-aa63-6fb24c5279af",
        "name": "Test_Product4"
    },
    {
        "available": 1,
        "updatedAt": "2025-10-02T13:38:43.093Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.093Z",
        "price": 50.5,
        "id": "31be6a23-b8e5-4bb5-844c-d6674d6db99d",
        "name": "Test_Product1"
    },
    {
        "available": 15,
        "updatedAt": "2025-10-02T13:38:43.517Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.517Z",
        "price": 5.99,
        "id": "b743965d-acaa-441a-998a-802d2cd4e999",
        "name": "Test_Product3"
    },
    {
        "available": 3,
        "updatedAt": "2025-10-02T13:38:43.298Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.298Z",
        "price": 120,
        "id": "dcd5923e-6423-44c3-8cd3-1bc16f8f1b2f",
        "name": "Test_Product2"
    }
    ]

    Listing products in category: Auth
    [
    {
        "available": 1,
        "updatedAt": "2025-10-02T13:38:42.571Z",
        "category": "Auth",
        "createdAt": "2025-10-02T13:38:42.555Z",
        "price": 100.5,
        "id": "71571208-06c8-490b-b9fb-386789dacc7e",
        "name": "Auth_Test1"
    },
    {
        "available": 5,
        "updatedAt": "2025-10-02T13:38:42.870Z",
        "category": "Auth",
        "createdAt": "2025-10-02T13:38:42.870Z",
        "price": 200,
        "id": "f0b5b8e9-dcf0-41a9-b0ff-e65bfb247524",
        "name": "Auth_Test2"
    }
    ]

    Listing products in category: Test
    [
    {
        "available": 100,
        "updatedAt": "2025-10-02T13:38:44.399Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:44.399Z",
        "price": 500,
        "id": "099a8bbb-5faf-466f-a1dd-8ef653282f11",
        "name": "Test_Product5"
    },
    {
        "available": 30,
        "updatedAt": "2025-10-02T13:38:44.000Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:44.000Z",
        "price": 45.76,
        "id": "2ef7425a-0c33-46dd-aa63-6fb24c5279af",
        "name": "Test_Product4"
    },
    {
        "available": 1,
        "updatedAt": "2025-10-02T13:38:43.093Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.093Z",
        "price": 50.5,
        "id": "31be6a23-b8e5-4bb5-844c-d6674d6db99d",
        "name": "Test_Product1"
    },
    {
        "available": 15,
        "updatedAt": "2025-10-02T13:38:43.517Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.517Z",
        "price": 5.99,
        "id": "b743965d-acaa-441a-998a-802d2cd4e999",
        "name": "Test_Product3"
    },
    {
        "available": 3,
        "updatedAt": "2025-10-02T13:38:43.298Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.298Z",
        "price": 120,
        "id": "dcd5923e-6423-44c3-8cd3-1bc16f8f1b2f",
        "name": "Test_Product2"
    }
    ]

    Listing products in category: Query
    [
    {
        "available": 2,
        "updatedAt": "2025-10-02T13:38:44.602Z",
        "category": "Query",
        "createdAt": "2025-10-02T13:38:44.602Z",
        "price": 1000,
        "id": "fc06d280-ee5b-4eed-91b9-e85a52cf6c70",
        "name": "Test_Query"
    }
    ]

    Listing products in category Test with available >= 5
    [
    {
        "available": 100,
        "updatedAt": "2025-10-02T13:38:44.399Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:44.399Z",
        "price": 500,
        "id": "099a8bbb-5faf-466f-a1dd-8ef653282f11",
        "name": "Test_Product5"
    },
    {
        "available": 30,
        "updatedAt": "2025-10-02T13:38:44.000Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:44.000Z",
        "price": 45.76,
        "id": "2ef7425a-0c33-46dd-aa63-6fb24c5279af",
        "name": "Test_Product4"
    },
    {
        "available": 15,
        "updatedAt": "2025-10-02T13:38:43.517Z",
        "category": "Test",
        "createdAt": "2025-10-02T13:38:43.517Z",
        "price": 5.99,
        "id": "b743965d-acaa-441a-998a-802d2cd4e999",
        "name": "Test_Product3"
    }
    ]
    ```

5. Integrate Authorizer into frontend & add filters

    ![Task 3. Frontend](./media/task_3_frontend.png)

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
chmod +x apps/backend/tests/no_auth_test.sh
./apps/backend/tests/no_auth_test.sh
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
