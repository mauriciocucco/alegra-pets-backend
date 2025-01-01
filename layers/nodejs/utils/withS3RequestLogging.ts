import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { saveRequestBodyToS3 } from "./saveRequestBodyToS3";

export const withS3RequestLogging = (
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>,
  endpointHandler: string
) => {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const bucketName = process.env.REQUESTS_BUCKET_NAME || "";
    const uniqueKey = `requests/${Date.now()}-${endpointHandler}.json`;

    await saveRequestBodyToS3(bucketName, uniqueKey, event.body || "");

    return handler(event);
  };
};
