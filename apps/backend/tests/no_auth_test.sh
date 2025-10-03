#!/bin/bash
API="https://swbm3u0ur0.execute-api.us-east-1.amazonaws.com/dev/products"

# Create
echo "Creating a new product..."
CREATE=$(curl -s -X POST $API -H "Content-Type: application/json" -d '{"name":"Phone","price":699,"category":"Electronics","available":true}')
CATEGORY=$(echo $CREATE | jq -r '.category')
ID=$(echo $CREATE | jq -r '.id')
echo "Created product with ID: $ID"

# Get
echo "Retrieving the created product..."
curl $API/$CATEGORY/$ID
echo

# Update
echo "Updating the product..."
curl -X PUT $API/$CATEGORY/$ID -H "Content-Type: application/json" -d '{"name":"Smartphone","price":799,"category":"Electronics","available":false}'
echo

# List all
echo "Listing all products..."
curl $API
echo

# Delete
echo "Deleting the product..."
curl -X DELETE $API/$CATEGORY/$ID
