import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import {useCustomers} from '../../context/CustomerContext';

const EditCustomer = ({route, navigation}) => {
  const {customer} = route.params;
  const {updateCustomer, deleteCustomer, deleteAllTransactions} = useCustomers();
  const fullPhone = customer.phone || '';
  let phoneWithoutCode = fullPhone;
  let extractedCode = '+91';

  if (fullPhone.startsWith('+91')) {
    extractedCode = '+91';
    phoneWithoutCode = fullPhone.replace('+91', '');
  } else if (fullPhone.startsWith('+1')) {
    extractedCode = '+1';
    phoneWithoutCode = fullPhone.replace('+1', '');
  } else if (fullPhone.startsWith('+44')) {
    extractedCode = '+44';
    phoneWithoutCode = fullPhone.replace('+44', '');
  }

  const [customerName, setCustomerName] = useState(customer.name || '');
  const [phoneNumber, setPhoneNumber] = useState(phoneWithoutCode);
  const [countryCode, setCountryCode] = useState(extractedCode);

  const handleSubmit = async () => {
    if (!customerName) {
      Alert.alert('Validation Error', 'Customer name is required.');
      return;
    }
    const body = {
      name: customerName,
      phone: phoneNumber ? `${countryCode}${phoneNumber}` : null,
      id: customer.id,
      ownerId: customer.ownerId,
    };

    try {
      await updateCustomer(body);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Customer', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer(customer.id);
            navigation.navigate('Home');
          } catch (error) {
            console.error('Error deleting customer:', error);
          }
        },
      },
    ]);
  };

  const clearData = () => {
    Alert.alert(
      'Clear Data',
      'Are you sure you want to clear all transactions for this customer?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllTransactions(customer.id);
              navigation.navigate('Home')
            } catch (error) {
              console.error('Error clearing data:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Customer Name *"
        placeholderTextColor="#aaa"
        value={customerName}
        onChangeText={setCustomerName}
      />

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

      <TouchableOpacity style={styles.clearButton} onPress={clearData}>
        <Text style={styles.clearButtonText}>Clear All Data</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
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
  clearButton: {
    backgroundColor: '#ffc107',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  clearButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    color: '#000',
    backgroundColor: '#fff',
  },
  placeholder: {
    color: '#aaa',
  },
});

export default EditCustomer;
