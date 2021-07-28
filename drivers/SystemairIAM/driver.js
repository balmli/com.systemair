'use strict';

const Homey = require('homey');
const IAMApi = require('./systemair_iam_api');

module.exports = class SystemairIAMDriver extends Homey.Driver {

  async onInit() {
    this.log('SystemairIAMDriver has been initialized');
  }

  async onPair(session) {
    let api;
    let username = "";
    let password = "";
    let token;

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      api = new IAMApi({
        logger: this.log,
        homey: this.homey
      });

      try {
        token = await api.loginPortal(username, password);
        return true;
      } catch (err) {
        this.log('SystemairIAMDriver login error', err);
        throw err;
      }
    });

    session.setHandler("list_devices", async () => {
      const accountData = await api.getAccountData(token);
      return accountData.map(item => ({
        name: `${item.name} - ${item.unit_model}`,
        data: {
          id: item.machineIdentifier
        },
        store: {
          username: username,
          password: password,
          iam_id: item.machineIdentifier,
          token: token
        }
      }));
    });

  }

  async onRepair(session, device) {
    let api;
    let username = "";
    let password = "";
    let token;

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      api = new IAMApi({
        logger: this.log,
        homey: this.homey
      });

      try {
        token = await api.loginPortal(username, password);
        await device.setStoreValue('username', username);
        await device.setStoreValue('password', password);
        await device.setStoreValue('token', token);
        await device.setAvailable();
        await session.done();
        return true;
      } catch (err) {
        this.log('SystemairIAMDriver login error', err);
        throw err;
      }
    });
  }

};
