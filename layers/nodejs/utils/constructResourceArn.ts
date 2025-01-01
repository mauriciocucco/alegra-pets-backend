import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";

export const constructResourceArn = (
  event: APIGatewayRequestAuthorizerEvent
): string => {
  const region = process.env.AWS_REGION || "us-east-1";
  const accountId = event.requestContext.accountId || "";
  const apiId = event.requestContext.apiId || "";
  const stage = event.requestContext.stage || "";
  const method = event.requestContext.http?.method || "";
  const path = event.requestContext.http?.path || "";
  const constructedArn = `arn:aws:execute-api:${region}:${accountId}:${apiId}/${stage}/${method}${path}`;

  return event.requestContext.routeArn || constructedArn;
};
