import nock from "nock";

export function mockBytecampUpdate(user: string, pass: string): nock.Scope {
  return nock("https://update.nerdcamp.net")
    .get("/update.cgi")
    .query({
      user,
      pass,
      reqc: 2,
    })
    .reply(200, {});
}
