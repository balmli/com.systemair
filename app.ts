import sourceMapSupport from 'source-map-support';
sourceMapSupport.install();

import Homey from 'homey';
const { MODES } = require("./drivers/SystemairIAM/constants");

module.exports = class SystemairApp extends Homey.App {

  async onInit() {
    await this._initFlows();
    this.log('SystemairApp is running...');
  }

  async _initFlows() {

    // Systemair IAM Cloud

    this.homey.flow.getDeviceTriggerCard('alarm_specific')
      .registerRunListener(async (args, state) => args.type.id === state.alarm_code)
      .registerArgumentAutocompleteListener('type', async (query, args) => args.device.getAlarmTypes().filter((result: any) => result.name.toLowerCase().includes(query.toLowerCase())));

    this.homey.flow.getDeviceTriggerCard('function_specific_activated')
      .registerRunListener(async (args, state) => args.type.id === state.function_code)
      .registerArgumentAutocompleteListener('type', async (query, args) => args.device.getFunctionTypes().filter((result: any) => result.name.toLowerCase().includes(query.toLowerCase())));

    this.homey.flow.getDeviceTriggerCard('function_specific_deactivated')
      .registerRunListener(async (args, state) => args.type.id === state.function_code)
      .registerArgumentAutocompleteListener('type', async (query, args) => args.device.getFunctionTypes().filter((result: any) => result.name.toLowerCase().includes(query.toLowerCase())));

    this.homey.flow.getConditionCard('has_alarm')
      .registerRunListener((args, state) => args.device.hasAlarm(args.type.id))
      .registerArgumentAutocompleteListener('type', async (query, args) => args.device.getAlarmTypes().filter((result: any) => result.name.toLowerCase().includes(query.toLowerCase())));

    this.homey.flow.getConditionCard('has_function_active')
      .registerRunListener((args, state) => args.device.hasFunctionActivated(args.type.id))
      .registerArgumentAutocompleteListener('type', async (query, args) => args.device.getFunctionTypes().filter((result: any) => result.name.toLowerCase().includes(query.toLowerCase())));

    this.homey.flow.getActionCard('systemair_boost_on_iam')
      .registerRunListener((args, state) => args.device.setBoostMode(args.boost_period));

    // Systemair IAM Cloud / Modbus

    this.homey.flow.getConditionCard('systemair_fan_mode_iam')
      .registerRunListener((args, state) => args.device.getCapabilityValue('systemair_fan_mode_iam') === args.fanmode);

    this.homey.flow.getConditionCard('systemair_mode_iam')
      .registerRunListener((args, state) => args.device.getCapabilityValue('systemair_mode_iam_ro') === MODES[args.mode]);

    this.homey.flow.getConditionCard('eco_mode_enabled')
      .registerRunListener((args, state) => args.device.getCapabilityValue('eco_mode') === true);

    this.homey.flow.getActionCard('systemair_set_fan_mode_iam')
      .registerRunListener((args, state) => args.device.triggerCapabilityListener('systemair_fan_mode_iam', args.fanmode, {}));

    this.homey.flow.getActionCard('systemair_set_mode_iam')
      .registerRunListener((args, state) => args.device.triggerCapabilityListener('systemair_mode_iam', args.mode, {}));

    this.homey.flow.getActionCard('systemair_mode_away_iam')
      .registerRunListener((args, state) => args.device.setAwayMode(args.period));

    this.homey.flow.getActionCard('systemair_mode_crowded_iam')
      .registerRunListener((args, state) => args.device.setCrowdedMode(args.period));

    this.homey.flow.getActionCard('systemair_mode_fireplace_iam')
      .registerRunListener((args, state) => args.device.setFireplaceMode(args.period));

    this.homey.flow.getActionCard('systemair_mode_holiday_iam')
      .registerRunListener((args, state) => args.device.setHolidayMode(args.period));

    this.homey.flow.getActionCard('systemair_mode_refresh_iam')
      .registerRunListener((args, state) => args.device.setRefreshMode(args.period));

    this.homey.flow.getActionCard('control_eco_mode')
      .registerRunListener((args, state) => args.device.setEcoMode(args.enabled));

    // Systemair Z-wave

    this.homey.flow.getActionCard('systemair_set_fan_mode')
      .registerRunListener((args, state) => args.device.triggerCapabilityListener('systemair_fan_mode', args.fanmode, {}));

    this.homey.flow.getActionCard('systemair_set_mode')
      .registerRunListener((args, state) => args.device.triggerCapabilityListener('systemair_mode', args.mode, {}));

    this.homey.flow.getActionCard('systemair_boost_on')
      .registerRunListener((args, state) => args.device.triggerCapabilityListener('systemair_boost', true, {}));
  }

};
