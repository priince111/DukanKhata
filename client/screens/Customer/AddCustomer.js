import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  PermissionsAndroid,
  Image
} from 'react-native';
import Contacts from 'react-native-contacts';

const AddCustomer = ({navigation}) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    checkContactPermission();
  }, []);

  const checkContactPermission = async () => {
    try {
      const permission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      if (permission) {
        loadContacts();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message:
              'This app needs access to your contacts to add new customers.',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          loadContacts();
        } else {
          Alert.alert(
            'Permission Denied',
            'You can enable permissions in settings.',
          );
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error checking/requesting contacts permission:', error);
      Alert.alert('Error', 'Could not access contacts. Please try again.');
      navigation.goBack();
    }
  };

  const loadContacts = async () => {
    try {
      const allContacts = await Contacts.getAll();
      const validContacts = allContacts
        .filter(contact => contact.displayName)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      setContacts(validContacts);
      setFilteredContacts(validContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Could not load contacts. Please try again.');
      navigation.goBack();
    }
  };

  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.displayName?.toLowerCase().includes(searchText.toLowerCase()),
    );
    setFilteredContacts(filtered);
  }, [searchText, contacts]);

  const handleSelectContact = contact => {
    navigation.navigate('CustomerDetails', {contact});
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Customer name"
        placeholderTextColor="#aaa"
        value={searchText}
        onChangeText={setSearchText}
      />

      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleSelectContact(null)}>
        <View >
          <Image
            source={require('../../assets/medical-book.png')}
            style={styles.avatarImage}
          />
        </View>
        <View>
          <Text style={styles.manual}>Add Manually</Text>
        </View>
      </TouchableOpacity>

      <FlatList
        data={filteredContacts}
        keyExtractor={item => item.recordID}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleSelectContact(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.displayName[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.contactName}>{item.displayName}</Text>
              {item.phoneNumbers.length > 0 && (
                <Text style={styles.contactNumber}>
                  {item.phoneNumbers[0].number}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: 15,
  },
  addCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 10,
    marginBottom: 15,
  },
  addCustomerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  contactNumber: {
    fontSize: 16,
    color: '#555',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
    paddingRight: 10
  },
  manual: {
    paddingLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default AddCustomer;
