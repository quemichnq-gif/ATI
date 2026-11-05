import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '../../services/apiClient';
import { API } from '../../config/api';

const { width } = Dimensions.get('window');

export default function DetailedCompatibilityScreen({ navigation, route }) {
  const myProfile = useSelector((state) => state.profile);
  const partnerId = route?.params?.uid;
  
  const [analysis, setAnalysis] = useState('');
  const [scores, setScores] = useState({
    compatibility_score: 0,
    love_score: 0,
    trust_score: 0,
    communication_score: 0,
    marriage_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    if (!partnerId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đối phương');
      navigation.goBack();
      return;
    }
    console.log('🔍 Fetching compatibility for:', myProfile.uid, '→', partnerId);
    fetchCompatibilityAnalysis();
  }, []);

  const fetchCompatibilityAnalysis = async () => {
    try {
      setLoading(true);

      const requestData = {
        myUid: myProfile.uid,
        partnerUid: partnerId,
      };

      console.log('📤 API Request:', API.compatibilityAnalysis);
      console.log('📦 Request Data:', requestData);

      const response = await apiClient.post(API.compatibilityAnalysis, requestData);

      console.log('📥 API Response:', response.data);

      if (response.data) {
        setAnalysis(response.data.analysis);
        setScores({
          compatibility_score: response.data.compatibility_score || 0,
          love_score: response.data.love_score || 0,
          trust_score: response.data.trust_score || 0,
          communication_score: response.data.communication_score || 0,
          marriage_score: response.data.marriage_score || 0,
        });
        setCached(response.data.cached || false);
      }
    } catch (error) {
      console.error('❌ Error fetching compatibility analysis:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Xử lý lỗi 429 (Rate Limit)
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 60;
        Alert.alert(
          'Vui lòng đợi',
          `Hệ thống đang quá tải. Vui lòng thử lại sau ${retryAfter} giây.`,
          [
            { text: 'Quay lại', onPress: () => navigation.goBack() },
            { 
              text: `Thử lại (${retryAfter}s)`, 
              onPress: () => {
                setTimeout(() => {
                  fetchCompatibilityAnalysis();
                }, retryAfter * 1000);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Lỗi',
          'Không thể tải phân tích. Vui lòng thử lại sau.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    if (score >= 40) return '#fb923c';
    return '#ef4444';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return 'heart';
    if (score >= 60) return 'heart-half';
    return 'heart-outline';
  };

  const getSectionIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('tổng quan')) {
      return { name: 'people-outline', color: '#ff7bbf' };
    } else if (lowerTitle.includes('cảm xúc')) {
      return { name: 'heart-outline', color: '#f472b6' };
    } else if (lowerTitle.includes('giao tiếp') || lowerTitle.includes('tư duy')) {
      return { name: 'chatbubbles-outline', color: '#c084fc' };
    } else if (lowerTitle.includes('tình yêu') || lowerTitle.includes('lãng mạn')) {
      return { name: 'heart-circle-outline', color: '#fb7185' };
    } else if (lowerTitle.includes('cam kết') || lowerTitle.includes('hôn nhân')) {
      return { name: 'infinite-outline', color: '#fbbf24' };
    } else if (lowerTitle.includes('thách thức') || lowerTitle.includes('xung đột')) {
      return { name: 'warning-outline', color: '#f97316' };
    } else if (lowerTitle.includes('điểm mạnh')) {
      return { name: 'trophy-outline', color: '#34d399' };
    } else if (lowerTitle.includes('lời khuyên')) {
      return { name: 'bulb-outline', color: '#60a5fa' };
    }
    return { name: 'star-outline', color: '#ff7bbf' };
  };

  const formatAnalysis = (text) => {
    let cleanedText = text.replace(/\*/g, '');
    const sections = cleanedText.split(/\n\n+/);
    
    return sections.map((section, index) => {
      const isNumberedTitle = section.match(/^(\d+\.)\s*(.+?)(:)?$/m);
      
      if (isNumberedTitle) {
        const title = isNumberedTitle[2].trim();
        const contentMatch = section.match(/^(\d+\.)\s*(.+?)(:)?\n\n?([\s\S]*)/);
        const content = contentMatch ? contentMatch[4].trim() : '';
        const icon = getSectionIcon(title);
        
        return (
          <View key={index} style={styles.section}>
            <LinearGradient
              colors={['rgba(255, 123, 191, 0.15)', 'rgba(179, 109, 255, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleContainer}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={icon.name} size={22} color={icon.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: icon.color }]}>{title}</Text>
            </LinearGradient>
            {content && <Text style={styles.sectionContent}>{content}</Text>}
          </View>
        );
      } else if (section.trim() && !section.match(/^\d+\./)) {
        return (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionContent}>{section.trim()}</Text>
          </View>
        );
      }
      return null;
    }).filter(Boolean);
  };

  const renderScoreCard = (label, score, icon) => (
    <View style={styles.scoreCard}>
      <View style={styles.scoreIconWrapper}>
        <Ionicons name={icon} size={24} color={getScoreColor(score)} />
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
        {score}%
      </Text>
      <View style={styles.scoreBarContainer}>
        <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: getScoreColor(score) }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#ff7bbf', '#b36dff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>
            {cached ? 'Đang tải phân tích...' : 'AI đang phân tích độ tương hợp...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            Quá trình này có thể mất vài giây
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#ff7bbf', '#b36dff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Phân tích tương hợp</Text>
        
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Cards */}
        <View style={styles.scoresContainer}>
          <Text style={styles.scoresTitle}>Chỉ số tương hợp</Text>
          
          {/* Main Score */}
          <View style={styles.mainScoreCard}>
            <LinearGradient
              colors={['rgba(255, 123, 191, 0.2)', 'rgba(179, 109, 255, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainScoreGradient}
            >
              <Ionicons 
                name={getScoreIcon(scores.compatibility_score)} 
                size={48} 
                color={getScoreColor(scores.compatibility_score)} 
              />
              <Text style={styles.mainScoreLabel}>Tổng thể</Text>
              <Text style={[styles.mainScoreValue, { color: getScoreColor(scores.compatibility_score) }]}>
                {scores.compatibility_score}%
              </Text>
            </LinearGradient>
          </View>

          {/* Detail Scores Grid */}
          <View style={styles.scoreGrid}>
            {renderScoreCard('Tình yêu', scores.love_score, 'heart')}
            {renderScoreCard('Tin tưởng', scores.trust_score, 'shield-checkmark')}
            {renderScoreCard('Giao tiếp', scores.communication_score, 'chatbubbles')}
            {renderScoreCard('Hôn nhân', scores.marriage_score, 'infinite')}
          </View>

          {cached && (
            <View style={styles.cacheBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
              <Text style={styles.cacheBadgeText}>Đã lưu</Text>
            </View>
          )}
        </View>

        {/* Analysis Content */}
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisHeader}>Phân tích chi tiết</Text>
          {formatAnalysis(analysis)}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="sparkles" size={16} color="#ff7bbf" />
          <Text style={styles.footerText}>
            Phân tích được tạo bởi AI dựa trên thông tin chiêm tinh học
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  scoresContainer: {
    marginBottom: 32,
  },
  scoresTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  mainScoreCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  mainScoreGradient: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  mainScoreLabel: {
    fontSize: 16,
    color: '#ddd',
    marginTop: 12,
    fontWeight: '600',
  },
  mainScoreValue: {
    fontSize: 48,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -1,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  scoreCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  scoreIconWrapper: {
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  scoreBarContainer: {
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  cacheBadgeText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  analysisContainer: {
    gap: 16,
  },
  analysisHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#ff7bbf',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 123, 191, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    flex: 1,
    letterSpacing: 0.3,
  },
  sectionContent: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 26,
    paddingLeft: 0,
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingTop: 24,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
