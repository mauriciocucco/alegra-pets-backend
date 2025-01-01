import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const topicArn = process.env.PET_HAPPY_TOPIC_ARN;
const adoptedStatus = "happy";

export const notifyIfPetIsAdopted = async (
  petId: string,
  newStatus: string
) => {
  if (newStatus !== adoptedStatus) return;

  if (!topicArn) {
    console.error("PET_HAPPY_TOPIC_ARN not set");

    return;
  }

  try {
    const message = `Pet with ID ${petId} is now adopted!`;

    await snsClient.send(
      new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        Subject: "PetAdopted",
      })
    );

    console.log(`Notification sent for pet ID: ${petId}`);
  } catch (error) {
    console.error("Error sending notification:", error);

    return;
  }
};
