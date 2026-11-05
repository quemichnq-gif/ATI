import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { getVietnameseDate } from "../../utils/date";
import { ELEMENT_MAP, ELEMENT_COLORS, ZODIAC_ICONS } from '../../constants/astrologyMap';
import useAstroAPI from '../../hook/useAstroAPI';
import { auth } from "../../config/firebaseConfig";
import { loadUserProfile } from "../../services/profileLoader";
import { openDirectChat } from "../../services/chatService";
import { BASE_URL } from '../../config/api';
import { apiFetch } from '../../services/apiClient';

const { width } = Dimensions.get('window');


export default function HomeScreen({ navigation }) {
  const [scope, setScope] = useState('astro');
  const [loveMetrics, setLoveMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Load user profile
  useEffect(() => {
    dispatch(loadUserProfile());
  }, []);

  const profile = useSelector((state) => state.profile);
  const { generatePrediction, generateLoveMetrics } = useAstroAPI();

  const element = ELEMENT_MAP[profile.sun] || '...';
  const elementColors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];
  const zodiacIcon = ZODIAC_ICONS[profile.sun] || ZODIAC_ICONS['Không xác định'];

  // Love metrics
  useEffect(() => {
    if (profile.uid && profile.sun && profile.moon) {
      const timer = setTimeout(() => {
        handleLoveMetrics();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      console.log("Profile chưa sẵn sàng:");
    }
  }, [profile]);

  const openChatRoom = async (person) => {
    const result = await openDirectChat(profile.uid, profile.name, person);
    if (!result) return;
  
    navigation.navigate("ChatRoomScreen", {
      chatId: result.id,
      chatName: result.chatName,
    });
  };
  

  const [currentDate, setCurrentDate] = useState(getVietnameseDate("today"));
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(getVietnameseDate("today"));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleGeneratePrediction = () => {
    const userData = {
      uid: profile.uid,
      name: profile.name,
      sun: profile.sun,
      moon: profile.moon,
      birthDate: profile.birthDate,
    };
    generatePrediction(userData, navigation);
  };

  const handleLoveMetrics = async () => {
    setLoading(true);
    const userData = {
      uid: profile.uid,
      name: profile.name,
      sun: profile.sun,
      moon: profile.moon,
      birthDate: profile.birthDate,
    };
    const data = await generateLoveMetrics(userData);
    if (data) setLoveMetrics(data);
    setLoading(false);
  };
  console.log("🔥 Firebase UID:", auth.currentUser?.uid);



  // LOAD 5 NGƯỜI TƯƠNG HỢP ĐÃ LƯU TRONG FIRESTORE
  // LOAD 5 NGƯỜI GREENFLAG – nếu không có thì gọi AI để tạo luôn
  const [fiveMatches, setFiveMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    async function loadGreenFlag() {
      if (!profile.uid) return;

      try {
        setLoadingMatches(true);

        // CHECK DB
        const cachedRes = await apiFetch(
          `${BASE_URL}/love-matching/history/${profile.uid}/greenflag`
        );
        const cached = await cachedRes.json();

        console.log("💚 GREENFLAG HISTORY:", cached);

        //Nếu có users → dùng DB
        if (cached.success && cached.users && cached.users.length > 0) {
          console.log("⚡ Dùng dữ liệu DB (GreenFlag)");
          setFiveMatches(cached.users);
          setLoadingMatches(false);
          return;
        }

        // KHÔNG CÓ DB → GỌI AI
        console.log("🤖 Không có DB → Gọi AI để tạo GreenFlag");

        const aiRes = await apiFetch(
          `${BASE_URL}/love-matching/greenflag`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: profile.uid })
          }
        );

        const aiJson = await aiRes.json();
        console.log("🤖 AI RESULT:", aiJson);

        if (aiJson.success && aiJson.users) {
          setFiveMatches(aiJson.users);
        } else {
          setFiveMatches([]);
        }

      } catch (err) {
        console.log("💥 Lỗi load greenflag:", err);
      } finally {
        setLoadingMatches(false);
      }
    }

    loadGreenFlag();
  }, [profile.uid]);


  return (
    <ImageBackground
      source={require('../../assets/background/homebg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>{currentDate}</Text>
          <Text style={styles.welcome}>Xin Chào, {profile.name || 'bạn'}</Text>
        </View>

        {/* Segment */}
        <View style={styles.segmentContainer}>
          <View style={styles.segmentBg}>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setScope('astro')}
              style={[styles.segmentItem, scope === 'astro' && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, scope === 'astro' && styles.segmentTextActive]}>
                Chiêm tinh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setScope('love')}
              style={[styles.segmentItem, scope === 'love' && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, scope === 'love' && styles.segmentTextActive]}>
                Tình Duyên
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Nội dung */}
        {scope === 'astro' ? (
          <>
            {/* Zodiac info */}
            <View style={styles.zodiacBox}>

              <View style={styles.row}>
                <Text style={styles.infoText}>
                  <Text style={{ fontSize: 14, color: '#a8a8a8' }}>Mặt trời{'\n'}</Text>
                  <Text style={{ fontSize: 20 }}>{profile.sun || '...'}</Text>
                </Text>

                <Text style={styles.infoText}>
                  <Text style={{ fontSize: 14, color: '#a8a8a8' }}>Mặt trăng{'\n'}</Text>
                  <Text style={{ fontSize: 20 }}>{profile.moon || '...'}</Text>
                </Text>
              </View>

              <View style={styles.centerCircle}>
                <View style={styles.outerRing} />
                <View style={styles.innerRing} />
                <View style={styles.topinnerRing} />
                <View style={styles.middleRing} />

                <LinearGradient
                  colors={elementColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  locations={[0, 0.8]}
                  style={styles.circleGradient}
                >
                  <Image source={zodiacIcon} style={styles.zodiacIcon} resizeMode="contain" />
                </LinearGradient>
              </View>

              <View style={styles.row}>
                <Text style={styles.infoText}>
                  <Text style={{ fontSize: 14, color: '#a8a8a8' }}>Điểm mọc{'\n'}</Text>
                  <Text style={{ fontSize: 20 }}>{profile.ascendant || '...'}</Text>
                </Text>

                <Text style={styles.infoText}>
                  <Text style={{ fontSize: 14, color: '#a8a8a8' }}>Nguyên tố{'\n'}</Text>
                  <Text style={{ fontSize: 20 }}>{element}</Text>
                </Text>
              </View>

            </View>

            <TouchableOpacity style={styles.button} onPress={handleGeneratePrediction}>
              <LinearGradient
                colors={elementColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Dự đoán</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Widgets */}
            <View style={styles.loveRow}>
              <LinearGradient
                colors={['rgba(255, 154, 201, 0.2)', 'rgba(179, 109, 255, 0.2)']}
                style={styles.loveBox}
              >
                <Ionicons
                  name="heart"
                  size={35}
                  color="rgba(255, 182, 217, 0.8)"
                  style={styles.loveIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.loveTitle}>Tình duyên</Text>

                  <View style={styles.loveBarBackground}>
                    <LinearGradient
                      colors={['#ffb6d9', '#b36dff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.loveBarFill,
                        { width: `${loveMetrics?.love_luck || 0}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.lovePercent}>
                    {loveMetrics ? `${loveMetrics.love_luck}%` : '...'}
                  </Text>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['rgba(255, 154, 201, 0.2)', 'rgba(179, 109, 255, 0.2)']}
                style={styles.matchBox}
              >
                <Text style={styles.matchTitle}>Cung hợp</Text>
                <View style={styles.matchContent}>
                  <Image
                    source={
                      ZODIAC_ICONS[loveMetrics?.best_match] ||
                      ZODIAC_ICONS['Không xác định']
                    }
                    style={styles.matchAvatar}
                  />
                  <View>
                    <Text style={styles.matchName}>
                      {loveMetrics?.best_match || '—'}
                    </Text>
                    <Text style={styles.matchPercent}>
                      {loveMetrics ? `${loveMetrics.compatibility}%` : '...'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/*Quote */}
            <View style={styles.quoteBox}>
              <LinearGradient
                colors={['rgba(255, 154, 201, 0.2)', 'rgba(179, 109, 255, 0.2)']}
                style={styles.quoteGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.quoteText}>
                    {loveMetrics?.quote ||
                      'Đang đọc năng lượng vũ trụ của bạn...'}
                  </Text>
                )}
              </LinearGradient>
            </View>
          </>
        )}

        {/* TƯƠNG HỢP */}
        <View style={styles.compatibilitySection}>
          <Text style={styles.sectionTitle}>Tương hợp</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>

            {loadingMatches ? (
              <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 20 }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', marginTop: 10 }}>Đang tải dữ liệu...</Text>
              </View>
            ) : fiveMatches && fiveMatches.length > 0 ? (

              fiveMatches.map((item, index) => (
                <TouchableOpacity
                key={index}
                style={styles.glassBox}
                onPress={() => openChatRoom(item)}
              >
                <Image
                  source={
                    item.avatar
                      ? { uri: item.avatar }
                      : require("../../assets/default_avatar.jpg")
                  }
                  style={styles.glassImage}
                />

                <View style={styles.glassInfo}>
                  <Text style={styles.glassName}>{item.name}</Text>
                  <Text style={styles.glassZodiac}>{item.zodiac}</Text>
                </View>
              </TouchableOpacity>
              ))
            ) : (
              <View style={{ justifyContent: "center", alignItems: "center", marginRight: 20 }}>
                <Text style={{ color: "#fff", opacity: 0.7 }}>Chưa có dữ liệu tương hợp</Text>
                <Text style={{ color: "#ccc", fontSize: 12 }}>Hãy thử xem tương hợp trong mục Tình Duyên</Text>
              </View>
            )}

            {/* Nút xem thêm */}
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate("LoveMatchSelectScreen")}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.exploreGradient}
              >
                <Ionicons name="arrow-forward" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>

        </View>

      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  moon: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 280,
    resizeMode: 'cover',
    opacity: 0.9,
  },
  background: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 120 },
  header: { bottom: 30, alignItems: 'center', marginTop: 130 },
  date: { color: '#dcdcdc', fontSize: 26, opacity: 0.8 },
  welcome: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  segmentContainer: { width: '70%', marginTop: 130, alignSelf: 'center' },
  segmentBg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 28,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(146,132,255,0.25)',
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: 'rgba(20,10,60,0.6)',
    borderWidth: 0.7,
    borderColor: '#8a82ff',
    shadowColor: '#8a82ff',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    opacity: 0.8,
  },
  segmentText: { color: '#bfb9d9', fontSize: 16, fontWeight: '600' },
  segmentTextActive: { color: '#ffffff' },

  zodiacBox: { width: '90%', alignSelf: 'center', alignItems: 'center', marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 40 },
  infoText: { color: '#fff', fontSize: 21, width: '30%', textAlign: 'center', lineHeight: 30 },
  centerCircle: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },

  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#83d2ff',
    borderRightColor: '#83d2ff',
    transform: [{ rotate: '35deg' }],
  },
  innerRing: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 102.5,
    borderWidth: 2,
    borderColor: 'transparent',
    borderBottomColor: '#83d2ff',
    borderRightColor: '#83d2ff',
    transform: [{ rotate: '20deg' }],
  },
  topinnerRing: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 102.5,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#83d2ff',
    transform: [{ rotate: '-30deg' }],
  },
  middleRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#83d2ff',
    transform: [{ rotate: '-95deg' }],
  },

  compatibilitySection: {
    width: '100%',
    marginTop: 60,
    paddingLeft: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20,
  },

  glassBox: {
    width: 180,
    height: 230,
    marginRight: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(200, 120, 255, 0.6)',
    justifyContent: 'flex-start',
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: "center",
    shadowColor: '#b36dff',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  glassImage: {
    width: 150,
    height: 150,
    borderRadius: 15,
    resizeMode: 'cover',
  },

  glassInfo: {
    marginTop: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  glassName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  glassZodiac: {
    color: '#d8d8d8',
    fontSize: 13,
    marginTop: 2,
  },

  exploreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 25,
  },
  exploreGradient: {
    width: 65,
    height: 65,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7acb',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },

  zodiacIcon: { width: 90, height: 90, tintColor: '#fff', opacity: 0.95 },
  circleGradient: {
    width: 130,
    height: 130,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: { marginTop: 0 },
  buttonGradient: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  loveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginTop: 60,
  },
  loveBox: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
  },
  loveIcon: { marginRight: 10 },
  loveTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  loveBarBackground: {
    width: '100%',
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  loveBarFill: { height: '100%', borderRadius: 10 },
  lovePercent: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 5, textAlign: 'right' },

  matchBox: {
    width: '48%',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  matchTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  matchContent: { flexDirection: 'row', alignItems: 'center' },
  matchAvatar: { width: 55, height: 55, borderRadius: 28, marginRight: 15 },
  matchName: { color: '#fff', fontSize: 17, fontWeight: '600' },
  matchPercent: { color: '#ffb6d9', fontSize: 15 },

  quoteBox: { width: '90%', alignSelf: 'center', marginTop: 20, marginBottom: 20, alignItems: 'center' },
  quoteGradient: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quoteText: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.9,
  },
});
