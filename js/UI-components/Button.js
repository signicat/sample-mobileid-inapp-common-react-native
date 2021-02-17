import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../Colors';

const buttonPadding = 16;

const buttonStyles = StyleSheet.create({
  buttonSharedStyle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4, // TODO: not visible on iOS
    paddingTop: buttonPadding,
    paddingBottom: buttonPadding,
    fontFamily: 'OpenSans-SemiBold',
    letterSpacing: 0.03,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    borderColor: Colors.primaryBlue,
    backgroundColor: Colors.primaryBlue,
    color: Colors.white,
  },
  buttonNegative: {
    borderColor: Colors.disabledGrey,
    backgroundColor: Colors.disabledGrey,
    color: Colors.greyTxt,
  },
});

const Button = props => (
  <View style={props.style}>
    <TouchableOpacity
      onPress={props.onPress}
      accessibilityRole="button"
    >
      <View style={{ alignItems: 'stretch' }}>
        <Text style={[
          buttonStyles.buttonSharedStyle,
          props.secondaryButton ? buttonStyles.buttonNegative : buttonStyles.primaryButton,
        ]}
        >
          {props.title}
        </Text>
      </View>
    </TouchableOpacity>
  </View>
);

export default Button;
