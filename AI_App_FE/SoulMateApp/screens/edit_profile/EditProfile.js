import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfileField, resetProfile } from '../my_profile/profileSlice';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { BASE_URL } from '../../config/api';
import { apiFetch } from '../../services/apiClient';

export default function EditProfile({ navigation, route }) {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);
  const { editType } = route.params || {}; // 'personal' hoặc 'security'

  const [loading, setLoading] = useState(false);

  // State cho Personal Info
  const [name, setName] = useState(profile.name || '');
  const [age, setAge] = useState(profile.age || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [height, setHeight] = useState(profile.height?.toString() || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  const [job, setJob] = useState(profile.job || '');

  // State cho Security Info
  const [email, setEmail] = useState(profile.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form với các giới hạn hợp lý
  const validatePersonalInfo = () => {
    // Tên: không được rỗng, chỉ chứa chữ cái, khoảng trắng, dấu tiếng Việt
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return false;
    }
    if (name.trim().length < 2) {
      Alert.alert('Lỗi', 'Tên phải có ít nhất 2 ký tự');
      return false;
    }
    if (name.trim().length > 50) {
      Alert.alert('Lỗi', 'Tên không được quá 50 ký tự');
      return false;
    }
    // Kiểm tra tên chỉ chứa chữ cái và khoảng trắng
    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(name.trim())) {
      Alert.alert('Lỗi', 'Tên chỉ được chứa chữ cái');
      return false;
    }

    // Tuổi: 1-120
    if (age && (isNaN(age) || parseInt(age) < 1 || parseInt(age) > 120)) {
      Alert.alert('Lỗi', 'Tuổi không hợp lệ (1-120)');
      return false;
    }

    // Chiều cao: 0.5m - 3.0m (50cm - 300cm)
    if (height) {
      const heightNum = parseFloat(height);
      if (isNaN(heightNum) || heightNum < 0.5 || heightNum > 3.0) {
        Alert.alert('Lỗi', 'Chiều cao không hợp lệ (0.5m - 3.0m)');
        return false;
      }
      // Kiểm tra số thập phân không quá 2 chữ số
      if (height.includes('.') && height.split('.')[1].length > 2) {
        Alert.alert('Lỗi', 'Chiều cao chỉ được nhập tối đa 2 số thập phân');
        return false;
      }
    }

    // Cân nặng: 20kg - 300kg
    if (weight) {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
        Alert.alert('Lỗi', 'Cân nặng không hợp lệ (20kg - 300kg)');
        return false;
      }
      // Kiểm tra số thập phân không quá 1 chữ số
      if (weight.includes('.') && weight.split('.')[1].length > 1) {
        Alert.alert('Lỗi', 'Cân nặng chỉ được nhập tối đa 1 số thập phân');
        return false;
      }
    }

    // Giới tính: phải chọn
    if (!gender) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính');
      return false;
    }

    // Công việc: tối đa 100 ký tự
    if (job && job.trim().length > 100) {
      Alert.alert('Lỗi', 'Công việc không được quá 100 ký tự');
      return false;
    }

    return true;
  };

  const validateSecurityInfo = () => {
    // Email: phải đúng định dạng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return false;
    }

    // Nếu đổi mật khẩu
    if (newPassword || currentPassword || confirmPassword) {
      // Phải nhập đủ 3 trường
      if (!currentPassword) {
        Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
        return false;
      }
      if (!newPassword) {
        Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
        return false;
      }
      if (!confirmPassword) {
        Alert.alert('Lỗi', 'Vui lòng xác nhận mật khẩu mới');
        return false;
      }

      // Mật khẩu mới phải có ít nhất 6 ký tự
      if (newPassword.length < 6) {
        Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
        return false;
      }

      // Mật khẩu mới không được quá 50 ký tự
      if (newPassword.length > 50) {
        Alert.alert('Lỗi', 'Mật khẩu mới không được quá 50 ký tự');
        return false;
      }

      // Mật khẩu mới phải khác mật khẩu cũ
      if (newPassword === currentPassword) {
        Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
        return false;
      }

      // Xác nhận mật khẩu phải khớp
      if (newPassword !== confirmPassword) {
        Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
        return false;
      }
    }

    return true;
  };

  // Xử lý input chỉ cho phép số và dấu chấm
  const handleHeightChange = (text) => {
    // Chỉ cho phép số và 1 dấu chấm
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Không cho phép nhiều hơn 1 dấu chấm
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setHeight(cleaned);
  };

  const handleWeightChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setWeight(cleaned);
  };

  const handleAgeChange = (text) => {
    // Chỉ cho phép số nguyên
    const cleaned = text.replace(/[^0-9]/g, '');
    setAge(cleaned);
  };

  // Hàm logout đúng cách
  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(resetProfile());
      navigation.replace('LoginScreen');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
    }
  };

  // Handle Save
  const handleSave = async () => {
    setLoading(true);

    try {
      if (editType === 'personal') {
        if (!validatePersonalInfo()) {
          setLoading(false);
          return;
        }

        const updatedFields = {
          name: name.trim(),
          age: age ? parseInt(age) : null,
          gender: gender.trim(),
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          job: job.trim(),
        };

        // Gọi API để cập nhật
        const response = await apiFetch(`${BASE_URL}/update-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: profile.uid,
            fields: updatedFields,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Cập nhật từng field
          Object.entries(updatedFields).forEach(([field, value]) => {
            dispatch(updateProfileField({ field, value }));
          });
          Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
          navigation.goBack();
        } else {
          Alert.alert('Lỗi', result.error || 'Không thể cập nhật');
        }
      } else {
        // Security Info
        if (!validateSecurityInfo()) {
          setLoading(false);
          return;
        }

        // Nếu đổi mật khẩu, xác thực mật khẩu hiện tại trước
        if (newPassword || email.trim() !== profile.email) {
          try {
            const verifyResponse = await apiFetch(`${BASE_URL}/verify-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: profile.email, // Email hiện tại
                password: currentPassword,
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (!verifyResult.success) {
              Alert.alert('Lỗi', 'Mật khẩu hiện tại không đúng');
              setLoading(false);
              return;
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xác thực mật khẩu');
            setLoading(false);
            return;
          }
        }

        const updatedFields = { email: email.trim() };
        
        // Thêm mật khẩu mới nếu có
        if (newPassword) {
          updatedFields.password = newPassword;
        }

        const response = await apiFetch(`${BASE_URL}/update-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: profile.uid,
            fields: updatedFields,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Chỉ cập nhật email vào Redux (không cập nhật password)
          dispatch(updateProfileField({ field: 'email', value: updatedFields.email }));

          // Nếu đổi email hoặc mật khẩu, bắt buộc đăng xuất
          if (result.authUpdated) {
            Alert.alert(
              'Thành công',
              'Đã cập nhật thông tin bảo mật. Vui lòng đăng nhập lại với thông tin mới.',
              [
                {
                  text: 'OK',
                  onPress: handleLogout, 
                },
              ],
              { cancelable: false }
            );
          } else {
            Alert.alert('Thành công', 'Đã cập nhật thông tin bảo mật');
            navigation.goBack();
          }
        } else {
          Alert.alert('Lỗi', result.error || 'Không thể cập nhật');
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render Personal Info Form
  const renderPersonalForm = () => (
    <>
      <View style={styles.inputGroup}>
        <MaterialIcons name="badge" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Tên *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên của bạn"
            placeholderTextColor="#666"
            maxLength={50}
          />
          <Text style={styles.helperText}>Chỉ chữ cái, 2-50 ký tự</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="cake" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Tuổi</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={handleAgeChange}
            placeholder="Nhập tuổi (1-120)"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.helperText}>Từ 1 đến 120</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="wc" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Giới tính *</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'Nam' && styles.genderButtonActive]}
              onPress={() => setGender('Nam')}
            >
              <Text style={[styles.genderText, gender === 'Nam' && styles.genderTextActive]}>
                Nam
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'Nữ' && styles.genderButtonActive]}
              onPress={() => setGender('Nữ')}
            >
              <Text style={[styles.genderText, gender === 'Nữ' && styles.genderTextActive]}>
                Nữ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'Khác' && styles.genderButtonActive]}
              onPress={() => setGender('Khác')}
            >
              <Text style={[styles.genderText, gender === 'Khác' && styles.genderTextActive]}>
                Khác
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="straighten" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Chiều cao (m)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={handleHeightChange}
            placeholder="Ví dụ: 1.70"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            maxLength={4}
          />
          <Text style={styles.helperText}>Từ 0.5m đến 3.0m (vd: 1.75)</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="fitness-center" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={handleWeightChange}
            placeholder="Ví dụ: 65.5"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            maxLength={5}
          />
          <Text style={styles.helperText}>Từ 20kg đến 300kg</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="work" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Công việc</Text>
          <TextInput
            style={styles.input}
            value={job}
            onChangeText={setJob}
            placeholder="Nhập công việc"
            placeholderTextColor="#666"
            maxLength={100}
          />
          <Text style={styles.helperText}>Tối đa 100 ký tự</Text>
        </View>
      </View>
    </>
  );

  // Render Security Info Form
  const renderSecurityForm = () => (
    <>
      <View style={styles.inputGroup}>
        <MaterialIcons name="email" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Nhập email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>Email hợp lệ</Text>
        </View>
      </View>

      <View style={styles.sectionDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Đổi mật khẩu (tùy chọn)</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="lock" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập mật khẩu hiện tại"
              placeholderTextColor="#666"
              secureTextEntry={!showCurrentPassword}
              maxLength={50}
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <MaterialIcons
                name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="lock-outline" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Mật khẩu mới</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor="#666"
              secureTextEntry={!showNewPassword}
              maxLength={50}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <MaterialIcons
                name={showNewPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Ít nhất 6 ký tự</Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <MaterialIcons name="lock-outline" size={22} color="#ff7bbf" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="#666"
              secureTextEntry={!showConfirmPassword}
              maxLength={50}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={['#ff7bbf', '#b36dff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editType === 'personal' ? 'Chỉnh sửa thông tin' : 'Chỉnh sửa bảo mật'}
        </Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Form */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formWrapper}>
          <LinearGradient
            colors={['#ff7bbf', '#b36dff', '#ff7bbf']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.formContainer}>
              {editType === 'personal' ? renderPersonalForm() : renderSecurityForm()}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButtonWrapper}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={loading}
        >
          <LinearGradient
            colors={['#ff7bbf', '#b36dff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formWrapper: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2,
    shadowColor: '#ff7acb',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  formContainer: {
    backgroundColor: '#000',
    borderRadius: 14,
    padding: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  inputIcon: {
    marginTop: 28,
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  helperText: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: 'rgba(255, 123, 191, 0.2)',
    borderColor: '#ff7bbf',
  },
  genderText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#ff7bbf',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonWrapper: {
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#ff7acb',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
