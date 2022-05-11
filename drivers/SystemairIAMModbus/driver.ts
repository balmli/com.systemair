import Homey from 'homey';

module.exports = class SystemairIAMModbusDriver extends Homey.Driver {

  async onInit() {
    this.log('SystemairIAMModbusDriver has been initialized');
  }

  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    this.log('onPairListDevices', discoveryResults);

    return Object.values(discoveryResults).map(discoveryResult => {
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
  }

};
