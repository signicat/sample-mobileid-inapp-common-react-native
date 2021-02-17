
import axios from 'axios';

const {
  createAccountEndpointFromDevice,
  initAuthSessionEndpointFromDevice,
  webRegInfoEndpoint,
} = require('./configs/MerchantConfig');

const RestClient = {
  startRegisterFromDevice(merchantServer, accountName, deviceName) {
    const startRegisterUrl = `${merchantServer + createAccountEndpointFromDevice}?externalRef=${accountName}&deviceName=${deviceName}`;
    return new Promise((resolve, reject) => this.get(startRegisterUrl, resolve, reject));
  },

  startAuthFromDevice(merchantServer, externalRef, deviceId) {
    const startAuthUrl = `${merchantServer + initAuthSessionEndpointFromDevice}?externalRef=${externalRef}&deviceId=${deviceId}`;
    return new Promise((resolve, reject) => this.get(startAuthUrl, resolve, reject));
  },

  getActivationCode(oidcAuthorizeSignicatUrl) {
    return new Promise((resolve, reject) => this.get(oidcAuthorizeSignicatUrl, resolve, reject));
  },

  informOperationComplete(completeUrl) {
    return new Promise((resolve, reject) => this.get(completeUrl, resolve, reject));
  },

  checkOperationStatus(statusUrl) {
    return new Promise((resolve, reject) => this.get(statusUrl, resolve, reject));
  },

  initAuthSession(authUrl) {
    return new Promise((resolve, reject) => this.get(authUrl, resolve, reject));
  },

  getWebRegInfo(merchantServer, validActivationCode) {
    const infoUrl = `${merchantServer + webRegInfoEndpoint}?activationCode=${validActivationCode}`;
    return new Promise((resolve, reject) => this.get(infoUrl, resolve, reject));
  },

  get(url, successFn, errorFn) {
    console.log(`GET ${url}`);
    axios.get(url, {}, { withCredentials: true })
      .then(this.checkResponseStatus)
      .then(this.checkJson)
      .then((response) => {
        successFn(response.data);
      })
      .catch((error) => {
        errorFn(error);
      });
  },

  post(url, body, successFn, errorFn) {
    console.log(`POST ${url}\n ${JSON.stringify(body)} =>`);
    axios.post(url, body, { withCredentials: true })
      .then(this.checkResponseStatus)
      .then(this.checkJson)
      .then((response) => {
        successFn(response.data);
      })
      .catch((error) => {
        errorFn(error);
      });
  },

  checkResponseStatus(response) {
    console.log(response.status);
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    const error = new Error(`Status code: ${response.status}`);
    error.response = response;
    throw error;
  },


  checkJson(response) {
    if (typeof response.data === 'object') {
      return response;
    }
    const error = new Error(`Expected JSON, but got: ${response.data}`);
    error.response = response;
    throw error;
  },

};

export { RestClient as default };
