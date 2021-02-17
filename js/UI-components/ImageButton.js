import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../Colors';

const buttonStyles = StyleSheet.create({
  sharedContainerStyle: {
    backgroundColor: Colors.white,
    shadowColor: '#111', // iOS only
    shadowOffset: { // iOS only
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84, // iOS only
    borderRadius: 10,
    elevation: 3, // Android only
  },
  horizontalButtonContainer: {
    flexDirection: 'row',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  verticalButtonContainer: {
    height: 214,
  },
  iconBox: {
    backgroundColor: Colors.primaryBlue,
    height: 42,
    borderRadius: 10,
    width: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 18,
    letterSpacing: 0.03,
    color: Colors.slate,
  },
  text: {
    fontFamily: 'OpenSans',
    fontSize: 14,
    letterSpacing: 0.02,
    color: Colors.slate,
  },
});

const ImageButton = (props) => {
  let content = (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={() => {
        props.onPress();
      }}
    >
      <View style={[buttonStyles.sharedContainerStyle, buttonStyles.verticalButtonContainer]}>
        <View style={{ alignItems: 'center' }}>
          <View style={[buttonStyles.iconBox, { marginTop: 20 }]}>
            <Image
              source={props.image}
              style={{
                width: 24,
                height: 24,
              }}
            />
          </View>
        </View>
        <Text style={[buttonStyles.caption, { marginTop: 20, marginLeft: 25, marginBottom: 10 }]}>
          {props.caption}
        </Text>
        <Text style={[buttonStyles.text, { margin: 25, marginTop: 0 }]}>
          {props.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (props.horizontalButton) {
    content = (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          props.onPress();
        }}
      >
        <View style={[buttonStyles.sharedContainerStyle, buttonStyles.horizontalButtonContainer]}>
          <View style={[buttonStyles.iconBox, { marginLeft: 0, marginRight: 20 }]}>
            <Image
              source={props.image}
              style={{
                width: 24,
                height: 24,
              }}
            />
          </View>
          {/* flexShrink helps with bugged non-existent linebreak on iPhone 6 */}
          <View style={{ flexDirection: 'column', flexShrink: 1 }}>
            <Text style={buttonStyles.caption}>
              {props.caption}
            </Text>
            <Text style={buttonStyles.text}>
              {props.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return content;
};

export default ImageButton;
