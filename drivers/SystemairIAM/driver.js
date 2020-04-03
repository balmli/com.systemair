'use strict';

const Homey = require('homey');
const IAMApi = require('./systemair_iam_api');

module.exports = class SystemairIAMDriver extends Homey.Driver {

  onInit() {
    this.log('SystemairIAMDriver has been initialized');
  }

  onPair(socket) {
    let self = this;

    socket.on('password_input', (data, callback) => {

      const _api = new IAMApi({
        logger: this.log,
        iam: data.iam,
        password: data.password
      });

      _api._connection()
        .then(response => {
          callback(null, response);
        })
        .catch(err => {
          self.log('SystemairIAMDriver login error', err);
          callback(err, null);
        });
    });

  }

};
