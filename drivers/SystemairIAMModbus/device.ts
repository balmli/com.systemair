import Homey, {DiscoveryResult, DiscoveryResultMAC} from 'homey';

import {
  ModbusResultParameter,
  ModbusResultParameters,
  ModbusResultParametersMap,
  READ_PARAMETERS,
  READ_PARAMETERS_MAP,
  UPDATE_PARAMETERS_MAP,
  READ_PARAMETERS_2,
} from "./constants";
import {SystemairIAMApi} from "./systemair_modbus_api";

const {MODES_LIST, MODES, FAN_MODES_LIST, FAN_MODES} = require("../SystemairIAM/constants");

module.exports = class SystemairIAMModbusDevice extends Homey.Device {

  _api!: SystemairIAMApi;
  fetch1Timeout?: NodeJS.Timeout;
  fetch2Timeout?: NodeJS.Timeout;

  async onInit() {
    await this.migrate();

    this._api = new SystemairIAMApi({
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
    this.addFetchTimeout2(2);
    this.log('device initialized');
  }

  onDiscoveryResult(dResult: DiscoveryResult): boolean {
    const discoveryResult = dResult as DiscoveryResultMAC;
    const response = discoveryResult.id === this.getData().id;
    if (response) {
      this.log('onDiscoveryResult', discoveryResult);
      this.setSettings({
        IP_Address: discoveryResult.address,
      }).then(() => {
        this._api.resetSocket();
      }).catch(err => this.log(err));
    }
    return response;
  }

  async onDiscoveryAddressChanged(dResult: DiscoveryResult): Promise<void> {
    const discoveryResult = dResult as DiscoveryResultMAC;
    this.log('onDiscoveryAddressChanged', discoveryResult);
    this.setSettings({
      IP_Address: discoveryResult.address,
    }).then(() => {
      this._api.resetSocket();
    }).catch(err => this.log(err));
  }

  async migrate(): Promise<void> {
    try {
    } catch (err) {
      this.log('migrate error:', err);
    }
  }

  async onAdded(): Promise<void> {
    this.log('device added');
  }

  onDeleted(): void {
    this.clearFetchTimeout();
    this.clearFetchTimeout2();
    if (this._api && this._api._clearSocketTimeout) {
      this._api._clearSocketTimeout();
    }
    this.log('device deleted');
  }

  async onSettings({oldSettings, newSettings, changedKeys}: {
    oldSettings: object;
    newSettings: object;
    changedKeys: string[];
  }): Promise<string | void> {
    if (changedKeys.includes('IP_Address')) {
      if (!this.getAvailable()) {
        await this.setAvailable();
        this.addFetchTimeout(1);
        this.addFetchTimeout2(2);
      }
      this._api.resetSocket();
    }
    if (changedKeys.includes('Polling_Interval')) {
      this.addFetchTimeout();
    }
    if (changedKeys.includes('temp_report_interval')) {
      this.addFetchTimeout2();
    }
  }

  addFetchTimeout(seconds?: number): void {
    this.clearFetchTimeout();
    const settings = this.getSettings();
    const interval = seconds || settings.Polling_Interval || 10;
    this.fetch1Timeout = this.homey.setTimeout(() => this.fetchParameters(), 1000 * interval);
  }

  clearFetchTimeout(): void {
    if (this.fetch1Timeout) {
      this.homey.clearTimeout(this.fetch1Timeout);
      this.fetch1Timeout = undefined;
    }
  }

  async fetchParameters(): Promise<void> {
    try {
      if (this.getAvailable()) {
        if (this.getSetting('IP_Address').endsWith('.xxx')) {
          this.log('IP_Address not set');
          await this.setUnavailable(this.homey.__('unavailable.set_ip_address'));
        } else {
          await this._api.read(READ_PARAMETERS);
        }
      }
    } catch (err) {
      this.log('fetchSensors error', err);
    } finally {
      this.addFetchTimeout();
    }
  }

  addFetchTimeout2(seconds?: number): void {
    this.clearFetchTimeout2();
    const settings = this.getSettings();
    const interval = seconds || settings.temp_report_interval || 30;
    this.fetch2Timeout = this.homey.setTimeout(() => this.fetchParameters2(), 1000 * interval);
  }

  clearFetchTimeout2(): void {
    if (this.fetch2Timeout) {
      this.homey.clearTimeout(this.fetch2Timeout);
      this.fetch2Timeout = undefined;
    }
  }

  async fetchParameters2(): Promise<void> {
    try {
      if (this.getAvailable()) {
        if (this.getSetting('IP_Address').endsWith('.xxx')) {
          this.log('IP_Address not set');
          await this.setUnavailable(this.homey.__('unavailable.set_ip_address'));
        } else {
          await this._api.read(READ_PARAMETERS_2);
        }
      }
    } catch (err) {
      this.log('fetchSensors error', err);
    } finally {
      this.addFetchTimeout2();
    }
  }

  onUpdateValues(result: ModbusResultParameters, device: any): void {
    const resultAsMap: ModbusResultParametersMap = result.reduce((obj, r) => {
      // @ts-ignore
      obj[r.short] = r;
      return obj;
    }, {});

    device.updateNumber("target_temperature", resultAsMap['REG_TC_SP']);
    device.updateNumber("measure_temperature", resultAsMap['REG_SENSOR_SAT']);
    device.updateNumber("measure_temperature.outdoor_air_temp", resultAsMap['REG_SENSOR_OAT']);
    device.updateNumber("measure_temperature.supply_air_temp", resultAsMap['REG_SENSOR_SAT']);
    device.updateNumber("measure_temperature.extract_air_temp", resultAsMap['REG_SENSOR_PDM_EAT_VALUE']);
    device.updateNumber("measure_temperature.overheat_temp", resultAsMap['REG_SENSOR_OHT']);
    device.updateNumber("measure_humidity", resultAsMap['REG_SENSOR_RHS_PDM']);
    device.updateNumber("eaf_reg_speed", resultAsMap['REG_SENSOR_RPM_EAF']);
    device.updateNumber("eaf_rpm", resultAsMap['REG_SENSOR_RPM_EAF']);
    device.updateNumber("saf_reg_speed", resultAsMap['REG_SENSOR_RPM_SAF']);
    device.updateNumber("saf_rpm", resultAsMap['REG_SENSOR_RPM_SAF']);
    device.updateMode(resultAsMap['REG_USERMODE_MODE']);
    device.updateFanMode(resultAsMap['REG_USERMODE_MANUAL_AIRFLOW_LEVEL_SAF']);
    device.updateEcoMode(resultAsMap['REG_ECO_MODE_ON_OFF']);
    device.updateFilterTimeLeft(resultAsMap['REG_FILTER_REMAINING_TIME_L'], resultAsMap['REG_FILTER_REMAINING_TIME_H']);
  }

  async updateNumber(cap: string, resultParameter?: ModbusResultParameter, factor = 1): Promise<void> {
    const toValue = resultParameter?.value as number;
    if (toValue !== undefined && toValue !== null && this.hasCapability(cap)) {
      await this.setCapabilityValue(cap, Math.round(10 * toValue / factor) / 10).catch(err => this.log(err));
    }
  }

  async updateMode(resultParameter?: ModbusResultParameter): Promise<void> {
    try {
      const toValue = resultParameter?.value;
      if (toValue !== undefined && toValue !== null) {
        const theValue = `${toValue}`;
        if (MODES_LIST[theValue]) {
          await this.setCapabilityValue('systemair_mode_iam', theValue).catch(err => this.error(err));
        }
        await this.setCapabilityValue('systemair_mode_iam_ro', MODES[theValue] ? MODES[theValue] : theValue).catch(err => this.error(err));
      }
    } catch (err) {
      this.log('Update mode failed:', err);
    }
  }

  async updateFanMode(resultParameter?: ModbusResultParameter): Promise<void> {
    try {
      const toValue = resultParameter?.value;
      if (toValue !== undefined && toValue !== null) {
        const theValue = `${toValue}`;
        if (FAN_MODES_LIST[theValue]) {
          await this.setCapabilityValue('systemair_fan_mode_iam', theValue).catch(err => this.error(err));
        }
        await this.setCapabilityValue('systemair_fan_mode_iam_ro', FAN_MODES[theValue] ? FAN_MODES[theValue] : theValue).catch(err => this.error(err));
      }
    } catch (err) {
      this.log('Update fan mode failed:', err);
    }
  }

  async updateEcoMode(resultParameter?: ModbusResultParameter): Promise<void> {
    try {
      const toValue = resultParameter?.value as boolean;
      if (toValue !== undefined && toValue !== null) {
        await this.setCapabilityValue('eco_mode', toValue).catch(err => this.error(err));
      }
    } catch (err) {
      this.log('Update ECO mode failed:', err);
    }
  }

  async updateFilterTimeLeft(resultParameterL?: ModbusResultParameter, resultParameterH?: ModbusResultParameter): Promise<void> {
    try {
      const toValueL = resultParameterL?.value as number;
      const toValueH = resultParameterH?.value as number;
      if (toValueL !== undefined && toValueL !== null && toValueH !== undefined && toValueH !== null) {
        const theValue = toValueL + toValueH * 65565;
        await this.setCapabilityValue('filter_time_left', Math.ceil(theValue / 86400)).catch(err => this.log(err));
      }
    } catch (err) {
      this.log('Update filter time left failed:', err);
    }
  }

  async onUpdateTargetTemperature(value: number, opts: any): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this._api.write(READ_PARAMETERS_MAP['REG_TC_SP'], value);
      this.log(`set target temperature OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateMode(value: string, opts: any): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES[value] ? MODES[value] : value).catch(err => this.error(err));
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], Number(value) + 1);
      this.log(`set mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateFanMode(value: string, opts: any): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_fan_mode_iam_ro', FAN_MODES[value] ? FAN_MODES[value] : value).catch(err => this.error(err));
      await this._api.write(READ_PARAMETERS_MAP['REG_USERMODE_MANUAL_AIRFLOW_LEVEL_SAF'], value);
      this.log(`set fan mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setCrowdedMode(period: number): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES['2']).catch(err => this.error(err));
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_CROWDED_TIME'], period);
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], 3);
      this.log(`crowded mode started for ${period} hours`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setRefreshMode(period: number): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES['3']).catch(err => this.error(err));
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_REFRESH_TIME'], period);
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], 4);
      this.log(`refresh mode started for ${period} minutes`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setFireplaceMode(period: number): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES['4']).catch(err => this.error(err));
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_FIREPLACE_TIME'], period);
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], 5);
      this.log(`fireplace mode started for ${period} minutes`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setAwayMode(period: number): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES['5']).catch(err => this.error(err));
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_AWAY_TIME'], period);
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], 6);
      this.log(`away mode started for ${period} hours`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setHolidayMode(period: number): Promise<void> {
    try {
      this.clearFetchTimeout();
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES['6']).catch(err => this.error(err));
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HOLIDAY_TIME'], period);
      await this._api.write(UPDATE_PARAMETERS_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], 7);
      this.log(`holiday mode started for ${period} days`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setEcoMode(enabled: string): Promise<void> {
    try {
      this.clearFetchTimeout();
      const eco_mode = enabled === 'true';
      await this.setCapabilityValue('eco_mode', eco_mode).catch(err => this.error(err));
      await this._api.write(READ_PARAMETERS_MAP['REG_ECO_MODE_ON_OFF'], eco_mode);
      this.log(`ECO mode: enabled = ${enabled}`);
    } finally {
      this.addFetchTimeout();
    }
  }

}
