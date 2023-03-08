export type UpdateConfig = {
  domain: string;
  hostname: string;
  ip4addr?: string;
  ip6addr?: string;
  dualstack?: string;
  ip6lanprefix?: string;
};

export interface Updater {
  init(): Promise<void> | void;
  update(config: UpdateConfig): Promise<any> | any;
}
