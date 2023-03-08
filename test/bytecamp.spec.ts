import nock from "nock";
import sinon from "sinon";
import { expect } from "chai";
import { BytecampUpdater } from "../src/updaters/BytecampUpdater.js";
import { mockBytecampUpdate } from "./fixtures/bytecamp.fixture.js";

describe("Bytecamp Updater", async function () {
  const dummyUser = "dummyUser";
  const dummyPass = "dummyPass";
  let scope: nock.Scope;
  let sandbox: sinon.SinonSandbox;

  before(function () {
    sandbox = sinon.createSandbox();
    scope = mockBytecampUpdate(dummyUser, dummyPass);
  });

  afterEach(function () {
    sandbox.reset();
  });

  after(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  it("throws on missing username", async function () {
    sandbox.stub(process, "env").value({
      BYTECAMP_PASS: dummyPass,
    });

    const updater = new BytecampUpdater();

    expect(updater.init).to.throw(
      Error,
      'Required environment variable "BYTECAMP_USER" not found'
    );
  });

  it("throws on missing password", async function () {
    sandbox.stub(process, "env").value({
      BYTECAMP_USER: dummyUser,
    });

    const updater = new BytecampUpdater();

    expect(updater.init).to.throw(
      Error,
      'Required environment variable "BYTECAMP_PASS" not found'
    );
  });

  it("calls update endpoint with correct credentials", async function () {
    sandbox.stub(process, "env").value({
      BYTECAMP_USER: dummyUser,
      BYTECAMP_PASS: dummyPass,
    });

    const updater = new BytecampUpdater();
    updater.init();

    await updater.update();

    expect(scope.isDone()).to.be.true;
  });
});
