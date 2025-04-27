import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const PhoneNumber = ({navigation}) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      return Toast.show({
        type: 'error',
        text1: 'Please enter a valid 10 digit phone number',
        position: 'bottom',
      });
    }

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
      navigation.navigate('Otp', {
        confirmation,
        phone: `+91${phone}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send OTP. Please try again later.',
        position: 'bottom',
      });
      console.log('[Firebase Error]', error); // for internal logs
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your phone number?</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.countryCode}>+91</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          placeholderTextColor="grey"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
      <TouchableOpacity
        style={[styles.button, loading && {backgroundColor: '#aaa'}]}
        onPress={handleSendOtp}
        disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Sending OTP...' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  countryCode: {
    marginRight: 10,
    fontSize: 18,
    color: '#000',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    color: '#000',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
});

export default PhoneNumber;
