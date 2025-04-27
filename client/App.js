import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, Text} from 'react-native';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {API_URL} from './context/api';
import style from './styles/style';
import Toast from 'react-native-toast-message';

// Screens
import PhoneNumber from './screens/Login/PhoneNumber';
import Otp from './screens/Login/Otp';
import BusinessName from './screens/Login/BusinessName';
import Home from './screens/Home/Home';
import AddCustomer from './screens/Customer/AddCustomer';
import CustomerDetails from './screens/Customer/CustomerDetails';
import ListTransaction from './screens/Transaction/ListTransaction';
import EditCustomer from './screens/Customer/EditCustomer';
import Entry from './screens/Transaction/Entry';
import ViewDetails from './screens/BillBasedCustomer/ViewDetails';
import ViewBill from './screens/BillBasedCustomer/ViewBill';
import BillEntry from './screens/BillBasedCustomer/BillEntry';

// Context Providers
import {TransactionProvider} from './context/TransactionContext';
import {CustomerProvider} from './context/CustomerContext';
import {BillTransactionProvider} from './context/BillTransactionContext';
import TransactionSummary from './screens/Summary/TransactionSummary';
import TransactionReport from './screens/Report/TransactionReport';
import SummaryList from './screens/Summary/SummaryList';

const Stack = createStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const { creationTime, lastSignInTime } = firebaseUser.metadata;
  
          if (creationTime === lastSignInTime) {
            setIsNewUser(true);
          } else {
            setIsNewUser(false);
          }
        } catch (error) {
          console.error('Error checking new user:', error);
          setIsNewUser(false); // fallback
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
    });
  
    return subscriber; // unsubscribe on unmount
  }, []);
  

  if (initializing) {
    return (
      <View style={style.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={{marginTop: 10}}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <CustomerProvider
      user={user}
      isNewUser={isNewUser}
      key={`${user?.uid}-${isNewUser}`}>
      <TransactionProvider>
        <BillTransactionProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              {!user ? (
                <>
                  <Stack.Screen name="PhoneNumber" component={PhoneNumber} />
                  <Stack.Screen name="Otp" component={Otp} />
                </>
              ) : isNewUser ? (
                <Stack.Screen name="BusinessName">
                  {props => (
                    <BusinessName {...props} setIsNewUser={setIsNewUser} />
                  )}
                </Stack.Screen>
              ) : (
                <>
                  <Stack.Screen name="Home" component={Home} />
                  <Stack.Screen name="AddCustomer" component={AddCustomer} />
                  <Stack.Screen
                    name="CustomerDetails"
                    component={CustomerDetails}
                  />
                  <Stack.Screen
                    name="ListTransaction"
                    component={ListTransaction}
                  />
                  <Stack.Screen name="EditCustomer" component={EditCustomer} />
                  <Stack.Screen name="Entry" component={Entry} />
                  <Stack.Screen name="ViewDetails" component={ViewDetails} />
                  <Stack.Screen name="ViewBill" component={ViewBill} />
                  <Stack.Screen name="BillEntry" component={BillEntry} />
                  <Stack.Screen
                    name="TransactionSummary"
                    component={TransactionSummary}
                  />
                  <Stack.Screen
                    name="TransactionReport"
                    component={TransactionReport}
                  />
                  <Stack.Screen
                    name="SummaryList"
                    component={SummaryList}
                  />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </BillTransactionProvider>
      </TransactionProvider>
    </CustomerProvider>
  );
};

export default App;
