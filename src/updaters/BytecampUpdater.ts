import { Updater } from "./Updater.interface";
import axios from "axios";
import https from "https";
import { assertEnvironment, getEnv } from "../EnvironmentReader.js";

/**
 * An Updater to set the current IP addresses via
 * the Bytecamp DDNS service.
 *
 * Configuration (environment variables):
 *   - `BYTECAMP_USER`
 *   - `BYTECAMP_PASS`
 *
 *    All environment variables can be read from a file.
 *    The main purpose is to support docker secrets.
 *    For this to work just add `_FILE` suffix.
 *    (E.g. `BYTECAMP_PASS` -> `BYTECAMP_PASS_FILE`)
 */
export class BytecampUpdater implements Updater {
  private static readonly BYTECAMP_UPDATE_URL =
    "https://update.nerdcamp.net/update.cgi";

  public init(): void {
    assertEnvironment("BYTECAMP_USER");
    assertEnvironment("BYTECAMP_PASS");
  }

  public async update(): Promise<any> {
    const instance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });

    await instance.get(BytecampUpdater.BYTECAMP_UPDATE_URL, {
      params: {
        user: getEnv("BYTECAMP_USER"),
        pass: getEnv("BYTECAMP_PASS"),
        reqc: 2,
      },
    });
  }
}
