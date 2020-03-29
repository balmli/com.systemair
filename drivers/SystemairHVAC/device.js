'use strict';

const Homey = require('homey');

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class SystemairHVAC extends ZwaveDevice {

  async onInit() {
    super.onInit();
    this.registerFlowCards();
    this.log(`device initialized: ${this.getData().id}`);
  }

  async onMeshInit() {

    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
      getOpts: {
        getOnStart: true,
      },
      reportParserV3: report => {
        this.log('THERMOSTAT_SETPOINT reportParserV3', report);
        return null;
      }
    });

    this.registerCapability('systemair_boost', 'SWITCH_BINARY', {
      getOpts: {
        getOnStart: true,
      },
      reportParserV3: report => {
        this.log('SWITCH_BINARY reportParserV3', report);
        return null;
      }
    });

    this.registerCapability('systemair_mode', 'THERMOSTAT_MODE', {
      getOpts: {
        getOnStart: true,
      },
      reportParserV3: report => {
        this.log('THERMOSTAT_MODE reportParserV3', report);
        return null;
      }
    });

    this.registerCapability('systemair_fan_mode', 'THERMOSTAT_FAN_MODE', {
      getOpts: {
        getOnStart: true,
      },
      reportParserV3: report => {
        this.log('THERMOSTAT_FAN_MODE reportParserV3', report);
        return null;
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

  async onAdded() {
    this.log(`device added: ${this.getData().id}`);
  }

  onDeleted() {
    this.log(`device deleted: ${this.getData().id}`);
  }

  async registerFlowCards() {
  }

}

module.exports = SystemairHVAC;

