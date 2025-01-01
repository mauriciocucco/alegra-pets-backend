import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { dynamoClient } from "../../layers/nodejs/utils/dbClient";
import { createHTTPResponse } from "../../layers/nodejs/utils/createHTTPResponse";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const foundationId = event.pathParameters?.foundationId;

    if (!foundationId) {
      return createHTTPResponse({ message: "foundationId is required" }, 400);
    }

    const { type, breed, name } = event.queryStringParameters || {};
    const expressionValues: Record<string, any> = {
      ":foundationId": foundationId,
    };
    const expressionNames: Record<string, string> = {};
    let indexName: string | undefined = undefined;
    let keyConditionExpression: string = "foundationId = :foundationId";

    if (breed) {
      indexName = "FoundationBreedIndex";
      keyConditionExpression += " AND #breed = :breed";
      expressionValues[":breed"] = breed;
      expressionNames["#breed"] = "breed";
    }

    if (type) {
      indexName = "FoundationTypeIndex";
      keyConditionExpression += " AND #type = :type";
      expressionValues[":type"] = type;
      expressionNames["#type"] = "type";
    }

    if (name) {
      indexName = "FoundationNameIndex";
      keyConditionExpression += " AND #name = :name";
      expressionValues[":name"] = name;
      expressionNames["#name"] = "name";
    }

    const marshalledExpressionValues = marshall(expressionValues);
    let pets: any[] = [];

    if (indexName) {
      const queryParams: QueryCommandInput = {
        TableName: process.env.PETS_TABLE_NAME!,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: marshalledExpressionValues,
        ExpressionAttributeNames: Object.keys(expressionNames).length
          ? expressionNames
          : undefined,
      };
      const queryResult: QueryCommandOutput = await dynamoClient.send(
        new QueryCommand(queryParams)
      );

      pets = queryResult.Items?.map((item) => unmarshall(item)) || [];
    } else {
      const scanParams: ScanCommandInput = {
        TableName: process.env.PETS_TABLE_NAME!,
        FilterExpression: "foundationId = :foundationId",
        ExpressionAttributeValues: marshall({ ":foundationId": foundationId }),
      };
      const scanResult: ScanCommandOutput = await dynamoClient.send(
        new ScanCommand(scanParams)
      );

      pets = scanResult.Items?.map((item) => unmarshall(item)) || [];
    }

    console.log("Pets founded: ", pets);

    return createHTTPResponse(pets, 200);
  } catch (error) {
    console.error("Error listing pets:", error);

    return createHTTPResponse({ message: "Internal error." }, 500);
  }
};
