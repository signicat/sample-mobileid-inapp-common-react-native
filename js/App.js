import React, { Component } from 'react';
import {
  AppState,
  SafeAreaView,
  View,
  StatusBar,
  Alert,
  NativeModules,
  Platform,
  DeviceEventEmitter,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { RootSiblingParent } from 'react-native-root-siblings';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotificationPermissions from '@react-native-community/push-notification-ios';
import AsyncStorage from '@react-native-community/async-storage';
import I18n from '../i18n/i18n';
import styles from './Styles';
import Colors from './Colors';

import {
  Loading,
  InactivateStateUI,
  ActivatedStateUI,
  Header,
  EnterActivationCodeUI,
  EnterPincodeCodeUI,
  ChooseAppModeUI,
  ChangeSettingsUI,
  EndOfFlowUI, alertMsg,
} from './UserInterfaceUtils';
import RestClient from './RestClient';
import SignicatConfig from './configs/SignicatConfig';
import AppStateType from './configs/AppState';

const { baseEndpoint } = require('./configs/MerchantConfig');

const KEY_MERCHANT_SERVER_URL = 'KEY_MERCHANT_SERVER_URL';
const KEY_SIGNICAT_ENV = 'KEY_SIGNICAT_ENV';
const KEY_AUTO_AUTH_OPTION = 'KEY_AUTO_AUTH_OPTION';
const KEY_IS_SAMPLE_BACKEND_OPTION = 'KEY_IS_SAMPLE_BACKEND_OPTION';
const KEY_CURRENT_EXTERNAL_REFERENCE = 'KEY_CURRENT_EXTERNAL_REFERENCE';
const KEY_CURRENT_DEVICE = 'KEY_CURRENT_DEVICE';
const KEY_ENCAP_APPLICATION_ID = 'KEY_ENCAP_APPLICATION_ID';
const KEY_AUTHENTICATION = 'authentication';
const KEY_NOTIFICATION = 'notification';
const KEY_CHANGE = 'change';
const CUSTOM_PAYLOAD_DATA = 'custom-push-payload';

const defaultDeviceName = `${Platform.OS}_device`;

class App extends Component {
  constructor(props) {
    super(props);
    console.log(`Starting InAppSample, with props = ${JSON.stringify(props)}`);

    this.state = {
      deviceActivated: false,
      authInProgress: false,
      regInProgress: false,
      showEnterPinUI: false,
      showActivationCodeUI: false,
      appMode: AppStateType.UNKNOWN,
      appState: AppState.currentState,
      externalReference: null,
      autoAuthOption: false,
      tempAutoAuthOption: false,
      processingAuthLoading: false,
      isKeyboardVisible: false,
      isSampleBackend: true,
      tempIsSampleBackend: true,
    };
  }

  async componentDidMount() {
    console.log('componentDidMount');
    console.log('Platform:', Platform.OS);

    const sigEnv = await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
    this.setState({ signicatEnvId: sigEnv !== null && sigEnv !== undefined ? sigEnv : SignicatConfig.get().id });

    const appId = await AsyncStorage.getItem(KEY_ENCAP_APPLICATION_ID);
    this.setState({ encapAppId: appId !== null && appId !== undefined ? appId : SignicatConfig.get().encapApplicationId });

    // try to get saved merchant server url otherwise use from config file
    const url = await AsyncStorage.getItem(KEY_MERCHANT_SERVER_URL);
    this.setState({ merchantServerUrl: url !== null && url !== undefined ? url : baseEndpoint });

    const isSampleBackend = await this.getSavedIsSampleBackend();
    this.state.isSampleBackend = isSampleBackend;
    this.setState({ tempIsSampleBackend: isSampleBackend });

    // Store auto auth option value
    const autoAuthOptionValue = await this.getSavedAutoAuthOptionValue();
    this.state.autoAuthOption = autoAuthOptionValue;
    this.setState({ tempAutoAuthOption: autoAuthOptionValue });

    this.initializeEncap().then(() => {
      // get and set activation status
      this.updateDeviceState();
      this.storeDataToAsyncStorage(KEY_SIGNICAT_ENV, this.state.signicatEnvId);
      this.storeDataToAsyncStorage(KEY_ENCAP_APPLICATION_ID, this.state.encapAppId);
    }).catch((error) => {
      console.error(error);
      Alert.alert(I18n.t('error'), error.toString());
    });

    // update external reference
    const savedExternalReference = await AsyncStorage.getItem(KEY_CURRENT_EXTERNAL_REFERENCE);
    this.setState({ externalReference: savedExternalReference !== null && savedExternalReference !== undefined ? savedExternalReference : `user_${Math.floor(Math.random() * 100000)}` });

    // update device
    const savedDevice = await AsyncStorage.getItem(KEY_CURRENT_DEVICE);
    this.setState({ currentDevice: savedDevice !== null && savedDevice !== undefined ? savedDevice : defaultDeviceName });

    if (Platform.OS === 'android') {
      // handle push notification after the app has started
      DeviceEventEmitter.addListener(KEY_AUTHENTICATION, this.onPushNotification);
    } else if (Platform.OS === 'ios') {
      // ask for permissions once
      PushNotificationIOS.requestPermissions(PushNotificationPermissions.alert).then((result) => {
        // NOTE - if push notification permission is not allowed, the app will not receive them
        console.log(result);
      });

      // handle push notification after the app has started
      PushNotificationIOS.addEventListener(KEY_NOTIFICATION, this.onPushNotification);
    }

    const deviceActivated = await NativeModules.EncapModule.isDeviceActivated();
    if (deviceActivated) {
      this.checkAuthAndStartIfAvailable(true);
    }

    AppState.addEventListener(KEY_CHANGE, this.handleAppStateChange);
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide);

    // PUSH message arrived when app was in background on older devices where we don't show a small notification
    // outside of the app, but still want to display the payload once the app comes to foreground
    if (this.props.pushPayload && this.props.pushPayload.length > 0) {
      console.log('pushPayload (old device, app was in background): ', this.props.pushPayload);
      alertMsg(`${I18n.t('push_payload')}\n${this.props.pushPayload}`);
    }
  }

  componentWillUnmount(): void {
    console.log('componentWillUnmount');
    AppState.removeEventListener(KEY_CHANGE, this.handleAppStateChange);
    if (Platform.OS === 'android') {
      DeviceEventEmitter.removeListener(KEY_AUTHENTICATION, this.onPushNotification);
    } else if (Platform.OS === 'ios') {
      PushNotificationIOS.removeEventListener(KEY_NOTIFICATION, this.onPushNotification);
    }
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  keyboardDidShow = () => {
    this.setKeyboardState(true);
  }

  keyboardDidHide = () => {
    this.setKeyboardState(false);
  }

  setKeyboardState = (isVisible) => {
    if (this.state.appMode === AppStateType.END_OF_FLOW) {
      this.state.isKeyboardVisible = isVisible; // Avoids unwanted re-render
    } else {
      this.setState({ isKeyboardVisible: isVisible });
    }
  };

  handleAppStateChange = async (nextAppState) => {
    console.log('handleAppStateChange');
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
      const activated = await NativeModules.EncapModule.isDeviceActivated();
      if (activated) {
        this.checkAuthAndStartIfAvailable(false);
      }
    }
    this.setState({ appState: nextAppState });
  };

  getSavedAutoAuthOptionValue = async () => {
    const autoAuthOption = await AsyncStorage.getItem(KEY_AUTO_AUTH_OPTION);
    return !(autoAuthOption === null || autoAuthOption === 'false'); // Default false
  }

  getSavedIsSampleBackend = async () => {
    const isSampleBackend = await AsyncStorage.getItem(KEY_IS_SAMPLE_BACKEND_OPTION); // Is null on fresh install of app
    return (isSampleBackend === null || isSampleBackend === 'true'); // Default true
  }

  updateAutoAuthOption = async (enabled) => {
    console.log('updateAutoAuthOption, enabled: ', enabled);
    if (this.state.deviceActivated) {
      this.setState({ tempAutoAuthOption: enabled });
    } else {
      console.log('Ignoring auto auth option change, device not activated');
      Alert.alert(
        I18n.t('information'),
        I18n.t('auto_auth_device_not_activated'),
      );
    }
  };

  updateIsSampleBackendOption = (enabled) => {
    this.setState({ tempIsSampleBackend: enabled });
  };

  // PUSH notification arrives when app is in the foreground
  // NOTE: In iOS `onPushNotification` will be fired either when the app comes from the push alert or foreground
  onPushNotification = (notification) => {
    const pushPayload = Platform.select({
      ios: () => notification.getData()[CUSTOM_PAYLOAD_DATA] || null,
      android: () => notification,
    })();
    console.log('onPushNotification, pushPayload: ', pushPayload);
    if (this.state.appMode === AppStateType.WEB2APP || this.state.appMode === AppStateType.UNKNOWN) {
      if (pushPayload !== null && pushPayload.length > 0) {
        alertMsg(`${I18n.t('push_payload')}\n${pushPayload}`);
      }
      this.checkAuthAndStartIfAvailable(false);
    }
  };

  updateDeviceState = async () => {
    console.log('updateDeviceState');
    const activated = await NativeModules.EncapModule.isDeviceActivated();
    this.setState({ deviceActivated: activated });
    console.log(`Is device activated: ${activated}`);
  };

  initializeEncap = async () => {
    console.log('initializeEncap');
    // --- signicat config
    let sConfig;
    const envId = await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
    if (envId !== null && envId !== undefined) {
      sConfig = SignicatConfig.get(envId);
    }

    if (sConfig === null || sConfig === undefined) {
      sConfig = SignicatConfig.get(); // default value
    }
    // --- encap app id
    const savedEncapAppId = await AsyncStorage.getItem(KEY_ENCAP_APPLICATION_ID);
    let encapAppId;
    if (savedEncapAppId !== null && savedEncapAppId !== undefined) {
      encapAppId = savedEncapAppId;
    }

    const { encapServerUrl, encapApplicationId, encapPublicKey } = sConfig;
    if (encapAppId === null || encapAppId === undefined) {
      encapAppId = encapApplicationId;
    }

    console.log(`initializeEncap...${encapServerUrl} ${encapAppId} ${encapPublicKey}`);
    this.setState({ signicatEnvId: sConfig.id, encapAppId: encapAppId });
    return NativeModules.EncapModule.configureEncap(encapServerUrl, encapAppId, encapPublicKey);
  };

  updateEncapApplicationId = (newEncapAppId) => {
    console.log('updateEncapApplicationId');
    this.state.tempEncapAppId = newEncapAppId; // No need to re-render
  };

  updateMerchantServerUrl = (url) => {
    console.log('updateMerchantServerUrl');
    this.state.tempMerchantServerUrl = url; // No need to re-render
  };

  clearAllTempSettings = () => {
    console.log('clearAllTempSettings', this.state);
    this.state.tempAutoAuthOption = this.state.autoAuthOption;
    this.state.tempIsSampleBackend = this.state.isSampleBackend;
    this.state.tempMerchantServerUrl = undefined;
    this.state.tempEncapAppId = undefined;
    this.state.tempSignicatEnvId = undefined;
  };

  updateSignicatEnv = async (newEnvId) => {
    console.log(`updateSignicatEnv ${newEnvId}`);
    let newEnvIdEffective;
    // if empty, do this
    if (newEnvId.toLocaleLowerCase() === '') {
      const tempId = await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
      if (tempId !== null && tempId !== undefined) {
        newEnvIdEffective = tempId;
      } else {
        newEnvIdEffective = SignicatConfig.get().id;
      }
    } else {
      newEnvIdEffective = newEnvId;
    }

    this.setState({ tempSignicatEnvId: newEnvId });
    let sConfig;
    if (newEnvIdEffective !== null && newEnvIdEffective !== undefined) {
      sConfig = SignicatConfig.get(newEnvIdEffective.toLowerCase());
      this.setState({
        tempEncapAppId: sConfig.encapApplicationId,
      });
    }
  };

  applySettingsChange = async () => {
    console.log('applySettingsChange');
    const {
      tempSignicatEnvId, tempEncapAppId, tempMerchantServerUrl, tempAutoAuthOption, tempIsSampleBackend,
    } = this.state;

    if (tempAutoAuthOption !== this.state.autoAuthOption) {
      console.log('Changing settings for the auto authentication');
      this.state.autoAuthOption = tempAutoAuthOption;
      this.storeDataToAsyncStorage(KEY_AUTO_AUTH_OPTION, tempAutoAuthOption ? 'true' : 'false');
    }

    if (tempIsSampleBackend !== this.state.isSampleBackend) {
      console.log('Changing settings for backend type');
      this.state.isSampleBackend = tempIsSampleBackend;
      this.storeDataToAsyncStorage(KEY_IS_SAMPLE_BACKEND_OPTION, tempIsSampleBackend ? 'true' : 'false');
    }

    if (tempMerchantServerUrl) {
      console.log('Changing settings for the merchant server URL');
      this.state.merchantServerUrl = tempMerchantServerUrl;
      this.state.tempMerchantServerUrl = undefined;
      this.storeDataToAsyncStorage(KEY_MERCHANT_SERVER_URL, this.state.merchantServerUrl);
    }

    if (tempSignicatEnvId || tempEncapAppId) {
      console.log('Changing Signicat enivronment settings');
      const activated = await NativeModules.EncapModule.isDeviceActivated();

      // --- signicat config
      // --- first try from memory
      const envId = tempSignicatEnvId; // await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
      let sConfig;
      if (envId !== null && envId !== undefined) {
        sConfig = SignicatConfig.get(envId.toLowerCase());
      }
      // --- if null, try from storage
      if (sConfig === null || sConfig === undefined) {
        const envIdFromStorage = await AsyncStorage.getItem(KEY_SIGNICAT_ENV);
        if (envIdFromStorage !== null && envIdFromStorage !== undefined) {
          sConfig = SignicatConfig.get(envIdFromStorage.toLowerCase());
        }
      }
      // --- if still null, get it from config file
      if (sConfig === null || sConfig === undefined) {
        console.log('Unknown env, and using default...');
        sConfig = SignicatConfig.get(); // default value preprod
      }

      // --- encap application id
      // --- first try from memory
      let encapAppId;
      const savedEncapAppId = tempEncapAppId; // await AsyncStorage.getItem(KEY_ENCAP_APPLICATION_ID);
      if (savedEncapAppId !== null && savedEncapAppId !== undefined) {
        encapAppId = savedEncapAppId;
      }
      // --- if null, try from storage
      if (encapAppId === null || encapAppId === undefined) {
        const encapAppIdFromStorage = await AsyncStorage.getItem(KEY_ENCAP_APPLICATION_ID);
        if (encapAppIdFromStorage !== null && encapAppIdFromStorage !== undefined) {
          encapAppId = encapAppIdFromStorage;
        }
      }
      // --- if still null, use from config file
      const { encapServerUrl, encapApplicationId, encapPublicKey } = sConfig;
      if (encapAppId === null || encapAppId === undefined) {
        console.log('Unknown encapAppId, and using default from config file...');
        encapAppId = encapApplicationId;
      }

      // --- deactivate and reconfigure
      if (activated === true) {
        NativeModules.EncapModule.deactivate().then(() => {
          NativeModules.EncapModule.configureEncap(encapServerUrl, encapAppId, encapPublicKey).then(() => {
            this.setState({
              tempEncapAppId: undefined,
              tempSignicatEnvId: undefined,
              signicatEnvId: sConfig.id,
              encapAppId: encapAppId,
              deviceActivated: false,
              authInProgress: false,
              regInProgress: false,
              showEnterPinUI: false,
              showActivationCodeUI: false,
            });
            this.storeDataToAsyncStorage(KEY_SIGNICAT_ENV, sConfig.id);
            this.storeDataToAsyncStorage(KEY_ENCAP_APPLICATION_ID, encapAppId);
          });
        });
      } else {
        NativeModules.EncapModule.configureEncap(encapServerUrl, encapAppId, encapPublicKey).then(() => {
          this.setState({
            tempEncapAppId: undefined,
            tempSignicatEnvId: undefined,
            signicatEnvId: sConfig.id,
            encapAppId: encapAppId,
          });
          this.storeDataToAsyncStorage(KEY_SIGNICAT_ENV, sConfig.id);
          this.storeDataToAsyncStorage(KEY_ENCAP_APPLICATION_ID, encapAppId);
        });
      }
    }
    this.setState({ appMode: AppStateType.UNKNOWN }); // to go back to home screen
  };

  storeDataToAsyncStorage = async (key, data) => {
    console.log(`storeDataToAsyncStorage ${key}:${data}`);
    try {
      await AsyncStorage.setItem(key, data);
    } catch (error) {
      console.log('Error: ', error); // TODO: better error handling
    }
  };

  updateAndSaveExternalReference = (newExternalReference) => {
    console.log('updateAndSaveExternalReference: ', newExternalReference);
    this.state.externalReference = newExternalReference;
    this.storeDataToAsyncStorage(KEY_CURRENT_EXTERNAL_REFERENCE, this.state.externalReference);
  };

  updateAndSaveCurrentDevice = (newDevice) => {
    console.log('updateAndSaveCurrentDevice: ', newDevice);
    this.state.currentDevice = newDevice;
    this.storeDataToAsyncStorage(KEY_CURRENT_DEVICE, this.state.currentDevice);
  };

  // ---------- Activation related code START ---------------- //
  activateFromDevice = async () => {
    console.log('activateFromDevice');

    // if externalRef is null at this point, generate random one
    let externalRef = this.state.externalReference;
    if (this.state.externalReference === null || this.state.externalReference === undefined) {
      externalRef = `user_${Math.floor(Math.random() * 100000)}`;
    }
    // if deviceName is null, use the default name $platform_device i.e ios_device or android_device
    let deviceName = this.state.currentDevice;
    if (this.state.currentDevice === null || this.state.currentDevice === undefined) {
      deviceName = defaultDeviceName;
    }

    this.setState({ externalReference: externalRef, currentDevice: deviceName });

    if (this.state.isSampleBackend) {
      RestClient.isExternalRefAndDeviceNameActivated(this.state.merchantServerUrl, externalRef, deviceName).then((response) => {
        console.log('isExternalRefAndDeviceNameActivated: ', response);
        if (response.data !== null) {
          if (response.data === true) {
            Alert.alert(
              I18n.t('external_ref_and_device_name_already_activated'),
              I18n.t('do_you_want_to_override'),
              [{
                text: I18n.t('cancel'),
                onPress: () => console.log('Cancel pressed'),
              }, { text: I18n.t('ok'), onPress: () => this.startRegisterFromDevice(externalRef, deviceName) },
              ],
            );
          } else {
            this.startRegisterFromDevice(externalRef, deviceName);
          }
        } else {
          const errMsg = 'isExternalRefAndDeviceNameActivated response data missing';
          console.error(errMsg);
          Alert.alert(I18n.t('error'), errMsg);
        }
      }).catch((err) => {
        console.error(err);
        Alert.alert(I18n.t('error'), err.toString());
      });
    } else {
      await this.startRegisterFromDevice(externalRef, deviceName);
    }
  };

  startRegisterFromDevice = async (externalRef, deviceName) => {
    console.log('startRegisterFromDevice');
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

          this.validateActivationCodeAndStartActivation(activationCode); // Start Encap activation
        },
      );
    }).catch((err) => {
      console.error(err);
      Alert.alert(I18n.t('error'), err.toString());
    });
  };

  activateFromBrowser = () => {
    console.log('activateFromBrowser');
    this.setState({ regInProgress: true, showActivationCodeUI: true });
  }

  validateActivationCodeAndStartActivation = async (activationCode) => {
    console.log('validateActivationCodeAndStartActivation: ', activationCode);
    NativeModules.EncapModule.startActivation(activationCode, (pinLength, pinType, allowedAuthMethods) => {
      const activationMsg = `Starting activation with Encap...${pinLength} ${pinType} ${allowedAuthMethods}`;
      if (this.state.isSampleBackend && this.state.appMode === AppStateType.WEB2APP) {
        /*
        Transfer the external reference and device name from the Merchant backend to the app in order to:
        - enable authentication from device even if registered from the web
        - hint user on which externalRef and deviceName to use if authenticating from web
        - make auto authentication feature work (depends on app knowing externalRef and device name)
        NOTE: In a production scenario, the mobile app would probably do a lockup against a database passing the Encap
        registrationId instead to get hold of the externalRef and device name.
        */
        RestClient.getWebRegInfo(this.state.merchantServerUrl, activationCode).then((response) => {
          console.log('getWebRegInfo: ', response);
          if (response && response.externalRef && response.deviceName) {
            this.updateAndSaveExternalReference(response.externalRef);
            this.updateAndSaveCurrentDevice(response.deviceName);
            console.log(activationMsg);
            this.setState({ showEnterPinUI: true, showActivationCodeUI: false });
          } else {
            const errMsg = I18n.t('external_ref_and_device_name_missing');
            this.onActivationError(errMsg);
          }
        }).catch((err) => {
          this.onActivationError(err);
        });
      } else {
        console.log(activationMsg);
        this.setState({ showEnterPinUI: true, showActivationCodeUI: false });
      }
    },
    (err) => {
      this.onActivationError(err);
    });
  };

  onActivationError = (error) => {
    const errorString = error.toString();
    console.log(`onActivationError: ${errorString}`);
    this.cancelEncapSession();
    this.setState({
      deviceActivated: false,
      showEnterPinUI: false,
      regInProgress: false,
      appMode: AppStateType.END_OF_FLOW,
      endOfFlowTitle: I18n.t('error'),
      endOfFlowText: errorString,
    });
  };

  performPinActivation = (pinCode) => {
    console.log('performPinActivation');
    NativeModules.EncapModule.finishPinCodeActivation(pinCode,
      () => {
        if (this.state.appMode === AppStateType.INAPP) {
          this.finishRegOperationOnDevice(pinCode);
        } else {
          const stateProps = {
            deviceActivated: true,
            showEnterPinUI: false,
            regInProgress: false,
            appMode: AppStateType.END_OF_FLOW,
            endOfFlowTitle: I18n.t('success'),
            endOfFlowText: I18n.t('activation_from_web_complete'),
          };

          this.continueAddBiometricWithStateProps(pinCode, stateProps);
        }
      },
      (err) => {
        this.onActivationError(err);
      });
  }

  finishRegOperationOnDevice = (pinCode) => {
    console.log('finishRegOperationOnDevice');

    // checking status
    RestClient.checkOperationStatus(this.state.statusUrl).then(
      (statusResponse) => {
        console.log(statusResponse);
        // If status  == COMPLETED, inform Signicat about it
        RestClient.informOperationComplete(this.state.completeUrl).then(
          (completeResponse) => {
            console.log(completeResponse);
            // update state and refresh UI
            if (completeResponse.status === 'SUCCESS') {
              const stateProps = {
                deviceActivated: true,
                showEnterPinUI: false,
                regInProgress: false,
                statusUrl: null,
                completeUrl: null,
                appMode: AppStateType.END_OF_FLOW,
                endOfFlowTitle: I18n.t('success'),
                endOfFlowText: I18n.t('activation_complete'),
              };

              this.continueAddBiometricWithStateProps(pinCode, stateProps);
            } else {
              this.onActivationError(completeResponse.data);
            }
          },
        );
      },
    ).catch((err) => {
      console.log(err);
    });
  };

  // ---------- Activation related code END ---------------- //

  // This will add the biometric support when authenticating
  continueAddBiometricWithStateProps = (pinCode, stateProps) => {
    // NOTE: It is only implemented for Android
    // TODO: Implement iOS FaceID / TouchID
    if (Platform.OS === 'android') {
      NativeModules.EncapModule.addOrUpdateBiometricMethod(pinCode, () => {
        this.setState(stateProps);
      }, (err) => {
        const errorString = err.toString();
        // If the user decides to do not add the biometric, then it fallback as completed state
        if (errorString === 'client.error.androidBiometricPromptErrorUserCanceled' || errorString === 'client.error.androidFingerprintErrorCanceled') {
          this.setState(stateProps);
        } else {
          this.onActivationError(err);
        }
      });
    } else {
      // Do not add any biometric feature for iOS
      this.setState(stateProps);
    }
  };

  // ---------- Authentication related code START ---------------- //
  authenticateFromDevice = async () => {
    console.log('authenticateFromDevice');
    this.setState({ processingAuthLoading: true });
    const deviceId = await NativeModules.EncapModule.getRegistrationId();
    // start auth session with merchant backend
    console.log('external reference is:', this.state.externalReference);
    RestClient.startAuthFromDevice(this.state.merchantServerUrl, this.state.externalReference, deviceId).then((response) => {
      // can be checked if response.status==success, then init auth session with Signicat
      const authUrl = response.data;
      RestClient.initAuthSession(authUrl).then((initAuthResponse) => {
        console.log(initAuthResponse);
        if (initAuthResponse.status === 'OK') {
          NativeModules.EncapModule.startAuthentication((availableBiometryAuthMethods, contextTitle, contextContent) => {
            console.log('availableBiometryAuthMethods device', availableBiometryAuthMethods);
            console.log(`contextTitle device ${contextTitle}`);
            console.log(`contextContent device ${contextContent}`);

            // For testing, keeping these params in state. In your app, manage on your own in a better way!
            this.setState({
              statusUrl: initAuthResponse.statusUrl,
              completeUrl: initAuthResponse.completeUrl,
              authInProgress: true,
              showEnterPinUI: availableBiometryAuthMethods.biometry !== true,
              appMode: AppStateType.INAPP,
              processingAuthLoading: false,
            });

            this.finishAuthenticationWithBiometricIfAvailable(availableBiometryAuthMethods);
          }, (err) => {
            console.error(err);
            this.cancelEncapSession();
            this.setState({ processingAuthLoading: false });
          });
        } else {
          Alert.alert(
            I18n.t('error'),
            initAuthResponse.error.message ? initAuthResponse.error.message : I18n.t('error'),
          );
          this.setState({ processingAuthLoading: false });
        }
      });
    }).catch((err) => {
      console.error(err);
      this.setState({ processingAuthLoading: false });
    });
  }

  finishAuthenticationWithBiometricIfAvailable = (availableBiometryAuthMethods) => {
    // NOTE: It is only implemented for Android
    // TODO: Implement iOS FaceID / TouchID
    if (availableBiometryAuthMethods.biometry === true && Platform.OS === 'android') {
      if (availableBiometryAuthMethods.biometricPrompt) {
        NativeModules.EncapModule.finishAuthWithBiometricPrompt(() => {
          this.finishAuthenticationOperation();
        }, (err) => {
          const errorString = err.toString();
          if (errorString === 'client.error.androidBiometricPromptErrorUserCanceled') {
            this.setState({
              authInProgress: false,
              appMode: AppStateType.UNKNOWN,
            });
          } else {
            this.setState({
              appMode: AppStateType.END_OF_FLOW,
              endOfFlowTitle: I18n.t('error'),
              endOfFlowText: err,
            });
          }
        });
      } else if (availableBiometryAuthMethods.fingerprint) {
        NativeModules.EncapModule.finishAuthWithFingerprint(() => {
          this.finishAuthenticationOperation();
        }, (err) => {
          const errorString = err.toString();
          if (errorString === 'client.error.androidFingerprintErrorCanceled') {
            this.setState({
              authInProgress: false,
              appMode: AppStateType.UNKNOWN,
            });
          } else {
            this.setState({
              appMode: AppStateType.END_OF_FLOW,
              endOfFlowTitle: I18n.t('error'),
              endOfFlowText: err,
            });
          }
        });
      }
    } else {
      this.setState({ showEnterPinUI: true });
    }
  };

  finishAuthenticationOperation = () => {
    if (this.state.appMode === AppStateType.INAPP) {
      this.finishAuthOperationOnDevice();
    } else {
      console.log('Finish WebAuth successful');
      // Meanwhile customer backend will be polling Signicat
      // and eventually will know that auth process is successful
      this.setState({
        authInProgress: false,
        appMode: AppStateType.END_OF_FLOW,
        endOfFlowTitle: I18n.t('success'),
        endOfFlowText: I18n.t('authentication_complete'),
      });
    }
  };

  checkAuthAndStartIfAvailable = (startedFromInit) => {
    console.log('checkAuthAndStartIfAvailable');
    NativeModules.EncapModule.startAuthentication((availableBiometryAuthMethods, contextTitle, contextContent) => {
      console.log('availableBiometryAuthMethods device', availableBiometryAuthMethods);
      console.log(`contextTitle device ${contextTitle}`);
      console.log(`contextContent device ${contextContent}`);

      const isBiometricEnabled = availableBiometryAuthMethods.biometry === true;
      if (contextTitle === undefined || contextTitle === '') {
        this.setState({ authInProgress: true, showEnterPinUI: !isBiometricEnabled, appMode: AppStateType.WEB2APP });
        this.finishAuthenticationWithBiometricIfAvailable(availableBiometryAuthMethods);
      } else {
        Alert.alert(
          I18n.t('consent_signature'),
          contextTitle,
          [
            {
              text: I18n.t('yes'),
              onPress: () => {
                console.log('Consent OK');
                this.setState({ authInProgress: true, showEnterPinUI: !isBiometricEnabled, appMode: AppStateType.WEB2APP });
                this.finishAuthenticationWithBiometricIfAvailable(availableBiometryAuthMethods);
              },
            },
            {
              text: I18n.t('no'),
              onPress: () => {
                console.log('Consent NOT OK');
                this.cancelEncapSession();
              },
              style: 'cancel',
            },
          ],
          {
            cancelable: true,
          },
        );
      }
    }, async (err) => {
      console.log(`Start authentication error: ${err}`);
      if (err === 'server.error.noSession' && startedFromInit && this.state.autoAuthOption && this.state.isSampleBackend) {
        this.authenticateFromDevice();
      }
    });
  }

  cancelAuthSession = () => {
    this.setState({
      showEnterPinUI: false,
    });
    this.cancelEncapSession();
  };

  cancelEncapSession = () => {
    // Will cancel the current activation, authentication or signing session on the server
    NativeModules.EncapModule.cancelSession(() => {
      console.log('Encap session cancelled successfully');
    }, (err) => {
      console.log(`Encap session cancel error: ${err}`);
    });
  };

  performPinAuthentication = (pinCode) => {
    console.log('performPinAuthentication');
    NativeModules.EncapModule.finishPinCodeAuthentication(pinCode, () => {
      this.finishAuthenticationOperation();
    }, (err) => {
      console.log(`Finish WebAuth Error ${err}`);
      // NOTE: When this happens is because (most of cases) there was a call of authentication
      // from then website when a current authentication was going on.
      // In that case, we can try to pick up the current session
      if (err === 'server.error.unexpected') {
        this.setState({
          showEnterPinUI: false,
          authInProgress: false,
          appMode: AppStateType.UNKNOWN,
        });
        Alert.alert(
          I18n.t('information'),
          I18n.t('authentication_invalidated_description'),
          [
            {
              text: I18n.t('ok'),
              onPress: () => {
                this.checkAuthAndStartIfAvailable(false);
              },
            },
          ],
          {
            cancelable: false,
          },
        );
      } else {
        this.setState({
          authInProgress: false,
          appMode: AppStateType.END_OF_FLOW,
          endOfFlowTitle: I18n.t('error'),
          endOfFlowText: err,
        });
      }
    });
  }

  finishAuthOperationOnDevice = () => {
    // now check status in the server
    RestClient.checkOperationStatus(this.state.statusUrl).then(
      (statusResponse) => {
        console.log(statusResponse);
        // If status  == COMPLETED, inform Signicat about it
        RestClient.informOperationComplete(this.state.completeUrl).then(
          (completeResponse) => {
            console.log(completeResponse);
            if (completeResponse.status === 'SUCCESS') {
              // update state and refresh UI
              this.setState({
                statusUrl: null,
                completeUrl: null,
                authInProgress: false,
                appMode: AppStateType.END_OF_FLOW,
                endOfFlowTitle: I18n.t('success'),
                endOfFlowText: I18n.t('authentication_complete'),
              });
            } else {
              this.setState({
                appMode: AppStateType.END_OF_FLOW,
                endOfFlowTitle: I18n.t('error'),
                endOfFlowText: completeResponse.data,
              });
            }
          },
        );
      },
    ).catch((err) => {
      console.error(err);
      this.setState({
        appMode: AppStateType.END_OF_FLOW,
        endOfFlowTitle: I18n.t('error'),
        endOfFlowText: err,
      });
    });
  }
  // ---------- Authentication related code START ---------------- //


  // ---------- Deactivate related code START ---------------- //
  deactivate = async () => {
    console.log('deactivate');
    const { externalReference, currentDevice } = this.state;

    if (this.state.isSampleBackend) {
      RestClient.deleteDevice(this.state.merchantServerUrl, externalReference, currentDevice).then((response) => {
        console.log('deleteDevice response: ', response);
      }).catch((err) => {
        console.error(err);
        Alert.alert(I18n.t('error'), err.toString());
      });
    }

    NativeModules.EncapModule.deactivate().then(() => {
      console.log('encap deactivation success');
      this.storeDataToAsyncStorage(KEY_AUTO_AUTH_OPTION, 'false'); // Not allowed in inactivated state
      this.setState({
        deviceActivated: false,
        authInProgress: false,
        regInProgress: false,
        showEnterPinUI: false,
        showActivationCodeUI: false,
        autoAuthOption: false,
        tempAutoAuthOption: false,
        appMode: AppStateType.UNKNOWN, // to go back to home screen
      });
    }).catch((err) => {
      console.error(`deactivate error ${err}`);
    });
  };

  // ---------- Other utilities methods ---------------- //
  getDeviceIsNotActivatedAndOperationIsNotInProgress = () => {
    if (this.state.deviceActivated === !true
        && this.state.regInProgress === !true
        && this.state.authInProgress === !true) {
      return true;
    }
    return false;
  }

  getDeviceIsNotActivatedRegInProgressActivationCodeNeeded = () => {
    if (this.state.deviceActivated === !true
        && this.state.appMode === AppStateType.WEB2APP
        && this.state.regInProgress === true
        && this.state.showActivationCodeUI === true) {
      return true;
    }
    return false;
  }

  getDeviceIsNotActivatedRegInProgressPincodeNeeded = () => {
    if (this.state.deviceActivated === false
        && this.state.regInProgress === true
        && this.state.showEnterPinUI === true) {
      return true;
    }
    return false;
  }

  getDeviceIsActivatedAndOperationIsNotInProgress = () => {
    if (this.state.appMode !== AppStateType.UNKNOWN
        && this.state.appMode !== AppStateType.SETTINGS
        && this.state.appMode !== AppStateType.END_OF_FLOW
        && this.state.deviceActivated === true
        && this.state.regInProgress === !true
        && this.state.authInProgress === !true) {
      return true;
    }
    return false;
  }

  getDeviceIsActivatedAuthInProgressPincodeNeeded = () => {
    if (this.state.deviceActivated === true
        && this.state.authInProgress === true
        && this.state.showEnterPinUI === true) {
      return true;
    }
    return false;
  }

  setToWeb2AppMode = () => {
    console.log('setToWeb2AppMode');
    if (this.validURL(this.state.merchantServerUrl)) {
      this.setState({ appMode: AppStateType.WEB2APP });
    } else {
      Alert.alert(I18n.t('error'), I18n.t('invalid_server_url'));
    }
  }

  setToInAppMode = () => {
    console.log('setToInAppMode');
    if (this.validURL(this.state.merchantServerUrl)) {
      this.setState({ appMode: AppStateType.INAPP });
    } else {
      Alert.alert(I18n.t('error'), I18n.t('invalid_server_url'));
    }
  }

  setToSettingsMode = async () => {
    console.log('setToSettingsMode');
    this.setState({ appMode: AppStateType.SETTINGS });
  }

   validURL = (str) => {
     const httpsRegex = new RegExp('^https:\\/\\/\\w+(\\.\\w+)*(:[0-9]+)?\\/?(\\/[.-\\w]*)*$', 'i');
     const httpRegex = new RegExp('^http:\\/\\/\\w+(\\.\\w+)*(:[0-9]+)?\\/?(\\/[.-\\w]*)*$', 'i');
     return !!httpsRegex.test(str) || !!httpRegex.test(str);
   }

   goToHomeScreen = () => {
     console.log('goToHomeScreen');
     this.setState({ appMode: AppStateType.UNKNOWN, regInProgress: false, authInProgress: false });
   }

   render() {
     console.log(`render: appMode.${this.state.appMode}`);
     const statusBarInvert = this.state.appMode === AppStateType.END_OF_FLOW;
     const barStyle = Platform.OS === 'ios' ? 'dark-content' : 'light-content';
     return (
       <RootSiblingParent>
       <KeyboardAvoidingView
         style={{ flex: 1 }}
         behavior="padding"
         enabled={Platform.OS === 'ios'}
       >
         <StatusBar
           backgroundColor={statusBarInvert ? Colors.white : Colors.primaryBlue}
           barStyle={barStyle}
           translucent={false}
         />
         <SafeAreaView style={{ flex: 1 }}>
           <View style={styles.body}>

           {
             this.state.appMode === AppStateType.UNKNOWN && (
             <Header/>
             )
           }

           {
             <View style={{ flex: 1 }}>
               {
                this.state.appMode === AppStateType.END_OF_FLOW && (
                  <EndOfFlowUI
                    endOfFlowTitle={this.state.endOfFlowTitle}
                    endOfFlowText={this.state.endOfFlowText}
                    onPressOk={() => this.setState({ appMode: AppStateType.UNKNOWN })}
                  />
                )
              }

               {
                this.state.appMode === AppStateType.UNKNOWN && (
                  <ChooseAppModeUI
                    setWeb2AppMode={this.setToWeb2AppMode}
                    setInAppMode={this.setToInAppMode}
                    setSettingsMode={this.setToSettingsMode}
                  />
                )
              }

               {
                this.state.appMode === AppStateType.SETTINGS && (
                  <ChangeSettingsUI
                    merchantServerUrl={this.state.merchantServerUrl}
                    tempMerchantServerUrl={this.state.tempMerchantServerUrl}
                    encapAppId={this.state.encapAppId}
                    tempEncapAppId={this.state.tempEncapAppId}
                    signicatEnvId={this.state.signicatEnvId}
                    tempSignicatEnvId={this.state.tempSignicatEnvId}
                    clearAllTempSettings={this.clearAllTempSettings}
                    updateMerchantServerUrl={this.updateMerchantServerUrl}
                    updateEncapApplicationId={this.updateEncapApplicationId}
                    updateSignicatEnv={this.updateSignicatEnv}
                    applySettings={this.applySettingsChange}
                    goToHome={this.goToHomeScreen}
                    hasValidUrlFormat={this.validURL}
                    autoAuthOptionValue={this.state.tempAutoAuthOption}
                    updateAutoAuthOption={this.updateAutoAuthOption}
                    isSampleBackend={this.state.tempIsSampleBackend}
                    updateIsSampleBackendOption={this.updateIsSampleBackendOption}
                    deviceActivated={this.state.deviceActivated}
                    isKeyboardVisible={this.state.isKeyboardVisible}
                  />
                )
              }

               {
                this.getDeviceIsNotActivatedAndOperationIsNotInProgress() && this.state.appMode === AppStateType.INAPP && (
                  <InactivateStateUI
                    appMode={this.state.appMode}
                    deviceActivated={this.state.deviceActivated}
                    onExternalReferenceChange={this.updateAndSaveExternalReference}
                    onDeviceChange={this.updateAndSaveCurrentDevice}
                    externalReference={this.state.externalReference}
                    currentDevice={this.state.currentDevice}
                    performAction={this.activateFromDevice}
                    goToHome={this.goToHomeScreen}
                  />
                )
              }

               {
                this.getDeviceIsNotActivatedAndOperationIsNotInProgress() && this.state.appMode === AppStateType.WEB2APP && (
                  <InactivateStateUI
                    appMode={this.state.appMode}
                    performAction={this.activateFromBrowser}
                    goToHome={this.goToHomeScreen}
                  />
                )
              }

               {
                this.getDeviceIsNotActivatedRegInProgressActivationCodeNeeded() && (
                  <EnterActivationCodeUI
                    validateCode={this.validateActivationCodeAndStartActivation}
                    goToHome={this.goToHomeScreen}
                  />
                )
              }

               {
                this.getDeviceIsNotActivatedRegInProgressPincodeNeeded() && (
                  <EnterPincodeCodeUI
                    performAction={this.performPinActivation}
                    goToHome={this.goToHomeScreen}
                    onCancel={this.deactivate}
                  />
                )
              }

               {
                this.getDeviceIsActivatedAuthInProgressPincodeNeeded() && (
                  <EnterPincodeCodeUI
                    performAction={this.performPinAuthentication}
                    goToHome={this.goToHomeScreen}
                    onCancel={this.cancelAuthSession}
                  />
                )
              }

               {
                this.getDeviceIsActivatedAndOperationIsNotInProgress() && (
                  <ActivatedStateUI
                    appMode={this.state.appMode}
                    deactivateDevice={this.deactivate}
                    startAuthenticate={this.authenticateFromDevice}
                    goToHome={this.goToHomeScreen}
                    externalReference={this.state.externalReference}
                    currentDevice={this.state.currentDevice}
                    isSampleBackend={this.state.isSampleBackend}
                    onExternalReferenceChange={this.updateAndSaveExternalReference}
                    onDeviceChange={this.updateAndSaveCurrentDevice}
                    isKeyboardVisible={this.state.isKeyboardVisible}
                  />
                )
              }
             </View>
           }
           </View>
           {
             this.state.processingAuthLoading && (
               <Loading/>
             )
           }
         </SafeAreaView>
       </KeyboardAvoidingView>
       </RootSiblingParent>
     );
   }
}

export default App;
