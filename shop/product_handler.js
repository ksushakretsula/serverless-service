import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.PRODUCTS_TABLE;

export async function createProduct(event) {
  try {
    const body = JSON.parse(event.body);
    const item = {
      id: uuidv4(),
      name: body.name,
      price: body.price,
      category: body.category,
      available: body.available,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}

export async function getProduct(event) {
  const { id } = event.pathParameters;

  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(result.Item),
  };
}

export async function listProducts() {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(result.Items),
  };
}

export async function updateProduct(event) {
  const { id } = event.pathParameters;
  const body = JSON.parse(event.body);

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: "set #n = :n, price = :p, category = :c, available = :a",
    ExpressionAttributeNames: { "#n": "name" },
    ExpressionAttributeValues: {
      ":n": body.name,
      ":p": body.price,
      ":c": body.category,
      ":a": body.available,
    },
    ReturnValues: "ALL_NEW",
  }));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(result.Attributes),
  };
}

export async function deleteProduct(event) {
  const { id } = event.pathParameters;

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  return {
    statusCode: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: "",
  };
}
