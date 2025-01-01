export interface HttpResponse {
  statusCode: number;
  body: string;
  headers?: {
    [header: string]: string;
  };
}
