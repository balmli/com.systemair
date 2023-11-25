import Homey from 'homey';
import PairSession from "homey/lib/PairSession";

import net from 'net';
import {SystemairSaveConnectApi} from "./systemair_saveconnect_api";

module.exports = class SystemairIAMModbusDriver extends Homey.Driver {

  async onInit() {
    this.log('SystemairSaveConnectDriver has been initialized');
  }

  onPair(session: PairSession): void {

    let devices: any[] = [];

    session.setHandler('showView', async (view) => {
      if (view === 'loading') {
        const discoveryStrategy = this.getDiscoveryStrategy();
        const discoveryResults = discoveryStrategy.getDiscoveryResults();

        devices = Object.values(discoveryResults).map((discoveryResult: any) => {
          return {
            name: `Systemair Save Connect`,
            data: {
              id: discoveryResult.id,
            },
            settings: {
              IP_Address: discoveryResult.address
            }
          };
        });

        this.log('onPair: loading:', discoveryResults);

        if (devices.length > 0) {
          // @ts-ignore
          await session.showView('list_devices');
        } else {
          // @ts-ignore
          await session.showView('ip_address');
        }
      }
    });

    session.setHandler('ip_address_entered', async (data) => {
      this.log('onPair: ip_address_entered:', data);
      if (!net.isIP(data.ipaddress)) {
        throw new Error(this.homey.__('pair.valid_ip_address'));
      }

      const api = new SystemairSaveConnectApi({
        homey: this.homey,
        logger: this.log,
      });
      await api.checkConnection(data.ipaddress);

      devices = [{
        name: `Systemair Save Connect`,
        data: {
          id: 'x.x.x.x',
        },
        settings: {
          IP_Address: data.ipaddress
        }
      }];

      // @ts-ignore
      await session.showView('list_devices');
    });

    session.setHandler("list_devices", async () => {
      return devices;
    });

  }

};
