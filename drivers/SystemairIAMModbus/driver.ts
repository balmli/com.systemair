import Homey from 'homey';
import PairSession from "homey/lib/PairSession";

import net from 'net';
import {SystemairIAMApi} from "./systemair_modbus_api";

module.exports = class SystemairIAMModbusDriver extends Homey.Driver {

  async onInit() {
    this.log('SystemairIAMModbusDriver has been initialized');
  }

  onPair(session: PairSession): void {

    let devices: any[] = [];

    session.setHandler('ip_address_entered', async (data) => {
      this.log('onPair: ip_address_entered:', data);
      if (!net.isIP(data.ipaddress)) {
        throw new Error(this.homey.__('pair.valid_ip_address'));
      }

      const api = new SystemairIAMApi({
        homey: this.homey,
        logger: this.log,
      });
      await api._connection(data.ipaddress);

      devices = [{
        name: `Systemair IAM Modbus`,
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
