import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../layers/nodejs/utils/dbClient";
import { ulid } from "../../layers/nodejs/node_modules/ulidx";
import { withS3RequestLogging } from "../../layers/nodejs/utils/withS3RequestLogging";
import { createHTTPResponse } from "../../layers/nodejs/utils/createHTTPResponse";

export const createFoundationHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const foundationId = ulid();
    const tableName = process.env.FOUNDATIONS_TABLE_NAME!;

    console.log("Creating new foundation: ", body);

    // Insertar en Dynamo
    const params = {
      TableName: tableName,
      Item: {
        foundationId: { S: foundationId },
        name: { S: body.name },
        createdAt: { S: new Date().toISOString() },
      },
    };

    await dynamoClient.send(new PutItemCommand(params));

    const bodyResponse = {
      foundationId,
      message: "Foundation created successfully.",
    };

    return createHTTPResponse(bodyResponse, 201);
  } catch (error) {
    console.error("Error creating foundation: ", error);

    return createHTTPResponse({ message: "Internal server error." }, 500);
  }
};

export const handler = withS3RequestLogging(
  createFoundationHandler,
  "createFoundation"
);
