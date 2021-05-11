import React from 'react';
import {
  Text, TextInput,
  View,
} from 'react-native';
import Colors from '../Colors';
import styles from '../Styles';

const outerContainerStyle = {
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: Colors.white,
};

const textInputStyle = {
  flex: 1,
  paddingLeft: 10,
  paddingRight: 10,
  fontFamily: 'OpenSans-SemiBold',
  fontSize: 16,
  letterSpacing: -0.07,
  backgroundColor: Colors.base,
  color: Colors.slate,
};

const TextInputWithTitle = props => (
  <View style={outerContainerStyle}>
    <Text style={[styles.settingsItemTitleText, { paddingBottom: 5 }]}>
      {props.title ? props.title : 'title not set'}
    </Text>
    {
      props.description && (
        <Text style={[styles.settingsItemDescriptionText, { paddingBottom: 5 }]}>
          {props.description}
        </Text>
      )
    }
    <View style={{ height: 54 }}>
      <TextInput
        style={textInputStyle}
        autoFocus={props.autoFocus ? props.autoFocus : false}
        keyboardType={props.keyboardType ? props.keyboardType : 'url'} // "url" works for iOS only according to documentation
        maxLength={200}
        editable={props.editable ? props.editable : true}
        placeholder={props.placeholder ? props.placeholder : ''}
        placeholderTextColor={Colors.greyTxt}
        value={props.value}
        underlineColorAndroid="transparent"
        onChangeText={props.onChangeText}
        defaultValue={props.defaultValue}
      />
    </View>
  </View>
);

export default TextInputWithTitle;
