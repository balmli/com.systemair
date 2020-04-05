'use strict';

const Homey = require('homey');

module.exports = class SystemairApp extends Homey.App {

  onInit() {
    this.log('SystemairApp is running...');

    // Systemair IAM Cloud

    this.triggerSystemairFanModeChangedIAM = new Homey.FlowCardTriggerDevice('systemair_fan_mode_changed_iam');
    this.triggerSystemairFanModeChangedIAM
      .register();

    this.triggerSystemairModeChangedIAM = new Homey.FlowCardTriggerDevice('systemair_mode_changed_iam');
    this.triggerSystemairModeChangedIAM
      .register();

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

    new Homey.FlowCardAction('systemair_boost_on_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.setBoostMode(args.boost_period);
      });

    new Homey.FlowCardAction('systemair_mode_away_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.setAwayMode(args.period);
      });

    new Homey.FlowCardAction('systemair_mode_crowded_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.setCrowdedMode(args.period);
      });

    new Homey.FlowCardAction('systemair_mode_fireplace_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.setFireplaceMode(args.period);
      });

    new Homey.FlowCardAction('systemair_mode_holiday_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.setHolidayMode(args.period);
      });

    new Homey.FlowCardAction('systemair_mode_refresh_iam')
      .register()
      .registerRunListener((args, state) => {
        return args.device.setRefreshMode(args.period);
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
