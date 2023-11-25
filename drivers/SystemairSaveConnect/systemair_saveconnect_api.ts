import {Device} from 'homey';

import {ModbusResultParameters, IntegerType} from "../SystemairIAMModbus/constants";

const http = require('http.min');

export interface SystemairSaveConnectApiOptions {
  device?: Device;
  homey: any;
  logger: any;
  onUpdateValues?: (result: ModbusResultParameters, device: any)=> Promise<void>;
}

export class SystemairSaveConnectApi {
  _device?: Device;
  _homey: any;
  _logger: any;
  _onUpdateValues?: (result: ModbusResultParameters, device: any) => Promise<void>;
  _errorCounter: number;

  constructor(options: SystemairSaveConnectApiOptions) {
    this._device = options.device;
    this._homey = options.homey;
    this._logger = options.logger;
    this._onUpdateValues = options.onUpdateValues;
    this._errorCounter = 0;
  }

  async checkConnection(ipAddress?: string): Promise<void> {
    const response = await http.get(`http://${ipAddress}/mread?{}`)

    if (response.response.statusCode !== 200) {
      this._logger('Failed to check connection:', response.response.statusCode, response.response.statusMessage, response.data);
      throw new Error(this._homey.__('pair.connection_refused'));
    }
  }

  async read(params: any) {
    if (!this._device) {
      this._logger("error: no device set")
      return
    }

    const ip = this._device.getSetting('IP_Address')
    const queryParams = params.map((p: any) => `%22${p.register - 1}%22:1`)
    const url = `http://${ip}/mread?{${queryParams.join(",")}}`

    const result = await http.get(url)

    if (result.response.statusCode !== 200) {
      this._logger("read request failed", result.response.statusCode, result.response.statusMessage, result.data)
      return
    }

    const matched = this.matchResults(params, JSON.parse(result.data));

    if (this._onUpdateValues && this._device) {
      this._onUpdateValues(matched, this._device);
    }
  }

  matchResults(params: any, results: any) : ModbusResultParameters {
    const matched: ModbusResultParameters = [];

    for (let ii = 0; ii < params.length; ii++) {
      const param = params[ii];
      const result = results[param.register - 1]
      let value
      if (param.boolean) {
        value = !!result
      } else {
        let parsed = parseInt(result)

        if (param.sig === IntegerType.INT && parsed > 1 << 15) {
          parsed = -(65536 - parsed)
        }
        value = parsed / (param.scaleFactor || 1)
      }

      this._logger(`Register ${param.register} ${param.short} = ${value} (${result})`)

      matched.push({
        ...param,
        value,
      })
    }

    return matched
  }

  async write(params: any, values: any) {
    params = Array.isArray(params) ? params : [params];
    values = Array.isArray(values) ? values : [values];

    if (!this._device) {
      this._logger("error: no device set")
      return
    }

    const ip = this._device.getSetting('IP_Address')
    const queryParams = params.map((param: any, idx: number) => {
      const value = values[idx]
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

      return `%22${param.register - 1}%22:${toVal}`
    })
    const url = `http://${ip}/mwrite?{${queryParams.join(",")}}`

    const result = await http.get(url)

    if (result.response.statusCode !== 200) {
      this._logger("write request failed", result.response.statusCode, result.response.statusMessage, result.data)
      return
    }

    this._logger("write request", result.response.statusCode, result.data)
  }

}
