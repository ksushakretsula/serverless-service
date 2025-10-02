#!/bin/bash

API="https://swbm3u0ur0.execute-api.us-east-1.amazonaws.com/dev"
HEADERS=(-H "Content-Type: application/json")

function check_error() {
    if [ $1 -ne 0 ]; then
        echo "Error: $2"
        exit 1
    fi
}

# 1. Get JWT token
echo "Fetching JWT token..."
TOKEN=$(curl -s "${API}/auth/token" "${HEADERS[@]}" | jq -r '.token')
check_error $? "Failed to get token"

echo "Using token: $TOKEN"
AUTH_HEADER=(-H "Authorization: Bearer $TOKEN")

# 2. Create a new product
echo "Creating a new product..."
CREATE=$(curl -s -X POST "${API}/products" "${HEADERS[@]}" "${AUTH_HEADER[@]}" \
    -d '{"name": "Auth_Test", "price": 299.5, "category": "Auth", "available": 10}')
check_error $? "Failed to create product"

ID=$(echo $CREATE | jq -r '.id')
if [ "$ID" == "null" ] || [ -z "$ID" ]; then
    echo "Error: Failed to retrieve product ID after creation"
    echo "$CREATE"
    exit 1
fi
echo "Created product with ID: $ID"

# 3. Retrieve the product
echo "Retrieving the created product..."
curl -s "${API}/products/$ID" "${HEADERS[@]}" | jq
echo

# 4. Update the product
echo "Updating the product..."
curl -s -X PUT "${API}/products/$ID" "${HEADERS[@]}" "${AUTH_HEADER[@]}" \
    -d '{"name": "Auth_Test new", "price": 15, "category": "Auth updated", "available": 5}' | jq
echo

# 5. List all products
echo "Listing all products..."
curl -s "${API}/products" "${HEADERS[@]}" | jq
echo

# 6. Delete the product
echo "Deleting the product..."
curl -s -X DELETE "${API}/products/$ID" "${HEADERS[@]}" "${AUTH_HEADER[@]}" | jq
echo "Product deleted."
