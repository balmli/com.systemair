'use strict';

const http = require('http.min');
const WebSocket = require('ws');
const jwt_decode = require('jwt-decode');
const { default: PQueue } = require('p-queue');

module.exports = class SystemairIAMApi {

  constructor(options) {
    if (options == null) {
      options = {}
    }
    this._device = options.device;
    this._homey = options.homey;
    this._logger = options.logger;
    this._onUpdateValues = options.onUpdateValues;
    this._commandQueue = new PQueue({ concurrency: 1 });
  }

  _getUri() {
    return 'https://homesolutions.systemair.com/portal-gateway/api';
  }

  async loginPortal(username, password) {
    const response = await http.post({
        uri: `${this._getUri()}`,
        json: true
      },
      {
        operationName: "Login",
        query: "query Login($email: String!, $password: String!) {\n  Login(email: $email, password: $password)\n}\n",
        variables: {
          email: username,
          password: password
        }
      }
    );
    if (response.response.statusCode !== 200 || response.data && response.data.errors && response.data.errors.length > 0) {
      this._logger('Login portal: Wrong email or password:', response.response.statusCode, response.response.statusMessage, response.data);
      throw new Error(this._homey.__('errors.wrong_email_or_password'));
    }
    if (!response.data || !response.data.data || !response.data.data.Login) {
      this._logger('Login portal: Invalid login response:', response.response.statusCode, response.response.statusMessage, response.data);
      throw new Error(this._homey.__('errors.invalid_login_response'));
    }
    const token = response.data.data.Login;
    this._logger(`Login portal: OK`);
    return token;
  }

  async getAccountData(token) {
    const response = await http.post({
        uri: `${this._getUri()}`,
        headers: {
          'x-access-token': token
        },
        json: true
      },
      {
        variables: {},
        query: "{\n  GetMachinesOfUser(fetchRegisterValues: true) {\n    userIdentifier\n    machineIdentifier\n    name\n    tags\n    registerValues\n  }\n}\n"
      });
    this._logger('Get account data:', response.data.data.GetMachinesOfUser);
    return response.data.data.GetMachinesOfUser.map(item => ({
      machineIdentifier: item.machineIdentifier,
      name: item.name,
      unit_model: item.registerValues.unit_model
    }));
  }

  async _refreshToken() {
    try {
      const token = this._device.getStoreValue('token');
      if (token) {
        const decoded = jwt_decode(token);
        const now = new Date().getTime();
        if (now - decoded.iat * 1000 > 86400 * 1000) {
          this._logger('Will refresh token');
          const username = this._device.getStoreValue('username');
          const password = this._device.getStoreValue('password');
          const newToken = await this.loginPortal(username, password);
          await this._device.setStoreValue('token', newToken);
          if (!this._device.getAvailable()) {
            await this._device.setAvailable();
          }
          this._logger('Token refreshed');
        }
      } else {
        await this._device.setUnavailable(this._homey.__('unavailable.missing_token'));
      }
    } catch (err) {
      this._logger('Token refresh failed', err);
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
          self.socket.send(JSON.stringify(self._loginCmd()), error => {
            if (error) {
              self._logger('_connection login error', error);
              self.socket.close();
              reject(this._homey.__('errors.unable_to_log_in'));
            }
          });

        }).on('message', data => {
          data = JSON.parse(data);

          if (data.type === 'LOGGED_IN') {
            self._addSocketTimeout();
            resolve(true);
          } else if (data.type === 'ERROR' && data.errorTypeId === 'UNIT_NOT_CONNECTED') {
            self._logger('_connection unit not connected error', data);
            self.socket.close();
            reject(this._homey.__('errors.unit_not_connected'));
          } else if (data.type === 'ERROR' && data.errorTypeId === 'ACCESS_DENIED_SEVERE') {
            self._logger('_connection access denied error', data);
            self.socket.close();
            reject(this._homey.__('errors.access_denied'));
          } else if (data.type === 'ERROR' && data.errorTypeId === 'WRONG_PASSWORD') {
            self._logger('_connection wrong password error', data);
            self.socket.close();
            this._device.setUnavailable(this._homey.__('unavailable.wrong_email_or_password'));
            reject(this._homey.__('errors.wrong_email_or_password'));
          } else {
            self._handleMessage(data);
          }
        }).on('close', () => {
          self._logger('socket close');
          self._clearSocketTimeout();
          self.socket = null;
        }).on('error', err => {
          if (err.code && err.code === 'ECONNREFUSED') {
            self._logger('_connection refused', err);
            self.socket.close();
            reject(this._homey.__('errors.connection_refused', { uri }));
          } else if (err.code && err.code === 'EHOSTUNREACH') {
            self._logger('_connection host unreachable', err);
            self.socket.close();
            reject(this._homey.__('errors.connection_unreachable', { uri }));
          } else if (err.code && err.code === 'ENETUNREACH') {
            self._logger('_connection net unreachable', err);
            self.socket.close();
            reject(this._homey.__('errors.connection_unreachable', { uri }));
          } else {
            self._logger('_connection ERROR', err);
            self.socket.close();
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
    this.socketTimeout = this._homey.setTimeout(() => this._onSocketTimeout(), 1000 * 60 * 2);
  }

  _clearSocketTimeout() {
    if (this.socketTimeout) {
      this._homey.clearTimeout(this.socketTimeout);
      this.socketTimeout = undefined;
    }
  }

  _onSocketTimeout() {
    if (this.socket) {
      this._logger('_onSocketTimeout');
      this.socket.close();
    }
  }

  _loginCmd() {
    const iamId = this._device.getStoreValue('iam_id');
    const token = this._device.getStoreValue('token');
    return {
      type: 'LOGIN',
      machineId: iamId,
      passCode: 'overridePw',
      sessionClientId: `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      token: token
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
      throw new Error(this._homey.__('errors.not_connected'));
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

  async read(aCmd) {
    return this._commandQueue.add(async () => {
      await this._refreshToken();
      if (this._device.getAvailable()) {
        await this._connection();
        await this._send(this._readCmd(aCmd));
      }
    });
  }

  async write(aCmd) {
    return this._commandQueue.add(async () => {
      await this._refreshToken();
      if (this._device.getAvailable()) {
        await this._connection();
        await this._send(this._writeCmd(aCmd));
      }
    });
  }

  async _handleMessage(message) {
    if (message.type === 'ID_VALIDATION') {
      this._logger('Handle message: id validation', message);
    } else if (message.type === 'LOGGED_IN') {
      this._logger('Handle message: logged in', message);
    } else if (message.type === 'PARAM_FILE_MAPPINGS') {
      this._logger('Handle message: param file mappings', message.mappings);
    } else if (message.type === 'READ') {
      this._logger('Handle message: read', message.readValues);
      if (this._onUpdateValues) {
        this._onUpdateValues(message, this._device);
      }
    } else if (message.type === 'VALUE_CHANGED') {
      this._logger('Handle message: value changed', message);
      if (this._onUpdateValues) {
        this._onUpdateValues(message, this._device);
      }
    } else if (message.type === 'ERROR') {
      this._logger('Handle message: ERROR', message);
    } else {
      this._logger('Handle message: unknown type', message.type, message);
    }
  }

};
