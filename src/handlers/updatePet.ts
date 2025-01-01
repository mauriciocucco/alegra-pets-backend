import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  UpdateItemCommand,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { dynamoClient } from "../../layers/nodejs/utils/dbClient";
import { notifyIfPetIsAdopted } from "../../layers/nodejs/utils/notifyIfPetIsAdopted";
import { withS3RequestLogging } from "../../layers/nodejs/utils/withS3RequestLogging";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { createHTTPResponse } from "../../layers/nodejs/utils/createHTTPResponse";

export const updatePetHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const petId = event.pathParameters?.petId;

    if (!petId) {
      return createHTTPResponse({ message: "petId is required" }, 400);
    }

    const body = JSON.parse(event.body || "{}");
    const updateExpressionParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};
    let { name, type, breed, status } = body;

    if (name) {
      updateExpressionParts.push("#name = :name");
      expressionNames["#name"] = "name";
      expressionValues[":name"] = { S: name };
    }

    if (type) {
      updateExpressionParts.push("#type = :type");
      expressionNames["#type"] = "type";
      expressionValues[":type"] = { S: type };
    }

    if (breed) {
      updateExpressionParts.push("#breed = :breed");
      expressionNames["#breed"] = "breed";
      expressionValues[":breed"] = { S: breed };
    }

    if (status) {
      updateExpressionParts.push("#status = :status");
      expressionNames["#status"] = "status";
      expressionValues[":status"] = { S: status };
    }

    if (!updateExpressionParts.length) {
      return createHTTPResponse({ message: "No fields to update" }, 400);
    }

    const params = {
      TableName: process.env.PETS_TABLE_NAME!,
      Key: { petId: { S: petId } },
      UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW",
    };

    const updateResult: UpdateItemCommandOutput = await dynamoClient.send(
      new UpdateItemCommand(params)
    );

    console.log("Update result: ", updateResult);

    // Notifico si el estado de la mascota es adoptado luego de la actualización
    if (status) await notifyIfPetIsAdopted(petId, status);

    const bodyResponse = {
      message: "Pet updated",
      updated: unmarshall(updateResult.Attributes),
    };

    return createHTTPResponse(bodyResponse, 200);
  } catch (error) {
    console.error("Error updating pet:", error);

    return createHTTPResponse({ message: "Internal server error." }, 500);
  }
};

export const handler = withS3RequestLogging(updatePetHandler, "updatePet");
