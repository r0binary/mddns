# mddns

A multi DDNS updater webservice. It can currently dynamically update DNS records
for the [Bytecamp][bytecamp] / [IONOS][ionos] DDNS service and [Netcup][netcup]'s DNS API. Unlike
usual DDNS clients this one is intented to be triggered by an AVM Fritz!Box
providing the current public IP addresses.

## Features

- HTTP interface to trigger updates
- Support for IPv4 and/or IPv6
- Available Providers:
  - [Netcup][netcup-updater] _(DNS API)_
  - [Bytecamp][bytecamp-updater] _(DDNS)_
  - [IONOS Dyn DNS][ionos-updater] _(DDNS)_

## Usage

### Installation

To use the tool, install it globally by running
`npm run build && npm pack && npm install --global mddns-0.2.0.tgz`.
Once this is done, start the service: `mddns [<port>]`.

If you prefer to not install the tool `npm run start [<port>]`.

If not port was specified, the system will assign an available port
to the service.

### Build the docker container

To build mddns into a docker container run

`docker build . -t mddns:latest`

To start the app in docker run

`docker run -ti -p 8080:8080 mddns`

### Send update request

To trigger the updater just make a GET request to the `/update` endpoint.

The request parameters are used to configure the Netcup updater.

- The `domain` is required.
- The `hostname` is optional and defaults to `@` (=the domain)
- The `ip4addr` is optional and holds the new IP4 address the domain should point to
- The `ip6addr` is optional and holds the new IP6 address the domain should point to
  Either one or both IP address types can be updated at the same time.

```
curl http://localhost:8080/update?domain=<domain>[&hostname=www][&ip4addr=<public-ip4address>][&ip6addr=<public-ip6address>]
```

#### Fritz!Box

ToDo

---

[bytecamp]: https://www.bytecamp.net
[netcup]: https://www.netcup.de
[ionos]: https://www.ionos.de
[bytecamp-updater]: src/updaters/BytecampUpdater.ts
[netcup-updater]: src/updaters/NetcupUpdater.ts
[ionos-updater]: src/updaters/IonosUpdater.ts

ToDo:

- move the domain config from request into env

TypeScript + Yarn3

    yarn add --dev @yarnpkg/sdks
