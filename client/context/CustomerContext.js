import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import {API_URL} from './api';

const CustomerContext = createContext();

export const useCustomers = () => useContext(CustomerContext);

export const CustomerProvider = ({children, user, isNewUser}) => {
  const [customers, setCustomers] = useState([]);

  const sortCustomers = list => {
    return list.sort((a, b) => {
      const timeA = new Date(a.latestEntry || a.createdAt).getTime();
      const timeB = new Date(b.latestEntry || b.createdAt).getTime();
      return timeB - timeA;
    });
  };

  const loadCustomers = async () => {
    try {
      if (isNewUser) return;

      const localData = await AsyncStorage.getItem('customers');
      if (localData) {
        const parsed = JSON.parse(localData);
        const sorted = sortCustomers(parsed);
        setCustomers(sorted);
      } else {
        const response = await axios.get(`${API_URL}/customer/list-customers`, {
          params: {phone: user?.phoneNumber || user?.phone},
        });

        const fetchedCustomers = response.data.customers.map(c => ({
          ...c,
          latestEntry: c.lastUpdated,
          pendingSum: 0,
        }));

        const sortedData = sortCustomers(fetchedCustomers);
        setCustomers(sortedData);
        await AsyncStorage.setItem('customers', JSON.stringify(sortedData));
        await AsyncStorage.setItem('owner', JSON.stringify(response.data.owner));
      }
      
    } catch (err) {
      setCustomers([]);
      console.log(err);
      Toast.show({
        type: 'error',
        text1: 'Unable to load customer',
        position: 'bottom',
      });
    }

  };

  const addCustomer = async body => {
    try {
      const {data} = await axios.post(`${API_URL}/customer/add-customer`, body);
      const now = new Date().toISOString();

      const newCustomer = {
        ...data.customer,
        latestEntry: now,
        pendingSum: 0,
      };
      const updatedList = sortCustomers([...customers, newCustomer]);
      setCustomers(updatedList);
      await AsyncStorage.setItem('customers', JSON.stringify(updatedList));
      Toast.show({
        type: 'success',
        text1: 'Customer added successfully',
        position: 'bottom',
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Something went wrong';

      Toast.show({
        type: 'error',
        text1: message,
        position: 'bottom',
      });
    }
  };

  const updateCustomer = async body => {
    try {
      const {data} = await axios.patch(
        `${API_URL}/customer/update-customer`,
        body,
      );
      const now = new Date().toISOString();

      const updatedList = customers.map(c =>
        c.id === data.customer.id
          ? {...c, ...data.customer, latestEntry: now}
          : c,
      );

      const sorted = sortCustomers(updatedList);
      setCustomers(sorted);
      await AsyncStorage.setItem('customers', JSON.stringify(sorted));
      Toast.show({
        type: 'success',
        text1: 'Customer updated successfully',
        position: 'bottom',
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Something went wrong';

        Toast.show({
          type: 'error',
          text1: message,
          position: 'bottom',
        });
    }
  };

  const updateCustomerPending = async updatedCustomer => {
    try {
      const updatedCustomers = customers.map(c =>
        c.id === updatedCustomer.id
          ? {...c, pendingSum: updatedCustomer.pendingSum}
          : c,
      );

      const isSame =
        JSON.stringify(updatedCustomers) === JSON.stringify(customers);
      if (isSame) return;

      const sortedData = sortCustomers(updatedCustomers);
      setCustomers(sortedData);
      await AsyncStorage.setItem('customers', JSON.stringify(sortedData));
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not update pending',
        position: 'bottom',
      });
    }
  };

  const deleteCustomer = async customerId => {
    console.log('in delete customer context', customerId);
    try {
      await axios.delete(`${API_URL}/customer/delete-customer/${customerId}`);
      const updatedList = customers.filter(c => c.id !== customerId);
      setCustomers(updatedList);
      await AsyncStorage.setItem('customers', JSON.stringify(updatedList));

      Toast.show({
        type: 'success',
        text1: 'Customer deleted successfully',
        position: 'bottom',
      });
    } catch (err) {
      console.log('error is', err);
      Toast.show({
        type: 'error',
        text1: 'Could not delete customer',
        position: 'bottom',
      });
    }
  };

  const deleteAllTransactions = async customerId => {
    try {
      const reponse = await axios.delete(
        `${API_URL}/customer/clear-all-transaction/${customerId}`,
      );
      const cst = reponse.data.customer;
      const now = new Date().toISOString();
      const updatedList = customers.map(c =>
        c.id === customerId ? {...cst, latestEntry: now, pendingSum: 0} : c,
      );

      const sorted = sortCustomers(updatedList);
      setCustomers(sorted);
      await AsyncStorage.setItem('customers', JSON.stringify(sorted));
      Toast.show({
        type: 'success',
        text1: 'All Transactions cleared successfully',
        position: 'bottom',
      });
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Something went wrong';
      Toast.show({
        type: 'error',
        text1: message,
        position: 'bottom',
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user, isNewUser]);

  return (
    <CustomerContext.Provider
      value={{
        customers,
        setCustomers,
        addCustomer,
        updateCustomer,
        reloadCustomers: loadCustomers,
        updateCustomerPending,
        deleteCustomer,
        deleteAllTransactions,
      }}>
      {children}
    </CustomerContext.Provider>
  );
};
