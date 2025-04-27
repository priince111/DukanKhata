import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const Otp = ({route, navigation}) => {
  const {confirmation, phone} = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendTime, setResendTime] = useState(30);
  const [backPressTime, setBackPressTime] = useState(15);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [currentConfirmation, setCurrentConfirmation] = useState(confirmation);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (resendTime > 0) {
      const timer = setInterval(() => setResendTime(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendTime]);

  useEffect(() => {
    if (backPressTime > 0) {
      const timer = setInterval(() => setBackPressTime(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [backPressTime]);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}.${String(secs).padStart(
      2,
      '0',
    )}`;
  };

  const handleVerifyOtp = async () => {
    if (timeLeft <= 0) return Alert.alert('Error', 'OTP has expired');

    if (otp.some(digit => digit === '')) {
      return Alert.alert('Error', 'Please enter all 6 digits');
    }

    try {
      setIsVerifying(true);
      const otpCode = otp.join('');
      await currentConfirmation.confirm(otpCode);
    } catch (error) {
      console.log('err', error);
      Alert.alert('Error', 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTime > 0 || isResending) return;

    try {
      setIsResending(true);
      const newConfirmation = await auth().signInWithPhoneNumber(phone);
      setCurrentConfirmation(newConfirmation);
      Toast.show({
        type: 'success',
        text1: 'A new OTP has been sent successfully',
        position: 'bottom',
      });
      setResendTime(30);
      setTimeLeft(300);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to resend OTP',
        position: 'bottom',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        disabled={backPressTime > 0}
        onPress={() => navigation.goBack()}>
        <Text
          style={[
            styles.backButtonText,
            backPressTime > 0 && styles.disabledText,
          ]}>
          ← Back {backPressTime > 0 ? `(${formatTime(backPressTime)})` : ''}
        </Text>
      </TouchableOpacity>

      <Text style={styles.timer}>OTP expires in: {formatTime(timeLeft)}</Text>
      <Text style={styles.title}>Verify your phone number</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {phone}
      </Text>

      <View style={styles.otpContainer}>
        {[...Array(6)].map((_, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            maxLength={1}
            keyboardType="numeric"
            autoFocus={index === 0}
            value={otp[index]}
            onChangeText={text => handleChange(index, text)}
            ref={ref => (inputRefs.current[index] = ref)}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
              }
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, isVerifying && styles.disabledButton]}
        onPress={handleVerifyOtp}
        disabled={isVerifying}>
        {isVerifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        disabled={resendTime > 0 || isResending}
        onPress={handleResendOtp}>
        <Text
          style={[
            styles.resendLink,
            (resendTime > 0 || isResending) && styles.disabledText,
          ]}>
          {isResending
            ? 'Resending...'
            : `Resend code via SMS ${
                resendTime > 0 ? `(${formatTime(resendTime)})` : ''
              }`}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    width: 40,
    height: 50,
    textAlign: 'center',
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendLink: {
    color: '#007bff',
    marginTop: 15,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  timer: {
    color: 'red',
    marginBottom: 10,
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
  disabledText: {
    color: '#aaa',
  },
});

export default Otp;
