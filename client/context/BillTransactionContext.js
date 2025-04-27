import React, {createContext, useContext, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useCustomers} from './CustomerContext';
import Toast from 'react-native-toast-message';
import {API_URL} from './api';
const BillTransactionContext = createContext();

export const useBillTransactions = () => useContext(BillTransactionContext);

export const BillTransactionProvider = ({children}) => {
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

  const addBillTransaction = async (body, customerId, transactionId) => {
    try {
      const response = await axios.post(
        `${API_URL}/bill-transaction/add-bill-transaction`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      const newBillTransaction = response.data.transaction;
      console.log('New Bill Transaction:', newBillTransaction);

      const updatedCustomers = customers.map(customer => {
        if (customer.id === customerId) {
          const updatedTransactions = (customer.Transactions || []).map(txn => {
            if (txn.id === transactionId) {
              return {
                ...txn,
                BillTransactions: [
                  newBillTransaction,
                  ...(txn.BillTransactions || []),
                ],
              };
            }
            return txn;
          });

          return {
            ...customer,
            Transactions: updatedTransactions,
            latestEntry: new Date().toISOString(),
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

  const deleteBillTransaction = async (
    billTransactionId,
    customerId,
    transactionId,
  ) => {
    try {
      await axios.post(
        `${API_URL}/bill-transaction/delete-bill-transaction/${billTransactionId}`,
      );

      const updatedCustomers = customers.map(customer => {
        if (customer.id === customerId) {
          const updatedTransactions = (customer.Transactions || []).map(txn => {
            if (txn.id === transactionId) {
              const filteredBillTxns = (txn.BillTransactions || []).filter(
                bt => bt.id !== billTransactionId,
              );
              return {
                ...txn,
                BillTransactions: filteredBillTxns,
              };
            }
            return txn;
          });

          return {
            ...customer,
            Transactions: updatedTransactions,
          };
        }
        return customer;
      });

      await updateCustomersInCache(updatedCustomers);
      Toast.show({
        type: 'success',
        text1: 'Transaction deleted successfully',
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not delete transaction',
        position: 'bottom',
      });
    }
  };

  const updateBillTransaction = async (
    body,
    billTransactionId,
    transactionId,
    customerId,
  ) => {
    try {
      const response = await axios.put(
        `${API_URL}/bill-transaction/update-bill-transaction`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const updatedBillTransaction = response.data.billTransaction;

      const updatedCustomers = customers.map(customer => {
        if (customer.id === customerId) {
          const updatedTransactions = (customer.Transactions || []).map(txn => {
            if (txn.id === transactionId) {
              const updatedBillTxns = (txn.BillTransactions || []).map(bt =>
                bt.id === billTransactionId ? updatedBillTransaction : bt,
              );
              return {
                ...txn,
                BillTransactions: updatedBillTxns,
              };
            }
            return txn;
          });

          return {
            ...customer,
            Transactions: updatedTransactions,
          };
        }
        return customer;
      });
      console.log(
        'bill transaction details in update transaction',
        updateBillTransaction,
      );
      console.log('in update transaction', updatedCustomers);
      await updateCustomersInCache(updatedCustomers);
      Toast.show({
        type: 'success',
        text1: 'Transaction updated successfully',
        position: 'bottom',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Unable to update transaction',
        position: 'bottom',
      });
    }
  };

  const getBillTransactionsByTransactionId = useCallback(
    (customerId, transactionId) => {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const transaction = customer.Transactions.find(
          t => t.id === transactionId,
        );
        return transaction?.BillTransactions || [];
      } else {
        return [];
      }
    },
    [customers],
  );

  return (
    <BillTransactionContext.Provider
      value={{
        addBillTransaction,
        deleteBillTransaction,
        updateBillTransaction,
        getBillTransactionsByTransactionId,
      }}>
      {children}
    </BillTransactionContext.Provider>
  );
};
