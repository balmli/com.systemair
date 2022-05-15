import Homey from 'homey';
const ip = require('ip');

module.exports = class SystemairIAMModbusDriver extends Homey.Driver {

  async onInit() {
    this.log('SystemairIAMModbusDriver has been initialized');
  }

  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    this.log('onPairListDevices', discoveryResults);

    const devices = Object.values(discoveryResults).map(discoveryResult => {
      return {
        name: `Systemair IAM Modbus`,
        data: {
          id: discoveryResult.id,
        },
        settings: {
          IP_Address: discoveryResult.address
        }
      };
    });
    if (devices.length === 0) {
      this.log('No devices found.  Manual IP address entry required.');
      const homeyIp = ip.address();
      const splitted = homeyIp.split('.');
      devices.push({
        name: `Systemair IAM Modbus`,
        data: {
          id: 'x.x.x.x',
        },
        settings: {
          IP_Address: `${splitted[0]}.${splitted[1]}.${splitted[2]}.xxx`,
        }
      })
    }
    return devices;
  }

};
