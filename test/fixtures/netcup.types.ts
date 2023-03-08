export type CustomerNumber = string;
export type ApiKey = string;
export type ApiPassword = string;
export type ApiSessionId = string;
export type Domain = `${string}.${string}`;
export type Host = string;

export type LoginResponseBody = {
  serverrequestid: string;
  clientrequestid: string;
  action: string;
  status: string;
  statuscode: number;
  shortmessage: string;
  longmessage: string;
  responsedata: string | { apisessionid: ApiSessionId };
};
