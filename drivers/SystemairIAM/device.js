'use strict';

const Homey = require('homey');
const IAMApi = require('./systemair_iam_api');
const {
  FAN_MODES,
  MODES,
  FAN_MODES_LIST,
  MODES_LIST,
  READ_PARAMETERS,
  ALARMS,
  FUNCTIONS
} = require("./constants");

module.exports = class SystemairIAMDevice extends Homey.Device {

  async onInit() {
    await this.migrate();

    this._api = new IAMApi({
      device: this,
      homey: this.homey,
      logger: this.log,
      onUpdateValues: this.onUpdateValues
    });

    this._lastUpdated = {
      "measure_temperature": 1,
      "measure_temperature.outdoor_air_temp": 1,
      "measure_temperature.supply_air_temp": 1,
      "measure_temperature.extract_air_temp": 1,
      "measure_temperature.overheat_temp": 1,
    };

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
    this.log('device initialized');
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
      if (!this.hasCapability('filter_time_left')) {
        await this.addCapability('filter_time_left');
      }
      if (!migVersion || migVersion < 2) {
        await this.removeCapability('measure_temperature.overheat_temp');
        await this.removeCapability('filter_time_left');
        await this.addCapability('measure_temperature.overheat_temp');
        await this.addCapability('filter_time_left');
      }
      if (!this.hasCapability('eaf_reg_speed')) {
        await this.addCapability('eaf_reg_speed');
      }
      if (!this.hasCapability('eaf_rpm')) {
        await this.addCapability('eaf_rpm');
      }
      if (!this.hasCapability('saf_reg_speed')) {
        await this.addCapability('saf_reg_speed');
      }
      if (!this.hasCapability('saf_rpm')) {
        await this.addCapability('saf_rpm');
      }
      if (this.hasCapability('cooker_hood')) {
        await this.removeCapability('cooker_hood');
      }
      if (!this.hasCapability('eco_mode')) {
        await this.addCapability('eco_mode');
      }
      if (!migVersion || migVersion < 3) {
        await this.setUnavailable(this.homey.__('messages.not_supported_anymore'));
        await this.homey.notifications.createNotification({ excerpt: this.homey.__('messages.not_supported_anymore') });
      }
      await this.setStoreValue('version', 3);
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
    this.fetchTimeout = this.homey.setTimeout(() => this.fetchSensors(), 1000 * interval);
  }

  clearFetchTimeout() {
    if (this.fetchTimeout) {
      this.homey.clearTimeout(this.fetchTimeout);
      this.fetchTimeout = undefined;
    }
  }

  async fetchSensors() {
    try {
      if (this.getAvailable()) {
        const params = READ_PARAMETERS
          .concat(ALARMS.map(a => a.id))
          .concat(FUNCTIONS.map(a => a.id));
        await this._api.read(params);
      }
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
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES[value] ? MODES[value] : value);
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
      await this.setCapabilityValue('systemair_fan_mode_iam_ro', FAN_MODES[value] ? FAN_MODES[value] : value);
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
      device.updateNumber("eaf_reg_speed", message.readValues.control_regulation_speed_after_free_cooling_eaf);
      device.updateNumber("eaf_rpm", message.readValues.digital_input_tacho_eaf_value);
      device.updateNumber("saf_reg_speed", message.readValues.control_regulation_speed_after_free_cooling_saf);
      device.updateNumber("saf_rpm", message.readValues.digital_input_tacho_saf_value);
      device.updateMode(message.readValues.main_user_mode);
      device.updateFanMode(message.readValues.speed_indication_app);
      device.updateEcoMode(message.readValues.eco_mode);
      device.updateFilterTimeLeft(message.readValues.components_filter_time_left);
      device.updateAlarms(message.readValues);
      device.updateFunctions(message.readValues);
    }
    if (message.changedValues && !message.askedByClient) {
      device.updateNumber("target_temperature", message.changedValues.main_temperature_offset, 10);
      device.updateMode(message.changedValues.main_user_mode);
      device.updateFanMode(message.changedValues.speed_indication_app);
      device.updateEcoMode(message.changedValues.eco_mode);
      device.updateAlarms(message.changedValues);
      device.updateFunctions(message.changedValues);
    }
  }

  async updateNumber(cap, toValue, factor = 1) {
    if (toValue !== undefined && toValue !== null && this.hasCapability(cap)) {
      let update = true;
      const now = Date.now();
      const lastUpdated = this._lastUpdated[cap];
      if (lastUpdated) {
        update = ((now - lastUpdated) / 1000) > this.getSetting('temp_report_interval');
      }
      if (update) {
        await this.setCapabilityValue(cap, Math.round(10 * toValue / factor) / 10).catch(err => this.log(err));
        if (lastUpdated) {
          this._lastUpdated[cap] = now;
        }
      }
    }
  }

  async updateMode(toValue) {
    try {
      if (toValue !== undefined && toValue !== null) {
        if (MODES_LIST[toValue]) {
          await this.setCapabilityValue('systemair_mode_iam', toValue);
        }
        await this.setCapabilityValue('systemair_mode_iam_ro', MODES[toValue] ? MODES[toValue] : toValue);
      }
    } catch (err) {
      this.log('Update mode failed:', err);
    }
  }

  async updateFanMode(toValue) {
    try {
      if (toValue !== undefined && toValue !== null) {
        if (FAN_MODES_LIST[toValue]) {
          await this.setCapabilityValue('systemair_fan_mode_iam', toValue);
        }
        await this.setCapabilityValue('systemair_fan_mode_iam_ro', FAN_MODES[toValue] ? FAN_MODES[toValue] : toValue);
      }
    } catch (err) {
      this.log('Update fan mode failed:', err);
    }
  }

  async updateEcoMode(toValue) {
    try {
      if (toValue !== undefined && toValue !== null) {
        await this.setCapabilityValue('eco_mode', toValue);
      }
    } catch (err) {
      this.log('Update ECO mode failed:', err);
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
            this.homey.flow.getDeviceTriggerCard('alarm').trigger(this, {
              alarm_code: a.id,
              alarm_description: a.description
            }, {
              alarm_code: a.id
            });
            this.homey.flow.getDeviceTriggerCard('alarm_specific').trigger(this, {
              alarm_code: a.id,
              alarm_description: a.description
            }, {
              alarm_code: a.id
            });
          }
        }
      }
      await this.setStoreValue('alarms', newAlarms);
    } catch (err) {
      this.log('Update alarms error:', err);
    }
  }

  getAlarmTypes() {
    return ALARMS.map(a => ({
      id: a.id,
      name: a.description
    }));
  }

  hasAlarm(alarmId) {
    const curAlarms = this.getStoreValue('alarms');
    return curAlarms && curAlarms[alarmId] ? curAlarms[alarmId] !== 'inactive' && curAlarms[alarmId] !== 'waiting' : false;
  }

  async updateFunctions(readValues) {
    try {
      const curFunctions = this.getStoreValue('functions');
      const newFunctions = { ...curFunctions };
      for (let a of FUNCTIONS) {
        const newValue = readValues[a.id];
        if (newValue !== undefined && newValue !== null) {
          const prevValue = curFunctions ? curFunctions[a.id] : undefined;
          newFunctions[a.id] = newValue;
          //this.log(`${a.description} (${a.id}): ${prevValue} -> ${newValue}`);
          if (prevValue !== undefined && newValue !== prevValue) {
            if (newValue) {
              this.log(`Function activated: ${a.description} (${a.id}): ${prevValue} -> ${newValue}`);
              this.homey.flow.getDeviceTriggerCard('function_activated').trigger(this, {
                function_code: a.id,
                function_description: a.description
              }, {
                function_code: a.id
              });
              this.homey.flow.getDeviceTriggerCard('function_specific_activated').trigger(this, {
                function_code: a.id,
                function_description: a.description
              }, {
                function_code: a.id
              });
            } else {
              this.log(`Function deactivated: ${a.description} (${a.id}): ${prevValue} -> ${newValue}`);
              this.homey.flow.getDeviceTriggerCard('function_deactivated').trigger(this, {
                function_code: a.id,
                function_description: a.description
              }, {
                function_code: a.id
              });
              this.homey.flow.getDeviceTriggerCard('function_specific_deactivated').trigger(this, {
                function_code: a.id,
                function_description: a.description
              }, {
                function_code: a.id
              });
            }
          }
        }
      }
      await this.setStoreValue('functions', newFunctions);
    } catch (err) {
      this.log('Update functions error:', err);
    }
  }

  getFunctionTypes() {
    return FUNCTIONS.map(a => ({
      id: a.id,
      name: a.description
    }));
  }

  hasFunctionActivated(functionId) {
    const curFunctions = this.getStoreValue('functions');
    return curFunctions && curFunctions[functionId] !== undefined ? curFunctions[functionId] : false;
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
      this.boostTimeout = this.homey.setTimeout(() => this.onBoostEnded(), 1000 * 60 * boost_period);
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
      this.homey.clearTimeout(this.boostTimeout);
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

  async setEcoMode(enabled) {
    try {
      this.clearFetchTimeout();
      const eco_mode = enabled === 'true';
      await this._api.write({
        eco_mode: eco_mode
      });
      await this.updateEcoMode(eco_mode);
      this.log(`ECO mode: enabled = ${enabled}`);
    } finally {
      this.addFetchTimeout();
    }
  }

};
