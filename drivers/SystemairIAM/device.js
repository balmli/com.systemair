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
    this._clearFetchTimeout();
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
    this._clearFetchTimeout();
    let interval = seconds;
    if (!interval) {
      let settings = await this.getSettings();
      interval = settings.Polling_Interval || 30;
    }
    this.fetchTimeout = setTimeout(() => this.fetchSensors(), 1000 * interval);
  }

  _clearFetchTimeout() {
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
      this._clearFetchTimeout();
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
      this._clearFetchTimeout();
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
      this._clearFetchTimeout();
      await this._api.write({
        main_airflow: value
      });
      this.log(`set fan mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  onUpdateValues(message, device) {
    device.checkChangedValues(message);
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

  checkChangedValues(message) {
    const values = message.readValues ? message.readValues : message.changedValues;

    // Fan mode changed ?
    const fanMode = this.getCapabilityValue('systemair_fan_mode_iam');
    if (fanMode && values) {
      const newFanMode = values.main_airflow;
      if (newFanMode && fanMode !== newFanMode) {
        Homey.app.triggerSystemairFanModeChangedIAM.trigger(this, {
          fanmode: FAN_MODES[newFanMode] ? FAN_MODES[newFanMode] : newFanMode,
          changedByHomey: values.askedByClient
        }, null);
      }
    }

    // Mode changed ?
    const mode = this.getCapabilityValue('systemair_mode_iam');
    if (mode && values) {
      const newMode = values.main_airflow;
      if (newMode && mode !== newMode) {
        Homey.app.triggerSystemairModeChangedIAM.trigger(this, {
          mode: MODES[newMode] ? MODES[newMode] : newMode,
          changedByHomey: values.askedByClient
        }, null);
      }
    }
  }

  updateNumber(cap, toValue, factor = 1) {
    if (toValue !== undefined && this.hasCapability(cap)) {
      this.setCapabilityValue(cap, Math.round(10 * toValue / factor) / 10).catch(err => this.log(err));
    }
  }

  updateString(cap, toValue) {
    if (toValue !== undefined && this.hasCapability(cap)) {
      this.setCapabilityValue(cap, toValue).catch(err => this.log(err));
    }
  }
};
