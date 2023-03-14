import nock from "nock";
import sinon from "sinon";
import { expect } from "chai";
import { IonosUpdater } from "../src/updaters/IonosUpdater.js";
import {
  mockIonosUpdate,
  mockFailedIonosUpdate,
} from "./fixtures/ionos.fixture.js";

describe("Ionos Updater", async function () {
  const dummyApiKey =
    "dummyKey21892734897384597985436798534769854zhgjkwldhgf348975hg874905hg487hiudfhbgiqwhbe678fb43nw";
  let sandbox: sinon.SinonSandbox;

  before(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.reset();
  });

  after(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  it("throws on missing API key", async function () {
    sandbox.stub(process, "env").value({});

    const updater = new IonosUpdater();

    expect(updater.init).to.throw(
      Error,
      'Required environment variable "IONOS_API_KEY" not found'
    );
  });

  describe("HTTP request", async function () {
    let updater: IonosUpdater;

    beforeEach(function () {
      sandbox.stub(process, "env").value({
        IONOS_API_KEY: dummyApiKey,
      });

      updater = new IonosUpdater();
      updater.init();
    });

    it("calls update endpoint with correct credentials", async function () {
      const scope = mockIonosUpdate(dummyApiKey);

      await updater.update();

      expect(scope.isDone()).to.be.true;
    });

    it("rejects on wrong status code", async function () {
      const scope = mockFailedIonosUpdate(dummyApiKey);

      try {
        await updater.update();
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }

      expect(scope.isDone()).to.be.true;
    });
  });
});
