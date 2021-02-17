const configFile = require('./config.json');

const configurations: Map<string, Object> = new Map();

class SignicatConfig {
  static get(id: string): Object {
    let configuration = configurations.get(id);
    if (configuration === undefined || configuration === null) {
      // Default to preprod
      configuration = configurations.get('preprod');
    }
    return configuration;
  }

  /* Return an array with environments */
  static getEnvironments() {
    const environments = [];
    const keys = configurations.keys();
    let environment = keys.next();
    while (!environment.done) {
      environments.push(Object.assign({}, { id: environment.value }, configurations.get(environment.value)));
      environment = keys.next();
    }
    return environments;
  }
}

if (configFile !== null) {
  configFile.forEach((c) => {
    const { id, ...configuration } = c;
    if (configuration.encapPublicKey !== '') {
      configurations.set(id, c);
    }
  });
}

export default SignicatConfig;
