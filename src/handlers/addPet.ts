import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  PutItemCommand,
  GetItemCommand,
  GetItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { ulid } from "../../layers/nodejs/node_modules/ulidx";
import { dynamoClient } from "../../layers/nodejs/utils/dbClient";
import { withS3RequestLogging } from "../../layers/nodejs/utils/withS3RequestLogging";
import { createHTTPResponse } from "../../layers/nodejs/utils/createHTTPResponse";

export const addPetHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const petId = ulid();
    const tableName = process.env.PETS_TABLE_NAME!;
    const status = body.status ?? "adoptable";
    const breed = body.breed ?? "unknown";
    const foundationId = body.foundationId;
    const userFoundationId =
      event.requestContext?.authorizer?.lambda?.userFoundationId;

    if (!foundationId) {
      return createHTTPResponse({ message: "foundationId is required" }, 400);
    }

    if (userFoundationId !== foundationId) {
      return createHTTPResponse({ message: "Unauthorized" }, 403);
    }

    console.log("Adding new pet:", body);

    const getFoundationParams = {
      TableName: process.env.FOUNDATIONS_TABLE_NAME!,
      Key: {
        foundationId: { S: foundationId },
      },
    };

    const foundationResult: GetItemCommandOutput = await dynamoClient.send(
      new GetItemCommand(getFoundationParams)
    );

    console.log("Foundation result:", foundationResult);

    if (!foundationResult.Item) {
      return createHTTPResponse({ message: "Foundation not found." }, 404);
    }

    const addPetParams = {
      TableName: tableName,
      Item: {
        petId: { S: petId },
        name: { S: body.name },
        breed: { S: breed },
        status: { S: status },
        type: { S: body.type },
        createdAt: { S: new Date().toISOString() },
        foundationId: { S: foundationId },
      },
    };

    await dynamoClient.send(new PutItemCommand(addPetParams));

    return createHTTPResponse(
      { petId, message: "Pet added successfully." },
      201
    );
  } catch (error) {
    console.error("Error adding pet:", error);

    return createHTTPResponse({ message: "Internal error." }, 500);
  }
};

export const handler = withS3RequestLogging(addPetHandler, "addPet");
