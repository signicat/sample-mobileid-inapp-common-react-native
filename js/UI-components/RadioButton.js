import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Colors from '../Colors';

const RadioButton = (props) => {
  const {
    id,
    size,
    label,
    selected,
  } = props;

  const radioContainerStyle = {
    flexDirection: 'row',
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const radioStyle = {
    height: size,
    width: size,
    borderRadius: size * 0.5,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: Colors.primaryBlue,
  };

  const dotStyle = {
    justifyContent: 'center',
    alignItems: 'center',
    height: size * 0.5,
    width: size * 0.5,
    borderRadius: size * 0.25,
    backgroundColor: Colors.primaryBlue,
  };

  const labelStyle = {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    color: Colors.slate,
    marginLeft: 20,
    textAlign: 'center',
  };

  return (
    <TouchableOpacity onPress={() => props.onClick(id)} activeOpacity={0.8} style={radioContainerStyle}>
      <View style={radioStyle}>
        {
            (selected) ? (<View style={dotStyle}/>) : null
        }
      </View>
      <Text style={labelStyle}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export { RadioButton as default };
