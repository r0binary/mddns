import bodyParser from "body-parser";
import chai, { expect } from "chai";
import express from "express";
import nock from "nock";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import request from "supertest";
import update, { UpdateQuery } from "../src/routes/update/index.js";
import { mockBytecampUpdate } from "./fixtures/bytecamp.fixture.js";
import { mockNetcupUpdate } from "./fixtures/netcup.fixture.js";

chai.use(sinonChai);

describe("mDDNS Integration", function () {
  // environment variables
  const dummyEnv = {
    BYTECAMP_USER: "dummyUser",
    BYTECAMP_PASS: "dummyPass",
    NETCUP_CUSTOMER_NUMBER: "customerNumber",
    NETCUP_API_KEY: "apiKey",
    NETCUP_API_PASSWORD: "validApiPassword",
  };

  // query variables
  const updateQuery: Required<UpdateQuery> = {
    domain: "FAKE.DOMAIN",
    hostname: "@", // represents entry for the whole domain
    ip4addr: "1.2.3.4",
    ip6addr: "1::1",
  };

  // --------- Test fixture --------------

  let sandbox: sinon.SinonSandbox;
  let consoleInfoStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let netcupScope: nock.Scope;
  let bytecampScope: nock.Scope;

  before(function () {
    sandbox = sinon.createSandbox();
    sandbox.stub(process, "env").value(dummyEnv);
    consoleInfoStub = sandbox.stub(console, "info");
    consoleErrorStub = sandbox.stub(console, "error");

    bytecampScope = mockBytecampUpdate(
      dummyEnv.BYTECAMP_USER,
      dummyEnv.BYTECAMP_PASS
    );

    netcupScope = mockNetcupUpdate(
      {
        apiKey: dummyEnv.NETCUP_API_KEY,
        customerNumber: dummyEnv.NETCUP_CUSTOMER_NUMBER,
        validApiPassword: dummyEnv.NETCUP_API_PASSWORD,
        validSessionId: "valid-dummy-session",
        domain: updateQuery.domain,
      },
      updateQuery.hostname,
      updateQuery.ip4addr,
      updateQuery.ip6addr
    );
  });

  after(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  it("updates Bytecamp and Netcup", async function () {
    const app = express();
    app.use(bodyParser.json());
    app.get("/update", update);

    // Update request
    await request(app).get("/update").query(updateQuery);

    // Assert all expected HTTP requests have been made
    expect(bytecampScope.isDone()).to.be.true;
    expect(netcupScope.isDone()).to.be.true;

    // Assert the update status was printed
    expect(consoleInfoStub).to.be.calledWithExactly(
      "BytecampUpdater: ✅ success"
    );
    expect(consoleInfoStub).to.be.calledWithExactly(
      "NetcupUpdater: ✅ success"
    );

    // Assert no unexpected errors
    expect(consoleErrorStub).not.to.be.called;
  });
});
