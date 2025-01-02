import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { checkUserCredentials } from "../../layers/nodejs/utils/checkUserCredentials";
import { buildIAMPolicy } from "../../layers/nodejs/utils/buildIAMPolicy";
import { verifyFoundationAccess } from "../../layers/nodejs/utils/verifyFoundationAccess";
import { constructResourceArn } from "../../layers/nodejs/utils/constructResourceArn";

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const resourceArn = constructResourceArn(event);

  console.log("Authorizer event: ", event);

  try {
    const authHeader = event.headers?.authorization || "";

    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Chequea si el usuario existe y si las credenciales son correctas
    const user = await checkUserCredentials(authHeader);
    const userFoundationId = user?.foundationId || "";

    if (!userFoundationId) {
      throw new Error("User has no foundationId");
    }

    // Chequea también si el usuario tiene acceso a la fundación correspondiente
    const path = event.requestContext.http?.path || "";

    await verifyFoundationAccess(path, userFoundationId);

    return buildIAMPolicy(user.email, "Allow", resourceArn, {
      userFoundationId,
    });
  } catch (error) {
    console.error("Authorizer error: ", error);

    return buildIAMPolicy("anonymous", "Deny", resourceArn);
  }
};
