import net from 'net';
import {Device} from 'homey';
import {ModbusTCPClient} from 'jsmodbus';

import {ModbusResultParameters} from "./constants";

const {default: PQueue} = require('p-queue');

export interface SystemairIAMApiOptions {
  device: Device;
  logger: any;
  onUpdateValues: (result: ModbusResultParameters, device: any) => void;
}

export class SystemairIAMApi {
  _device: Device;
  _logger: any;
  _onUpdateValues: (result: ModbusResultParameters, device: any) => void;
  _commandQueue: any;
  _client?: ModbusTCPClient;
  _socket?: net.Socket;
  _socketTimeout?: NodeJS.Timeout;

  constructor(options: SystemairIAMApiOptions) {
    this._device = options.device;
    this._logger = options.logger;
    this._onUpdateValues = options.onUpdateValues;
    this._commandQueue = new PQueue({concurrency: 1});
  }

  resetSocket(): void {
    this._onSocketTimeout();
  }

  async _connection(): Promise<ModbusTCPClient | undefined> {
    return new Promise((resolve, reject) => {
      if (this._client) {
        this._addSocketTimeout();
        resolve(this._client);
      } else {
        const self = this;
        this._socket = new net.Socket();
        //console.log('connect', this._device.getSetting('IP_Address'), 502);
        this._client = new ModbusTCPClient(this._socket, 1, 5000);
        this._socket.on('ready', () => {
          self._logger('Socket ready');
          self._addSocketTimeout();
          resolve(this._client);
        }).on('close', () => {
          self._logger('Socket closed');
          self._clearSocketTimeout();
          self._socket = undefined;
          self._client = undefined;
        }).on('error', (error: any) => {
          self._logger('Socket error', error);
          if (error.code === "ECONNREFUSED") {
            const uri = `${error.address}:${error.port}`;
            //self._device.setUnavailable(self._device.homey.__('errors.connection_refused', {uri}));

          } else if (error.code === "EHOSTUNREACH") {
            const uri = `${error.address}:${error.port}`;
            //self._device.setUnavailable(self._device.homey.__('errors.connection_unreachable', {uri}));

          }
          self._socket?.end();
          reject('connect error');
        });
        this._socket.connect({
          host: this._device.getSetting('IP_Address'),
          port: 502,
        });
      }
    });
  }

  _addSocketTimeout() {
    this._clearSocketTimeout();
    this._socketTimeout = this._device.homey.setTimeout(() => this._onSocketTimeout(), 1000 * 60);
  }

  _clearSocketTimeout() {
    if (this._socketTimeout) {
      this._device.homey.clearTimeout(this._socketTimeout);
      this._socketTimeout = undefined;
    }
  }

  _onSocketTimeout() {
    this._socket?.end();
    this._socket = undefined;
    this._client = undefined;
  }

  async read(params: any) {
    return this._commandQueue.add(async () => {
        if (this._device.getAvailable()) {
          const client = await this._connection();
          if (client) {
            Promise.all(params.map((p: any) => client.readHoldingRegisters(p.register - 1, 1)))
              .then((results) => {
                const matched = this.matchResults(params, results);
                this._onUpdateValues(matched, this._device);
              })
              .catch((error) => {
                this._logger('Read error', error);
              });
          }
        }
      }
    );
  }

  matchResults = (params: any, results: any): ModbusResultParameters => {
    const matched: ModbusResultParameters = [];

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      const {metrics, response} = results[i];

      const value = response._body.valuesAsArray && response._body.valuesAsArray.length > 0
        ? param.boolean
          ? !!response._body.valuesAsArray[0]
          : response._body.valuesAsArray[0] / (param.scaleFactor || 1)
        : undefined;

      this._logger(`Register: ${param.register} ${param.short} = ${value} (transfer: ${metrics.transferTime} ms, cue: ${metrics.waitTime} ms)`);

      matched.push({
        ...param,
        value,
      });
    }

    return matched;
  }

  async write(params: any, values: any) {
    params = Array.isArray(params) ? params : [params];
    values = Array.isArray(values) ? values : [values];
    return this._commandQueue.add(async () => {
        if (this._device.getAvailable()) {
          const client = await this._connection();
          if (client) {
            Promise.all(params
              .map((param: any, i: number) => {
                const value = values[i];
                let toVal;
                if (typeof value === 'boolean') {
                  toVal = value ? 1 : 0;
                } else {
                  toVal = Number(value) * (param.scaleFactor || 1);
                  if (param.min !== undefined && toVal < param.min) {
                    toVal = param.min;
                  }
                  if (param.max !== undefined && toVal > param.max) {
                    toVal = param.max;
                  }
                }

                this._logger(`Write: ${param.register} ${param.short} = ${toVal}`);
                return client.writeSingleRegister(param.register - 1, toVal);
              }))
              .then((responses) => {
                responses.map((resp, i) => {
                  const {metrics} = resp;
                  const param = params[i];
                  this._logger(`Write OK: ${param.register} ${param.short} (transfer: ${metrics.transferTime} ms, cue: ${metrics.waitTime} ms)`);
                });
              })
              .catch((error) => {
                this._logger('Write error', error);
              });
          }
        }
      }
    );
  }

}