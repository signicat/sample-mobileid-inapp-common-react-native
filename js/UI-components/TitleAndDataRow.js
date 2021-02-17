import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import styles from '../Styles';

const TitleAndDataRow = props => (
  <View style={{
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5,
  }}
  >
    <Text style={styles.settingsItemTitleText}>
      { props.title ? props.title : 'Title not set'}
    </Text>
    <Text style={styles.settingsItemDataText}>
      {props.data ? props.data : 'Data not set'}
    </Text>
  </View>
);

export default TitleAndDataRow;
