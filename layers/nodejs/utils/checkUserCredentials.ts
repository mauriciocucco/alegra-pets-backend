import { QueryCommand, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { dynamoClient } from "./dbClient";
import { UserItem } from "../interfaces/userItem.interface";

export const checkUserCredentials = async (
  authHeader: string
): Promise<UserItem> => {
  try {
    if (!authHeader.startsWith("Basic ")) {
      throw new Error(
        'Invalid authorization header format. Expected "Basic <token>"'
      );
    }

    const base64Token = authHeader.slice(6).trim();
    const decodedToken = Buffer.from(base64Token, "base64").toString("utf-8");
    const [email, password] = decodedToken.split(":");

    if (!email || !password) {
      throw new Error('Invalid token format. Expected "email:password"');
    }

    const userData: QueryCommandOutput = await dynamoClient.send(
      new QueryCommand({
        TableName: process.env.USERS_TABLE_NAME,
        IndexName: "emailIndex",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": { S: email },
        },
      })
    );

    if (!userData.Items || userData.Items.length === 0) {
      throw new Error(`User not found for email ${email}`);
    }

    const userItem = unmarshall(userData.Items[0]) as UserItem;

    if (userItem.password !== password) {
      throw new Error("Password mismatch");
    }

    return userItem;
  } catch (error) {
    console.error("Error checking credentials: ", error);

    throw new Error("Internal error checking credentials");
  }
};
