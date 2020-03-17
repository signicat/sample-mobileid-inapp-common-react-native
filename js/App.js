import React, { Component } from 'react';
import {
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

import {
  InactivateStateUI, ActivatedStateUI, Header, EncapConfigError, EnterActivationCodeUI, EnterPincodeCodeUI, ChooseAppModeUI, ServerAddressUI,
} from './UserInterfaceUtils';
import styles from './Styles';
import RestClient from './RestClient';

const { encapServerUrl, encapApplicationId, encapPublicKey } = require('./SignicatConfig');
const { baseEndpoint } = require('./MerchantConfig');

const APP_MODE_WEB2APP = 'WEB2APP';
const APP_MODE_INAPP = 'INAPP';
const APP_MODE_UNKNOWN = 'UNKNOWN';

//  Sample account data for registration and authentication, used in InApp mode   //
const accountName = 'kekur';
const deviceName = 'myDevice';

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
      appMode: APP_MODE_UNKNOWN,
    };
  }

  async componentDidMount() {
    console.log(`Platform ${Platform.OS}`);
    this.initializeEncap().then(() => {
      this.setState({ encapConfigured: true, merchantServerUrl: baseEndpoint });

      // get and set activation status
      this.updateDeviceState();
    }).catch((error) => {
      console.error(error);
      // Alert.alert('Encap initialization error!');
    });

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
  }

    onPushNotification = () => {
      console.log('Push Notification Arrived');
      console.log('Start auth...');
      this.authStartFomBrowser();
    };

    updateDeviceState = async () => {
      const activated = await NativeModules.EncapModule.isDeviceActivated();
      this.setState({ deviceActivated: activated });
      console.log(`Is device activated: ${activated}`);
    }

    initializeEncap = async () => {
      console.log('initializeEncap...');
      return NativeModules.EncapModule.configureEncap(encapServerUrl, encapApplicationId, encapPublicKey);
    };


    // ---------- Activation related code START ---------------- //
    activateFromDevice = async () => {
      console.log('activateDevice...');

      // create account
      RestClient.startRegister(accountName, deviceName).then((response) => {
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
          if (this.state.appMode === APP_MODE_INAPP) {
            this.finishRegOperationOnDevice();
          } else {
            const logMsg = 'Finish activation successful from web';
            console.log(logMsg);
            Alert.alert('Success', logMsg);
            this.setState({ deviceActivated: true, showEnterPinUI: false, regInProgress: false });
            // meanwhile customer backend will be polling Signicat
            // and eventually will know that registration process is successful
          }
        },
        (err) => {
          const errMsg = `Finish activation failed from web ${err}`;
          console.error(errMsg);
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
                });
                console.log(completeResponse);
                Alert.alert('Registration is successful!');
              } else {
                console.log(completeResponse);
                Alert.alert('Error', completeResponse.data);
              }
            },
          );
        },
      ).catch((err) => {
        console.error(err);
      });
    };

    // ---------- Activation related code END ---------------- //


    // ---------- Authentication related code START ---------------- //
    authenticateFromDevice = async () => {
      console.log('');
      const deviceId = await NativeModules.EncapModule.getRegistrationId();
      // start auth session with merchant backend
      RestClient.startAuth(accountName, deviceId).then((response) => {
        // can be checked if response.status==success, then init auth session with Signicat
        const authUrl = response.data;
        RestClient.initAuthSession(authUrl).then((initAuthResponse) => {
          console.log(initAuthResponse);
          // For testing, keeping these params in state. In your app, manage on your own in a better way!

          if (initAuthResponse.status === 'OK') {
            this.setState({
              statusUrl: initAuthResponse.statusUrl,
              completeUrl: initAuthResponse.completeUrl,
              authInProgress: true,
              showEnterPinUI: true,
            });
          }
        });
      }).catch((err) => {
        console.error(err);
      });
    }

    authStartFomBrowser = () => {
      console.log('authenticate from web...');
      this.setState({ authInProgress: true, showEnterPinUI: true, appMode: APP_MODE_WEB2APP });
    }

    performPinAuthentication = (pincode) => {
      NativeModules.EncapModule.startAuthentication(() => {
        NativeModules.EncapModule.finishPinCodeAuthentication(pincode, (fResponse) => {
          if (this.state.appMode === APP_MODE_INAPP) {
            this.finishAuthOperationOnDevice(fResponse);
          } else {
            const logMsg = 'Finish WebAuth successful';
            console.log(logMsg);
            Alert.alert('Success', logMsg);
            // meanwhile customer backend will be polling Signicat
            // and eventually will know that auth process is successful
            this.setState({ authInProgress: false });
          }
        }, (err) => {
          const errMsg = `Finish WebAuth Error ${err}`;
          console.log(errMsg);
          Alert.alert('Error', errMsg);
        });
      }, (err) => {
        const errMsg = `Start WebAuth Error ${err}`;
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
          appMode: APP_MODE_UNKNOWN, // to go back to home sscreen
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
          && this.state.appMode === APP_MODE_WEB2APP
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
      if (this.state.appMode !== APP_MODE_UNKNOWN
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
        this.setState({ appMode: APP_MODE_WEB2APP });
      } else {
        Alert.alert('Error!', 'Invalid server URL');
      }
    }

    setToInAppMode = () => {
      if (this.validURL(this.state.merchantServerUrl)) {
        this.setState({ appMode: APP_MODE_INAPP });
      } else {
        Alert.alert('Error!', 'Invalid server URL');
      }
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
                 this.state.appMode === APP_MODE_INAPP && (
                 <ServerAddressUI
                   defaultValue={this.state.merchantServerUrl}
                   setServerAddress={(addr) => { this.setState({ merchantServerUrl: addr }); }}
                 />)
               }
               {
                this.state.encapConfigured === true && (
                <View style={styles.body}>
                  {
                    this.state.appMode === APP_MODE_UNKNOWN && (
                    <ChooseAppModeUI
                      setWeb2AppMode={this.setToWeb2AppMode}
                      setInAppMode={this.setToInAppMode}
                    />)
                  }
                  {
                    this.deviceIsNotActivatedAndOperationIsNotInProgress() && this.state.appMode === APP_MODE_INAPP && (
                    <InactivateStateUI
                      appMode={this.state.appMode}
                      performAction={this.activateFromDevice}
                    />)
                  }
                  {
                    this.deviceIsNotActivatedAndOperationIsNotInProgress() && this.state.appMode === APP_MODE_WEB2APP && (
                    <InactivateStateUI
                      appMode={this.state.appMode}
                      performAction={this.activateFomBrowser}
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
