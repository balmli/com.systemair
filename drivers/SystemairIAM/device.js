'use strict';

const Homey = require('homey');
const WebSocket = require('ws');
const IAMApi = require('./systemair_iam_api');
const { FAN_MODES, MODES, FAN_MODES_LIST, MODES_LIST, READ_PARAMETERS, ALARMS } = require("./constants");

module.exports = class SystemairIAMDevice extends Homey.Device {

  async onInit() {
    this.log('device initialized');

    await this.migrate();

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

  async migrate() {
    try {
      const migVersion = this.getStoreValue('version');
      if (!migVersion || migVersion < 1) {
        await this.removeCapability('measure_humidity');
        if (!this.hasCapability('measure_temperature.overheat_temp')) {
          await this.addCapability('measure_temperature.overheat_temp');
        }
        await this.addCapability('measure_humidity');
      }
      if (!this.hasCapability('cooker_hood')) {
        await this.addCapability('cooker_hood');
      }
      if (!this.hasCapability('filter_time_left')) {
        await this.addCapability('filter_time_left');
      }
      if (!migVersion || migVersion < 2) {
        await this.removeCapability('measure_temperature.overheat_temp');
        await this.removeCapability('filter_time_left');
        await this.addCapability('measure_temperature.overheat_temp');
        await this.addCapability('filter_time_left');
      }
      await this.setStoreValue('version', 2);
    } catch (err) {
      this.log('migrate error:', err);
    }
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

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (changedKeys.includes('Polling_Interval')) {
      this.addFetchTimeout();
    }
  }

  async addFetchTimeout(seconds) {
    this.clearFetchTimeout();
    let interval = seconds;
    if (!interval) {
      let settings = await this.getSettings();
      interval = settings.Polling_Interval || 10;
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
      const params = READ_PARAMETERS.concat(ALARMS.map(a => a.id));
      await this._api.read(params);
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
      device.updateNumber("measure_temperature.extract_air_temp", message.readValues.pdm_input_temp_value, 10);
      device.updateNumber("measure_temperature.overheat_temp", message.readValues.overheat_temp, 10);
      device.updateNumber("measure_humidity", message.readValues.pdm_input_rh_value);
      device.updateMode(message.readValues.main_user_mode);
      device.updateFanMode(message.readValues.main_airflow);
      device.updateCookerHood(message.readValues);
      device.updateFilterTimeLeft(message.readValues.components_filter_time_left);
      device.updateAlarms(message.readValues);
    }
    if (message.changedValues && !message.askedByClient) {
      device.updateNumber("target_temperature", message.changedValues.main_temperature_offset, 10);
      device.updateMode(message.changedValues.main_user_mode);
      device.updateFanMode(message.changedValues.main_airflow);
    }
  }

  async updateNumber(cap, toValue, factor = 1) {
    if (toValue !== undefined && toValue !== null && this.hasCapability(cap)) {
      await this.setCapabilityValue(cap, Math.round(10 * toValue / factor) / 10).catch(err => this.log(err));
    }
  }

  async updateMode(toValue) {
    const cap = 'systemair_mode_iam';
    const capRo = 'systemair_mode_iam_ro';
    if (toValue !== undefined && toValue !== null) {
      if (this.hasCapability(cap) && toValue !== this.getCapabilityValue(cap) && MODES_LIST[toValue]) {
        await this.setCapabilityValue(cap, toValue).catch(err => this.log(err));
      }
      const modeTxt = MODES[toValue] ? MODES[toValue] : toValue;
      if (this.hasCapability(capRo) && modeTxt !== this.getCapabilityValue(capRo)) {
        this.homey.app.triggerSystemairModeChangedIAM.trigger(this, {
          mode: modeTxt
        }, null);
        await this.setCapabilityValue(capRo, modeTxt).catch(err => this.log(err));
      }
    }
  }

  async updateFanMode(toValue) {
    const cap = 'systemair_fan_mode_iam';
    const capRo = 'systemair_fan_mode_iam_ro';
    if (toValue !== undefined && toValue !== null) {
      if (this.hasCapability(cap) && toValue !== this.getCapabilityValue(cap) && FAN_MODES_LIST[toValue]) {
        await this.setCapabilityValue(cap, toValue).catch(err => this.log(err));
      }
      const fanModeTxt = FAN_MODES[toValue] ? FAN_MODES[toValue] : toValue;
      if (this.hasCapability(capRo) && fanModeTxt !== this.getCapabilityValue(capRo)) {
        this.homey.app.triggerSystemairFanModeChangedIAM.trigger(this, {
          fanmode: fanModeTxt
        }, null);
        await this.setCapabilityValue(capRo, fanModeTxt).catch(err => this.log(err));
      }
    }
  }

  async updateCookerHood(readValues) {
    if (readValues.digital_input_type1 === 'cooker' && readValues.digital_input_value1 !== null) {
      await this.setCapabilityValue('cooker_hood', readValues.digital_input_value1 !== 0).catch(err => this.log(err));
    } else if (readValues.digital_input_type2 === 'cooker' && readValues.digital_input_value2 !== null) {
      await this.setCapabilityValue('cooker_hood', readValues.digital_input_value2 !== 0).catch(err => this.log(err));
    }
  }

  async updateFilterTimeLeft(toValue) {
    if (toValue !== undefined && toValue !== null) {
      await this.setCapabilityValue('filter_time_left', Math.ceil(toValue / 86400)).catch(err => this.log(err));
    }
  }

  async updateAlarms(readValues) {
    try {
      const curAlarms = this.getStoreValue('alarms');
      const newAlarms = { ...curAlarms };
      for (let a of ALARMS) {
        const newValue = readValues[a.id];
        if (newValue) {
          const prevValue = curAlarms ? curAlarms[a.id] : undefined;
          newAlarms[a.id] = newValue;
          //this.log(`${a.description} (${a.id}): ${prevValue} -> ${newValue}`);
          if (prevValue && newValue !== prevValue && newValue !== 'inactive' && newValue !== 'waiting') {
            this.log(`Alarm triggered: ${a.description} (${a.id}): ${prevValue} -> ${newValue}`);
            this.homey.app.triggerAlarm.trigger(this, {
              alarm_code: a.id,
              alarm_description: a.description
            }, null);
          }
        }
      }
      await this.setStoreValue('alarms', newAlarms);
    } catch (err) {
      this.log('Update alarms error:', err);
    }
  }

  hasAlarm(alarmId) {
    const curAlarms = this.getStoreValue('alarms');
    return curAlarms && curAlarms[alarmId] ? curAlarms[alarmId] !== 'inactive' && curAlarms[alarmId] !== 'waiting' : false;
  }

  getAlarmTypes() {
    return ALARMS.map(a => ({
      id: a.id,
      name: a.description
    }));
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
