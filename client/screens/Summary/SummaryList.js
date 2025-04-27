import React from 'react';
import {View, Text, SectionList, StyleSheet} from 'react-native';
import {groupTransactionsByDate} from '../../utils/groupTransactionByDate';

const SummaryList = ({route}) => {
  const {debit, debitTransactions, creditTransactions} = route.params;
  const sections = debit
    ? groupTransactionsByDate(debitTransactions)
    : groupTransactionsByDate(creditTransactions);

  const renderItem = ({item}) => {
    let alignmentStyle = debit ? styles.leftAligned : styles.rightAligned;
    return (
      <View style={[styles.transactionContainer, alignmentStyle]}>
        <View style={styles.transactionBox}>
          <Text style={styles.transactionLabel}>
            {item.customerName}
          </Text>
          <Text
            style={[
              styles.transactionAmount,
              debit?styles.negative:styles.positive,
            ]}>
            ₹{item.amount}
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({section: {title}}) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerContent}>Transaction Summary</Text>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{paddingBottom: 80}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  headerContent: {
    backgroundColor: '#bde0fe',
    fontSize: 26,
    fontWeight: '800',
    color: '#2d3436',
    marginTop: 35,
    marginBottom: 20,
    paddingVertical: 20,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#FAA0A0',
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
});

export default SummaryList;
