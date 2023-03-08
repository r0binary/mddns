import { DnsRecord } from "netcup-node";
import nock from "nock";
import {
  ApiKey,
  ApiPassword,
  ApiSessionId,
  CustomerNumber,
  Domain,
  LoginResponseBody,
} from "./netcup.types.js";

export function mockNetcupUpdate(
  context: ApiContext,
  hostname: string,
  ip4addr: string,
  ip6addr: string
): nock.Scope {
  const scope = nock("https://ccp.netcup.net:443", {
    encodedQueryParams: true,
  });
  addLoginSuccessInteraction(scope, context);
  addFetchExistingHostInteraction(
    scope,
    context,
    makeDnsRecord("A", hostname, "IP4_OLD"),
    makeDnsRecord("AAAA", hostname, "IP6_OLD")
  );
  addUpdateRecordsInteraction(
    scope,
    context,
    makeDnsRecord("A", hostname, ip4addr),
    makeDnsRecord("AAAA", hostname, ip6addr)
  );
  return scope;
}

export function addLoginFailedInteraction(
  scope: nock.Scope,
  { customerNumber, apiKey, validApiPassword }: ApiContext
): nock.Scope {
  const loginFailedResponseBody: LoginResponseBody = {
    serverrequestid: "request_id",
    clientrequestid: "",
    action: "login",
    status: "error",
    statuscode: 4011,
    shortmessage: "login failed",
    longmessage: "The login to the API failed.",
    responsedata: "",
  };

  return scope
    .persist()
    .post(
      "/run/webservice/servers/endpoint.php",
      ({ action, param }: any) =>
        action === "login" &&
        param.customernumber === customerNumber &&
        param.apikey === apiKey &&
        param.apipassword !== validApiPassword
    )
    .query({ JSON: "" })
    .reply(
      200,
      loginFailedResponseBody,
      getResponseHeaders(loginFailedResponseBody)
    );
}

export function addLoginSuccessInteraction(
  scope: nock.Scope,
  { customerNumber, apiKey, validSessionId, validApiPassword }: ApiContext
): nock.Scope {
  const loginSuccessResponseBody: LoginResponseBody = {
    serverrequestid: "request_id",
    clientrequestid: "",
    action: "login",
    status: "success",
    statuscode: 2000,
    shortmessage: "Login successful",
    longmessage: "Session has been created successful.",
    responsedata: {
      apisessionid: validSessionId,
    },
  };

  return scope
    .persist()
    .post(
      "/run/webservice/servers/endpoint.php",
      ({ action, param }: any) =>
        action === "login" &&
        param.customernumber === customerNumber &&
        param.apikey === apiKey &&
        param.apipassword === validApiPassword
    )
    .query({ JSON: "" })
    .reply(
      200,
      loginSuccessResponseBody,
      getResponseHeaders(loginSuccessResponseBody)
    );
}

export function addFetchExistingHostInteraction(
  scope: nock.Scope,
  { customerNumber, apiKey, validSessionId, domain }: ApiContext,
  ...records: DnsRecord[]
): nock.Scope {
  const infoResponseBody = {
    serverrequestid: "G0Z=G1sWR5MrFEdop",
    clientrequestid: "",
    action: "infoDnsRecords",
    status: "success",
    statuscode: 2000,
    shortmessage: "DNS records found",
    longmessage: "DNS Records for this zone were found.",
    responsedata: {
      dnsrecords: records,
    },
  };

  return scope
    .persist()
    .post(
      "/run/webservice/servers/endpoint.php",
      ({ action, param }: any) =>
        action === "infoDnsRecords" &&
        param.customernumber === customerNumber &&
        param.apikey === apiKey &&
        param.apisessionid === validSessionId &&
        param.domainname === domain
    )
    .query({ JSON: "" })
    .reply(200, infoResponseBody);
}

export function addFetchMissingHostInteraction(
  scope: nock.Scope,
  { customerNumber, apiKey, validSessionId, domain }: ApiContext
): nock.Scope {
  return scope
    .persist()
    .post(
      "/run/webservice/servers/endpoint.php",
      ({ action, param }: any) =>
        action === "infoDnsRecords" &&
        param.customernumber === customerNumber &&
        param.apikey === apiKey &&
        param.apisessionid === validSessionId &&
        param.domainname === domain
    )
    .query({ JSON: "" })
    .reply(200, {
      serverrequestid: "G0Z=G1sWR5MrFEdop",
      clientrequestid: "",
      action: "infoDnsRecords",
      status: "success",
      statuscode: 2000,
      shortmessage: "DNS records found",
      longmessage: "DNS Records for this zone were found.",
      responsedata: {
        dnsrecords: [],
      },
    });
}

export function addUpdateRecordsInteraction(
  scope: nock.Scope,
  { customerNumber, apiKey, validSessionId, domain }: ApiContext,
  ...expectedDnsRecords: DnsRecord[]
): nock.Scope {
  return scope
    .persist()
    .post("/run/webservice/servers/endpoint.php", ({ action, param }: any) => {
      for (const e of expectedDnsRecords) {
        if (
          !param.dnsrecordset?.dnsrecords.find(
            (r: DnsRecord) =>
              r.type === e.type &&
              r.hostname === e.hostname &&
              r.destination === e.destination
          )
        ) {
          return false;
        }
      }
      return (
        action === "updateDnsRecords" &&
        param.customernumber === customerNumber &&
        param.apikey === apiKey &&
        param.apisessionid === validSessionId &&
        param.domainname === domain
      );
    })
    .query({ JSON: "" })
    .reply(200, (_uri, body) => {
      return {
        serverrequestid: "G0Z=G1sWR5MrFEdop",
        clientrequestid: "",
        action: "updateDnsRecords",
        status: "success",
        statuscode: 2000,
        shortmessage: "DNS records updated",
        longmessage: "DNS Records for this zone were updated.",
        responsedata: (body as any).param.dnsrecordset,
      };
    });
}

export function makeDnsRecord(
  type: string,
  hostname: string,
  destination: string
): DnsRecord {
  return {
    id: "51708779",
    hostname,
    type,
    priority: "0",
    destination,
    deleterecord: false,
    state: "yes",
  };
}

// Add test
export function mockUnreachableNetcup() {
  nock("https://ccp.netcup.net")
    .persist()
    .post("/run/webservice/servers/endpoint.php")
    .query({ JSON: "" })
    .replyWithError(Error("ETIMEDOUT"));
}

function getResponseHeaders(body: Record<string, any>) {
  return {
    date: "Fri, 27 Jan 2023 19:18:07 GMT",
    "content-type": "application/json",
    "content-length": JSON.stringify(body).length.toString(),
    connection: "close",
    expires: "Tue, 03 Jul 2001 06:00:00 GMT",
    "last-modified": "Fri, 27 Jan 2023 19:18:07 GMT",
    "cache-control":
      "no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0",
    pragma: "no-cache",
    vary: "Accept-Encoding,User-Agent",
    "x-robots-tag": "noindex",
    "content-security-policy": "frame-ancestors 'self';",
    "x-xss-protection": "1; mode=block",
    "x-frame-options": "SAMEORIGIN",
    "x-content-type-options": "nosniff",
  };
}

export type ApiContext = {
  customerNumber: CustomerNumber;
  apiKey: ApiKey;
  validSessionId: ApiSessionId;
  validApiPassword: ApiPassword;
  domain: Domain;
};
