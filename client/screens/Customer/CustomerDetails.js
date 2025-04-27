import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import {useCustomers} from '../../context/CustomerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const CustomerDetails = ({route, navigation}) => {
  const {contact} = route.params;
  const {addCustomer} = useCustomers();
  const initialCountryCode = '+91';
  const initialPhoneNumber =
    contact?.phoneNumbers?.[0]?.number.replace(/^\+91|\s+/g, '') || '';

  const [customerName, setCustomerName] = useState(contact?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [both, setboth] = useState(false);
  const [billBased, setBillBased] = useState(false);
  const [countryCode, setCountryCode] = useState(initialCountryCode);

  const handleSubmit = async () => {
    if (!customerName) {
      Toast.show({
        type: 'error',
        text1: 'Customer name is required',
        position: 'bottom',
      });
      return;
    }
    console.log('Submitting Customer Details:', {
      name: customerName,
      phone: phoneNumber ? `${countryCode}${phoneNumber}` : null,
      transactionType: both ? 'both' : 'duplicate',
      billType: billBased ? 'bill_based' : 'normal',
    });
    const ownerData = await AsyncStorage.getItem('owner');
    const parsedOwner = ownerData ? JSON.parse(ownerData) : null;
    const body = {
      name: customerName,
      phone: phoneNumber ? `${countryCode}${phoneNumber}` : null,
      transactionType: both ? 'both' : 'duplicate',
      billType: billBased ? 'bill_based' : 'normal',
      ownerId: parsedOwner.id,
    };
    try {
      await addCustomer(body);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Enter Customer Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Customer Name *"
        placeholderTextColor="#aaa"
        value={customerName}
        onChangeText={setCustomerName}
      />

      {/* Country Code + Phone Number Row */}
      <View style={styles.phoneRow}>
        <View style={styles.countryCodeContainer}>
          <RNPickerSelect
            onValueChange={setCountryCode}
            items={[
              {label: '🇮🇳 +91', value: '+91'},
              {label: '🇺🇸 +1', value: '+1'},
              {label: '🇬🇧 +44', value: '+44'},
            ]}
            value={countryCode}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
          />
        </View>

        <TextInput
          style={[styles.input, styles.phoneInput]}
          placeholder="Phone Number"
          placeholderTextColor="#aaa"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      {/* Toggle Buttons */}
      <View style={styles.togglesContainer}>
        <View style={styles.toggleWrapper}>
          <Text style={styles.toggleLabel}>Original and Dupliacate </Text>
          <TouchableOpacity
            style={[styles.toggleButton, both && styles.toggleActive]}
            onPress={() => setboth(!both)}>
            <Text style={styles.toggleText}>{both ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleWrapper}>
          <Text style={styles.toggleLabel}>Bill Based</Text>
          <TouchableOpacity
            style={[styles.toggleButton, billBased && styles.toggleActive]}
            onPress={() => setBillBased(!billBased)}>
            <Text style={styles.toggleText}>{billBased ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Save Customer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  countryCodeContainer: {
    flex: 0.4,
  },
  phoneInput: {
    flex: 1,
  },
  togglesContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 25,
  },
  toggleWrapper: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  toggleButton: {
    backgroundColor: 'black',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  placeholder: {
    color: '#aaa',
  },
});

export default CustomerDetails;
