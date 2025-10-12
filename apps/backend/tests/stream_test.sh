#!/bin/bash

API="https://swbm3u0ur0.execute-api.us-east-1.amazonaws.com/dev"
HEADERS=(-H "Content-Type: application/json")

BLUE="\033[1;34m"
NC="\033[0m"

function check_error() {
    if [ $1 -ne 0 ]; then
        echo "Error: $2"
        exit 1
    fi
}

function get_product_stock() {
    local category=$1
    local productId=$2
    curl -s -X GET "${API}/products/${category}/${productId}" "${AUTH_HEADER[@]}" | jq -r '.available'
}

function get_category_item() {
    local category=$1
    curl -s -X GET "${API}/categories/${category}" "${AUTH_HEADER[@]}"
}

function print_category_info() {
    local category=$1
    echo
    echo -e "${BLUE}Checking category aggregate for '$category'...${NC}"
    local CATEGORY_JSON
    CATEGORY_JSON=$(get_category_item "$category")

    if echo "$CATEGORY_JSON" | jq -e '.id' >/dev/null 2>&1; then
        local TOTAL_AVAIL=$(echo "$CATEGORY_JSON" | jq -r '.totalAvailability')
        local PRODUCT_IDS=$(echo "$CATEGORY_JSON" | jq -r '.productIDs | join(", ")')
        echo "Category aggregate found:"
        echo "   totalAvailability: $TOTAL_AVAIL"
        echo "   productIDs: [$PRODUCT_IDS]"
    else
        echo "Category aggregate not found for '$category'"
    fi
}

function delete_product() {
    local category=$1
    local productId=$2
    curl -s -X DELETE "${API}/products/${category}/${productId}" "${HEADERS[@]}" "${AUTH_HEADER[@]}" | jq -r '.message'
}

function check_category() {
    local category=$1
    sleep 2
    echo
    print_category_info "$category"
}

# 1. Get JWT token
echo "Fetching JWT token..."
TOKEN=$(curl -s "${API}/auth/token" "${HEADERS[@]}" | jq -r '.token')
check_error $? "Failed to get token"
AUTH_HEADER=(-H "Authorization: Bearer $TOKEN")

# 2. Populate with test data
echo "Populating test products..."

PRODUCTS=(
  '{"name": "Auth_Test1", "price": 100.5, "category": "Auth", "available": 1}'
  '{"name": "Auth_Test2", "price": 200.0, "category": "Auth", "available": 5}'
  '{"name": "Test_Product1", "price": 50.5, "category": "Test", "available": 1}'
  '{"name": "Test_Product2", "price": 120.0, "category": "Test", "available": 3}'
  '{"name": "Test_Query", "price": 1000.0, "category": "Query", "available": 2}'
)
CATEGORIES=("Auth" "Test" "Query")
PRODUCT_IDS=()

for PRODUCT in "${PRODUCTS[@]}"; do
    RESPONSE=$(curl -s -X POST "${API}/products" "${HEADERS[@]}" "${AUTH_HEADER[@]}" -d "$PRODUCT")
    STATUS=$?
    check_error $STATUS "Failed to create product: $PRODUCT"

    ID=$(echo "$RESPONSE" | jq -r '.id')
    CATEGORY=$(echo "$RESPONSE" | jq -r '.category')
    NAME=$(echo "$RESPONSE" | jq -r '.name')

    if [ "$ID" == "null" ] || [ -z "$ID" ]; then
        echo "Error: Failed to retrieve product ID after creation"
        echo "$RESPONSE"
        exit 1
    fi

    PRODUCT_IDS+=("$ID")
    echo "Created product: name=$NAME id=$ID category=$CATEGORY"
done

for CAT in "${CATEGORIES[@]}"; do
    print_category_info "$CAT"
done

echo
echo "Created product IDs:"
printf '%s\n' "${PRODUCT_IDS[@]}"

# 3. Define test orders
ORDERS=(
  "{\"productId\": \"${PRODUCT_IDS[2]}\", \"category\": \"Test\", \"quantity\": 1}"
  "{\"productId\": \"${PRODUCT_IDS[3]}\", \"category\": \"Test\", \"quantity\": 3}"
)

ORDER_IDS=()
PRODUCT_KEYS=()
ORIGINAL_STOCKS=()

# 4. Record original stock
echo
echo "Recording original stock..."
for ORDER_JSON in "${ORDERS[@]}"; do
    PRODUCT_ID=$(echo $ORDER_JSON | jq -r '.productId')
    CATEGORY=$(echo $ORDER_JSON | jq -r '.category')
    STOCK=$(get_product_stock "$CATEGORY" "$PRODUCT_ID")

    PRODUCT_KEYS+=("${CATEGORY}__${PRODUCT_ID}")
    ORIGINAL_STOCKS+=("$STOCK")
done

# Helper to get original stock
function get_original_stock() {
    local key=$1
    for i in "${!PRODUCT_KEYS[@]}"; do
        if [ "${PRODUCT_KEYS[$i]}" == "$key" ]; then
            echo "${ORIGINAL_STOCKS[$i]}"
            return
        fi
    done
    echo 0
}

# 5. Create orders and check stock changes
echo
echo "Creating orders..."
for ORDER_JSON in "${ORDERS[@]}"; do
    PRODUCT_ID=$(echo $ORDER_JSON | jq -r '.productId')
    CATEGORY=$(echo $ORDER_JSON | jq -r '.category')
    QUANTITY=$(echo $ORDER_JSON | jq -r '.quantity')

    RESPONSE=$(curl -s -X POST "${API}/orders" "${HEADERS[@]}" "${AUTH_HEADER[@]}" -d "$ORDER_JSON")
    check_error $? "Failed to create order: $ORDER_JSON"

    ID=$(echo $RESPONSE | jq -r '.id')
    ORDER_IDS+=($ID)

    # Verify stock decreased
    sleep 2
    NEW_STOCK=$(get_product_stock "$CATEGORY" "$PRODUCT_ID")
    KEY="${CATEGORY}__${PRODUCT_ID}"
    EXPECTED_STOCK=$(get_original_stock "$KEY")
    EXPECTED_STOCK=$((EXPECTED_STOCK - QUANTITY))

    if [ "$NEW_STOCK" -eq "$EXPECTED_STOCK" ]; then
        echo "Stock updated correctly for $CATEGORY:$PRODUCT_ID after create ($NEW_STOCK)"
    else
        echo "ERROR: Stock mismatch for $CATEGORY:$PRODUCT_ID after create. Expected $EXPECTED_STOCK, got $NEW_STOCK"
    fi
done

check_category "Test"

# 6. Update first order quantity (increase by 1)
echo
echo "Updating first order quantity..."
FIRST_ORDER_ID=${ORDER_IDS[0]}
UPDATE_QUANTITY=2

# 6.1 Fetch current order (robust jq that accepts .order.quantity or .quantity)
ORDER_JSON=$(curl -s -X GET "${API}/orders/$FIRST_ORDER_ID" "${AUTH_HEADER[@]}")
check_error $? "Failed to fetch order $FIRST_ORDER_ID before update"

OLD_QUANTITY=$(echo "$ORDER_JSON" | jq -r '(.order.quantity // .quantity // 0)')
PRODUCT_ID=$(echo "$ORDER_JSON" | jq -r '(.order.productId // .productId // "")')
CATEGORY=$(echo "$ORDER_JSON" | jq -r '(.order.category // .category // "")')

if [ -z "$PRODUCT_ID" ] || [ -z "$CATEGORY" ]; then
    echo "ERROR: Couldn't determine productId/category for order $FIRST_ORDER_ID"
    echo "Order JSON: $ORDER_JSON"
    exit 1
fi

# 6.2 Record stock before update
PRE_UPDATE_STOCK=$(get_product_stock "$CATEGORY" "$PRODUCT_ID")
echo "Before update - order quantity: $OLD_QUANTITY, product stock: $PRE_UPDATE_STOCK"

# 6.3 Attempt update and capture HTTP status + body
TMPFILE=$(mktemp)
HTTP_STATUS=$(curl -s -o "$TMPFILE" -w "%{http_code}" -X PUT "${API}/orders/$FIRST_ORDER_ID" "${HEADERS[@]}" "${AUTH_HEADER[@]}" -d "{\"quantity\":$UPDATE_QUANTITY}")
BODY=$(cat "$TMPFILE")
rm -f "$TMPFILE"

# 6.4 Branch on result
if [[ "$HTTP_STATUS" =~ ^2 ]]; then
    # Update succeeded — fetch updated order and verify stock changed accordingly
    echo "Update returned success (HTTP $HTTP_STATUS). Verifying stock change..."
    # Try to extract updated quantity from response body; fallback to GET
    NEW_QUANTITY=$(echo "$BODY" | jq -r '(.order.quantity // .quantity // null)')
    if [ "$NEW_QUANTITY" == "null" ] || [ -z "$NEW_QUANTITY" ]; then
        # fallback to GET
        UPDATED_ORDER_JSON=$(curl -s -X GET "${API}/orders/$FIRST_ORDER_ID" "${AUTH_HEADER[@]}")
        NEW_QUANTITY=$(echo "$UPDATED_ORDER_JSON" | jq -r '(.order.quantity // .quantity // 0)')
    fi

    # expected stock: original stock before any orders - NEW_QUANTITY
    KEY="${CATEGORY}__${PRODUCT_ID}"
    ORIGINAL=$(get_original_stock "$KEY")   # assumes you recorded ORIGINAL earlier
    EXPECTED_STOCK=$((ORIGINAL - NEW_QUANTITY))
    AFTER_STOCK=$(get_product_stock "$CATEGORY" "$PRODUCT_ID")

    if [ "$AFTER_STOCK" -eq "$EXPECTED_STOCK" ]; then
        echo "OK: Stock updated correctly for $CATEGORY:$PRODUCT_ID after update ($AFTER_STOCK)"
    else
        echo "ERROR: Stock mismatch for $CATEGORY:$PRODUCT_ID after update. Expected $EXPECTED_STOCK, got $AFTER_STOCK"
        echo "Response body: $BODY"
    fi
else
    # Update failed (likely due to insufficient stock). Verify nothing changed.
    echo "Update failed as expected (HTTP $HTTP_STATUS). Verifying no changes to order and stock..."
    echo "Update response: $BODY"

    # Check order quantity unchanged
    ORDER_AFTER=$(curl -s -X GET "${API}/orders/$FIRST_ORDER_ID" "${AUTH_HEADER[@]}")
    QUANTITY_AFTER=$(echo "$ORDER_AFTER" | jq -r '(.order.quantity // .quantity // 0)')
    if [ "$QUANTITY_AFTER" -eq "$OLD_QUANTITY" ]; then
        echo "OK: Order quantity unchanged ($QUANTITY_AFTER)"
    else
        echo "ERROR: Order quantity changed unexpectedly. Was $OLD_QUANTITY, now $QUANTITY_AFTER"
        echo "Order after update: $ORDER_AFTER"
    fi

    # Check stock unchanged (should remain PRE_UPDATE_STOCK)
    AFTER_STOCK=$(get_product_stock "$CATEGORY" "$PRODUCT_ID")
    if [ "$AFTER_STOCK" -eq "$PRE_UPDATE_STOCK" ]; then
        echo "OK: Product stock unchanged ($AFTER_STOCK)"
    else
        echo "ERROR: Product stock changed unexpectedly. Was $PRE_UPDATE_STOCK, now $AFTER_STOCK"
    fi
fi

check_category "Test"

# 7. Delete orders and verify stock restored
echo
echo "Deleting orders..."
for i in "${!ORDER_IDS[@]}"; do
    ID=${ORDER_IDS[$i]}
    CATEGORY=$(echo ${ORDERS[$i]} | jq -r '.category')
    PRODUCT_ID=$(echo ${ORDERS[$i]} | jq -r '.productId')
    QUANTITY=$(echo ${ORDERS[$i]} | jq -r '.quantity')

    # If first order was updated, adjust quantity
    if [ "$i" -eq 0 ]; then
        QUANTITY=$UPDATE_QUANTITY
    fi

    RESPONSE=$(curl -s -X DELETE "${API}/orders/$ID" "${HEADERS[@]}" "${AUTH_HEADER[@]}")
    check_error $? "Failed to delete order $ID"

    sleep 2

    # Verify stock restored
    NEW_STOCK=$(get_product_stock "$CATEGORY" "$PRODUCT_ID")
    KEY="${CATEGORY}__${PRODUCT_ID}"
    EXPECTED_STOCK=$(get_original_stock "$KEY")

    if [ "$NEW_STOCK" -eq "$EXPECTED_STOCK" ]; then
        echo "Stock restored correctly for $CATEGORY:$PRODUCT_ID after delete ($NEW_STOCK)"
    else
        echo "ERROR: Stock mismatch for $CATEGORY:$PRODUCT_ID after delete. Expected $EXPECTED_STOCK, got $NEW_STOCK"
    fi
done

check_category "Test"

# 8. Delete 2 products from different categories
echo
echo "Deleting 2 products from different categories..."

# Pick first product from 'Test' and first from 'Query' for example
PRODUCTS_TO_DELETE=(
    "${PRODUCT_IDS[2]}__Test"   # Test_Product1
    "${PRODUCT_IDS[4]}__Query"  # Test_Query
)

for ITEM in "${PRODUCTS_TO_DELETE[@]}"; do
    PRODUCT_ID=${ITEM%%__*}
    CATEGORY=${ITEM##*__}

    echo -e "Deleting product $PRODUCT_ID from category $CATEGORY..."
    delete_product "$CATEGORY" "$PRODUCT_ID"

    sleep 2

    # Verify product deletion
    RESPONSE=$(curl -s -X GET "${API}/products/${CATEGORY}/${PRODUCT_ID}" "${AUTH_HEADER[@]}")
    if [[ "$RESPONSE" != *"not found"* ]]; then
        echo -e "ERROR: Product $PRODUCT_ID still exists!"
        echo "$RESPONSE"
    fi
done

echo
echo "Final category aggregates:"
for CAT in "${CATEGORIES[@]}"; do
    print_category_info "$CAT"
done
