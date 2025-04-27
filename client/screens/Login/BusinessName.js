import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import {API_URL} from '../../context/api';
import Toast from 'react-native-toast-message';

const BusinessName = ({setIsNewUser}) => {
  const phone = auth().currentUser.phoneNumber;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false); // Loading state

  const handleSaveOwner = async () => {
    if (!name.trim()) {
      return Toast.show({
        type: 'error',
        text1: 'Please enter valid business name',
        position: 'bottom',
      });
    }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/auth/save-owner`, {phone, name});
      Toast.show({
        type: 'success',
        text1: 'Business registered successfully',
        position: 'bottom',
      });
      setIsNewUser(false);
    } catch (error) {
      console.error('Error saving owner:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save business details',
        position: 'bottom',
      });
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Business Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Business Name"
        placeholderTextColor="grey"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity
        style={[styles.button, loading && {opacity: 0.6}]}
        onPress={handleSaveOwner}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save & Continue</Text>
        )}
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
    marginBottom: 20,
    color: '#000',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    color: '#000',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BusinessName;
