import React, { Component } from 'react';
import {
  AppState,
  SafeAreaView,
  ScrollView,
  View,
  StatusBar,
  Alert,
  NativeModules,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotificationPermissions from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-community/async-storage';

import {
  InactivateStateUI,
  ActivatedStateUI,
  Header,
  EncapConfigError,
  EnterActivationCodeUI,
  EnterPincodeCodeUI,
  ChooseAppModeUI,
  ChangeSettingsUI,
} from './UserInterfaceUtils';
import styles from './Styles';
import RestClient from './RestClient';
import SignicatConfig from './configs/SignicatConfig';
import AppStateType from './configs/AppState';

const { baseEndpoint } = require('./configs/MerchantConfig');

const KEY_MERCHANT_SERVER_URL = 'KEY_MERCHANT_SERVER_URL';
const KEY_SIGNICAT_ENV = 'KEY_SIGNICAT_ENV';
const KEY_CURRENT_USER = 'KEY_CURRENT_USER';
const KEY_CURRENT_DEVICE = 'KEY_CURRENT_DEVICE';

const defaultDeviceName = `${Platform.OS}_device`;

class App extends Component {
  constructor(props) {
    super(props);
    console.log(`Starting InAppSample, with props = ${JSON.stringify(props)}`);
    this.state = {
      deviceActivated: false,
      authInProgress: false,
      regInProgress: false,
      encapConfigured: false,
      showEnterPinUI: false,
      showActivationCodeUI: false,
      appMode: AppStateType.UNKNOWN,
      appState: AppState.currentState,
      signicatConfig: SignicatConfig.get(),
    };
  }

  async componentDidMount() {
    console.log(`Platform ${Platform.OS}`);

    const sigEnv = await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
    this.setState({ signicatConfig: sigEnv !== null && sigEnv !== undefined ? sigEnv : undefined });

    // try to get saved merchant server url otherwise use from config file
    const url = await AsyncStorage.getItem(KEY_MERCHANT_SERVER_URL);
    this.setState({ merchantServerUrl: url !== null && url !== undefined ? url : baseEndpoint });

    this.initializeEncap().then(() => {
      this.setState({ encapConfigured: true });

      // get and set activation status
      this.updateDeviceState();
    }).catch((error) => {
      console.error(error);
      // Alert.alert('Encap initialization error!');
    });

    // update user
    const savedUser = await AsyncStorage.getItem(KEY_CURRENT_USER);
    this.setState({ currentUser: savedUser !== null && savedUser !== undefined ? savedUser : `user_${Math.floor(Math.random() * 100000)}` });

    // update device
    const savedDevice = await AsyncStorage.getItem(KEY_CURRENT_DEVICE);
    this.setState({ currentDevice: savedDevice !== null && savedDevice !== undefined ? savedDevice : defaultDeviceName });

    if (Platform.OS === 'android') {
      // handle push notification after the app has started
      DeviceEventEmitter.addListener('authentication', this.onPushNotification);
    }

    if (Platform.OS === 'ios') {
      // ask for permissions once
      PushNotificationIOS.requestPermissions(PushNotificationPermissions.alert).then((result) => {
        // NOTE - if push notifications permissions is not allowed, the app will not reveive them
        console.log(result);
      });

      // handle push notification after the app has started
      PushNotificationIOS.addEventListener('notification', this.onPushNotification);
    }

    // handle push notification if the app is in background or not running
    if (this.props.init === 'authentication') {
      this.authStartFomBrowser();
    }

    AppState.addEventListener('change', this.handleAppStateChange);
  }

  componentWillUnmount(): void {
    AppState.removeEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
      this.checkPendingAuthentication();
    }
    this.setState({ appState: nextAppState });
  };

  checkPendingAuthentication = async () => {
    console.log('Check Encap to see if an authentication has been started.');
    const activated = await NativeModules.EncapModule.isDeviceActivated();
    if (activated) {
      this.authStartFomBrowser();
    }
  };

    onPushNotification = () => {
      console.log('Push Notification Arrived');
      console.log('Start auth...');
      if (this.state.appMode === AppStateType.WEB2APP || this.state.appMode === AppStateType.UNKNOWN) {
        console.log(`app mode... ${this.state.appMode}`);
        this.authStartFomBrowser();
      }
    };

    updateDeviceState = async () => {
      const activated = await NativeModules.EncapModule.isDeviceActivated();
      this.setState({ deviceActivated: activated });
      console.log(`Is device activated: ${activated}`);
    }

    initializeEncap = async () => {
      let sConfig;
      const envId = await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
      if (envId !== null && envId !== undefined) {
        sConfig = SignicatConfig.get(envId);
      }

      if (sConfig === null || sConfig === undefined) {
        sConfig = SignicatConfig.get(); // default value
      }

      const { encapServerUrl, encapApplicationId, encapPublicKey } = sConfig;
      console.log(`initializeEncap...${encapServerUrl} ${encapApplicationId} ${encapPublicKey}`);
      this.setState({ signicatConfig: sConfig });
      return NativeModules.EncapModule.configureEncap(encapServerUrl, encapApplicationId, encapPublicKey);
    };

    signicatEnvChange = async (newEnvId) => {
      const activated = await NativeModules.EncapModule.isDeviceActivated();
      const newSignicatConfig = SignicatConfig.get(newEnvId.toLocaleLowerCase());
      const { encapServerUrl, encapApplicationId, encapPublicKey } = newSignicatConfig;
      if (activated === true) {
        NativeModules.EncapModule.deactivate().then(() => {
          NativeModules.EncapModule.configureEncap(encapServerUrl, encapApplicationId, encapPublicKey).then(() => {
            this.setState({
              signicatConfig: newSignicatConfig,
              deviceActivated: false,
              authInProgress: false,
              regInProgress: false,
              showEnterPinUI: false,
              showActivationCodeUI: false,
              appMode: AppStateType.UNKNOWN, // to go back to home screen
            });
            this.storeDataToAsyncStorage(KEY_SIGNICAT_ENV, newEnvId);
          });
        });
      } else {
        NativeModules.EncapModule.configureEncap(encapServerUrl, encapApplicationId, encapPublicKey).then(() => {
          this.setState({
            signicatConfig: newSignicatConfig,
          });
          this.storeDataToAsyncStorage(KEY_SIGNICAT_ENV, newEnvId);
        });
      }
    };

    storeDataToAsyncStorage = async (key, data) => {
      console.log(`storeDataToAsyncStorage ${key}:${data}`);
      try {
        await AsyncStorage.setItem(key, data);
      } catch (error) {
        console.log('Error: ', error); // TODO: better error handling
      }
    };

    updateCurrentUser = async (newUser) => {
      this.state.currentUser = newUser;
      this.storeDataToAsyncStorage(KEY_CURRENT_USER, newUser);
    };

    updateCurrentDevice = async (newDevice) => {
      this.state.currentDevice = newDevice;
      this.storeDataToAsyncStorage(KEY_CURRENT_DEVICE, newDevice);
    };

    saveCurrentUser = () => {
      console.log(`saving...${this.state.currentUser}`);
      this.storeDataToAsyncStorage(KEY_CURRENT_USER, this.state.currentUser);
    }

    // ---------- Activation related code START ---------------- //
    activateFromDevice = async () => {
      console.log('activateDevice...');

      // if externalRef is null at this point, generate random one
      let externalRef = this.state.currentUser;
      if (this.state.currentUser === null || this.state.currentUser === undefined) {
        externalRef = `user_${Math.floor(Math.random() * 100000)}`;
      }
      // if deviceName is null, use the default name $platform_device i.e ios_device or android_device
      let deviceName = this.state.currentDevice;
      if (this.state.currentDevice === null || this.state.currentDevice === undefined) {
        deviceName = defaultDeviceName;
      }

      this.setState({ currentUser: externalRef, currentDevice: deviceName });

      // create account
      RestClient.startRegisterFromDevice(this.state.merchantServerUrl, externalRef, deviceName).then((response) => {
        console.log(`Create account: ${response.status}`);

        // if response.status==success, account is created. start registration
        const oidcAuthorizeSignicatUrl = response.data;
        RestClient.getActivationCode(oidcAuthorizeSignicatUrl).then(
          (responseWithActivationCode) => {
            console.log(`responseWithActivationCode: ${responseWithActivationCode}`);

            const { activationCode } = responseWithActivationCode;
            const { completeUrl } = responseWithActivationCode;
            const { statusUrl } = responseWithActivationCode;

            // For testing, keeping these params in state. In your app, manage on your own in a better way!
            this.setState({
              statusUrl: statusUrl,
              completeUrl: completeUrl,
              regInProgress: true,
            });

            // Start encap registration
            this.validateActivationCode(activationCode);
          },
        );
      }).catch((err) => {
        console.error(err);
        Alert.alert('Error', err);
      });
    };

    activateFomBrowser = () => {
      console.log('activateDevice web...');
      this.setState({ regInProgress: true, showActivationCodeUI: true });
    }

    validateActivationCode = async (activationCode) => {
      console.log('Start activation code validation');
      NativeModules.EncapModule.startActivation(activationCode, (pinLength, pinType, hasFingerprint, hasFaceId) => {
        console.log(`Starting activation with Encap...${pinLength} ${pinType} ${hasFingerprint} ${hasFaceId}`);
        this.setState({ showEnterPinUI: true, showActivationCodeUI: false });
      },
      (err) => {
        const errMsg = `startActivationError ${err}`;
        console.log(errMsg);
        Alert.alert('Error', errMsg);
      });
    };

    performPinActivation = (pincode) => {
      NativeModules.EncapModule.finishPinCodeActivation(pincode,
        () => {
          if (this.state.appMode === AppStateType.INAPP) {
            this.finishRegOperationOnDevice();
          } else {
            const logMsg = 'Finish activation successful from web';
            console.log(logMsg);
            Alert.alert('Success', logMsg);
            this.setState({
              deviceActivated: true,
              showEnterPinUI: false,
              regInProgress: false,
              appMode: AppStateType.UNKNOWN,
              currentUser: null,
            });
            // meanwhile customer backend will be polling Signicat
            // and eventually will know that registration process is successful

            // Note - when registration is started via web channel, device has no idea about the externalRef
            // If needed it can be retrieved from a merchant server. Reseting current user info
            this.storeDataToAsyncStorage(KEY_CURRENT_USER, '');
            this.storeDataToAsyncStorage(KEY_CURRENT_DEVICE, '');
          }
        },
        (err) => {
          const errMsg = `Finish activation failed from web ${err}`;
          console.log(errMsg);
          Alert.alert('Error', errMsg);
        });
    }

    finishRegOperationOnDevice = () => {
      console.log('finishPinActivationSuccess ');

      // checking status
      RestClient.checkOperationStatus(this.state.statusUrl).then(
        (statusResponse) => {
          console.log(statusResponse);
          // If status  == COMPLETED, inform Signicat about it
          RestClient.informOperationComplete(this.state.completeUrl).then(
            (completeResponse) => {
              // update state and refresh UI
              if (completeResponse.status === 'SUCCESS') {
                this.setState({
                  deviceActivated: true,
                  showEnterPinUI: false,
                  regInProgress: false,
                  statusUrl: null,
                  completeUrl: null,
                  appMode: AppStateType.UNKNOWN,
                });
                console.log(completeResponse);
                this.saveCurrentUser();
                Alert.alert('Registration is successful!');
              } else {
                console.log(completeResponse);
                Alert.alert('Error', completeResponse.data);
              }
            },
          );
        },
      ).catch((err) => {
        console.log(err);
      });
    };

    // ---------- Activation related code END ---------------- //


    // ---------- Authentication related code START ---------------- //
    authenticateFromDevice = async () => {
      console.log('');
      const deviceId = await NativeModules.EncapModule.getRegistrationId();
      // start auth session with merchant backend
      RestClient.startAuthFromDevice(this.state.merchantServerUrl, this.state.currentUser, deviceId).then((response) => {
        // can be checked if response.status==success, then init auth session with Signicat
        const authUrl = response.data;
        RestClient.initAuthSession(authUrl).then((initAuthResponse) => {
          console.log(initAuthResponse);
          if (initAuthResponse.status === 'OK') {
            NativeModules.EncapModule.startAuthentication((availableBiometryAuthMethods, contextTitle, contextContent) => {
              console.log(`availableBiometryAuthMethods device ${availableBiometryAuthMethods}`);
              console.log(`contextTitle device ${contextTitle}`);
              console.log(`contextContent device ${contextContent}`);
              // For testing, keeping these params in state. In your app, manage on your own in a better way!
              this.setState({
                statusUrl: initAuthResponse.statusUrl,
                completeUrl: initAuthResponse.completeUrl,
                authInProgress: true,
                showEnterPinUI: true, // show pin and call finish auth afterwards
                appMode: AppStateType.INAPP,
              });
            }, (err) => {
              console.error(err);
            });
          }
        });
      }).catch((err) => {
        console.error(err);
      });
    }

    authStartFomBrowser = () => {
      console.log('authenticate from web...');
      NativeModules.EncapModule.startAuthentication((hasPincode, hasFingerprint, contextTitle, contextContent) => {
        console.log(`has pin, fingerprint? ${hasPincode} ${hasFingerprint}`);
        console.log(`contextTitle ${contextTitle}`);
        console.log(`contextContent ${contextContent}`);

        if (contextTitle === undefined || contextTitle === '') {
          this.setState({ authInProgress: true, showEnterPinUI: true, appMode: AppStateType.WEB2APP });
        } else {
          Alert.alert(
            'Consent Signature',
            contextTitle,
            [
              {
                text: 'Yes',
                onPress: () => {
                  console.log('Consent OK');
                  this.setState({ authInProgress: true, showEnterPinUI: true, appMode: AppStateType.WEB2APP });
                },
              },
              {
                text: 'No',
                onPress: () => {
                  console.log('Consent NOT OK');
                  // TODO cancel auth session
                  NativeModules.EncapModule.cancelSession(() => {
                    console.log('Encap cancelSession success');
                  }, () => {
                    console.log('Encap cancelSession failed');
                  });
                },
                style: 'cancel',
              },
            ],
            {
              cancelable: true,
            },
          );
        }
      }, (err) => {
        const errMsg = `Start WebAuth Error ${err}`;
        console.log(errMsg);
        // Alert.alert('Error', errMsg);
      });
    }

    performPinAuthentication = (pincode) => {
      NativeModules.EncapModule.finishPinCodeAuthentication(pincode, (fResponse) => {
        if (this.state.appMode === AppStateType.INAPP) {
          this.finishAuthOperationOnDevice(fResponse);
        } else {
          const logMsg = 'Finish WebAuth successful';
          console.log(logMsg);
          Alert.alert('Success', logMsg);
          // meanwhile customer backend will be polling Signicat
          // and eventually will know that auth process is successful
          this.setState({ authInProgress: false, appMode: AppStateType.UNKNOWN });
        }
      }, (err) => {
        const errMsg = `Finish WebAuth Error ${err}`;
        console.log(errMsg);
        Alert.alert('Error', errMsg);
      });
    }

    finishAuthOperationOnDevice = (response) => {
      console.log(response);
      // now check status in the server
      RestClient.checkOperationStatus(this.state.statusUrl).then(
        (statusResponse) => {
          console.log(statusResponse);
          // If status  == COMPLETED, inform Signicat about it
          RestClient.informOperationComplete(this.state.completeUrl).then(
            (completeResponse) => {
              if (completeResponse.status === 'SUCCESS') {
                // update state and refresh UI
                this.setState({
                  statusUrl: null,
                  completeUrl: null,
                  authInProgress: false,
                  appMode: AppStateType.UNKNOWN,
                });
                console.log(completeResponse);
                Alert.alert('Authentication is successful! ');
              } else {
                Alert.alert('Error!', completeResponse.data);
              }
            },
          );
        },
      ).catch((err) => {
        console.error(err);
        Alert.alert('Error!', err);
      });
    }

    // ---------- Authentication related code START ---------------- //


    // ---------- Deactivate related code START ---------------- //
    deactivate = async () => {
      console.log('deactivate');
      NativeModules.EncapModule.deactivate().then(() => {
        console.log('encap deactivation success');

        this.setState({
          deviceActivated: false,
          authInProgress: false,
          regInProgress: false,
          showEnterPinUI: false,
          showActivationCodeUI: false,
          appMode: AppStateType.UNKNOWN, // to go back to home screen
        });

        // Note - here, device deactivation is only done at client side just for the sake of testing
        // Note - in your production app, upon deactivation you should remove the registered device from a server also
      }).catch((err) => {
        console.error(`deactivate error ${err}`);
      });
    };

    // ---------- Other utilities methods ---------------- //
    deviceIsNotActivatedAndOperationIsNotInProgress = () => {
      if (this.state.deviceActivated === !true
          && this.state.regInProgress === !true
          && this.state.authInProgress === !true) {
        return true;
      }
      return false;
    }

    deviceIsNotActivatedRegInProgressActivationCodeNeeded = () => {
      if (this.state.deviceActivated === !true
          && this.state.appMode === AppStateType.WEB2APP
          && this.state.regInProgress === true
          && this.state.showActivationCodeUI === true) {
        return true;
      }
      return false;
    }

    deviceIsNotActivatedRegInProgressPincodeNeeded = () => {
      if (this.state.deviceActivated === false
          && this.state.regInProgress === true
          && this.state.showEnterPinUI === true) {
        return true;
      }
      return false;
    }

    deviceIsActivatedAndOperationIsNotInProgress = () => {
      if (this.state.appMode !== AppStateType.UNKNOWN
          && this.state.appMode !== AppStateType.SETTINGS
          && this.state.deviceActivated === true
          && this.state.regInProgress === !true
          && this.state.authInProgress === !true) {
        return true;
      }
      return false;
    }

    deviceIsActivatedAuthInProgressPincodeNeeded = () => {
      if (this.state.deviceActivated === true
          && this.state.authInProgress === true
          && this.state.showEnterPinUI === true) {
        return true;
      }
      return false;
    }

    setToWeb2AppMode = () => {
      if (this.validURL(this.state.merchantServerUrl)) {
        this.setState({ appMode: AppStateType.WEB2APP });
      } else {
        Alert.alert('Error!', 'Invalid server URL');
      }
    }

    setToInAppMode = () => {
      if (this.validURL(this.state.merchantServerUrl)) {
        this.setState({ appMode: AppStateType.INAPP });
      } else {
        Alert.alert('Error!', 'Invalid server URL');
      }
    }

  setToSettingsMode = async () => {
    this.setState({ appMode: AppStateType.SETTINGS });
  }

     validURL = (str) => {
       const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
           + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
           + '^https?:\\/\\/(localhost:([0-9]){2,})?$|' // OR localhost
          + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
          + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
          + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
          + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
       return !!pattern.test(str);
     }

     goToHomeScreen = () => {
       this.setState({ appMode: AppStateType.UNKNOWN });
     }

     render() {
       return (
         <>
           <StatusBar barStyle="dark-content"/>
           <SafeAreaView>
             <ScrollView
               contentInsetAdjustmentBehavior="automatic"
               style={styles.scrollView}
             >
               <Header/>
               {
                this.state.encapConfigured === true && (
                <View style={styles.body}>
                  {
                    this.state.appMode === AppStateType.UNKNOWN && (
                    <ChooseAppModeUI
                      setWeb2AppMode={this.setToWeb2AppMode}
                      setInAppMode={this.setToInAppMode}
                      setSettingsMode={this.setToSettingsMode}
                    />)
                  }
                  {
                    this.state.appMode === AppStateType.SETTINGS && (
                    <ChangeSettingsUI
                      currentMerchantServer={this.state.merchantServerUrl}
                      currentSignicatEnv={this.state.signicatConfig.id}
                      onSignicatEnvChange={this.signicatEnvChange}
                      setServerAddress={async (addr) => {
                        this.state.merchantServerUrl = addr;
                        // save to the storage
                        this.storeDataToAsyncStorage(KEY_MERCHANT_SERVER_URL, addr);
                      }}
                      goToHome={this.goToHomeScreen}
                      hasValidUrlFormat={this.validURL}
                    />)
                  }
                  {
                    this.deviceIsNotActivatedAndOperationIsNotInProgress() && this.state.appMode === AppStateType.INAPP && (
                    <InactivateStateUI
                      appMode={this.state.appMode}
                      deviceActivated={this.state.deviceActivated}
                      onUserChange={this.updateCurrentUser}
                      onDeviceChange={this.updateCurrentDevice}
                      currentUser={this.state.currentUser}
                      currentDevice={this.state.currentDevice}
                      performAction={this.activateFromDevice}
                      goToHome={this.goToHomeScreen}
                    />)
                  }
                  {
                    this.deviceIsNotActivatedAndOperationIsNotInProgress() && this.state.appMode === AppStateType.WEB2APP && (
                    <InactivateStateUI
                      appMode={this.state.appMode}
                      performAction={this.activateFomBrowser}
                      goToHome={this.goToHomeScreen}
                    />)
                  }
                  {
                    this.deviceIsNotActivatedRegInProgressActivationCodeNeeded() && (
                    <EnterActivationCodeUI
                      validateCode={this.validateActivationCode}
                    />)
                  }
                  {
                    this.deviceIsNotActivatedRegInProgressPincodeNeeded() && (
                    <EnterPincodeCodeUI
                      performAction={this.performPinActivation}
                    />)
                  }
                  {
                    this.deviceIsActivatedAuthInProgressPincodeNeeded() && (
                    <EnterPincodeCodeUI performAction={this.performPinAuthentication}/>)
                  }
                  {
                    this.deviceIsActivatedAndOperationIsNotInProgress() && (
                    <ActivatedStateUI
                      appMode={this.state.appMode}
                      deactivateDevice={this.deactivate}
                      startAuthenticate={this.authenticateFromDevice}
                      goToHome={this.goToHomeScreen}
                      onUserChange={this.updateCurrentUser}
                      currentUser={this.state.currentUser}
                    />)
                  }
                </View>
                )
              }
               {
                this.state.encapConfigured === false && (
                <View style={styles.body}>
                  <EncapConfigError/>
                </View>
                )
              }
             </ScrollView>
           </SafeAreaView>
         </>
       );
     }
}

export default App;
