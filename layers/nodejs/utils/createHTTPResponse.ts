import { HttpResponse } from "../interfaces/http-response.interface";

export const createHTTPResponse = (
  body: any,
  statusCode: number,
  headers?: { [header: string]: string }
): HttpResponse => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
};
