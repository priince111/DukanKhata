import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useBillTransactions} from '../../context/BillTransactionContext';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {groupTransactionsByDate} from '../../utils/groupTransactionByDate';

const ViewBill = ({route, navigation}) => {
  const {transaction, customer} = route.params;
  const sectionListRef = useRef(null);
  const {getBillTransactionsByTransactionId} = useBillTransactions();
  const [billTransactions, setBillTransactions] = useState([]);
  const [receivedBalance, setReceivedBalance] = useState(0);
  const [receivedDuplicateBalance, setReceivedDuplicateBalance] = useState(0);
  const [receivedOriginalBalance, setReceivedOriginalBalance] = useState(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const billTransactions = getBillTransactionsByTransactionId(
        customer.id,
        transaction.id,
      );
      console.log('bill transactions', billTransactions);
      // Balance Calculation
      let total = 0,
        duplicate = 0,
        original = 0;

      billTransactions.forEach(txn => {
        total += Number(txn.totalAmount) || 0;
        duplicate += Number(txn.duplicateAmount) || 0;
        original += Number(txn.originalAmount) || 0;
      });
      setReceivedBalance(total);
      setReceivedDuplicateBalance(duplicate);
      setReceivedOriginalBalance(original);
      const sectionData = groupTransactionsByDate(billTransactions);
      setBillTransactions(sectionData);
    }
  }, [
    isFocused,
    getBillTransactionsByTransactionId,
    customer.id,
    transaction.id,
  ]);
  const onContentSizeChange = () => {
    if (sectionListRef.current && billTransactions.length > 0) {
      const lastSectionIndex = billTransactions.length - 1;
      const lastItemIndex =
      billTransactions[lastSectionIndex].data.length - 1;

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
  const formatDate = date => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  const generateAndSharePDF = async () => {
    const flatTransactions = billTransactions.flatMap(section => section.data);
    const transactionRows = flatTransactions
      .map(item => {
        const formattedDate = item.date
          ? formatDate(new Date(item.date))
          : 'Invalid Date';
        return `
      <tr>
        <td style="padding: 8px 20px 8px 0;">${formattedDate}</td>
        <td style="padding: 8px 0;">₹${item.totalAmount}</td>
        <td style="padding: 8px 0;">${item.details}</td>
      </tr>
    `;
      })
      .join('');

    console.log(transactionRows);

    // Construct the HTML content
    const html = `
  <h1>Transaction Report</h1>
  <p><b>Customer:</b> ${customer.name}</p>
  <p><b>Bill Date:</b> ${formatDate(new Date(transaction.date))}</p>
  <hr />
  <p><b style="font-size:20px; color:black;">Total Bill:</b> <b style="color: blue;font-size:20px;">₹${
    transaction.totalAmount
  }</b></p>
  <p><b style="font-size:20px; color:black;">Total Received:</b> <b style="color: green;font-size:20px;">₹${receivedBalance}</b></p>
  <p><b style="font-size:20px; color:black;">Balance:</b> <b style="color: red;font-size:20px;">₹${
    transaction.totalAmount - receivedBalance
  }</b></p>
  <hr />
  <h2>Transactions</h2>
  <table style="width: 50%; border-collapse: collapse;">
    <thead>
      <tr>
        <th style="text-align:left; padding: 8px 20px 8px 0;">Date</th>
        <th style="text-align:left; padding: 8px 0;">Received</th>
        <th style="text-align:left; padding: 8px 0;">Details</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows}
    </tbody>
  </table>
`;

    try {
      // Save in app-specific directory
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

  const renderTransaction = ({item}) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('BillEntry', {
          customer,
          transaction,
          billTransaction: item,
        })
      }>
      <View style={styles.transactionCard}>
        {customer.transactionType === 'both' ? (
          <View style={styles.transactionRow}>
            <View style={styles.transactionBox}>
              <Text style={styles.transactionLabel}>Total</Text>
              <Text style={styles.transactionAmount}>₹{item.totalAmount}</Text>
            </View>
            <View style={styles.transactionBox}>
              <Text style={styles.transactionLabel}>Duplicate</Text>
              <Text style={styles.transactionAmount}>
                ₹{item.duplicateAmount}
              </Text>
            </View>
            <View style={styles.transactionBox}>
              <Text style={styles.transactionLabel}>Original</Text>
              <Text style={styles.transactionAmount}>
                ₹{item.originalAmount}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.transactionSingle}>
            <Text style={styles.transactionLabel}>You Got</Text>
            <Text style={styles.transactionAmount}>₹{item.totalAmount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const AmountRow = ({
    label,
    total,
    duplicate,
    original,
    bgColor,
    textColor,
  }) => (
    <View style={[styles.amountRow, {backgroundColor: bgColor}]}>
      <View style={styles.amountColumn}>
        <Text style={styles.amountLabel}>{label}</Text>
        <Text style={[styles.amountValue, {color: textColor}]}>₹ {total}</Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={styles.amountLabel}>Duplicate</Text>
        <Text style={[styles.amountValue, {color: textColor}]}>
          ₹ {duplicate}
        </Text>
      </View>
      <View style={styles.amountColumn}>
        <Text style={styles.amountLabel}>Original</Text>
        <Text style={[styles.amountValue, {color: textColor}]}>
          ₹ {original}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Total Bill */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Entry', {
            customer,
            entryType: 'debit',
            transaction,
            isBill: true,
          })
        }>
        <AmountRow
          label="Total Bill"
          total={transaction.totalAmount}
          duplicate={transaction.duplicateAmount}
          original={transaction.originalAmount}
          bgColor="#E3F2FD"
          textColor="#1E88E5"
        />
      </TouchableOpacity>

      {/* Total Received */}
      <AmountRow
        label="Total Received"
        total={receivedBalance}
        duplicate={receivedDuplicateBalance}
        original={receivedOriginalBalance}
        bgColor="#E8F5E9"
        textColor="#43A047"
      />

      {/* Total Pending */}
      <AmountRow
        label="Total Pending"
        total={transaction.totalAmount - receivedBalance}
        duplicate={transaction.duplicateAmount - receivedDuplicateBalance}
        original={transaction.originalAmount - receivedOriginalBalance}
        bgColor="#FFEBEE"
        textColor="#E53935"
      />

      {/* Transactions List */}
      <SectionList
        ref={sectionListRef}
        sections={billTransactions}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderTransaction}
        renderSectionHeader={({section: {title}}) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{title}</Text>
          </View>
        )}
        contentContainerStyle={{paddingBottom: 80}}
        onContentSizeChange={onContentSizeChange}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />

      {/* Bottom Button */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={generateAndSharePDF}>
          <Icon name="share" size={14} color="#fff" style={{marginRight: 1}} />
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gotButton}
          onPress={() =>
            navigation.navigate('BillEntry', {
              transaction,
              customer,
            })
          }>
          <Text style={styles.buttonText}>YOU GOT ₹</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB', paddingTop: 20},

  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 4,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  amountColumn: {
    alignItems: 'center',
  },
  amountLabel: {fontSize: 14, color: '#666'},
  amountValue: {fontSize: 18, fontWeight: 'bold'},

  transactionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    backgroundColor: '#e6ffe6',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionBox: {
    alignItems: 'center',
    flex: 1,
  },
  transactionSingle: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  transactionLabel: {fontSize: 14, color: '#333'},
  transactionAmount: {fontSize: 16, fontWeight: 'bold', color: '#2E7D32'},

  sectionHeaderContainer: {
    alignSelf: 'center',
    backgroundColor: '#eeeeee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
  },
  gotButton: {
    flex: 1,
    backgroundColor: 'green',
    padding: 20,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
  },
  buttonText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
  shareButton: {
    backgroundColor: '#007bff',
    flex: 1,
    padding: 14,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
  },
});

export default ViewBill;
