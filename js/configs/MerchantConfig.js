module.exports = {
  // NOTE: value given for baseEndpoint here must reflect where the Merchant backend is running
  // If you modify baseEndpoint, please contact Signicat. The URL must be white listed in our systems.
  baseEndpoint: 'https://demo.signicat.com/mobileid-inapp',
  createAccountEndpointFromDevice: '/mobile/register/start',
  initAuthSessionEndpointFromDevice: '/mobile/authenticate/start',
  webRegInfoEndpoint: '/web/register/info',
};
