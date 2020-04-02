'use strict';

const Homey = require('homey');

module.exports = class SystemairIAMDriver extends Homey.Driver {

  onInit() {
    this.log('SystemairIAMDriver has been initialized');
  }

  onPair(socket) {
    let self = this;

    socket.on('password_input', (data, callback) => {
      callback(null, 'ok');
    });

  }

};
