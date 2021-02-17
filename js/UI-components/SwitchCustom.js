import React from 'react';
import {
  Platform,
  Switch,
} from 'react-native';
import Colors from '../Colors';

const SwitchCustom = props => (
  <Switch
    onValueChange={value => props.onValueChange(value)}
    value={props.value}
    {...(Platform.OS === 'ios' && {
      trackColor: {
        true: Colors.primaryBlue,
      },
    })}
    {...(Platform.OS === 'android' && {
      trackColor: {
        true: Colors.lightPrimaryBlue,
        false: Colors.offSwitchOption,
      },
      thumbColor: props.value ? Colors.primaryBlue : Colors.offSwitchThumbColor,
    })}
  />
);

export default SwitchCustom;
