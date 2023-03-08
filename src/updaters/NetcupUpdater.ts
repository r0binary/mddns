import { UpdateConfig, Updater } from "./Updater.interface";
import NetcupApi, {
  DnsRecord,
  InfoDNSRecordsResponseData,
  InfoDNSZoneResponseData,
} from "netcup-node";
import { assertEnvironment, getEnv } from "../EnvironmentReader.js";

type ARecord = "A";
type AAAARecord = "AAAA";
type RecordType = ARecord | AAAARecord;

/**
 * An Updater to set the current IP addresses via
 * the Netcup DNS API.
 *
 * Configuration (environment variables):
 *   - `NETCUP_CUSTOMER_NUMBER`
 *   - `NETCUP_API_PASSWORD`
 *   - `NETCUP_API_KEY`
 *
 *    All environment variables can be read from a file.
 *    The main purpose is to support docker secrets.
 *    For this to work just add `_FILE` suffix.
 *    (E.g. `NETCUP_API_PASSWORD` -> `NETCUP_API_PASSWORD_FILE`)
 */
export class NetcupUpdater implements Updater {
  public init(): void {
    assertEnvironment("NETCUP_CUSTOMER_NUMBER");
    assertEnvironment("NETCUP_API_PASSWORD");
    assertEnvironment("NETCUP_API_KEY");
  }

  /**
   * Set IPv4 and/or IPv6 address for "hostname"."domain"
   *
   * @param updateConfig - An object providing the `domain`, a `hostname` describing
   *                       the record, an `ip4addr` (optional) and/or an `ip6addr`
   *                       (optional) to update
   *
   * @returns The update result message
   */
  public async update({
    domain,
    hostname,
    ip4addr,
    ip6addr,
  }: UpdateConfig): Promise<any> {
    // not in init because session might expire between update calls
    const api = await new NetcupApi().init({
      apikey: getEnv("NETCUP_API_KEY"),
      apipassword: getEnv("NETCUP_API_PASSWORD"),
      customernumber: getEnv("NETCUP_CUSTOMER_NUMBER"),
    });

    const { responsedata: dnsrecordset } = await api.infoDnsRecords({
      domainname: domain,
    });

    if (ip4addr) {
      this.setIp4Addr(dnsrecordset, hostname, ip4addr);
    }

    if (ip6addr) {
      this.setIp6Addr(dnsrecordset, hostname, ip6addr);
    }

    const updateResult = await api.updateDnsRecords({
      domainname: domain,
      dnsrecordset,
    });

    return updateResult.longmessage;
  }

  private setIp4Addr(
    dnsrecordset: InfoDNSRecordsResponseData,
    hostname: string,
    ipAddr: string
  ): void {
    const ARecord: ARecord = "A";
    return this.setIpAddr(dnsrecordset, ARecord, hostname, ipAddr);
  }

  private setIp6Addr(
    dnsrecordset: InfoDNSRecordsResponseData,
    hostname: string,
    ipAddr: string
  ): void {
    const AAAARecord: AAAARecord = "AAAA";
    return this.setIpAddr(dnsrecordset, AAAARecord, hostname, ipAddr);
  }

  private setIpAddr(
    dnsrecordset: InfoDNSRecordsResponseData,
    type: RecordType,
    hostname: string,
    ipAddr: string
  ): void {
    if (this.hasRecordForHost(dnsrecordset.dnsrecords, type, hostname)) {
      const recordIndex = this.getRecordIndex(
        dnsrecordset.dnsrecords,
        type,
        hostname
      );
      dnsrecordset.dnsrecords[recordIndex].destination = ipAddr;
    } else {
      dnsrecordset.dnsrecords.push({
        destination: ipAddr,
        hostname,
        type,
      });
    }
  }

  private getRecordIndex(
    dnsRecords: DnsRecord[],
    type: RecordType,
    hostname: string
  ): number {
    return dnsRecords.findIndex(
      (entry) => entry.hostname === hostname && entry.type === type
    );
  }

  private hasRecordForHost(
    dnsRecords: DnsRecord[],
    type: RecordType,
    hostname: string
  ): boolean {
    return this.getRecordIndex(dnsRecords, type, hostname) !== -1;
  }
}
