import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { dynamoClient } from "./dbClient";
import { PetItem } from "../interfaces/petItem.interface";

export async function verifyFoundationAccess(
  path: string,
  userFoundationId: string | undefined
): Promise<void> {
  if (!userFoundationId) {
    throw new Error("User foundation ID not found.");
  }

  // Si el path es /foundations/{foundationId}/pets
  const matchFoundations = path.match(/^\/foundations\/([^/]+)\/pets/);

  if (matchFoundations) {
    const [, foundationId] = matchFoundations;

    if (foundationId !== userFoundationId) {
      throw new Error("Foundation ID does not match user's foundation.");
    }

    return;
  }

  // Si el path es /pets/{petId}
  const matchPets = path.match(/^\/pets\/([^/]+)/);

  if (matchPets) {
    const [, petId] = matchPets;
    const petResult = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.PETS_TABLE_NAME!,
        Key: { petId: { S: petId } },
      })
    );

    if (!petResult.Item) {
      throw new Error(`Pet with ID ${petId} not found.`);
    }

    const petItem = unmarshall(petResult.Item) as PetItem;

    if (!petItem.foundationId) {
      throw new Error("Pet's foundation ID not found.");
    }

    if (petItem.foundationId !== userFoundationId) {
      throw new Error("Pet's foundation ID does not match user's foundation.");
    }

    return;
  }

  return;
}
