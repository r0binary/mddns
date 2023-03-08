import { UpdateConfig, Updater } from "./Updater.interface";
import { NetcupUpdater } from "./NetcupUpdater.js";
import { BytecampUpdater } from "./BytecampUpdater.js";

export class MultiUpdater implements Updater {
  public constructor(
    private readonly updaters: Updater[] = [
      new NetcupUpdater(),
      new BytecampUpdater(),
    ]
  ) {}

  public async init(): Promise<void> {
    const results = await Promise.allSettled(
      this.updaters.map(async (updater) => {
        try {
          await updater.init();
        } catch (e) {
          throw Error(`${updater.constructor.name}: ${(e as Error).message}`);
        }
      })
    );
    this.checkSettledPromisesForErrors(results);
  }

  /**
   * Calls update on all configured updaters.
   * Resolves on successful updates and on errors
   * providing an object indicating the result
   * for each updater.
   *
   * Errors cannot be handled anyways when this
   * is called by FritzBox, but results can be traced
   * via console traces.
   */
  public async update(config: UpdateConfig): Promise<Record<string, string>[]> {
    return Promise.all(
      this.updaters.map((updater) => this.performUpdate(updater, config))
    );
  }

  private async performUpdate(
    updater: Updater,
    config: UpdateConfig
  ): Promise<Record<string, string>> {
    try {
      const result = {
        updater: updater.constructor.name,
        status: "✅ success",
        result: await updater.update(config),
      };
      console.info(`${updater.constructor.name}: ${result.status}`);
      return result;
    } catch (e) {
      const result = {
        updater: updater.constructor.name,
        status: "❌ failure",
        result: (e as Error).message,
      };
      console.error(
        `${updater.constructor.name}: ${result.status} (${result.result})`
      );
      return result;
    }
  }

  private checkSettledPromisesForErrors(results: PromiseSettledResult<void>[]) {
    const errors = results.filter((r) => r.status === "rejected");
    if (errors.length > 0) {
      throw Error(errors.map((r: any) => r.reason).join("\n"));
    }
  }
}
