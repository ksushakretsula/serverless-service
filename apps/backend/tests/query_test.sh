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

# 2. Populate with test data
echo "Populating test products..."

# Define products as JSON array
PRODUCTS=(
  '{"name": "Auth_Test1", "price": 100.5, "category": "Auth", "available": 1}'
  '{"name": "Auth_Test2", "price": 200.0, "category": "Auth", "available": 5}'
  '{"name": "Test_Product1", "price": 50.5, "category": "Test", "available": 1}'
  '{"name": "Test_Product2", "price": 120.0, "category": "Test", "available": 3}'
  '{"name": "Test_Product3", "price": 5.99, "category": "Test", "available": 15}'
  '{"name": "Test_Product4", "price": 45.76, "category": "Test", "available": 30}'
  '{"name": "Test_Product5", "price": 500.0, "category": "Test", "available": 100}'
  '{"name": "Test_Query", "price": 1000.0, "category": "Query", "available": 2}'
)

for PRODUCT in "${PRODUCTS[@]}"; do
    RESPONSE=$(curl -s -X POST "${API}/products" "${HEADERS[@]}" "${AUTH_HEADER[@]}" -d "$PRODUCT")
    STATUS=$?
    check_error $STATUS "Failed to create product: $PRODUCT"

    ID=$(echo $RESPONSE | jq -r '.id')
    if [ "$ID" == "null" ] || [ -z "$ID" ]; then
        echo "Error: Failed to retrieve product ID after creation"
        echo "$RESPONSE"
        exit 1
    fi
    echo "Created product: $(echo $RESPONSE | jq -c '{id, name, category, available}')"
done

# 3. List all products
echo "Listing all products..."
curl -s $API/products "${AUTH_HEADER[@]}" | jq
echo

# 4. List products filtered by category
CATEGORY="Auth"
echo "Listing products in category: $CATEGORY"
curl -s "$API/products?category=$CATEGORY" "${AUTH_HEADER[@]}" | jq
echo

CATEGORY="Test"
echo "Listing products in category: $CATEGORY"
curl -s "$API/products?category=$CATEGORY" "${AUTH_HEADER[@]}" | jq
echo

CATEGORY="Query"
echo "Listing products in category: $CATEGORY"
curl -s "$API/products?category=$CATEGORY" "${AUTH_HEADER[@]}" | jq
echo

# 5. Filter by availability
CATEGORY="Test"
MIN_AVAILABLE=5
echo "Listing products in category $CATEGORY with available >= $MIN_AVAILABLE"
curl -s "$API/products?category=$CATEGORY&minAvailable=$MIN_AVAILABLE" "${AUTH_HEADER[@]}" | jq
echo
