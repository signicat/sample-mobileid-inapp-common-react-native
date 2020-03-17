
import {
  View, Text, TouchableOpacity, TextInput, ImageBackground, Alert,
} from 'react-native';
import React from 'react';

import styles from './Styles';
import Colors from './Colors';

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

const ServerAddressUI = props => (
  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lighter }}>
    <Text
      style={{
        flex: 0.3, fontSize: 15, paddingRight: 8, color: 'black', textAlign: 'right', textAlignVertical: 'center',
      }}
    >
          Backend:
    </Text>

    <TextInput
      style={{
        flex: 0.7, paddingLeft: 8, backgroundColor: Colors.black, width: 200, height: 50, color: Colors.white,
      }}
      autoFocus={false}
      maxLength={200}
      keyboardType="url"
      placeholder="Enter your server address and port here"
      placeholderTextColor="grey"
      value={props.defaultValue}
      underlineColorAndroid="transparent"
      onChangeText={(addr) => {
        props.setServerAddress(addr);
      }}
    />
  </View>
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
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.performAction();
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>
        Activate
        {props.appMode === 'WEB2APP' ? ' from web' : ' from device'}
      </Text>
    </TouchableOpacity>
  </View>
);

const ChooseAppModeUI = props => (
  <View style={styles.container}>
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
        props.setInAppMode();
      }}
      style={[styles.buttonContainer, { backgroundColor: Colors.lightPurple, opacity: 0.8 }]}
    >
      <Text style={[styles.link, { textAlign: 'center', fontSize: 25 }]}>InApp Mobile</Text>
      <Text style={[styles.link, { textAlign: 'center', fontSize: 15 }]}>Reg and Auth starts from app</Text>
    </TouchableOpacity>
  </View>
);

const ActivatedStateUI = props => (
  <View style={styles.container}>
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        if (props.appMode === 'WEB2APP') {
          Alert.alert('Warning!', 'Please start authentication from website');
        } else {
          props.startAuthenticate();
        }
      }}
      style={styles.linkContainer}
    >
      <Text style={styles.link}>
          Authenticate
        {props.appMode === 'WEB2APP' ? ' from web' : ' from device'}
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
  </View>
);


export {
  Header, InactivateStateUI, ActivatedStateUI, EncapConfigError, EnterActivationCodeUI, EnterPincodeCodeUI, ChooseAppModeUI, ServerAddressUI,
};
