'use strict';

const Homey = require('homey');
const WebSocket = require('ws');

const SECURE_IAM_ID = 'iam_id';
const SECURE_PASSWORD = 'password';

module.exports = class SystemairIAMDevice extends Homey.Device {

  onInit() {
    this.log('device initialized');

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
    setTimeout(() => this.fetchParamFileMappings(), 10000);
  }

  async onAdded() {
    this.log('device added');
  }

  onDeleted() {
    this._clearFetchTimeout();
    this._clearSocketTimeout();
    this.log('device deleted');
  }

  async fetchParamFileMappings() {
    try {
      await this.connectAndSend(this._paramFileMappingsCmd())
    } catch (err) {
      this.log('fetchParamFileMappings error', err);
    }
  }

  addFetchTimeout(seconds = 30) {
    this._clearFetchTimeout();
    this.fetchTimeout = setTimeout(() => this.fetchSensors(), 1000 * seconds);
  }

  _clearFetchTimeout() {
    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
      this.fetchTimeout = undefined;
    }
  }

  async fetchSensors() {
    try {
      await this.connectAndSend(this._readCmd([
        "components_filter_time_left",
        "eco_mode",
        "control_regulation_temp_unit",
        "main_temperature_offset",
        "mode_change_request",
        "main_airflow",
        "demand_control_fan_speed",
        "control_regulation_speed_after_free_cooling_saf",
        "control_regulation_speed_after_free_cooling_eaf",
        "outdoor_air_temp",
        "supply_air_temp",
        "overheat_temp",
        "rh_sensor"
      ]));
    } catch (err) {
      this.log('fetchSensors error', err);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateTargetTemperature(value, opts) {
    try {
      this._clearFetchTimeout();
      await this.connectAndSend(this._writeCmd({
        main_temperature_offset: value * 10
      }));
      this.log(`set target temperature OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateMode(value, opts) {
    try {
      this._clearFetchTimeout();
      await this.connectAndSend(this._writeCmd({
        mode_change_request: value
      }));
      this.log(`set mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  async onUpdateFanMode(value, opts) {
    try {
      this._clearFetchTimeout();
      await this.connectAndSend(this._writeCmd({
        main_airflow: value
      }));
      this.log(`set fan mode OK: ${value}`);
    } finally {
      this.addFetchTimeout();
    }
  }

  _connection() {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this._addSocketTimeout();
        resolve(true);
      } else {
        const uri = this._getWsUri();
        const self = this;
        self.socket = new WebSocket(uri);

        self.socket.on('open', data => {
          self.socket.send(JSON.stringify(self._validationRequestCmd()), error => {
            if (error) {
              self.log('_connection validation request error', error);
              throw new Error('Unable to log in');
            }
          });

        }).on('message', data => {
          data = JSON.parse(data);

          if (data.type === 'ID_VALIDATION') {
            self.socket.send(JSON.stringify(self._loginCmd()), error => {
              if (error) {
                self.log('_connection login error', error);
                throw new Error('Unable to log in');
              }
            });
          } else if (data.type === 'LOGGED_IN') {
            //self.log('socket message resolve LOGGED_IN');
            self._addSocketTimeout();
            resolve(true);
          }

          self.handleMessage(data);
        }).on('close', () => {
          self.log('socket close');
          self._clearSocketTimeout();
          self.socket = null;
        }).on('error', err => {
          if (err.code && err.code === 'ECONNREFUSED') {
            throw new Error(`Connection is refused (${uri})`);
          } else if (err.code && err.code === 'EHOSTUNREACH') {
            throw new Error(`Connection is unreachable (${uri})`);
          } else if (err.code && err.code === 'ENETUNREACH') {
            throw new Error(`Connection is unreachable (${uri})`);
          } else {
            self.log('_connection ERROR', err);
            reject(err);
          }
        });
      }
    });
  }

  _getWsUri() {
    return 'wss://homesolutions.systemair.com/ws/';
  }

  _addSocketTimeout() {
    this._clearSocketTimeout();
    this.socketTimeout = setTimeout(() => this._onSocketTimeout(), 1000 * 60 * 2);
  }

  _clearSocketTimeout() {
    if (this.socketTimeout) {
      clearTimeout(this.socketTimeout);
      this.socketTimeout = undefined;
    }
  }

  _onSocketTimeout() {
    if (this.socket) {
      this.log('_onSocketTimeout');
      this.socket.close();
    }
  }

  _validationRequestCmd() {
    const iamId = this.getStoreValue(SECURE_IAM_ID);
    this._sessionClientId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      type: 'LOGIN',
      machineId: iamId,
      passCode: 'ID_VALIDATION_REQUEST',
      sessionClientId: this._sessionClientId,
    };
  }

  _loginCmd() {
    const iamId = this.getStoreValue(SECURE_IAM_ID);
    const password = this.getStoreValue(SECURE_PASSWORD);
    return {
      type: 'LOGIN',
      machineId: iamId,
      passCode: password,
      sessionClientId: this._sessionClientId,
    };
  }

  _paramFileMappingsCmd(items) {
    return {
      type: 'PARAM_FILE_MAPPINGS',
    };
  }

  _readCmd(items) {
    return {
      type: 'READ',
      idsToRead: items,
    };
  }

  _writeCmd(values) {
    return {
      type: 'WRITE',
      valuesToWrite: values,
    };
  }

  async _send(aCmd) {
    if (!this.socket) {
      throw new Error('Not connected');
    }
    return new Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(aCmd), error => {
        if (error) {
          this.log('send ERROR', aCmd, error);
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  async connectAndSend(aCmd) {
    await this._connection();
    await this._send(aCmd);
  }

  async handleMessage(message) {
    if (message.type === 'ID_VALIDATION') {
      this.log('handleMessage: id validation', message);
    } else if (message.type === 'LOGGED_IN') {
      this.log('handleMessage: logged in', message);
    } else if (message.type === 'PARAM_FILE_MAPPINGS') {
      this.log('handleMessage: param file mappings', message.mappings);
    } else if (message.type === 'READ') {
      this.log('handleMessage: read', message.readValues);
      this.updateNumber("target_temperature", message.readValues.main_temperature_offset, 10);
      this.updateNumber("measure_temperature", message.readValues.supply_air_temp, 10);
      this.updateNumber("measure_temperature.outdoor_air_temp", message.readValues.outdoor_air_temp, 10);
      this.updateNumber("measure_temperature.supply_air_temp", message.readValues.supply_air_temp, 10);
      this.updateNumber("measure_humidity", message.readValues.rh_sensor);
      this.updateString("systemair_mode_iam", message.readValues.mode_change_request);
      this.updateString("systemair_fan_mode_iam", message.readValues.main_airflow);
    } else if (message.type === 'VALUE_CHANGED') {
      this.log('handleMessage: value changed', message);
    } else if (message.type === 'ERROR') {
      this.log('handleMessage: ERROR', message);
    } else {
      this.log('handleMessage: unknown type', message.type, message);
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
