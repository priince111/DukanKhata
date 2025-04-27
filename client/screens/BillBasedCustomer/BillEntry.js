import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import PhotoUploader from '../Transaction/PhotoUploader';
import Toast from 'react-native-toast-message';
import { useBillTransactions } from '../../context/BillTransactionContext';

const BillEntry = ({route, navigation}) => {
  const {transaction, customer, billTransaction} = route.params;
  console.log('transaction details in bill entry', transaction, customer);
  const {addBillTransaction, updateBillTransaction, deleteBillTransaction} = useBillTransactions();

  const isBothType = customer.transactionType === 'both';
  const themeColor = '#228B22';

  const [originalAmount, setOriginalAmount] = useState(
    billTransaction ? billTransaction.originalAmount?.toString() : '',
  );
  const [duplicateAmount, setDuplicateAmount] = useState(
    billTransaction ? billTransaction.duplicateAmount?.toString() : '',
  );
  const [singleAmount, setSingleAmount] = useState(
    billTransaction ? billTransaction.totalAmount?.toString() : '',
  );

  const [details, setDetails] = useState(
    billTransaction ? billTransaction.details : '',
  );
  const [date, setDate] = useState(
    billTransaction ? new Date(billTransaction.date) : new Date(),
  );
  const [images, setImages] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingMap, setLoadingMap] = useState({}); // optional if not lifted to PhotoUploader
  const [loading, setLoading] = useState(false);

  const isAnyImageLoading = () => {
    return Object.values(loadingMap).some(val => val === true);
  };

  useEffect(() => {
    if (billTransaction && billTransaction.images) {
      const initialImages = billTransaction.images.map((imgObj, index) => ({
        uri: imgObj.url,
        type: 'image/jpeg',
        name: `bill_transaction_image_${index}.jpg`,
        existing: true,
        public_id: imgObj.public_id,
      }));

      setImages(initialImages);
    }
  }, [billTransaction]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = date => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    console.log('date in format', `${day}-${month}-${year}`);
    return `${day}-${month}-${year}`;
  };

  const totalAmount = isBothType
    ? (parseFloat(originalAmount) || 0) + (parseFloat(duplicateAmount) || 0)
    : parseFloat(singleAmount) || 0;

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteBillTransaction(billTransaction.id,customer.id,transaction.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting transaction:', error);
            }
            finally{
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleUpdate = async () => {
    if (isBothType) {
      if (!originalAmount && !duplicateAmount) {
        Toast.show({
          type: 'error',
          text1: 'Please enter at least one amount.',
          position: 'bottom',
        });
        return;
      }
    } else {
      if (!singleAmount) {
        Toast.show({
          type: 'error',
          text1: 'Please enter an amount.',
          position: 'bottom',
        });
        return;
      }
    }
    if (isAnyImageLoading()) {
      Toast.show({
        type: 'error',
        text1: 'Please wait Images are still loading. Try again shortly.',
        position: 'bottom',
      });
      return;
    }
    Alert.alert(
      'Update Transaction',
      'Are you sure you want to update this transaction?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Update',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            const body = new FormData();
            body.append('billTransactionId', billTransaction.id);
            body.append('totalAmount', totalAmount);
            body.append('details', details);
            body.append('date', formatDate(date));
            if (
              originalAmount !== undefined &&
              originalAmount !== null &&
              originalAmount !== ''
            ) {
              body.append('originalAmount', originalAmount);
            }

            if (
              duplicateAmount !== undefined &&
              duplicateAmount !== null &&
              duplicateAmount !== ''
            ) {
              body.append('duplicateAmount', duplicateAmount);
            }

            const imagesToKeep = images
              .filter(img => img.existing)
              .map(img => ({
                url: img.uri,
                public_id: img.public_id,
              }));

            body.append('imagesToKeep', JSON.stringify(imagesToKeep));

            // Array of new images to append
            const newImages = images.filter(img => !img.existing);
            newImages.forEach((image, index) => {
              body.append('images', {
                uri: image.uri,
                type: image.type,
                name: image.fileName || `photo_${index}.jpg`,
              });
            });

            try {
              await updateBillTransaction(body,billTransaction.id,transaction.id,customer.id);
              navigation.goBack();
            } catch (error) {
              console.log('err',error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    if (isBothType) {
      if (!originalAmount && !duplicateAmount) {
        Toast.show({
          type: 'error',
          text1: 'Please enter at least one amount.',
          position: 'bottom',
        });
        return;
      }
    } else {
      if (!singleAmount) {
        Toast.show({
          type: 'error',
          text1: 'Please enter an amount.',
          position: 'bottom',
        });
        return;
      }
    }
    if (isAnyImageLoading()) {
      Toast.show({
        type: 'error',
        text1: 'Please wait, Images are still loading. Try again shortly.',
        position: 'bottom',
      });
      return;
    }
    setLoading(true);
    const body = new FormData();
    body.append('transactionId', transaction.id);
    body.append('totalAmount', totalAmount);
    body.append('details', details);
    body.append('date', formatDate(date));
    if (
      originalAmount !== undefined &&
      originalAmount !== null &&
      originalAmount !== ''
    ) {
      body.append('originalAmount', originalAmount);
    }

    if (
      duplicateAmount !== undefined &&
      duplicateAmount !== null &&
      duplicateAmount !== ''
    ) {
      body.append('duplicateAmount', duplicateAmount);
    }
    console.log('body ke upar image', body);
    images.forEach((image, index) => {
      body.append('images', {
        uri: image.uri,
        type: image.type,
        name: image.fileName || `photo_${index}.jpg`,
      });
    });
    console.log('body in nill transaction', body);
    try {
      await addBillTransaction(body,customer.id,transaction.id);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, {color: themeColor}]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: themeColor}]}>
          You got ₹ {totalAmount || '0'} from {customer.name}
        </Text>
      </View>

      {/* Amount Inputs */}
      {isBothType ? (
        <>
          <TextInput
            style={[styles.amountInput, {color: themeColor}]}
            placeholder="Original Amount"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={originalAmount}
            onChangeText={text => setOriginalAmount(text)}
          />
          <TextInput
            style={[styles.amountInput, {color: themeColor}]}
            placeholder="Duplicate Amount"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={duplicateAmount}
            onChangeText={text => setDuplicateAmount(text)}
          />
        </>
      ) : (
        <TextInput
          style={[styles.amountInput, {color: themeColor}]}
          placeholder="₹ 0"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={singleAmount}
          onChangeText={text => setSingleAmount(text)}
        />
      )}

      {/* Details Input */}
      <TextInput
        style={styles.detailsInput}
        placeholder="Enter details (Items, bill no., quantity, etc.)"
        placeholderTextColor="#aaa"
        value={details}
        onChangeText={text => setDetails(text)}
      />

      {/* Date Picker */}
      <TouchableOpacity style={styles.dateButton} onPress={showDatepicker}>
        <Icon name="calendar-today" size={20} color={themeColor} />
        <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onChangeDate}
        />
      )}

      <PhotoUploader
        images={images}
        setImages={setImages}
        themeColor={themeColor}
      />
      {loading && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      {/* Save Button */}
      {billTransaction ? (
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {backgroundColor: '#ff9800', flex: 1, marginRight: 10},
            ]}
            onPress={handleUpdate}>
            <Text style={styles.saveButtonText}>{loading ? 'UPDATING...' : 'UPDATE'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: '#d32f2f', flex: 1}]}
            onPress={handleDelete}>
            <Text style={styles.saveButtonText}>{loading ? 'DELETING...' : 'DELETE'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.saveButton, {backgroundColor: themeColor}]}
          onPress={handleSave}>
          <Text style={styles.saveButtonText}>{loading ? 'SAVING...' : 'SAVE'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    textAlign: 'center',
  },
  detailsInput: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default BillEntry;
