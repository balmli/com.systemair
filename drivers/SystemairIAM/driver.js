'use strict';

const Homey = require('homey');
const IAMApi = require('./systemair_iam_api');

module.exports = class SystemairIAMDriver extends Homey.Driver {

  async onInit() {
    this.log('SystemairIAMDriver has been initialized');
  }

  async onPair(session) {
    session.setHandler('password_input', async (data) => {

      const _api = new IAMApi({
        logger: this.log,
        homey: this.homey,
        iam: data.iam,
        password: data.password
      });

      try {
        return await _api._connection();
      } catch (err) {
        this.log('SystemairIAMDriver login error', err);
        throw err;
      }
    });

  }

};
