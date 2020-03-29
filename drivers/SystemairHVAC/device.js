'use strict';

const Homey = require('homey');

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class SystemairHVAC extends ZwaveDevice {

  async onMeshInit() {

    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
      getOpts: {
        getOnStart: true,
      }
    });

    this.registerCapability('systemair_boost', 'SWITCH_BINARY', {
      getOpts: {
        getOnStart: true,
      }
    });

    this.registerCapability('systemair_mode', 'THERMOSTAT_MODE', {
      getOpts: {
        getOnStart: true,
      }
    });

    this.registerCapability('systemair_fan_mode', 'THERMOSTAT_FAN_MODE', {
      getOpts: {
        getOnStart: true,
      }
    });

    this.registerCapability('alarm_water', 'NOTIFICATION', {
      setParserV3: setpointValue => {
        this.log('NOTIFICATION setParserV3', setpointValue);
        return null;
      },
      reportParserV3: report => {
        this.log('NOTIFICATION reportParserV3', report);
        return null;
      }
    });

  }

}

module.exports = SystemairHVAC;

