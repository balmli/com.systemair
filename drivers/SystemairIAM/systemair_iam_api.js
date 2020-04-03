'use strict';

const WebSocket = require('ws');

const SECURE_IAM_ID = 'iam_id';
const SECURE_PASSWORD = 'password';

module.exports = class SystemairIAMApi {

  constructor(options) {
    if (options == null) {
      options = {}
    }
    this._device = options.device;
    this._logger = options.logger;
    this._onUpdateValues = options.onUpdateValues;
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
              self._logger('_connection validation request error', error);
              throw new Error('Unable to log in');
            }
          });

        }).on('message', data => {
          data = JSON.parse(data);

          if (data.type === 'ID_VALIDATION') {
            self.socket.send(JSON.stringify(self._loginCmd()), error => {
              if (error) {
                self._logger('_connection login error', error);
                throw new Error('Unable to log in');
              }
            });
          } else if (data.type === 'LOGGED_IN') {
            //self._logger('socket message resolve LOGGED_IN');
            self._addSocketTimeout();
            resolve(true);
          } else if (data.type === 'ERROR' && (data.errorTypeId === 'UNIT_NOT_CONNECTED' ||
            data.errorTypeId === 'ACCESS_DENIED_SEVERE' ||
            data.errorTypeId === 'WRONG_PASSWORD')) {
            throw new Error('Unable to log in');
          }

          self.handleMessage(data);
        }).on('close', () => {
          self._logger('socket close');
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
            self._logger('_connection ERROR', err);
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
      this._logger('_onSocketTimeout');
      this.socket.close();
    }
  }

  _validationRequestCmd() {
    const iamId = this._device.getStoreValue(SECURE_IAM_ID);
    this._sessionClientId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      type: 'LOGIN',
      machineId: iamId,
      passCode: 'ID_VALIDATION_REQUEST',
      sessionClientId: this._sessionClientId,
    };
  }

  _loginCmd() {
    const iamId = this._device.getStoreValue(SECURE_IAM_ID);
    const password = this._device.getStoreValue(SECURE_PASSWORD);
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
          this._logger('send ERROR', aCmd, error);
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

  async read(aCmd) {
    await this.connectAndSend(this._readCmd(aCmd));
  }

  async write(aCmd) {
    await this.connectAndSend(this._writeCmd(aCmd));
  }

  async handleMessage(message) {
    if (message.type === 'ID_VALIDATION') {
      this._logger('handleMessage: id validation', message);
    } else if (message.type === 'LOGGED_IN') {
      this._logger('handleMessage: logged in', message);
    } else if (message.type === 'PARAM_FILE_MAPPINGS') {
      this._logger('handleMessage: param file mappings', message.mappings);
    } else if (message.type === 'READ') {
      this._logger('handleMessage: read', message.readValues);
      if (this._onUpdateValues) {
        this._onUpdateValues(message, this._device);
      }
    } else if (message.type === 'VALUE_CHANGED') {
      this._logger('handleMessage: value changed', message);
      if (this._onUpdateValues) {
        this._onUpdateValues(message, this._device);
      }
    } else if (message.type === 'ERROR') {
      this._logger('handleMessage: ERROR', message);
    } else {
      this._logger('handleMessage: unknown type', message.type, message);
    }
  }

};
