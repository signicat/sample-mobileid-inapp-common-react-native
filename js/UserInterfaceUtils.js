
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  Dimensions,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';

import Toast from 'react-native-root-toast';
import React from 'react';
import I18n from '../i18n/i18n';

import styles, { verticalSpacing } from './Styles';
import Colors from './Colors';
import AppStateType from './configs/AppState';
import Button from './UI-components/Button';
import NavBar from './UI-components/NavBar';
import PinCodeInput from './UI-components/PinCodeInput';
import ImageButton from './UI-components/ImageButton';
import TextInputWithTitle from './UI-components/TextInputWithTitle';
import RadioButton from './UI-components/RadioButton';
import SignicatConfig from './configs/SignicatConfig';
import TitleAndDataRow from './UI-components/TitleAndDataRow';
import SwitchCustom from './UI-components/SwitchCustom';

const webImage = require('../assets/icons_material_devices.png');
const phoneImage = require('../assets/icons_material_phone_iphone.png');
const smallRocketLaunchingImage = require('../assets/small_rocket_launching.png');
const settingsImage = require('../assets/icons_material_settings.png');
const rocketIllustrationImage = require('../assets/rocket_illustration.png');
const rocketIllustrationImageGrey = require('../assets/rocket_illustration_grey.png');
const flyingRocketImage = require('../assets/flying_rocket.png');
const authenticateImage = require('../assets/authenticate.png');
const cloudsImage = require('../assets/clouds.png');

const alertMsg = async (msg, duration) => {
  Toast.show(msg, {
    duration: duration || Toast.durations.LONG,
    position: Toast.positions.TOP,
    shadow: true,
    animation: true,
    hideOnPress: true,
    delay: 0,
  });
};

const Loading = () => (
  <View style={[styles.maxsize, styles.whiteOpacity50, styles.center]}>
    <ActivityIndicator size="large" color={Colors.primaryBlue}/>
  </View>
);

const Header = () => {
  console.log('Header');
  return (
    <View style={{ paddingTop: 25, backgroundColor: Colors.primaryBlue }}>
      <Image
        source={smallRocketLaunchingImage}
        style={{
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').width
          * (Image.resolveAssetSource(smallRocketLaunchingImage).height / Image.resolveAssetSource(smallRocketLaunchingImage).width),
        }}
      />

      <Text style={{
        letterSpacing: 1.08,
        textAlign: 'center',
        fontFamily: 'OpenSans-SemiBold',
        fontSize: 20,
        position: 'absolute', // Allows text to be printed on top of image
        bottom: 0,
        left: 0,
        right: 0,
        color: Colors.slate,
      }}
      >
        {I18n.t('app_name')}
      </Text>
    </View>
  );
};

const flyingRocketWidth = 0.75 * Dimensions.get('window').width;
const flyingRocketScaled = (
  <Image
    source={flyingRocketImage}
    style={{
      width: flyingRocketWidth,
      height: flyingRocketWidth
          * (Image.resolveAssetSource(flyingRocketImage).height / Image.resolveAssetSource(flyingRocketImage).width),
    }}
  />
);

const EnterActivationCodeUI = (props) => {
  console.log('EnterActivationCodeUI');
  return (
    <View style={styles.maxsize}>
      <NavBar
        caption={I18n.t('activate')}
        onPressBack={() => {
          Keyboard.dismiss();
          props.goToHome();
        }}
      />
      {flyingRocketScaled}
      <View style={[styles.container, { marginTop: 15 }]}>
        <View style={styles.center}>
          <Text style={styles.activationCodeTitleText}>{I18n.t('enter_activation_code')}</Text>
          <TextInput
            accessibilityLabel={I18n.t('wcag_activation_code')}
            accessibilityHint={I18n.t('wcag_activation_code_hint')}
            style={styles.activationCodeTextInput}
            keyboardType="numeric"
            autoFocus
            maxLength={6}
            placeholder=""
            underlineColorAndroid="transparent"
            onChangeText={(code) => {
              if (code.length === 6) {
                props.validateCode(code);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
};

const EnterPincodeCodeUI = (props) => {
  console.log('EnterPincodeCodeUI');
  return (
    <View style={styles.maxsize}>
      <NavBar
        caption={I18n.t('enter_pin')}
        onPressBack={() => {
          Keyboard.dismiss();
          props.onCancel();
          props.goToHome();
        }}
      />
      {flyingRocketScaled}
      <View style={[styles.container, { marginTop: 15 }]}>
        <View style={styles.center}>
          <Text style={styles.activationCodeTitleText}>{I18n.t('enter_pin')}</Text>
          <PinCodeInput
            pinLength={4}
            onComplete={props.performAction}
            style={{ marginTop: 31 }}
          />
        </View>
      </View>
    </View>
  );
};

const getExternalRefAndDeviceNameTextBoxes = props => (
  <View style={{ flexDirection: 'column' }}>
    <TextInputWithTitle
      title={I18n.t('external_reference')}
      editable={props.deviceActivated !== true}
      placeholder={props.externalReference ? props.externalReference : I18n.t('not_set_type_it')}
      defaultValue={props.externalReference ? props.externalReference : ''}
      onChangeText={(newExternalReference) => {
        props.onExternalReferenceChange(newExternalReference);
      }}
    />
    <View style={{ marginTop: verticalSpacing }}/>
    <TextInputWithTitle
      title={I18n.t('device_name')}
      editable={props.deviceActivated !== true}
      placeholder={props.currentDevice ? props.currentDevice : I18n.t('not_set_type_it')}
      defaultValue={props.currentDevice ? props.currentDevice : ''}
      underlineColorAndroid="transparent"
      onChangeText={(newDeviceName) => {
        props.onDeviceChange(newDeviceName);
      }}
    />
  </View>
);

const InactivateStateUI = (props) => {
  console.log('InactiveStateUI');
  const invertedColors = props.appMode === AppStateType.WEB2APP;
  const backgroundImage = invertedColors ? rocketIllustrationImage : rocketIllustrationImageGrey;
  const showExternalRefAndDeviceNameTextBoxes = props.appMode === AppStateType.INAPP;
  const externalRefAndDeviceNameTextBoxes = showExternalRefAndDeviceNameTextBoxes
    ? getExternalRefAndDeviceNameTextBoxes(props) : null;

  return (
    <View style={[styles.maxsize, { backgroundColor: invertedColors ? Colors.primaryBlue : Colors.white }]}>
      <NavBar
        caption={props.appMode === AppStateType.WEB2APP ? I18n.t('activate_from_web') : I18n.t('activate_from_device')}
        onPressBack={() => {
          Keyboard.dismiss();
          props.goToHome();
        }}
        onPressHelp={() => {
          Alert.alert(I18n.t('information'), I18n.t('press_button_to_activate'));
        }}
      />
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={styles.container}>
          {
            { showExternalRefAndDeviceNameTextBoxes } && (
              <>
                { externalRefAndDeviceNameTextBoxes }
              </>
            )
          }
        </View>

        <View>
          <ImageBackground
            source={backgroundImage}
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').width
                  * (Image.resolveAssetSource(backgroundImage).height / Image.resolveAssetSource(backgroundImage).width),
              justifyContent: 'space-between',
            }}
          >
            {/* Keep the empty View below, important for 'space-between' to work properly */}
            <View/>
            <View style={{ marginLeft: 20, marginRight: 20, marginBottom: 3 }}>
              <Button
                title={props.appMode === AppStateType.WEB2APP ? I18n.t('activate_from_web') : I18n.t('activate_from_device')}
                onPress={() => {
                  props.performAction();
                }}
              />
            </View>
          </ImageBackground>
        </View>
      </View>
    </View>);
};

const ChooseAppModeUI = (props) => {
  console.log('ChooseAppModeUI');
  return (
    <View style={styles.maxsize}>
      <View style={{ flex: 0.4, justifyContent: 'center', alignItems: 'center' }}/>

      <View style={[styles.container]}>

        <ImageButton
          image={settingsImage}
          caption={I18n.t('setup')}
          text={I18n.t('configure_merchant_and_signicat_settings')}
          onPress={props.setSettingsMode}
          horizontalButton
        />

        <View style={{ flexDirection: 'row' }}>
          <View style={{
            justifyContent: 'flex-start',
            flex: 1,
            marginTop: 20,
          }}
          >
            <ImageButton
              image={phoneImage}
              caption={I18n.t('inapp_mobile')}
              text={I18n.t('reg_and_auth_start_from_app')}
              onPress={props.setInAppMode}
            />

          </View>
          <View style={{
            justifyContent: 'flex-end',
            flex: 1,
            marginLeft: 20,
          }}
          >
            <ImageButton
              image={webImage}
              caption={I18n.t('inapp_web')}
              text={I18n.t('reg_and_auth_start_from_web')}
              onPress={props.setWeb2AppMode}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const ChangeSettingsUI = (props) => {
  console.log('ChangeSettingsUI');
  const envs = SignicatConfig.getEnvironments();

  return (
    <View style={styles.maxsize}>
      <NavBar
        caption={I18n.t('settings')}
        onPressBack={() => {
          props.clearAllTempSettings();
          Keyboard.dismiss();
          props.goToHome();
        }}
        onPressHelp={() => {
          Alert.alert(I18n.t('information'), I18n.t('settings_screen_help_msg'));
        }}
      />
      <ScrollView>
        {/* NOTE: styles.container causing bugs if put on scrollview or on view encapsulating scrollview! */}
        <View style={styles.container}>
          { props.isSampleBackend && (
            <View style={{ marginBottom: verticalSpacing }}>
              <View style={{
                flex: 1, flexDirection: 'row',
              }}
              >
                <View style={{ flex: 5 }}>
                  <Text style={[styles.settingsItemTitleText, { paddingBottom: 6, paddingTop: 2 }]}>
                    {I18n.t('auto_auth_option')}
                  </Text>
                  <Text style={[styles.settingsItemDescriptionText]}>
                    {I18n.t('auto_auth_option_description')}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <SwitchCustom
                    onValueChange={value => props.updateAutoAuthOption(value)}
                    value={props.autoAuthOptionValue}
                  />
                </View>
              </View>
            </View>)
          }

          <TextInputWithTitle
            title={I18n.t('merchant_server_address')}
            autoFocus={false}
            placeholder={props.tempMerchantServerUrl ? props.tempMerchantServerUrl : 'type http(s)://server:port/mobileid-inapp'}
            defaultValue={props.tempMerchantServerUrl ? props.tempMerchantServerUrl : props.merchantServerUrl}
            onChangeText={(addr) => {
              if (props.hasValidUrlFormat(addr)) {
                props.updateMerchantServerUrl(addr);
              }
            }}
          />

          <View style={{ marginBottom: verticalSpacing }}/>

          <View style={{
            flex: 1, flexDirection: 'row',
          }}
          >
            <View style={{ flex: 5 }}>
              <Text style={[styles.settingsItemTitleText, { paddingBottom: 6, paddingTop: 2 }]}>
                {I18n.t('server_is_sample_backend')}
              </Text>
              <Text style={[styles.settingsItemDescriptionText]}>
                {I18n.t('server_is_sample_backend_description')}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <SwitchCustom
                onValueChange={value => props.updateIsSampleBackendOption(value)}
                value={props.isSampleBackend}
              />
            </View>
          </View>

          <View style={{ marginTop: verticalSpacing }}/>
          <View style={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            marginBottom: verticalSpacing,
          }}
          >
            <Text style={[styles.settingsItemTitleText, { marginBottom: 15 }]}>
              {I18n.t('signicat_environment')}
            </Text>
            {
              envs.map(item => (
                <RadioButton
                  accessibilityRole="radio"
                  key={item.id}
                  id={item.id}
                  selected={(item.id === (props.tempSignicatEnvId ? props.tempSignicatEnvId : props.signicatEnvId))}
                  size={44}
                  label={item.id}
                  onClick={(envId) => {
                    console.log('RadioButton envId: ', envId);
                    props.updateSignicatEnv(envId);
                  }}
                />
              ))
            }
          </View>

          <TextInputWithTitle
            title={I18n.t('application_id')}
            autoFocus={false}
            placeholder={props.tempEncapAppId ? props.tempEncapAppId : props.encapAppId}
            value={props.defaultValue}
            onChangeText={(appId) => {
              props.updateEncapApplicationId(appId);
            }}
          />
          <View style={{ padding: 10 }}/>

        </View>
      </ScrollView>

      {
        !props.isKeyboardVisible && ( // KeyboardAvoidingView not working properly here - this is a workaround
        <View style={[styles.container, { paddingTop: 10 }]}>
          <Button
            title={I18n.t('apply')}
            onPress={() => {
              props.applySettings();
            }}
          />
        </View>)
      }
    </View>
  );
};


const ActivatedStateUI = (props) => {
  console.log('ActivatedStateUI');
  const showExternalRefAndDeviceNameTextBoxes = props.appMode === AppStateType.INAPP && !props.isSampleBackend;
  const externalRefAndDeviceNameTextBoxes = showExternalRefAndDeviceNameTextBoxes
    ? getExternalRefAndDeviceNameTextBoxes(props) : null;
  return (
    <View style={styles.maxsize}>

      <NavBar
        caption={I18n.t('authenticate')}
        onPressBack={() => {
          Keyboard.dismiss();
          props.goToHome();
        }}
            // TODO: Proper help message
        onPressHelp={() => {
          Alert.alert(I18n.t('information'), I18n.t('press_button_to_authenticate_or_deactivate'));
        }}
      />

      <View style={styles.container}>
        { props.isSampleBackend && (
          <View style={{ marginBottom: 20 }}>
            <TitleAndDataRow
              title={I18n.t('external_reference')}
              data={props.externalReference}
            />
            <TitleAndDataRow
              title={I18n.t('device_name')}
              data={props.currentDevice}
            />
          </View>)
        }

        {
          { showExternalRefAndDeviceNameTextBoxes } && (
            <>
              { externalRefAndDeviceNameTextBoxes }
            </>
          )
        }
      </View>

      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
      >
        <View style={{
          justifyContent: 'center', flex: 2, alignItems: 'center',
        }}
        >
          <Image
            source={authenticateImage}
            style={{
              flex: 1,
              aspectRatio: 1,
              maxWidth: Dimensions.get('window').width,
              maxHeight: Dimensions.get('window').width, // YES it should be width here, square image
            }}
            resizeMode="contain"
          />
        </View>

        {
          !props.isKeyboardVisible && (
            <View style={[styles.container, {
              width: Dimensions.get('window').width,
              alignItems: 'stretch',
              justifyContent: 'flex-end',
              paddingTop: 20,
            }]}
            >
              <Button
                title={I18n.t('authenticate')}
                onPress={() => {
                  if (props.appMode === AppStateType.WEB2APP) {
                    Alert.alert(I18n.t('information'), I18n.t('start_authentication_from_web'));
                  } else {
                    props.startAuthenticate();
                  }
                }}
              />
              <Button
                title={I18n.t('deactivate')}
                secondaryButton
                onPress={() => {
                  Alert.alert(
                    I18n.t('deactivate_device'),
                    I18n.t('are_you_sure'),
                    [{
                      text: I18n.t('cancel'),
                      onPress: () => console.log('Cancel pressed'),
                    },
                    { text: I18n.t('ok'), onPress: () => props.deactivateDevice() },
                    ],
                  );
                }}
              />
            </View>)
        }
      </View>
    </View>
  );
};

const EndOfFlowUI = (props) => {
  console.log('EndOfFlowUI');
  Alert.alert(
    props.endOfFlowTitle,
    props.endOfFlowText,
    [
      {
        text: I18n.t('ok'),
        onPress: () => {
          console.log('ON PRESS OK');
          props.onPressOk();
        },
      },
    ],
  );

  return (
    <View style={styles.maxsize}>
      {/* Transitioning from Enter PIN to End of Flow app state, having Navbar invisible here makes */}
      {/* flyingRocket image end up at the exact same position on screen on both screens - looks nicer */}
      <NavBar invisible />
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {flyingRocketScaled}
        <Image
          source={cloudsImage}
          style={{
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').width
              * (Image.resolveAssetSource(cloudsImage).height / Image.resolveAssetSource(cloudsImage).width),
          }}
        />
      </View>
    </View>
  );
};

export {
  alertMsg,
  Loading,
  Header,
  InactivateStateUI,
  ActivatedStateUI,
  EnterActivationCodeUI,
  EnterPincodeCodeUI,
  ChooseAppModeUI,
  ChangeSettingsUI,
  EndOfFlowUI,
};
