import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  BackHandler,
  ToastAndroid,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {useCustomers} from '../../context/CustomerContext';

const Home = ({navigation, route}) => {
  const [searchText, setSearchText] = useState('');
  const [user, setUser] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const {customers, reloadCustomers} = useCustomers();
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(currentUser => {
      setUser(currentUser);
    });
    const fetchOwner = async () => {
      try {
        const ownerData = await AsyncStorage.getItem('owner');
        const parsedOwner = ownerData ? JSON.parse(ownerData) : null;
        setOwner(parsedOwner); // save in state
      } catch (error) {
        console.error('Failed to fetch owner:', error);
      }
    };

    fetchOwner();
    return unsubscribe;
  }, []);

  let backPressedOnce = false;

  useFocusEffect(
    useCallback(() => {
      reloadCustomers();

      const onBackPress = () => {
        if (backPressedOnce) {
          BackHandler.exitApp();
          return true;
        }

        backPressedOnce = true;
        ToastAndroid.show('Tap back again to exit', ToastAndroid.SHORT);

        setTimeout(() => {
          backPressedOnce = false;
        }, 2000); // Reset after 2 seconds

        return true; // Prevent default behavior
      };

      let backHandler;

      if (Platform.OS === 'android') {
        backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress,
        );
      }

      return () => {
        if (Platform.OS === 'android' && backHandler) {
          backHandler.remove(); // ✅ modern cleanup
        }
      };
    }, []),
  );

  const handleRefresh = async () => {
    try {
      await AsyncStorage.removeItem('customers');
      await reloadCustomers();
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('customers');
      await auth().signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getTimeLabel = customer => {
    const time = customer.latestEntry || customer.createdAt;
    return moment(time).fromNow();
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const totalPending = customers.reduce((sum, customer) => {
    return sum + (customer?.pendingSum || 0);
  }, 0);

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() =>
        item.billType === 'bill_based'
          ? navigation.navigate('ViewDetails', {
              customer: item,
            })
          : navigation.navigate('ListTransaction', {
              customer: item,
            })
      }>
      <View>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.lastTransaction}>{getTimeLabel(item)}</Text>
      </View>
      <Text
        style={[
          styles.customerAmount,
          {color: item.pendingSum > 0 ? 'red' : 'green'},
        ]}>
        ₹{Math.abs(item.pendingSum).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f5f5f5'}}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            style={styles.profileSection}>
            <MaterialIcons name="menu" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('TransactionSummary')}
            activeOpacity={0.8}>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Total Pending Amount</Text>
              <Text style={styles.amountValue}>₹{totalPending.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search Customer"
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Customer List */}
        <FlatList
          data={filteredCustomers}
          renderItem={renderItem}
          keyExtractor={item => item._id || item.id}
          style={styles.customerList}
        />

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddCustomer', {})}>
          <Text style={styles.addButtonText}>ADD CUSTOMER</Text>
        </TouchableOpacity>

        {/* Profile Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={profileModalVisible}
          onRequestClose={() => setProfileModalVisible(false)}>
          <TouchableWithoutFeedback
            onPress={() => setProfileModalVisible(false)}>
            <View style={styles.centeredView}>
              <TouchableWithoutFeedback>
                <View style={styles.modalView}>
                  <Text style={styles.modalTitle}>Hi, {owner?.name}</Text>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.logoutButton]}
                    onPress={handleLogout}>
                    <Text style={styles.modalButtonText}>Logout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.refreshButton]}
                    onPress={() => {
                      handleRefresh();
                      setProfileModalVisible(false);
                    }}>
                    <Text style={styles.modalButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  profileSection: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountCard: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  amountLabel: {
    fontSize: 14,
    color: '#555',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  lastTransaction: {
    fontSize: 14,
    color: '#777',
  },
  customerAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  modalView: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  modalButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    marginTop: 10,
  },
});

export default Home;
