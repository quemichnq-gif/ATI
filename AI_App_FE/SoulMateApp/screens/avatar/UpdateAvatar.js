import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { updateProfileField } from '../my_profile/profileSlice';
import { BASE_URL } from '../../config/api';
import { apiFetch } from '../../services/apiClient';

export default function UpdateAvatar({ route, navigation }) {
  const { imageType } = route.params; // "avatar" hoặc "coverImage"
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const currentImage = imageType === 'avatar' ? profile.avatar : profile.coverImage;
  const defaultImage = imageType === 'avatar' 
    ? require('../../assets/default_avatar.jpg')
    : require('../../assets/default_cover_image.jpg');

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('❌ Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Use array instead of MediaTypeOptions
      allowsEditing: true,
      aspect: imageType === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Chụp ảnh mới
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('❌ Quyền truy cập', 'Cần cấp quyền truy cập camera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: imageType === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Upload ảnh lên server
  const uploadImage = async () => {
    if (!selectedImage) {
      Alert.alert('⚠️', 'Vui lòng chọn ảnh trước!');
      return;
    }

    setUploading(true);

    try {
      // Gửi base64 lên Flask server
      const response = await apiFetch(`${BASE_URL}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: profile.uid,
          imageType: imageType,
          imageData: selectedImage.base64,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Cập nhật Redux
        dispatch(updateProfileField({
          field: imageType,
          value: data.imageUrl,
        }));

        Alert.alert('✅ Thành công', 'Đã cập nhật ảnh!');
        navigation.goBack();
      } else {
        throw new Error(data.error || 'Upload thất bại');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('❌ Lỗi', 'Không thể upload ảnh. Vui lòng thử lại!');
    } finally {
      setUploading(false);
    }
  };

  // Xóa ảnh hiện tại
  const deleteImage = async () => {
    Alert.alert(
      '🗑️ Xóa ảnh',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);

              // Xóa trên server
              await apiFetch(`${BASE_URL}/delete-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: profile.uid,
                  imageType: imageType,
                  imageUrl: currentImage,
                }),
              });

              // Cập nhật local
              dispatch(updateProfileField({
                field: imageType,
                value: '',
              }));

              setSelectedImage(null);
              Alert.alert('✅', 'Đã xóa ảnh!');
            } catch (error) {
              Alert.alert('❌', 'Không thể xóa ảnh!');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {imageType === 'avatar' ? 'Chỉnh sửa Avatar' : 'Chỉnh sửa Ảnh bìa'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Preview Image */}
      <View style={styles.previewContainer}>
        <Image
          source={
            selectedImage
              ? { uri: selectedImage.uri }
              : currentImage
              ? { uri: currentImage }
              : defaultImage
          }
          style={
            imageType === 'avatar'
              ? styles.avatarPreview
              : styles.coverPreview
          }
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.gradientBtn}
          >
            <MaterialIcons name="photo-library" size={24} color="#fff" />
            <Text style={styles.buttonText}>Chọn từ thư viện</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.gradientBtn}
          >
            <MaterialIcons name="camera-alt" size={24} color="#fff" />
            <Text style={styles.buttonText}>Chụp ảnh mới</Text>
          </LinearGradient>
        </TouchableOpacity>

        {currentImage && (
          <TouchableOpacity style={styles.actionButton} onPress={deleteImage}>
            <LinearGradient
              colors={['#ff4444', '#cc0000']}
              style={styles.gradientBtn}
            >
              <MaterialIcons name="delete" size={24} color="#fff" />
              <Text style={styles.buttonText}>Xóa ảnh</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Save Button */}
      {selectedImage && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={uploadImage}
          disabled={uploading}
        >
          <LinearGradient
            colors={['#11998e', '#38ef7d']}
            style={styles.saveGradient}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={24} color="#fff" />
                <Text style={styles.saveText}>Lưu thay đổi</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarPreview: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#fff',
  },
  coverPreview: {
    width: '90%',
    height: 200,
    borderRadius: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    borderRadius: 15,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
