'use strict';

const Homey = require('homey');

module.exports = class SystemairApp extends Homey.App {

  onInit() {
    this.log('SystemairApp is running...');

    // Systemair IAM Cloud

    new Homey.FlowCardCondition('systemair_fan_mode_iam')
      .register()
      .registerRunListener((args) => {
        return args.device.getCapabilityValue('systemair_fan_mode_iam') === args.fanmode;
      });

    new Homey.FlowCardCondition('systemair_mode_iam')
      .register()
      .registerRunListener((args) => {
        return args.device.getCapabilityValue('systemair_mode_iam') === args.mode;
      });

    new Homey.FlowCardAction('systemair_set_fan_mode_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_fan_mode_iam', args.fanmode, {});
      });

    new Homey.FlowCardAction('systemair_set_mode_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_mode_iam', args.mode, {});
      });

    // Systemair Z-wave

    this.triggerSystemairAlarm = new Homey.FlowCardTriggerDevice('systemair_alarm');
    this.triggerSystemairAlarm
      .register();

    new Homey.FlowCardAction('systemair_set_fan_mode')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_fan_mode', args.fanmode, {});
      });

    new Homey.FlowCardAction('systemair_set_mode')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_mode', args.mode, {});
      });

    new Homey.FlowCardAction('systemair_boost_on')
      .register()
      .registerRunListener((args, state) => {
        return args.device.triggerCapabilityListener('systemair_boost', true, {});
      });
  }

};
