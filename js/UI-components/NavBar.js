import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Colors from '../Colors';
import I18n from '../../i18n/i18n';
import styles from '../Styles';

const arrowLeftInvertedImage = require('../../assets/arrow_left_inverted.png');
const helpInvertedImage = require('../../assets/help_inverted.png');

const imageSize = 30;

const captionTextStyle = {
  fontFamily: 'OpenSans-SemiBold',
  fontSize: 20,
  letterSpacing: 0.14,
  textAlign: 'left',
  color: Colors.white,
};

const sharedStyle = {
  flex: 2, // This also affects the horizontal touchable area for buttons, don't set lower than 2
  justifyContent: 'center',
  paddingHorizontal: 17,
  minWidth: 44, // WCAG min size
};

const touchableAreaAdjusterStyle = { height: 50, justifyContent: 'center' };

const spacingFineTune = 23; // Adjust horizontal position of NavBar caption text

const NavBar = (props) => {
  console.log('NavBar');
  return (
    <View style={[props.style, {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 5,
      paddingBottom: 5,
      backgroundColor: Colors.primaryBlue,
      marginBottom: 20,
      opacity: props.invisible ? 0 : 1,
    }]
    }
    >
      <View style={[sharedStyle]}>
        {props.onPressBack && (
        <TouchableOpacity
          style={styles.touchableMinSize}
          onPress={props.onPressBack}
          accessibilityRole="button"
          accessibilityLabel={I18n.t('wcag_go_back')}
          accessibilityHint={I18n.t('wcag_go_back_hint')}
        >
          <View style={touchableAreaAdjusterStyle}>
            <Image
              source={arrowLeftInvertedImage}
              style={[{ width: imageSize, height: imageSize }, props.style]}
            />
          </View>
        </TouchableOpacity>)
        }

        {!props.onPressBack && (
        <View style={touchableAreaAdjusterStyle}>
          <View style={[{ width: imageSize, height: imageSize }, props.style]}/>
        </View>
        )}
      </View>


      <View style={{ flex: spacingFineTune }}>
        <Text
          style={captionTextStyle}
        >
          {props.caption ? props.caption : 'Unset'}
        </Text>
      </View>

      <View style={[sharedStyle, { alignItems: 'flex-end' }]}>
        {props.onPressHelp && (
        <TouchableOpacity
          style={styles.touchableMinSize}
          onPress={props.onPressHelp}
          accessibilityRole="button"
          accessibilityLabel={I18n.t('wcag_show_help')}
          accessibilityHint={I18n.t('wcag_show_help_hint')}
        >
          <View style={touchableAreaAdjusterStyle}>
            <Image
              source={helpInvertedImage}
              style={[{ width: imageSize, height: imageSize }, props.style]}
            />
          </View>
        </TouchableOpacity>
        )}

        {!props.onPressHelp && (
        <View style={touchableAreaAdjusterStyle}>
          <View style={[{ width: imageSize, height: imageSize }, props.style]}/>
        </View>
        )}
      </View>
    </View>);
};

export default NavBar;
