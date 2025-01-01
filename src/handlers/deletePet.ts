import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../layers/nodejs/utils/dbClient";
import { createHTTPResponse } from "../../layers/nodejs/utils/createHTTPResponse";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const petId = event.pathParameters?.petId;

    if (!petId) {
      return createHTTPResponse({ message: "petId is required" }, 400);
    }

    const params = {
      TableName: process.env.PETS_TABLE_NAME!,
      Key: {
        petId: { S: petId },
      },
      ConditionExpression: "attribute_exists(petId)",
    };

    await dynamoClient.send(new DeleteItemCommand(params));

    return createHTTPResponse({ message: "Pet deleted successfully." }, 200);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return createHTTPResponse({ message: "Pet not found." }, 404);
    }

    console.error("Error deleting pet:", error);

    return createHTTPResponse({ message: "Internal server error." }, 500);
  }
};
