import React, {createContext, useContext, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useCustomers} from './CustomerContext';
import Toast from 'react-native-toast-message';
import {API_URL} from './api';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({children}) => {
  const {customers, setCustomers} = useCustomers();

  const sortCustomers = list => {
    return list.sort((a, b) => {
      const timeA = new Date(a.latestEntry || a.createdAt).getTime();
      const timeB = new Date(b.latestEntry || b.createdAt).getTime();
      return timeB - timeA;
    });
  };

  const updateCustomersInCache = async updatedCustomers => {
    const sortedData = sortCustomers(updatedCustomers);
    setCustomers(sortedData);
    await AsyncStorage.setItem('customers', JSON.stringify(sortedData));
  };

  const addTransaction = async (body, customerId) => {
    try {
      const response = await axios.post(
        `${API_URL}/transaction/add-transaction`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      const newTransaction = response.data.transaction;
      console.log('response.data', response.data);
      console.log('new transaction', newTransaction);
      const now = new Date().toISOString();

      const updatedCustomers = customers.map(customer => {
        if (customer.id === customerId) {
          return {
            ...customer,
            Transactions: [newTransaction, ...(customer.Transactions || [])],
            latestEntry: now,
          };
        }
        return customer;
      });
      await updateCustomersInCache(updatedCustomers);
      Toast.show({
        type: 'success',
        text1: 'Transaction added successfully',
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Unable to add Transaction',
        position: 'bottom',
      });
    }
  };

  const deleteTransaction = async (transactionId, customerId) => {
    try {
      await axios.post(
        `${API_URL}/transaction/delete-transaction/${transactionId}`,
      );

      const updatedCustomers = customers.map(customer => {
        if (customer.id === customerId) {
          const updatedTxns = (customer.Transactions || []).filter(
            txn => txn.id !== transactionId,
          );
          return {
            ...customer,
            Transactions: updatedTxns,
          };
        }
        return customer;
      });
      Toast.show({
        type: 'success',
        text1: 'Transaction deleted successfully',
        position: 'bottom',
      });

      await updateCustomersInCache(updatedCustomers);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not delete transaction',
        position: 'bottom',
      });
    }
  };

  const updateTransaction = async (transactionId, body, customerId) => {
    try {
      const response = await axios.put(
        `${API_URL}/transaction/update-transaction`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      const updatedTransaction = response.data.transaction;

      const updatedCustomers = customers.map(customer => {
        if (customer.id === customerId) {
          const updatedTxns = (customer.Transactions || []).map(txn => {
            if (txn.id === transactionId) {
              return {
                ...txn,
                ...updatedTransaction,
              };
            }
            return txn;
          });
          return {
            ...customer,
            Transactions: updatedTxns,
          };
        }
        return customer;
      });
      Toast.show({
        type: 'success',
        text1: 'Transaction updated successfully',
        position: 'bottom',
      });
      await updateCustomersInCache(updatedCustomers);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Unable to update transaction',
        position: 'bottom',
      });
    }
  };

  const getTransactionsByCustomerId = useCallback(
    customerId => {
      const customer = customers.find(c => c.id === customerId);
      return customer?.Transactions || [];
    },
    [customers],
  );

  return (
    <TransactionContext.Provider
      value={{
        addTransaction,
        deleteTransaction,
        updateTransaction,
        getTransactionsByCustomerId,
      }}>
      {children}
    </TransactionContext.Provider>
  );
};
