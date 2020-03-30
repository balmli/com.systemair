'use strict';

const Homey = require('homey');

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

class SystemairHVAC extends ZwaveDevice {

  async onInit() {
    super.onInit();
    this.registerFlowCards();
    this.log(`device initialized`);
  }

  async onMeshInit() {

    // enable debugging
    this.enableDebug();

    // print the node's info to the console
    this.printNode();

    this.registerCapability('target_temperature', 'THERMOSTAT_SETPOINT', {
      get: 'THERMOSTAT_SETPOINT_GET',
      getOpts: {
        getOnStart: true,
      },
      getParser() {
        return {
          Level: {
            'Setpoint Type': 'Auto changeover',
          },
        };
      },
      set: 'THERMOSTAT_SETPOINT_SET',
      setParser(value) {

        // Create value buffer
        const bufferValue = new Buffer(2);
        bufferValue.writeUInt16BE((Math.round(value * 2) / 2 * 10).toFixed(0));

        return {
          Level: {
            'Setpoint Type': 'Auto changeover',
          },
          Level2: {
            Size: 2,
            Scale: 0,
            Precision: 1,
          },
          Value: bufferValue,
        };
      },
      report: 'THERMOSTAT_SETPOINT_REPORT',
      reportParser: report => {
        if (report && report.hasOwnProperty('Level2')
          && report.Level2.hasOwnProperty('Scale')
          && report.Level2.hasOwnProperty('Precision')
          && report.Level2.Scale === 0
          && typeof report.Level2.Size !== 'undefined') {

          let readValue;
          try {
            readValue = report.Value.readUIntBE(0, report.Level2.Size);
          } catch (err) {
            return null;
          }

          if (typeof readValue !== 'undefined') {
            return readValue / Math.pow(10, report.Level2.Precision);
          }
          return null;
        }
        return null;
      }
    });

    this.registerCapability('setpoint_capabilities', 'THERMOSTAT_SETPOINT_CAPABILITIES_GET', {
      getOpts: {
        getOnStart: true,
        pollInterval: 10,
        pollMultiplication: 60000
      },
      reportParserV3: report => {
        this.log('THERMOSTAT_SETPOINT_CAPABILITIES_GET reportParserV3', report);
        const value = typeof report === 'object' ? JSON.stringify(report) : report;
        return value;
      }
    });

    this.registerCapability('systemair_boost', 'SWITCH_BINARY');

    this.registerCapability('systemair_mode', 'BASIC', {
      get: 'BASIC_GET',
      getOpts: {
        getOnStart: true,
      },
      set: 'BASIC_SET',
      setParser: value => {
        this.log('BASIC setParser', value);
        return {
          Value: parseInt(value)
        };
      },
      report: 'BASIC_REPORT',
      reportParser(report) {
        this.log('BASIC reportParser', report);
        if (report && report.hasOwnProperty('Value')) return report.Value > 0 ? "255" : "0";
        return null;
      },
    });

    this.registerCapability('systemair_fan_mode', 'THERMOSTAT_FAN_MODE', {
      get: 'THERMOSTAT_FAN_MODE_GET',
      getOpts: {
        getOnStart: true,
      },
      set: 'THERMOSTAT_FAN_MODE_SET',
      setParser: value => {
        this.log('THERMOSTAT_FAN_MODE setParser', value);
        return {
          Properties1: parseInt(value)
        };
      },
      report: 'THERMOSTAT_FAN_MODE_REPORT',
      reportParser: async report => {
        if (report && report.hasOwnProperty('Properties1 (Raw)')) {
          const value = report['Properties1 (Raw)'];
          this.log('THERMOSTAT_FAN_MODE reportParser', report, value);
          return value.toString();
        }
        return null;
      }
    });

    this.registerCapability('systemair_alarm', 'NOTIFICATION', {
      reportParserV3: report => {
        this.log('NOTIFICATION reportParserV3', report);
        const value = typeof report === 'object' ? JSON.stringify(report) : report;
        Homey.app.triggerSystemairAlarm.trigger(this, {
          info: value
        }, null);
        return value;
      }
    });

  }

  async onAdded() {
    this.log(`device added`);
  }

  onDeleted() {
    this.log(`device deleted`);
  }

  async registerFlowCards() {
  }

}

module.exports = SystemairHVAC;

