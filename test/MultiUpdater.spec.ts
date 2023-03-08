import chai, { expect } from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import {
  BytecampUpdater,
  MultiUpdater,
  UpdateConfig,
  Updater,
} from "../src/updaters";

chai.use(sinonChai);

describe("MultiUpdater", function () {
  const sandbox = sinon.createSandbox();
  const infoStub = sandbox.stub(console, "info");
  const errorStub = sandbox.stub(console, "error");
  const updaters: sinon.SinonStubbedInstance<BytecampUpdater>[] = [
    sandbox.createStubInstance(BytecampUpdater),
    sandbox.createStubInstance(BytecampUpdater),
    sandbox.createStubInstance(BytecampUpdater),
  ];

  afterEach(function () {
    sandbox.reset();
  });

  after(function () {
    sandbox.restore();
  });

  describe("init", function () {
    it("Calls init on all updaters", async function () {
      const updater = new MultiUpdater(updaters);

      await updater.init();

      expect(updaters[0].init).to.be.calledOnce;
      expect(updaters[1].init).to.be.calledOnce;
      expect(updaters[2].init).to.be.calledOnce;
    });

    it("fulfills on successful init", async function () {
      const updater = new MultiUpdater(updaters);

      await expect(updater.init()).to.eventually.be.fulfilled;
    });

    it("rejects with reason on single init error", async function () {
      updaters[0].init.rejects(Error("An error occurred"));

      const updater = new MultiUpdater(updaters);

      await expect(updater.init()).to.eventually.be.rejectedWith(
        Error,
        "Error: BytecampUpdater: An error occurred"
      );
    });

    it("rejects with reason on multiple init errors", async function () {
      updaters[0].init.rejects(Error("An error occurred"));
      updaters[2].init.rejects(Error("Another error occurred"));

      const updater = new MultiUpdater(updaters);

      await expect(updater.init()).to.eventually.be.rejectedWith(
        Error,
        "Error: BytecampUpdater: An error occurred\n" +
          "Error: BytecampUpdater: Another error occurred"
      );
    });
  });

  describe("update", function () {
    const dummyUpdateConfig: UpdateConfig = {
      domain: "DUMMY_DOMAIN",
      hostname: "DUMMY_HOSTNAME",
      ip4addr: "9.9.9.9",
      ip6addr: "::",
    };

    it("Calls update on all updaters with the provided config", async function () {
      const updater = new MultiUpdater(updaters);

      await updater.update(dummyUpdateConfig);

      expect(updaters[0].update).to.be.calledOnceWithExactly(dummyUpdateConfig);
      expect(updaters[1].update).to.be.calledOnceWithExactly(dummyUpdateConfig);
      expect(updaters[2].update).to.be.calledOnceWithExactly(dummyUpdateConfig);
    });

    it("fulfills on successful update", async function () {
      const updater = new MultiUpdater(updaters);

      await expect(updater.update(dummyUpdateConfig)).to.eventually.be
        .fulfilled;
    });

    it("fulfills on update error indicating the reason", async function () {
      updaters[0].update.rejects(Error("An error occurred"));

      const updater = new MultiUpdater(updaters);

      await expect(updater.update(dummyUpdateConfig)).to.eventually.deep.equal([
        {
          updater: "BytecampUpdater",
          status: "❌ failure",
          result: "An error occurred",
        },
        {
          updater: "BytecampUpdater",
          status: "✅ success",
          result: undefined,
        },
        {
          updater: "BytecampUpdater",
          status: "✅ success",
          result: undefined,
        },
      ]);
    });

    it("fulfills on update errors indicating the reasons", async function () {
      updaters[0].update.rejects(Error("An error occurred"));
      updaters[2].update.rejects(Error("Another error occurred"));

      const updater = new MultiUpdater(updaters);

      await expect(updater.update(dummyUpdateConfig)).to.eventually.deep.equal([
        {
          updater: "BytecampUpdater",
          status: "❌ failure",
          result: "An error occurred",
        },
        {
          updater: "BytecampUpdater",
          status: "✅ success",
          result: undefined,
        },
        {
          updater: "BytecampUpdater",
          status: "❌ failure",
          result: "Another error occurred",
        },
      ]);
    });

    it("prints update results to console", async function () {
      updaters[0].update.rejects(Error("An error occurred"));
      updaters[2].update.rejects(Error("Another error occurred"));

      const updater = new MultiUpdater(updaters);

      await updater.update(dummyUpdateConfig);

      expect(infoStub).to.be.calledWithExactly("BytecampUpdater: ✅ success");
      expect(errorStub).to.be.calledWithExactly(
        "BytecampUpdater: ❌ failure (An error occurred)"
      );
      expect(errorStub).to.be.calledTwice;
    });
  });
});
