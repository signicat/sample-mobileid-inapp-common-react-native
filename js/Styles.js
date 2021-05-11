import { StyleSheet } from 'react-native';
import Colors from './Colors';

export const verticalSpacing = 22;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  maxsize: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
  },
  container: {
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  settingsItemTitleText: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 17,
    letterSpacing: -0.07,
    color: Colors.slate,
  },
  settingsItemTitleTextInactive: {
    fontFamily: 'OpenSans-SemiBold',
    fontSize: 16,
    letterSpacing: -0.07,
    color: Colors.offSwitchOption,
  },
  settingsItemDataText: {
    fontFamily: 'OpenSans-SemiBoldItalic',
    fontSize: 16,
    letterSpacing: -0.07,
    color: Colors.slate,
  },
  settingsItemDescriptionText: {
    fontSize: 16,
    letterSpacing: -0.07,
    color: Colors.slate,
  },
  activationCodeTitleText: {
    fontSize: 18,
    fontFamily: 'OpenSans',
    letterSpacing: -0.08,
  },
  activationCodeTextInput: {
    fontSize: 24,
    fontFamily: 'OpenSans',
    letterSpacing: -0.08,
    color: Colors.slate,
    backgroundColor: Colors.white,
    borderColor: Colors.primaryBlue,
    borderRadius: 6,
    borderWidth: 1,
    width: 174,
    textAlign: 'center',
    marginTop: 30,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteOpacity50: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  touchableMinSize: {
    minWidth: 44, // WCAG min sizes for buttons
    minHeight: 44,
  },
});

export default { ...styles };
