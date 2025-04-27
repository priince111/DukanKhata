import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Text,
  TouchableWithoutFeedback,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';

const PhotoUploader = ({images, setImages}) => {
  const [loadingMap, setLoadingMap] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleAddPhoto = () => {
    setPickerVisible(true);
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions through image-picker
  };

  const handlePickerOption = async option => {
    setPickerVisible(false);

    if (option === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      launchCamera({mediaType: 'photo'}, response => {
        if (response.assets) {
          processImages(response.assets);
        }
      });
    } else if (option === 'gallery') {
      launchImageLibrary(
        {mediaType: 'photo', selectionLimit: 0},
        response => {
          if (response.assets) {
            processImages(response.assets);
          }
        },
      );
    }
  };

  const processImages = assets => {
    const newImages = assets.map(asset => ({
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName,
      fileName: asset.fileName,
      existing: false,
    }));

    const newLoadingState = {};
    newImages.forEach((_, index) => {
      const id = `${images.length + index}`;
      newLoadingState[id] = true;

      setTimeout(() => {
        setLoadingMap(prev => ({
          ...prev,
          [id]: false,
        }));
      }, 4000);
    });

    setLoadingMap(prev => ({...prev, ...newLoadingState}));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemovePhoto = index => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);

    const newLoadingMap = {...loadingMap};
    delete newLoadingMap[index];
    setLoadingMap(newLoadingMap);

    setImages(updatedImages);
  };

  const isAnyImageUploading = () => {
    return Object.values(loadingMap).some(val => val === true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={isAnyImageUploading() ? null : handleAddPhoto}
        style={[styles.addPhotoBox, isAnyImageUploading() && {opacity: 0.5}]}
        disabled={isAnyImageUploading()}>
        {isAnyImageUploading() ? (
          <ActivityIndicator size="small" color="#888" />
        ) : (
          <Icon name="add-circle-outline" size={40} color="#555" />
        )}
      </TouchableOpacity>

      {images.map((img, index) => (
        <View key={index} style={styles.imageContainer}>
          <TouchableOpacity onPress={() => setSelectedImage(img.uri)}>
            <Image
              source={{uri: img.uri}}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>

          {loadingMap[index] && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          <TouchableOpacity
            style={styles.removeIcon}
            onPress={() => handleRemovePhoto(index)}>
            <Icon name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Full image modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedImage(null)}>
          <View style={styles.modalContainer}>
            <Image
              source={{uri: selectedImage}}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}>
              <Icon name="close-circle" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom photo picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <Text style={styles.modalTitle}>Upload Photo</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handlePickerOption('camera')}>
                <Text style={styles.modalButtonText}>Take a Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => handlePickerOption('gallery')}>
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPickerVisible(false)}
                style={[styles.modalButton, {backgroundColor: '#eee'}]}>
                <Text style={[styles.modalButtonText, {color: '#333'}]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export const useImageValidation = loadingMap => {
  return Object.values(loadingMap).some(val => val === true);
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 10,
  },
  addPhotoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default PhotoUploader;
