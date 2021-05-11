import React from 'react';
import {
  StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import Colors from '../Colors';
import I18n from '../../i18n/i18n';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
  },
  hiddenInput: {
    width: 0,
    height: 0,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: Colors.primaryBlue,
  },
});

const Circle = (props) => {
  const { filled } = props;
  const style = {
    backgroundColor: filled ? Colors.primaryBlue : Colors.white,
  };
  return (<View style={[style, styles.circle]}/>);
};

export default class PinCodeInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pin: '',
    };
  }

  componentDidMount() {
    console.log('PinCodeInput - componentDidMount');
    // autoFocus on the TextInput sometimes not working on physical Android devices - replacing with this workaround
    setTimeout(() => this.keyboard.focus(), 150);
  }

  componentDidUpdate() {
    console.log('PinCodeInput - componentDidUpdate');
    if (this.state.pin.length === 0 && !this.keyboard.isFocused()) {
      this.keyboard.focus();
    }
  }

  onInputPin = (pin) => {
    const { pinLength, onComplete } = this.props;
    this.setState({ pin: pin });

    if (pin.length === pinLength) {
      onComplete(pin);
    }
  };

  toggleKeyboard = () => {
    if (this.keyboard.isFocused()) {
      this.keyboard.blur();
    }
    this.keyboard.focus();
  };

  clear = () => {
    this.keyboard.clear();
    this.setState({ pin: '' });
  };

  render() {
    console.log('PinCodeInput - render');

    const { pinLength } = this.props;
    const codeInputs = [];
    for (let i = 0; i < pinLength; i += 1) {
      const filled = i < this.state.pin.length;
      codeInputs.push(<Circle key={i} filled={filled}/>);
    }

    return (
      <TouchableWithoutFeedback onPress={this.toggleKeyboard}>
        <View
          accessibilityLabel={I18n.t('wcag_pin_input')}
          accessibilityHint={I18n.t('wcag_pin_input_hint')}
          style={{ alignItems: 'center' }}
        >
          <View style={[this.props.style, styles.container]}>
            {codeInputs}
          </View>
          <View style={styles.hiddenInput}>
            <TextInput
              ref={(component) => { this.keyboard = component; }}
              maxLength={pinLength}
              value={this.state.pin}
              onChangeText={pin => this.onInputPin(pin)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}
