import nock from "nock";

export function mockIonosUpdate(query: string): nock.Scope {
  // unfortunately, nock cannot distinguish between IPv4 and IPv6 invocations,
  // hence the "twice"
  return generateNockQuery(query).twice().reply(200, {});
}

export function mockFailedIonosUpdate(query: string): nock.Scope {
  return generateNockQuery(query).reply(500, {});
}

function generateNockQuery(query: string): nock.Interceptor {
  return nock("https://api.hosting.ionos.com").get("/dns/v1/dyndns").query({
    q: query,
  });
}
