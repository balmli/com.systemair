'use strict';

const Homey = require('homey');

module.exports = class SystemairApp extends Homey.App {

  onInit() {
    this.log('SystemairApp is running...');

    this.triggerSystemairAlarm = new Homey.FlowCardTriggerDevice('systemair_alarm');
    this.triggerSystemairAlarm
      .register();

    this._actionSystemairSetFanMode = new Homey.FlowCardAction('systemair_set_fan_mode')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_fan_mode', args.fanmode, {});
      });

    this._actionSystemairIAMSetFanMode = new Homey.FlowCardAction('systemair_set_fan_mode_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_fan_mode_iam', args.fanmode, {});
      });

    this._actionSystemairSetMode = new Homey.FlowCardAction('systemair_set_mode')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_mode', args.mode, {});
      });

    this._actionSystemairIAMSetMode = new Homey.FlowCardAction('systemair_set_mode_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_mode_iam', args.mode, {});
      });

    this._actionSystemairBoostOn = new Homey.FlowCardAction('systemair_boost_on')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_boost', true, {});
      });
  }

};
