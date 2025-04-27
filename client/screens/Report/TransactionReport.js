import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import {useTransactions} from '../../context/TransactionContext';

const TransactionReport = ({route, navigation}) => {
  const {customer} = route.params;
  const customerId = customer.id;
  const isBillBased = customer.billType === 'bill_based';
  const {getTransactionsByCustomerId} = useTransactions();

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [expandedTxn, setExpandedTxn] = useState(null);

  const allTransactions = getTransactionsByCustomerId(customerId);

  // Function to format date
  const formatDate = date => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Function to convert date to string format (YYYY-MM-DD)
  function toDateOnlyString(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Calculate total debit and credit
  const totalDebit = filtered
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

  let totalCredit = filtered
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

  // Add bill transactions to total credit
  totalCredit += filtered
    .filter(t => t.type === 'debit' && t.billTotal)
    .reduce((sum, t) => sum + Number(t.billTotal || 0), 0);

  const balance = totalDebit - totalCredit;

  // Helper function to apply date range
  const applyDateRange = useCallback(
    (start, end) => {
      setFromDate(start);
      setToDate(end);
    },
    [setFromDate, setToDate],
  );

  // Effect for setting the default date range to the last and latest transaction dates
  useEffect(() => {
    const getTransactionDates = () => {
      let allDates = [];
      allTransactions.forEach(txn => {
        allDates.push(new Date(txn.date));
        if (isBillBased && txn.type === 'debit' && txn.BillTransactions) {
          txn.BillTransactions.forEach(bill => {
            allDates.push(new Date(bill.date));
          });
        }
      });

      if (allDates.length > 0) {
        allDates.sort((a, b) => a - b);
        return [allDates[0], allDates[allDates.length - 1]];
      } else {
        return [new Date(), new Date()];
      }
    };

    const [firstDate, lastDate] = getTransactionDates();
    applyDateRange(firstDate, lastDate);
  }, [allTransactions, isBillBased, applyDateRange]);

  // Effect for filtering and sorting transactions based on date range
  useEffect(() => {
    if (fromDate && toDate) {
      // Filter transactions based on date range
      let filteredTxns = allTransactions.filter(txn => {
        const txStr = toDateOnlyString(txn.date);
        return (
          txStr >= toDateOnlyString(fromDate) &&
          txStr <= toDateOnlyString(toDate)
        );
      });

      // Sort transactions by date in ascending order (oldest first)
      filteredTxns.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate bill transactions total and assign it
      filteredTxns = filteredTxns.map(transaction => {
        if (
          isBillBased &&
          transaction.type === 'debit' &&
          transaction.BillTransactions
        ) {
          let billTotal = 0;
          transaction.BillTransactions.forEach(bill => {
            billTotal += Number(bill.totalAmount || 0);
          });
          transaction.billTotal = billTotal;
        }
        return transaction;
      });

      setFiltered(filteredTxns);
    }
  }, [fromDate, toDate, allTransactions, isBillBased]);

  const generateAndSharePDF = async () => {
    const generateBillTransactionsHTML = (billTransactions, pendingAmount) => {
      let billRows = '';
      if (billTransactions && billTransactions.length > 0) {
        billTransactions.forEach(bill => {
          billRows += `
            <tr class="bill-row">
              <td>${formatDate(new Date(bill.date))}</td>
              <td></td>
              <td>₹${bill.totalAmount}</td>
              <td>${bill.details}</td>
            </tr>
          `;
        });
        billRows += `
          <tr class="bill-row">
            <td colspan="4"><b>Pending:</b> ₹${pendingAmount}</td>
          </tr>
        `;
      }
      return billRows;
    };

    const transactionRows = filtered
      .map(item => {
        const pendingAmount =
          item.totalAmount -
          (item.BillTransactions
            ? item.BillTransactions.reduce(
                (sum, bill) => sum + Number(bill.totalAmount || 0),
                0,
              )
            : 0);
        let billTransactionRows = '';
        if (item.type === 'debit' && isBillBased && item.BillTransactions) {
          billTransactionRows = generateBillTransactionsHTML(
            item.BillTransactions,
            pendingAmount,
          );
        }

        return `
        <tr class="main-transaction">
          <td>${formatDate(new Date(item.date))}</td>
          <td>${item.type === 'debit' ? `₹${item.totalAmount}` : ''}</td>
          <td>${item.type === 'credit' ? `₹${item.totalAmount}` : ''}</td>
          <td>${item.details || ''}</td>
        </tr>
        ${billTransactionRows}
        <tr class="divider"><td colspan="4"></td></tr>
      `;
      })
      .join('');

    const html = `
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            padding: 20px;
            color: #333;
          }
          h1, h2 {
            color: #2c3e50;
          }
          table {
            width: 60%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 13px;
          }
          th, td {
            padding: 10px;
            text-align: left;
          }
          thead {
            background-color: #f1f1f1;
          }
          .bill-row {
            background-color: #eef6fc;
          }
          .summary {
            margin-top: 10px;
            font-size: 14px;
          }
          .summary p {
            margin: 4px 0;
          }
          tbody tr {
            border: none;
          }
          .spacer td {
            height: 20px;
          }
          .divider td {
            border-bottom: 1px solid #999;
            height: 10px;
          }

        </style>
      </head>
      <body>
        <h1>Transaction Report</h1>
  
        <div class="summary">
          <p><b>Customer:</b> ${customer.name}</p>
          <p><b>From:</b> ${formatDate(fromDate)}</p>
          <p><b>To:</b> ${formatDate(toDate)}</p>
          <hr />
          <p><b style="font-size:20px; color:black;">Total Sell:</b> <b style="color: blue;font-size:20px;">₹${totalDebit}</b></p>
          <p><b style="font-size:20px; color:black;">Total Received:</b> <b style="color: green;font-size:20px;">₹${totalCredit}</b></p>
          <p><b style="font-size:20px; color:black;">Pending:</b> <b style="color: red;font-size:20px;">₹${balance}</b></p>
          <hr />
        </div>
  
        <h2>Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
          </tbody>
        </table>
      </body>
    </html>
    `;

    try {
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `Transaction_Report_${Date.now()}`,
        directory: 'Documents',
      });

      console.log('PDF Path:', file.filePath);

      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        title: 'Transaction Report',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBillTransactions = transactionId => {
    setExpandedTxn(prevState => {
      return prevState === transactionId ? null : transactionId;
    });
  };

  const renderBillTransaction = bill => (
    <View style={styles.billEntry} key={bill.id}>
      <Text style={styles.billDate}>{formatDate(new Date(bill.date))}</Text>
      <Text style={styles.billAmount}>₹{bill.totalAmount}</Text>
    </View>
  );

  const renderTransactionItem = ({item}) => {
    const isExpanded = expandedTxn === item.id;
    const hasBills =
      isBillBased &&
      item.type === 'debit' &&
      item.BillTransactions &&
      item.BillTransactions.length > 0;

    // Sort BillTransactions by date in ascending order (oldest first)
    if (hasBills) {
      item.BillTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return (
      <View style={styles.transactionCard}>
        <TouchableOpacity
          onPress={() => {
            if (hasBills) {
              toggleBillTransactions(item.id);
            }
          }}
          style={styles.transactionTouchable}>
          <View style={styles.transactionRow}>
            <Text style={styles.transactionDate}>
              {formatDate(new Date(item.date))}
            </Text>
            <Text style={styles.transactionDebit}>
              {item.type === 'debit' ? `₹${item.totalAmount}` : ''}
            </Text>
            <Text style={styles.transactionCredit}>
              {item.type === 'credit'
                ? `₹${item.totalAmount}`
                : item.type === 'debit' && hasBills
                ? `₹${item.billTotal}`
                : ''}
            </Text>
            {hasBills && (
              <Icon
                name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color="#777"
              />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && hasBills && (
          <View style={styles.billEntriesContainer}>
            {item.BillTransactions.map(bill => renderBillTransaction(bill))}
            {/* Total Received and Pending Amount */}
            <View style={styles.amountSummary}>
              <Text style={styles.amountSummaryText}>
                Total Received: ₹
                {item.BillTransactions.reduce(
                  (sum, bill) => sum + Number(bill.totalAmount || 0),
                  0,
                )}
              </Text>
              <Text style={styles.amountSummaryText}>
                Pending Amount: ₹
                {item.totalAmount -
                  item.BillTransactions.reduce(
                    (sum, bill) => sum + Number(bill.totalAmount || 0),
                    0,
                  )}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const applyQuickDateRange = range => {
    const today = new Date();
    let start, end;

    switch (range) {
      case 'today':
        start = end = today;
        break;
      case 'thisWeek':
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        start = firstDayOfWeek;
        end = today;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        start = end = null;
    }

    applyDateRange(start, end);
  };

  return (
    <View style={styles.container}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>{customer.name}</Text>
      </View>

      {/* Date Selection */}
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
          onPress={() => applyQuickDateRange('thisYear')}>
          <Text style={styles.quickDateText}>This Year</Text>
        </TouchableOpacity>
      </View>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.netBalance}>₹{balance.toLocaleString()}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Total</Text>
          <Text style={styles.youGave}>₹{totalDebit.toLocaleString()}</Text>
          <Text style={styles.youGot}>₹{totalCredit.toLocaleString()}</Text>
        </View>
      </View>

      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={styles.headerDate}>Date</Text>
        <Text style={styles.headerDebit}>You Gave</Text>
        <Text style={styles.headerCredit}>You Got</Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filtered}
        renderItem={renderTransactionItem}
        keyExtractor={item => item.id}
        style={styles.transactionList}
      />

      {/* Action Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={generateAndSharePDF}>
          <Icon name="share" size={18} color="#fff" style={{marginRight: 5}} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  appBar: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  appBarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
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
    color:'black'
  },
  dateText: {
    color: 'black',
    fontSize: 17,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 16,
  },
  netBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  youGave: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  youGot: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  headerDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  headerBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'center',
  },
  headerDebit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    flex: 1,
    textAlign: 'center',
  },
  headerCredit: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
    flex: 1,
    textAlign: 'center',
  },
  transactionList: {
    marginHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionDate: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  transactionDebit: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  transactionCredit: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickDateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 10,
  },
  quickDateButton: {
    backgroundColor: '#bde0fe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginVertical:10
  },
  quickDateText: {
    color: 'black',
    fontSize: 17,
  },
  billEntriesContainer: {
    marginTop: 8,
    paddingLeft: 20,
  },
  billEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    marginBottom: 5,
  },
  billDate: {
    fontSize: 13,
    color: '#555',
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionTouchable: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default TransactionReport;
