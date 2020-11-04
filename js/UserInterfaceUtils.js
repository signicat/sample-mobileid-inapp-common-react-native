
import {
  View, Text, TouchableOpacity, TextInput, ImageBackground, Alert,
} from 'react-native';
import React from 'react';

import styles from './Styles';
import Colors from './Colors';
import AppStateType from './configs/AppState';

const logo = require('../assets/logo.png');

const Header = () => (
  <ImageBackground
    accessibilityRole="image"
    source={logo}
    style={styles.background}
    imageStyle={styles.logo}
  >
    <Text style={styles.text}>SampleApp</Text>
    <Text style={{
      paddingTop: 10, textAlign: 'center', fontSize: 20, color: Colors.black,
    }}
    >
    Signicat MobileID InApp Integration
    </Text>
  </ImageBackground>
);

const EncapConfigError = () => (
  <View style={styles.container}>
    <TouchableOpacity
      accessibilityRole="button"
      style={styles.linkContainer}
    >
      <Text style={styles.link}>Encap configuration error!</Text>
    </TouchableOpacity>
  </View>
);

const EnterActivationCodeUI = props => (
  <View style={styles.container}>
    <View style={styles.center}>
      <Text style={[{ paddingBottom: 16, textAlign: 'center', fontSize: 20 }]}>
                Enter your activation code
      </Text>
      <TextInput
        style={styles.activationCode}
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
);

const EnterPincodeCodeUI = props => (
  <View style={styles.container}>
    <View style={styles.center}>
      <Text style={[{ paddingBottom: 16, textAlign: 'center', fontSize: 20 }]}>
                Enter your PIN
      </Text>
      <TextInput
        style={styles.activationCode}
        keyboardType="numeric"
        autoFocus
        maxLength={4}
        placeholder=""
        underlineColorAndroid="transparent"
        onChangeText={(pincode) => {
          if (pincode.length === 4) {
            props.performAction(pincode);
          }
        }}
      />
    </View>
  </View>
);

const InactivateStateUI = props => (
  <View style={styles.container}>
    {
      props.appMode === AppStateType.INAPP && (
        <View style={{ flexDirection: 'column' }}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{
              fontSize: 18, paddingRight: 10, height: 50, textAlignVertical: 'center',
            }}
            >
              User ref.
            </Text>
            <TextInput
              style={{
                flex: 0.9, paddingLeft: 8, backgroundColor: Colors.white, width: 200, height: 50, color: Colors.black,
              }}
              autoFocus={false}
              keyboardType="url"
              maxLength={200}
              editable={props.deviceActivated !== true}
              placeholder={props.currentUser ? props.currentUser : 'not set, type it'}
              placeholderTextColor="grey"
              value={props.defaultValue}
              underlineColorAndroid="transparent"
              onChangeText={(newUser) => {
                props.onUserChange(newUser);
              }}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={{
              fontSize: 18, paddingRight: 10, height: 50, textAlignVertical: 'center',
            }}
            >
              Device name.
            </Text>
            <TextInput
              style={{
                flex: 0.9, paddingLeft: 8, backgroundColor: Colors.white, width: 200, height: 50, color: Colors.black,
              }}
              autoFocus={false}
              keyboardType="url"
              maxLength={200}
              editable={props.deviceActivated !== true}
              placeholder={props.currentDevice ? props.currentDevice : 'not set, type it'}
              placeholderTextColor="grey"
              value={props.defaultValue}
              underlineColorAndroid="transparent"
              onChangeText={(newUser) => {
                props.onDeviceChange(newUser);
              }}
            />
          </View>
        </View>
      )
    }
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.performAction();
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>
        Activate
        {props.appMode === AppStateType.WEB2APP ? ' from web' : ' from device'}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.goToHome();
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>Go to home</Text>
    </TouchableOpacity>
  </View>
);

const ChooseAppModeUI = props => (
  <View style={styles.container}>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.setInAppMode();
      }}
      style={[styles.buttonContainer, { backgroundColor: Colors.lightPurple, opacity: 0.8 }]}
    >
      <Text style={[styles.link, { textAlign: 'center', fontSize: 25 }]}>InApp Mobile</Text>
      <Text style={[styles.link, { textAlign: 'center', fontSize: 15 }]}>Reg and Auth starts from app</Text>
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.setWeb2AppMode();
      }}
      style={styles.buttonContainer}
    >
      <Text style={[styles.link, { textAlign: 'center', fontSize: 25 }]}>InApp Web</Text>
      <Text style={[styles.link, { textAlign: 'center', fontSize: 15 }]}>Reg and Auth starts from web</Text>
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.setSettingsMode();
      }}
      style={[styles.buttonContainer, { backgroundColor: Colors.lightPurple, opacity: 0.8 }]}
    >
      <Text style={[styles.link, { textAlign: 'center', fontSize: 25 }]}>Settings</Text>
      <Text style={[styles.link, { textAlign: 'center', fontSize: 15 }]}>Configure merchant and signicat settings</Text>
    </TouchableOpacity>
  </View>
);

const ChangeSettingsUI = props => (
  <View style={styles.container}>
    <Text style={{ paddingBottom: 20, fontSize: 25 }}>Settings</Text>
    <View style={{ flexDirection: 'row' }}>
      <Text style={{
        fontSize: 18, paddingRight: 10, height: 50, textAlignVertical: 'center',
      }}
      >
        Merchant server.
      </Text>
      <TextInput
        style={{
          flex: 0.9, paddingLeft: 8, backgroundColor: Colors.white, width: 200, height: 50, color: Colors.black,
        }}
        autoFocus={false}
        keyboardType="url"
        maxLength={200}
        placeholder={props.currentMerchantServer ? props.currentMerchantServer : 'type http(s)://server:port'}
        placeholderTextColor="grey"
        value={props.defaultValue}
        underlineColorAndroid="transparent"
        onChangeText={(addr) => {
          if (props.hasValidUrlFormat(addr)) {
            props.setServerAddress(addr);
          }
        }}
      />
    </View>
    <View style={{ flexDirection: 'row' }}>
      <Text style={{
        fontSize: 18, paddingRight: 10, height: 50, textAlignVertical: 'center',
      }}
      >
        Signicat Env.
      </Text>
      <TextInput
        style={{
          flex: 0.95, paddingLeft: 8, backgroundColor: Colors.white, width: 200, height: 50, color: Colors.black,
        }}
        autoFocus={false}
        maxLength={200}
        placeholder={props.currentSignicatEnv ? props.currentSignicatEnv : 'type dev, beta, qa, preprod, etc'}
        placeholderTextColor="grey"
        value={props.defaultValue}
        underlineColorAndroid="transparent"
        onChangeText={(envId) => {
          if (envId.toLocaleLowerCase() === 'dev'
            || envId.toLocaleLowerCase() === 'qa'
            || envId.toLocaleLowerCase() === 'beta'
            || envId.toLocaleLowerCase() === 'preprod'
            || envId.toLocaleLowerCase() === 'preprodeu01'
            || envId.toLocaleLowerCase() === 'seb') {
            props.onSignicatEnvChange(envId);
          }
        }}
      />
    </View>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.goToHome();
      }}
      style={[styles.linkContainer, { paddingBottom: 10, paddingTop: 20 }]}
    >
      <Text style={styles.link}>Go to home</Text>
    </TouchableOpacity>
  </View>
);

const ActivatedStateUI = props => (
  <View style={styles.container}>
    {
      props.appMode === AppStateType.INAPP && (
        <View style={{ flexDirection: 'row' }}>
          <Text style={{
            fontSize: 18, paddingRight: 10, height: 50, textAlignVertical: 'center',
          }}
          >
            User ref.
          </Text>
          <TextInput
            style={{
              flex: 0.9, paddingLeft: 8, backgroundColor: Colors.white, width: 200, height: 50, color: Colors.black,
            }}
            autoFocus={false}
            keyboardType="url"
            maxLength={200}
            editable
            placeholder={props.currentUser ? props.currentUser : 'not set, type it'}
            placeholderTextColor="grey"
            value={props.defaultValue}
            underlineColorAndroid="transparent"
            onChangeText={(newUser) => {
              props.onUserChange(newUser);
            }}
          />
        </View>
      )
    }
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        if (props.appMode === AppStateType.WEB2APP) {
          Alert.alert('Warning!', 'Please start authentication from website');
        } else {
          props.startAuthenticate();
        }
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>
          Authenticate
        {props.appMode === AppStateType.WEB2APP ? ' from web' : ' from device'}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.deactivateDevice();
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>Deactivate</Text>
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.goToHome();
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>Go to home</Text>
    </TouchableOpacity>
  </View>
);


export {
  Header, InactivateStateUI, ActivatedStateUI, EncapConfigError, EnterActivationCodeUI, EnterPincodeCodeUI, ChooseAppModeUI, ChangeSettingsUI,
};
