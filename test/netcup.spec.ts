import nock from "nock";
import sinon from "sinon";
import {
  addLoginSuccessInteraction,
  addLoginFailedInteraction,
  addFetchExistingHostInteraction,
  addUpdateRecordsInteraction,
  makeDnsRecord,
  ApiContext,
} from "./fixtures/netcup.fixture";

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import { NetcupUpdater, UpdateConfig } from "../src/updaters";
import {
  ApiKey,
  ApiPassword,
  ApiSessionId,
  CustomerNumber,
  Domain,
  Host,
} from "./fixtures/netcup.types";

describe("Netcup DNS API", async function () {
  this.slow(500);

  let sandbox: sinon.SinonSandbox;
  let scope: nock.Scope;

  const customerNumber: CustomerNumber = "123456";
  const apiKey: ApiKey = "API_KEY";
  const validApiPassword: ApiPassword = "VALID_API_PASSWORD";
  const validSessionId: ApiSessionId = "VALID_SESSION_ID";
  const dummyEnvConfig: Record<string, string> = {
    NETCUP_CUSTOMER_NUMBER: customerNumber,
    NETCUP_API_KEY: apiKey,
    NETCUP_API_PASSWORD: validApiPassword,
  };

  const domain: Domain = "FAKE.DOMAIN";
  const atHostname: Host = "@";
  const wwwHostname: Host = "www";
  const ip4addr = "1.2.3.4";
  const ip6addr = "1::1";
  const dummyUpdateConfig: UpdateConfig = {
    domain,
    hostname: atHostname,
    ip4addr,
    ip6addr,
  };

  const context: ApiContext = {
    apiKey,
    customerNumber,
    domain,
    validApiPassword,
    validSessionId,
  };

  before(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.reset();
  });

  after(function () {
    sandbox.restore();
  });

  describe("Verify Configuration (init)", function () {
    it("Throws on missing customer number", async function () {
      const invalidConfig = { ...dummyEnvConfig };
      delete invalidConfig["NETCUP_CUSTOMER_NUMBER"];
      sinon.stub(process, "env").value(invalidConfig);
      const updater = new NetcupUpdater();

      expect(updater.init).to.throw(
        Error,
        'Required environment variable "NETCUP_CUSTOMER_NUMBER" not found'
      );
    });

    it("Throws on missing api key", async function () {
      const invalidConfig = { ...dummyEnvConfig };
      delete invalidConfig["NETCUP_API_KEY"];
      sinon.stub(process, "env").value(invalidConfig);
      const updater = new NetcupUpdater();

      expect(updater.init).to.throw(
        Error,
        'Required environment variable "NETCUP_API_KEY" not found'
      );
    });

    it("Throws on missing api password", async function () {
      const invalidConfig = { ...dummyEnvConfig };
      delete invalidConfig["NETCUP_API_PASSWORD"];
      sinon.stub(process, "env").value(invalidConfig);
      const updater = new NetcupUpdater();

      expect(updater.init).to.throw(
        Error,
        'Required environment variable "NETCUP_API_PASSWORD" not found'
      );
    });

    it("returns void on complete config", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      const updater = new NetcupUpdater();

      expect(updater.init).to.not.throw;
    });
  });

  describe("Update", function () {
    before(function () {
      scope = nock("https://ccp.netcup.net:443", {
        encodedQueryParams: true,
      });
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it("updates the A and AAAA record of the @ pointer", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", atHostname, "IP6_OLD")
      );
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, ip4addr),
        makeDnsRecord("AAAA", atHostname, ip6addr)
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(updater.update(dummyUpdateConfig)).to.eventually.be.equal(
        "DNS Records for this zone were updated."
      );

      scope.done();
    });

    it("updates only the A record of the @ pointer", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", atHostname, "IP6_OLD")
      );
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, ip4addr),
        makeDnsRecord("AAAA", atHostname, "IP6_OLD")
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(
        updater.update({ ...dummyUpdateConfig, ip6addr: undefined })
      ).to.eventually.be.equal("DNS Records for this zone were updated.");

      scope.done();
    });

    it("updates only the AAAA record of the @ pointer", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", atHostname, "IP6_OLD")
      );
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", atHostname, ip6addr)
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(
        updater.update({ ...dummyUpdateConfig, ip4addr: undefined })
      ).to.eventually.be.equal("DNS Records for this zone were updated.");

      scope.done();
    });

    it("updates the A and AAAA record of a given host", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(
        scope,
        context,
        makeDnsRecord("A", wwwHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", wwwHostname, "IP6_OLD")
      );
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", wwwHostname, ip4addr),
        makeDnsRecord("AAAA", wwwHostname, ip6addr)
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(
        updater.update({ ...dummyUpdateConfig, hostname: wwwHostname })
      ).to.eventually.be.equal("DNS Records for this zone were updated.");

      scope.done();
    });

    it("leaves unrelated records unchanged", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", atHostname, "IP6_OLD"),
        makeDnsRecord("A", wwwHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", wwwHostname, "IP6_OLD")
      );
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, ip4addr),
        makeDnsRecord("AAAA", atHostname, ip6addr),
        makeDnsRecord("A", wwwHostname, "IP4_OLD"),
        makeDnsRecord("AAAA", wwwHostname, "IP6_OLD")
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(updater.update(dummyUpdateConfig)).to.eventually.be.equal(
        "DNS Records for this zone were updated."
      );

      scope.done();
    });

    it("fails on invalid credentials", function () {
      const invalidConfig = {
        ...dummyEnvConfig,
        NETCUP_API_PASSWORD: "invalidApiPassword",
      };
      sinon.stub(process, "env").value(invalidConfig);
      addLoginFailedInteraction(scope, context);

      const updater = new NetcupUpdater();
      updater.init();

      return expect(
        updater.update(dummyUpdateConfig)
      ).to.eventually.be.rejectedWith(Error, "The login to the API failed.");
    });
  });

  describe("Creates missing records", function () {
    before(function () {
      scope = nock("https://ccp.netcup.net:443", {
        encodedQueryParams: true,
      });
    });

    afterEach(function () {
      nock.cleanAll();
    });

    it("creates missing A record for @ host", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(scope, context);
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, ip4addr)
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(
        updater.update({ ...dummyUpdateConfig, ip6addr: undefined })
      ).to.eventually.be.equal("DNS Records for this zone were updated.");

      scope.done();
    });

    it("creates missing AAAA record for @ host", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(scope, context);
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("AAAA", atHostname, ip6addr)
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(
        updater.update({ ...dummyUpdateConfig, ip4addr: undefined })
      ).to.eventually.be.equal("DNS Records for this zone were updated.");

      scope.done();
    });

    it("creates missing A and AAAA records for @ host", async function () {
      sinon.stub(process, "env").value(dummyEnvConfig);
      addLoginSuccessInteraction(scope, context);
      addFetchExistingHostInteraction(scope, context);
      addUpdateRecordsInteraction(
        scope,
        context,
        makeDnsRecord("A", atHostname, ip4addr),
        makeDnsRecord("AAAA", atHostname, ip6addr)
      );

      const updater = new NetcupUpdater();
      updater.init();

      await expect(updater.update(dummyUpdateConfig)).to.eventually.be.equal(
        "DNS Records for this zone were updated."
      );

      scope.done();
    });
  });
});
