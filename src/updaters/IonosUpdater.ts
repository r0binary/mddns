import { Updater } from "./Updater.interface";
import http from "http";
import https from "https";
import { assertEnvironment, getEnv } from "../EnvironmentReader.js";

/**
 * An Updater to set the current IP addresses via
 * the IONOS' DDNS service.
 *
 * Configuration (environment variables):
 *   - `IONOS_API_KEY`
 */
export class IonosUpdater implements Updater {
  private static readonly IONOS_UPDATE_HOST = "api.hosting.ionos.com";

  public init(): void {
    assertEnvironment("IONOS_API_KEY");
  }

  public async update(): Promise<void> {
    const basicOptions: https.RequestOptions = {
      hostname: IonosUpdater.IONOS_UPDATE_HOST,
      port: 443,
      path: `/dns/v1/dyndns?q=${getEnv("IONOS_API_KEY")}`,
      method: "GET",
    };

    const ipv4Options = {
      ...basicOptions,
      family: 4,
    };

    await IonosUpdater.callUpdateHook(ipv4Options);

    const ipv6Options = {
      ...basicOptions,
      family: 6,
    };

    await IonosUpdater.callUpdateHook(ipv6Options);
  }

  private static async callUpdateHook(
    options: https.RequestOptions
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const req = https.request(options, (res) => {
        IonosUpdater.evaluateResult(res, resolve, reject);
      });

      req.on("error", (error: Error) => {
        reject(error);
      });

      req.end();
    });
  }

  private static evaluateResult(
    res: http.IncomingMessage,
    resolve: Function,
    reject: Function
  ) {
    if (res.statusCode == 200) {
      resolve();
    } else {
      IonosUpdater.withCollectedData(res, (data: string) => {
        reject(Error(`Server returned error code ${res.statusCode}: ${data}`));
      });
    }
  }

  private static withCollectedData(
    message: http.IncomingMessage,
    action: (data: string) => void
  ) {
    let data = "";

    message.on("data", (chunk: string) => {
      data += chunk;
    });

    message.on("end", () => {
      action(data);
    });
  }
}
