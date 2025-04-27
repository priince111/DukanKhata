import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useTransactions} from '../../context/TransactionContext';
import {useCustomers} from '../../context/CustomerContext';
import {groupTransactionsByDate} from '../../utils/groupTransactionByDate';

const ViewDetails = ({route, navigation}) => {
  const {customer} = route.params;
  const sectionListRef = useRef(null);
  const {getTransactionsByCustomerId} = useTransactions();
  const {updateCustomerPending} = useCustomers();
  const [groupedTransactions, setGroupedTransactions] = useState([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [pendingDuplicateBalance, setPendingDuplicateBalance] = useState(0);
  const [pendingOriginalBalance, setPendingOriginalBalance] = useState(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    const transactions = getTransactionsByCustomerId(customer.id);
    if (isFocused) {
      console.log(
        `transactions in view details for customer ${customer.name}`,
        transactions,
      );
      // Balance Calculation
      let total = 0,
        duplicate = 0,
        original = 0;

      transactions.forEach(txn => {
        const sign = txn.type === 'debit' ? 1 : -1;
        const totalTxnAmount = sign * txn.totalAmount || 0;
        const hasBills =
          Array.isArray(txn.BillTransactions) &&
          txn.BillTransactions.length > 0;

        let billTotalPaid = 0;
        let billDuplicatePaid = 0;
        let billOriginalPaid = 0;

        if (hasBills) {
          billTotalPaid = txn.BillTransactions.filter(bt => bt !== null).reduce(
            (sum, bt) => sum + (Number(bt.totalAmount) || 0),
            0,
          );
          billDuplicatePaid = txn.BillTransactions.filter(
            bt => bt !== null,
          ).reduce((sum, bt) => sum + (Number(bt.duplicateAmount) || 0), 0);
          billOriginalPaid = txn.BillTransactions.filter(
            bt => bt !== null,
          ).reduce((sum, bt) => sum + (Number(bt.originalAmount) || 0), 0);
        }

        total += totalTxnAmount - billTotalPaid;

        if (txn.duplicateAmount) {
          const totalTxnDuplicateAmount = txn.duplicateAmount || 0;
          duplicate += sign * totalTxnDuplicateAmount - billDuplicatePaid;
        }

        if (txn.originalAmount) {
          const totalTxnOriginalAmount = txn.originalAmount || 0;
          original += sign * totalTxnOriginalAmount - billOriginalPaid;
        }
      });

      setPendingBalance(total);
      setPendingDuplicateBalance(duplicate);
      setPendingOriginalBalance(original);
      if (customer.pendingSum !== total) {
        updateCustomerPending({
          ...customer,
          pendingSum: total,
        });
      }
      const sectionData = groupTransactionsByDate(transactions);
      setGroupedTransactions(sectionData);
    }
  }, [isFocused, getTransactionsByCustomerId, customer.id]);

  const onContentSizeChange = () => {
    if (sectionListRef.current && groupedTransactions.length > 0) {
      const lastSectionIndex = groupedTransactions.length - 1;
      const lastItemIndex =
        groupedTransactions[lastSectionIndex].data.length - 1;

      sectionListRef.current.scrollToLocation({
        sectionIndex: lastSectionIndex,
        itemIndex: lastItemIndex,
        animated: false,
        viewOffset: 100, // Optional
      });
    }
  };

  const onScrollToIndexFailed = info => {
    setTimeout(() => {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: info.sectionIndex,
        itemIndex: info.index,
        animated: false,
      });
    }, 500); // wait a bit then retry
  };

  const renderItem = ({item}) => {
    const isBoth = customer.transactionType === 'both';
    const isDebit = item.type === 'debit';
    let alignmentStyle = {};

    const received =
      item.BillTransactions?.reduce(
        (sum, bt) => sum + (Number(bt.totalAmount) || 0),
        0,
      ) || 0;

    if (isBoth) {
      alignmentStyle = isDebit
        ? styles.rightAlignedBoth
        : styles.leftAlignedBoth;
    } else {
      alignmentStyle = isDebit ? styles.leftAligned : styles.rightAligned;
    }
    if(received == item.totalAmount) alignmentStyle = styles.fullRecieved;
    console.log("alignmenr style",alignmentStyle);
    return (
      <TouchableOpacity
        onPress={() =>
          !isDebit
            ? navigation.navigate('Entry', {
                customer,
                entryType: 'debit',
                transaction: item,
              })
            : navigation.navigate('ViewBill', {
                customer,
                transaction: item,
              })
        }>
        <View style={[styles.transactionContainer, alignmentStyle]}>
          {isBoth ? (
            <View>
              <View style={styles.transactionRow}>
                <View style={styles.transactionCell}>
                  <Text style={styles.transactionLabel}>Total</Text>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isDebit ? styles.negative : styles.positive,
                    ]}>
                    ₹{item.totalAmount}
                  </Text>
                </View>
                <View style={styles.transactionCell}>
                  <Text style={styles.transactionLabel}>Duplicate</Text>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isDebit ? styles.negative : styles.positive,
                    ]}>
                    ₹{item.duplicateAmount}
                  </Text>
                </View>
                <View style={styles.transactionCell}>
                  <Text style={styles.transactionLabel}>Original</Text>
                  <Text
                    style={[
                      styles.transactionAmount,
                      isDebit ? styles.negative : styles.positive,
                    ]}>
                    ₹{item.originalAmount}
                  </Text>
                </View>
              </View>
            </View>
          ) : !isDebit ? (
            <View style={styles.transactionBox}>
              <Text style={styles.transactionLabel}>
                {isDebit ? 'You Gave' : 'You Got'}
              </Text>
              <Text
                style={[
                  styles.transactionAmount,
                  isDebit ? styles.negative : styles.positive,
                ]}>
                ₹{item.totalAmount}
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.transactionRow}>
                <View style={styles.transactionCell}>
                  <Text style={styles.transactionLabel}>Total Bill</Text>
                  <Text style={[styles.transactionAmount, styles.negative]}>
                    ₹{item.totalAmount}
                  </Text>
                </View>
                <View style={styles.transactionCell}>
                  <Text style={styles.transactionLabel}>Received</Text>
                  <Text style={[styles.transactionAmount, styles.positive]}>
                    ₹{received}
                  </Text>
                </View>
                <View style={styles.transactionCell}>
                  <Text style={styles.transactionLabel}>Pending</Text>
                  <Text style={[styles.transactionAmount, styles.negative]}>
                    ₹{item.totalAmount - received}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({section: {title}}) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() =>
              navigation.navigate('TransactionReport', {customer})
            }>
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>

          {/* Centered Customer Name & View Settings */}
          <View style={styles.customerInfoWrapper}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditCustomer', {customer})}>
              <Text style={styles.viewSettings}>View settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.balanceColumn}>
          <Text style={styles.amountLabel}>Total Pending</Text>
          <Text style={styles.amountValue}>₹ {pendingBalance}</Text>
        </View>
        <View style={styles.balanceColumn}>
          <Text style={styles.amountLabel}>Duplicate</Text>
          <Text style={styles.amountValue}>₹ {pendingDuplicateBalance}</Text>
        </View>
        <View style={styles.balanceColumn}>
          <Text style={styles.amountLabel}>Original</Text>
          <Text style={styles.amountValue}>₹ {pendingOriginalBalance}</Text>
        </View>
      </View>

      <SectionList
        ref={sectionListRef}
        sections={groupedTransactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{paddingBottom: 80}}
        onContentSizeChange={onContentSizeChange}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.gaveButton}
          onPress={() =>
            navigation.navigate('Entry', {customer, entryType: 'debit'})
          }>
          <Text style={styles.buttonText}>YOU GAVE ₹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gotButton}
          onPress={() =>
            navigation.navigate('Entry', {customer, entryType: 'credit'})
          }>
          <Text style={styles.buttonText}>YOU GOT ₹</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', paddingTop: 30},
  header: {
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },

  reportButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    elevation: 2,
  },

  reportButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  customerInfoWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },

  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  viewSettings: {
    fontSize: 14,
    color: '#fff',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FFEBEE',
    marginBottom: 4,
  },
  balanceColumn: {
    alignItems: 'center',
  },
  amountLabel: {fontSize: 18, color: '#555', fontWeight: 'bold'},
  amountValue: {fontSize: 22, fontWeight: 'bold', color: 'red'},
  sectionHeaderContainer: {
    marginTop: 16, // more space between date sections
    marginBottom: 6,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  transactionContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 6,
    elevation: 2,
    alignSelf: 'stretch',
  },
  leftAligned: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffe6e6',
  },
  rightAligned: {
    alignSelf: 'flex-end',
    backgroundColor: '#e6ffe6',
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  transactionCell: {
    flex: 1,
    alignItems: 'center',
  },
  transactionBox: {
    alignItems: 'flex-start',
  },
  positive: {color: 'green'},
  negative: {color: 'red'},
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
  },
  gaveButton: {
    flex: 1,
    backgroundColor: 'red',
    padding: 14,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  gotButton: {
    flex: 1,
    backgroundColor: 'green',
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
  },
  buttonText: {color: '#fff', fontWeight: 'bold'},
  leftAlignedBoth: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6ffe6', // greenish for credit
  },
  rightAlignedBoth: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffe6e6', // reddish for debit
  },
  fullRecieved: {
    alignSelf: 'flex-end',
    backgroundColor: '#eaf4f4', // reddish for debit
  },
});

export default ViewDetails;
