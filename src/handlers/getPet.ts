import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetItemCommand, GetItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
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
      Key: { petId: { S: petId } },
    };

    const result: GetItemCommandOutput = await dynamoClient.send(
      new GetItemCommand(params)
    );

    if (!result.Item) {
      return createHTTPResponse({ message: "Pet not found" }, 404);
    }

    const pet = unmarshall(result.Item);

    return createHTTPResponse(pet, 200);
  } catch (error) {
    console.error("Error getting pet:", error);

    return createHTTPResponse({ message: "Internal server error." }, 500);
  }
};
