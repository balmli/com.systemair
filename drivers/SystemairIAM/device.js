'use strict';

const Homey = require('homey');
const WebSocket = require('ws');
const IAMApi = require('./systemair_iam_api');
const { FAN_MODES, MODES } = require('./constants');

module.exports = class SystemairIAMDevice extends Homey.Device {

  onInit() {
    this.log('device initialized');

    this._api = new IAMApi({
      device: this,
      logger: this.log,
      onUpdateValues: this.onUpdateValues
    });

    this.triggerSystemairFanModeChangedIAM = new Homey.FlowCardTriggerDevice('systemair_fan_mode_changed_iam');
    this.triggerSystemairFanModeChangedIAM
      .register();

    this.triggerSystemairModeChangedIAM = new Homey.FlowCardTriggerDevice('systemair_mode_changed_iam');
    this.triggerSystemairModeChangedIAM
      .register();

    this.registerCapabilityListener('target_temperature', (value, opts) => {
      return this.onUpdateTargetTemperature(value, opts);
    });

    this.registerCapabilityListener('systemair_mode_iam', (value, opts) => {
      return this.onUpdateMode(value, opts);
    });

    this.registerCapabilityListener('systemair_fan_mode_iam', (value, opts) => {
      return this.onUpdateFanMode(value, opts);
    });

    this.addFetchTimeout(1);
  }

  async onAdded() {
    this.log('device added');
  }

  onDeleted() {
    this.clearFetchTimeout();
    this.clearBoostTimeout();
    if (this._api && this._api._clearSocketTimeout) {
      this._api._clearSocketTimeout();
    }
    this.log('device deleted');
  }

  async onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
    if (changedKeysArr.includes('Polling_Interval')) {
      this.addFetchTimeout();
    }

    callback(null, true);
  }

  async addFetchTimeout(seconds) {
    this.clearFetchTimeout();
    let interval = seconds;
    if (!interval) {
      let settings = await this.getSettings();
      interval = settings.Polling_Interval || 30;
    }
    this.fetchTimeout = setTimeout(() => this.fetchSensors(), 1000 * interval);
  }

  clearFetchTimeout() {
    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
      this.fetchTimeout = undefined;
    }
  }

  async fetchSensors() {
    try {
      await this._api.read([
        "components_filter_time_left",
        "eco_mode",
        "control_regulation_temp_unit",
        "main_temperature_offset",
        "main_user_mode",
        "main_airflow",
        "demand_control_fan_speed",
        "control_regulation_speed_after_free_cooling_saf",
        "control_regulation_speed_after_free_cooling_eaf",
        "outdoor_air_temp",
        "supply_air_temp",
        "overheat_temp",
        "rh_sensor"
      ]);
    } catch (err) {
      this.log('fetchSensors error', err);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateTargetTemperature(value, opts) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        main_temperature_offset: value * 10
      });
      this.log(`set target temperature OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateMode(value, opts) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: value
      });
      this.log(`set mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateFanMode(value, opts) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        main_airflow: value
      });
      this.log(`set fan mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  onUpdateValues(message, device) {
    if (message.readValues) {
      device.updateNumber("target_temperature", message.readValues.main_temperature_offset, 10);
      device.updateNumber("measure_temperature", message.readValues.supply_air_temp, 10);
      device.updateNumber("measure_temperature.outdoor_air_temp", message.readValues.outdoor_air_temp, 10);
      device.updateNumber("measure_temperature.supply_air_temp", message.readValues.supply_air_temp, 10);
      device.updateNumber("measure_humidity", message.readValues.rh_sensor);
      device.updateString("systemair_mode_iam", message.readValues.main_user_mode);
      device.updateString("systemair_fan_mode_iam", message.readValues.main_airflow);
    }
    if (message.changedValues && !message.askedByClient) {
      device.updateNumber("target_temperature", message.changedValues.main_temperature_offset, 10);
      device.updateString("systemair_mode_iam", message.changedValues.main_user_mode);
      device.updateString("systemair_fan_mode_iam", message.changedValues.main_airflow);
    }
  }

  updateNumber(cap, toValue, factor = 1) {
    if (toValue !== undefined && this.hasCapability(cap)) {
      this.setCapabilityValue(cap, Math.round(10 * toValue / factor) / 10).catch(err => this.log(err));
    }
  }

  updateString(cap, toValue) {
    if (toValue !== undefined && this.hasCapability(cap)) {
      const curValue = this.getCapabilityValue(cap);
      if (curValue !== toValue) {
        if (cap === 'systemair_mode_iam') {
          this.triggerSystemairModeChangedIAM.trigger(this, {
            mode: MODES[toValue] ? MODES[toValue] : toValue
          });
        }
        if (cap === 'systemair_fan_mode_iam') {
          this.triggerSystemairFanModeChangedIAM.trigger(this, {
            fanmode: FAN_MODES[toValue] ? FAN_MODES[toValue] : toValue
          });
        }
      }
      this.setCapabilityValue(cap, toValue).catch(err => this.log(err));
    }
  }

  async setBoostMode(boost_period) {
    try {
      this._boostMode = this.getCapabilityValue('systemair_mode_iam');
      this._boostFanMode = this.getCapabilityValue('systemair_fan_mode_iam');
      this.clearBoostTimeout();
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: '1', // Manual
        main_airflow: '4' // High
      });
      this.boostTimeout = setTimeout(() => this.onBoostEnded(), 1000 * 60 * boost_period);
      this.log(`boost mode started for ${boost_period} minutes`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onBoostEnded() {
    this.log(`boost mode ended`);
    if (this._boostMode && this._boostFanMode) {
      try {
        this.clearFetchTimeout();
        await this._api.write({
          mode_change_request: this._boostMode,
          main_airflow: this._boostFanMode
        });
      } finally {
        this.addFetchTimeout();
      }
    }
  }

  clearBoostTimeout() {
    if (this.boostTimeout) {
      clearTimeout(this.boostTimeout);
      this.boostTimeout = undefined;
    }
  }

  async setAwayMode(period) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: '5',
        user_mode_away_duration: period
      });
      this.log(`away mode started for ${period} hours`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setCrowdedMode(period) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: '2',
        user_mode_crowded_duration: period
      });
      this.log(`crowded mode started for ${period} hours`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setFireplaceMode(period) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: '4',
        user_mode_fireplace_duration: period
      });
      this.log(`fireplace mode started for ${period} minutes`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setHolidayMode(period) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: '6',
        user_mode_holiday_duration: period
      });
      this.log(`holiday mode started for ${period} days`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setRefreshMode(period) {
    try {
      this.clearFetchTimeout();
      await this._api.write({
        mode_change_request: '3',
        user_mode_refresh_duration: period
      });
      this.log(`refresh mode started for ${period} minutes`);
    } finally {
      this.addFetchTimeout();
    }
  }

};
