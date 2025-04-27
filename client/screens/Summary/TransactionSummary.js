import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useCustomers} from '../../context/CustomerContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TransactionSummary = ({navigation}) => {
  const {customers} = useCustomers();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [summary, setSummary] = useState({sell: 0, received: 0, pending: 0});
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [debitTransactions, setDebitTransactions] = useState([]);

  useEffect(() => {
    calculateSummary();
  }, [fromDate, toDate]);

  const formatDate = date => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateSummary = () => {
    let sell = 0;
    let received = 0;
    const tempDebitTransactions = [];
    const tempCreditTransactions = [];

    const toDateOnlyString = d => new Date(d).toISOString().split('T')[0];

    const fromStr = toDateOnlyString(fromDate);
    const toStr = toDateOnlyString(toDate);

    customers.forEach(customer => {
      customer.Transactions?.forEach(tx => {
        const txStr = toDateOnlyString(tx.date);
        if (txStr >= fromStr && txStr <= toStr) {
          const total = Number(tx.totalAmount || 0);
          if (tx.type === 'debit') {
            sell += total;
            tempDebitTransactions.push({
              customerName: customer.name,
              amount: total,
              date: tx.date,
            });
          } else {
            received += total;
            tempCreditTransactions.push({
              customerName: customer.name,
              amount: total,
              date: tx.date,
            });
          }
        }

        tx.BillTransactions?.forEach(billTx => {
          const billTxStr = toDateOnlyString(billTx.date);
          if (billTxStr >= fromStr && billTxStr <= toStr) {
            const billTotal = Number(billTx.totalAmount || 0);
            received += billTotal;
            tempCreditTransactions.push({
              customerName: customer.name,
              amount: billTotal,
              date: billTx.date,
            });
          }
        });
      });
    });

    const pending = sell - received;
    setSummary({sell, received, pending});
    setDebitTransactions(tempDebitTransactions);
    setCreditTransactions(tempCreditTransactions);
  };

  const applyQuickDateRange = range => {
    const today = new Date();
    let from, to;

    switch (range) {
      case 'today':
        from = to = today;
        break;
      case 'thisWeek':
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        from = firstDayOfWeek;
        to = today;
        break;
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = today;
        break;
      case 'total':
        from = new Date('2000-01-01'); // some very old date
        to = new Date(); // today
        break;
      default:
        return;
    }

    setFromDate(from);
    setToDate(to);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction Summary</Text>

      {/* Quick Range Buttons */}
      <View style={styles.dateSelectionContainer}>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowFromPicker(true)}>
          <Icon
            name="calendar-today"
            size={18}
            color="#grey"
            style={styles.dateIcon}
          />
          <Text style={styles.dateText}>
            {fromDate ? formatDate(fromDate) : 'Start Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowToPicker(true)}>
          <Icon
            name="calendar-today"
            size={18}
            color="#grey"
            style={styles.dateIcon}
          />
          <Text style={styles.dateText}>
            {toDate ? formatDate(toDate) : 'End Date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setFromDate(selectedDate);
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) setToDate(selectedDate);
          }}
        />
      )}
      <View style={styles.quickDateRangeContainer}>
        <TouchableOpacity
          style={styles.quickDateButton}
          onPress={() => applyQuickDateRange('today')}>
          <Text style={styles.quickDateText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickDateButton}
          onPress={() => applyQuickDateRange('thisWeek')}>
          <Text style={styles.quickDateText}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickDateButton}
          onPress={() => applyQuickDateRange('thisMonth')}>
          <Text style={styles.quickDateText}>This Month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickDateButton}
          onPress={() => applyQuickDateRange('total')}>
          <Text style={styles.quickDateText}>Total</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.sellCard]}
          onPress={() =>
            navigation.navigate('SummaryList', {
              debit: true,
              debitTransactions,
            })
          }>
          <Icon name="trending-up" size={24} color="#fff" />
          <Text style={styles.cardTitle}>Total Sales</Text>
          <Text style={styles.cardAmount}>
            ₹{summary.sell.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, styles.receivedCard]}
          onPress={() =>
            navigation.navigate('SummaryList', {
              credit: true,
              creditTransactions,
            })
          }>
          <Icon name="account-balance-wallet" size={24} color="#fff" />
          <Text style={styles.cardTitle}>Amount Received</Text>
          <Text style={styles.cardAmount}>
            ₹{summary.received.toLocaleString()}
          </Text>
        </TouchableOpacity>

        <View style={[styles.card, styles.pendingCard]}>
          <Icon name="pending-actions" size={24} color="#fff" />
          <Text style={styles.cardTitle}>Pending Amount</Text>
          <Text style={styles.cardAmount}>₹{summary.pending.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#bde0fe',
    fontSize: 26,
    fontWeight: '800',
    color: '#2d3436',
    marginTop: 35,
    marginBottom: 10,
    paddingVertical: 20,
    textAlign: 'center',
  },
  dateSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  dateInput: {
    backgroundColor: '#bde0fe',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 5,
    color: 'black'
  },
  dateText: {
    color: 'black',
    fontSize: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '100%',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sellCard: {
    backgroundColor: '#0984e3',
  },
  receivedCard: {
    backgroundColor: '#00b894',
  },
  pendingCard: {
    backgroundColor: '#d63031',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  cardAmount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  quickDateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  quickDateButton: {
    backgroundColor: '#bde0fe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  quickDateText: {
    color: 'black',
    fontSize: 16,
  },
});

export default TransactionSummary;
