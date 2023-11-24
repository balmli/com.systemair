import Homey, {DiscoveryResult, DiscoveryResultMAC} from 'homey';

import {
  ModbusResultParameter,
  ModbusResultParameters,
  ModbusResultParametersMap,
  OPERATION_PARAMETERS,
  SENSOR_PARAMETERS,
  PARAMETER_MAP,
  CONFIG_PARAMETERS,
  ALARM_PARAMETERS,
  FUNCTION_PARAMETERS,
} from "../SystemairIAMModbus/constants";
import {SystemairSaveConnectApi} from "./systemair_saveconnect_api";

const {MODES_LIST, MODES, FAN_MODES_LIST, FAN_MODES} = require("../SystemairIAM/constants");

module.exports = class SystemairIAMModbusDevice extends Homey.Device {

  _api!: SystemairSaveConnectApi;
  fetchTimeout?: NodeJS.Timeout;
  lastFetchParams?: number;
  lastFetchConfig?: number;
  lastFetchAlarms?: number;
  lastFetchFunctions?: number;
  updateTargetTempTimeout?: NodeJS.Timeout;
  updateModeTimeout?: NodeJS.Timeout;
  updateFanModeTimeout?: NodeJS.Timeout;
  userModeMap!: Map<string, number>;

  async onInit() {
    await this.migrate();

    this.userModeMap = new Map<string, number>();

    this._api = new SystemairSaveConnectApi({
      device: this,
      homey: this.homey,
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
      return this.onUpdateFanMode(value);
    });

    this.addFetchTimeout(1);
    this.log('device initialized');
  }

  onDiscoveryResult(dResult: DiscoveryResult): boolean {
    const discoveryResult = dResult as DiscoveryResultMAC;
    const response = discoveryResult.id === this.getData().id;
    this.log('*********** Device: onDiscoveryResult', discoveryResult, this.getData().id);
    if (response) {
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
      if (this.hasCapability('eaf_reg_speed')) {
        await this.removeCapability('eaf_reg_speed');
      }
      if (this.hasCapability('eaf_rpm')) {
        await this.removeCapability('eaf_rpm');
      }
      if (this.hasCapability('saf_reg_speed')) {
        await this.removeCapability('saf_reg_speed');
      }
      if (this.hasCapability('saf_rpm')) {
        await this.removeCapability('saf_rpm');
      }
      if (!this.hasCapability('meter_saf_rpm')) {
        await this.addCapability('meter_saf_rpm');
      }
      if (!this.hasCapability('meter_saf_reg_speed')) {
        await this.addCapability('meter_saf_reg_speed');
      }
      if (!this.hasCapability('meter_eaf_rpm')) {
        await this.addCapability('meter_eaf_rpm');
      }
      if (!this.hasCapability('meter_eaf_reg_speed')) {
        await this.addCapability('meter_eaf_reg_speed');
      }
      if (!this.hasCapability('systemair_fan_mode_iam_prev')) {
        await this.addCapability('systemair_fan_mode_iam_prev');
      }
    } catch (err) {
      this.log('migrate error:', err);
    }
  }

  async onAdded(): Promise<void> {
    this.log('device added');
  }

  onDeleted(): void {
    this.clearFetchTimeout();
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
      }
      this._api.resetSocket();
    }
    if (changedKeys.includes('Polling_Interval')) {
      this.addFetchTimeout();
    }
    if (changedKeys.includes('temp_report_interval')) {
      this.addFetchTimeout();
    }
  }

  addFetchTimeout(seconds?: number): void {
    this.clearFetchTimeout();
    const settings = this.getSettings();
    const interval = seconds || settings.Polling_Interval || 10;
    this.fetchTimeout = this.homey.setTimeout(() => this.fetchParameters(), 1000 * interval);
  }

  clearFetchTimeout(): void {
    if (this.fetchTimeout) {
      this.homey.clearTimeout(this.fetchTimeout);
      this.fetchTimeout = undefined;
    }
  }

  async fetchParameters(): Promise<void> {
    try {
      if (this.getAvailable()) {
        if (this.getSetting('IP_Address').endsWith('.xxx')) {
          this.log('IP_Address not set');
          await this.setUnavailable(this.homey.__('unavailable.set_ip_address'));
        } else {
          try {
            await this._api.read(OPERATION_PARAMETERS).catch((err: any) => this.log(err));
          } catch (err) {
          }
          const now = Date.now();
          const settings = this.getSettings();
          if (!this.lastFetchParams || now - this.lastFetchParams > (settings.temp_report_interval * 1000)) {
            this.homey.setTimeout(async () => {
              try {
                await this._api.read(SENSOR_PARAMETERS).catch((err: any) => this.log(err));
                this.lastFetchParams = now;
              } catch (err) {
              }
            }, 1000);
          }
          if (!this.lastFetchFunctions || now - this.lastFetchFunctions > 30 * 1000) {
            this.homey.setTimeout(async () => {
              try {
                await this._api.read(FUNCTION_PARAMETERS).catch((err: any) => this.log(err));
                this.lastFetchFunctions = now;
              } catch (err) {
              }
            }, 3000);
          }
          if (!this.lastFetchAlarms || now - this.lastFetchAlarms > 5 * 60 * 1000) {
            this.homey.setTimeout(async () => {
              try {
                await this._api.read(ALARM_PARAMETERS).catch((err: any) => this.log(err));
                this.lastFetchAlarms = now;
              } catch (err) {
              }
            }, 5000);
          }
          if (!this.lastFetchConfig || now - this.lastFetchConfig > 10 * 60 * 1000) {
            this.homey.setTimeout(async () => {
              try {
                await this._api.read(CONFIG_PARAMETERS).catch((err: any) => this.log(err));
                this.lastFetchConfig = now;
              } catch (err) {
              }
            }, 8000);
          }
        }
      }
    } catch (err) {
      this.log('fetchSensors error', err);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateValues(result: ModbusResultParameters, device: any): Promise<void> {
    const resultAsMap: ModbusResultParametersMap = result.reduce((obj, r) => {
      // @ts-ignore
      obj[r.short] = r;
      return obj;
    }, {});

    await device.updateConfig(resultAsMap);
    if (!device.updateTargetTempTimeout) {
      await device.updateNumber("target_temperature", resultAsMap['REG_TC_SP']);
    }
    await device.updateNumber("measure_temperature", resultAsMap['REG_SENSOR_SAT']);
    await device.updateNumber("measure_temperature.outdoor_air_temp", resultAsMap['REG_SENSOR_OAT']);
    await device.updateNumber("measure_temperature.supply_air_temp", resultAsMap['REG_SENSOR_SAT']);
    await device.updateNumber("measure_temperature.extract_air_temp", resultAsMap['REG_SENSOR_PDM_EAT_VALUE']);
    await device.updateNumber("measure_temperature.overheat_temp", resultAsMap['REG_SENSOR_OHT']);
    await device.updateNumber("measure_humidity", resultAsMap['REG_SENSOR_RHS_PDM']);
    await device.updateNumber("meter_saf_rpm", resultAsMap['REG_SENSOR_RPM_SAF']);
    await device.updateNumber("meter_saf_reg_speed", resultAsMap['REG_OUTPUT_SAF']);
    await device.updateNumber("meter_eaf_rpm", resultAsMap['REG_SENSOR_RPM_EAF']);
    await device.updateNumber("meter_eaf_reg_speed", resultAsMap['REG_OUTPUT_EAF']);
    if (!device.updateModeTimeout) {
      await device.updateMode(resultAsMap['REG_USERMODE_MODE']);
    }
    if (!device.updateFanModeTimeout) {
      await device.updateFanMode(resultAsMap['REG_USERMODE_MANUAL_AIRFLOW_LEVEL_SAF']);
    }
    await device.updateEcoMode(resultAsMap['REG_ECO_MODE_ON_OFF']);
    await device.updateFilterTimeLeft(resultAsMap['REG_FILTER_REMAINING_TIME_L'], resultAsMap['REG_FILTER_REMAINING_TIME_H']);
    await device.updateAlarms(resultAsMap);
    await device.updateFunctions(resultAsMap);
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
      const mode = this.getCapabilityValue('systemair_mode_iam_ro');
      const toValue = this.userModeMap.has(mode) ? this.userModeMap.get(mode) : resultParameter?.value;
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

  async updateConfig(resultMap: ModbusResultParametersMap): Promise<void> {
    if (resultMap['REG_USERMODE_CROWDED_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Crowded', resultMap['REG_USERMODE_CROWDED_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_USERMODE_REFRESH_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Refresh', resultMap['REG_USERMODE_REFRESH_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_USERMODE_FIREPLACE_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Fireplace', resultMap['REG_USERMODE_FIREPLACE_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_USERMODE_AWAY_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Away', resultMap['REG_USERMODE_AWAY_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_USERMODE_HOLIDAY_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Holiday', resultMap['REG_USERMODE_HOLIDAY_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_USERMODE_COOKERHOOD_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Cooker Hood', resultMap['REG_USERMODE_COOKERHOOD_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_USERMODE_VACUUMCLEANER_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('Vacuum Cleaner', resultMap['REG_USERMODE_VACUUMCLEANER_AIRFLOW_LEVEL_SAF'].value as number);
    }
    if (resultMap['REG_PRESSURE_GUARD_AIRFLOW_LEVEL_SAF']) {
      this.userModeMap.set('PressureGuard', resultMap['REG_PRESSURE_GUARD_AIRFLOW_LEVEL_SAF'].value as number);
    }
  }

  async updateAlarms(resultMap: ModbusResultParametersMap): Promise<void> {
    try {
      const curAlarms = this.getStoreValue('alarms');
      const newAlarms = {...curAlarms};
      for (let a of ALARM_PARAMETERS) {
        const key = a.short;
        if (resultMap[key]) {
          const newValue = resultMap[key].value;
          const prevValue = curAlarms ? curAlarms[key] : undefined;
          newAlarms[key] = newValue;
          if (prevValue && newValue !== prevValue && (newValue === 1 || newValue === true)) {
            this.log(`Alarm triggered: ${a.description} (${key}): ${prevValue} -> ${newValue}`);
            await this.homey.flow.getDeviceTriggerCard('alarm').trigger(this, {
              alarm_code: key,
              alarm_description: a.description
            }, {
              alarm_code: key
            }).catch(err => this.error(err));
            await this.homey.flow.getDeviceTriggerCard('alarm_specific').trigger(this, {
              alarm_code: key,
              alarm_description: a.description
            }, {
              alarm_code: key
            }).catch(err => this.error(err));
          }
        }
      }
      await this.setStoreValue('alarms', newAlarms).catch(err => this.error(err));
    } catch (err) {
      this.log('Update alarms error:', err);
    }
  }

  getAlarmTypes() {
    return ALARM_PARAMETERS.map(a => ({
      id: a.short,
      name: a.description
    }));
  }

  hasAlarm(alarmId: string) {
    const curAlarms = this.getStoreValue('alarms');
    return curAlarms && curAlarms[alarmId] ? (curAlarms[alarmId] === 1 || curAlarms[alarmId] === true) : false;
  }

  async updateFunctions(resultMap: ModbusResultParametersMap): Promise<void> {
    try {
      const curFunctions = this.getStoreValue('functions');
      const newFunctions = {...curFunctions};
      for (let a of FUNCTION_PARAMETERS) {
        const key = a.short;
        if (resultMap[key]) {
          const newValue = resultMap[key].value;
          const prevValue = curFunctions ? curFunctions[key] : undefined;
          newFunctions[key] = newValue;
          //this.log(`${a.description} (${key}): ${prevValue} -> ${newValue}`);
          if (prevValue !== undefined && newValue !== prevValue) {
            if (newValue) {
              this.log(`Function activated: ${a.description} (${key}): ${prevValue} -> ${newValue}`);
              await this.homey.flow.getDeviceTriggerCard('function_activated').trigger(this, {
                function_code: key,
                function_description: a.description
              }, {
                function_code: key
              }).catch(err => this.error(err));
              await this.homey.flow.getDeviceTriggerCard('function_specific_activated').trigger(this, {
                function_code: key,
                function_description: a.description
              }, {
                function_code: key
              }).catch(err => this.error(err));
            } else {
              this.log(`Function deactivated: ${a.description} (${key}): ${prevValue} -> ${newValue}`);
              await this.homey.flow.getDeviceTriggerCard('function_deactivated').trigger(this, {
                function_code: key,
                function_description: a.description
              }, {
                function_code: key
              }).catch(err => this.error(err));
              await this.homey.flow.getDeviceTriggerCard('function_specific_deactivated').trigger(this, {
                function_code: key,
                function_description: a.description
              }, {
                function_code: key
              }).catch(err => this.error(err));
            }
          }
        }
      }
      await this.setStoreValue('functions', newFunctions).catch(err => this.error(err));
    } catch (err) {
      this.log('Update functions error:', err);
    }
  }

  getFunctionTypes() {
    return FUNCTION_PARAMETERS.map(a => ({
      id: a.short,
      name: a.description
    }));
  }

  hasFunctionActivated(functionId: string) {
    const curFunctions = this.getStoreValue('functions');
    return curFunctions && curFunctions[functionId] ? curFunctions[functionId] === true : false;
  }

  async onUpdateTargetTemperature(value: number, opts: any): Promise<void> {
    if (!this.getAvailable()) {
      this.log(`STOP`);
      return;
    }
    try {
      this.log(`TRY`);
      this.clearFetchTimeout();
      this.updateTargetTempTimeout = this.homey.setTimeout(() => {
        this.updateTargetTempTimeout = undefined;
      }, 10000);
      await this._api.write(PARAMETER_MAP['REG_TC_SP'], value);
      this.log(`Set target temperature OK: ${value}`);
    } finally {
      this.log(`FINALLY`);
      this.addFetchTimeout();
    }
  }

  async onUpdateMode(value: string, opts: any): Promise<void> {
    if (!this.getAvailable()) {
      return;
    }
    try {
      this.clearFetchTimeout();
      this.updateModeTimeout = this.homey.setTimeout(() => {
        this.updateModeTimeout = undefined;
      }, 10000);
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES[value] ? MODES[value] : value).catch(err => this.error(err));
      await this._api.write(PARAMETER_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], Number(value) + 1);
      this.log(`Set mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateFanMode(value: string): Promise<void> {
    if (!this.getAvailable()) {
      return;
    }
    try {
      this.clearFetchTimeout();
      const prevValue = this.getCapabilityValue('systemair_fan_mode_iam');
      if (value === 'PREVIOUS') {
        value = this.getCapabilityValue('systemair_fan_mode_iam_prev');
        if (!!value) {
          await this.setCapabilityValue('systemair_fan_mode_iam', value).catch(err => this.error(err));
          this.log(`Roll back to previous fan mode: ${value}`);
        }
      }
      if (!!value) {
        this.updateFanModeTimeout = this.homey.setTimeout(() => {
          this.updateFanModeTimeout = undefined;
        }, 10000);
        await this.setCapabilityValue('systemair_fan_mode_iam_ro', FAN_MODES[value] ? FAN_MODES[value] : value).catch(err => this.error(err));
        if (!!prevValue) {
          await this.setCapabilityValue('systemair_fan_mode_iam_prev', prevValue).catch(err => this.error(err));
        }
        await this._api.write(PARAMETER_MAP['REG_USERMODE_MANUAL_AIRFLOW_LEVEL_SAF'], value);
        this.log(`Set fan mode OK: ${value}`);
      }
    } finally {
      this.addFetchTimeout();
    }
  }

  async setCrowdedMode(period: number): Promise<void> {
    await this.setMode('Crowded', 3, period);
  }

  async setRefreshMode(period: number): Promise<void> {
    await this.setMode('Refresh', 4, period);
  }

  async setFireplaceMode(period: number): Promise<void> {
    await this.setMode('Fireplace', 5, period);
  }

  async setAwayMode(period: number): Promise<void> {
    await this.setMode('Away', 6, period);
  }

  async setHolidayMode(period: number): Promise<void> {
    await this.setMode('Holiday', 7, period);
  }

  async setMode(mode: string, code: number, period: number): Promise<void> {
    if (!this.getAvailable()) {
      return;
    }
    try {
      this.clearFetchTimeout();
      this.updateModeTimeout = this.homey.setTimeout(() => {
        this.updateModeTimeout = undefined;
      }, 10000);
      await this.setCapabilityValue('systemair_mode_iam_ro', MODES[`${(code - 1)}`]).catch(err => this.error(err));
      await this.updateFanMode();
      await this._api.write(PARAMETER_MAP[`REG_USERMODE_${mode.toUpperCase()}_TIME`], period);
      await this._api.write(PARAMETER_MAP['REG_USERMODE_HMI_CHANGE_REQUEST'], code);
      this.log(`${mode} mode started, period: ${period}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async setEcoMode(enabled: string): Promise<void> {
    if (!this.getAvailable()) {
      return;
    }
    try {
      this.clearFetchTimeout();
      const eco_mode = enabled === 'true';
      await this.setCapabilityValue('eco_mode', eco_mode).catch(err => this.error(err));
      await this._api.write(PARAMETER_MAP['REG_ECO_MODE_ON_OFF'], eco_mode);
      this.log(`ECO mode: enabled = ${enabled}`);
    } finally {
      this.addFetchTimeout();
    }
  }

}
