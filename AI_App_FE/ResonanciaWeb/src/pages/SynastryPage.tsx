import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState } from '../store';
import { apiGenerate } from '../services/api';
import { ELEMENT_MAP, ELEMENT_COLORS } from '../constants/astrologyMap';
import UiIcon from '../components/UiIcon';

const ZODIAC_SIGNS = [
  'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ',
  'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
];

const ZODIAC_SYMBOLS: Record<string, string> = {
  'Bạch Dương': '♈', 'Kim Ngưu': '♉', 'Song Tử': '♊', 'Cự Giải': '♋',
  'Sư Tử': '♌', 'Xử Nữ': '♍', 'Thiên Bình': '♎', 'Bọ Cạp': '♏',
  'Nhân Mã': '♐', 'Ma Kết': '♑', 'Bảo Bình': '♒', 'Song Ngư': '♓'
};

interface SynastryResult {
  overall: number;
  love: number;
  communication: number;
  passion: number;
  spiritual: number;
  summary: string;
  strengths: string;
  challenges: string;
  advice: string;
}

export default function SynastryPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const navigate = useNavigate();

  const [person2, setPerson2] = useState({
    name: '', sun: '', moon: '', ascendant: '', venus: '', mars: '',
  });
  const [result, setResult] = useState<SynastryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const element = ELEMENT_MAP[profile.sun || ''] || 'Không xác định';
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS['Không xác định'];

  const isFormValid = person2.name && person2.sun && person2.moon;

  const handleAnalyze = async () => {
    if (!isFormValid || !profile.uid) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiGenerate({
        userData: {
          uid: profile.uid,
          name: profile.name,
          sun: profile.sun,
          moon: profile.moon,
          ascendant: profile.ascendant,
          venus: profile.venus,
          mars: profile.mars,
          mercury: profile.mercury,
          birthDate: profile.birthDate,
        },
        category: 'synastry',
        day: new Date().toISOString().split('T')[0],
        // Pass person2 and full person1 data as extra context
        extra: {
          person2_name: person2.name,
          person2_sun: person2.sun,
          person2_moon: person2.moon,
          person2_ascendant: person2.ascendant,
          person2_venus: person2.venus,
          person2_mars: person2.mars,
          person1_ascendant: profile.ascendant,
          person1_venus: profile.venus,
          person1_mars: profile.mars,
          person1_mercury: profile.mercury,
        }
      } as any);

      // Parse kết quả JSON hoặc fallback
      const text = res.data?.prediction || '';
      try {
        const cleaned = text.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}');
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed.overall === 'number' && parsed.summary) {
          setResult(parsed);
        } else {
          setResult(buildFallbackResult(profile.sun || '', person2.sun, text));
        }
      } catch {
        // Tạo kết quả từ text
        setResult(buildFallbackResult(profile.sun || '', person2.sun, text));
      }
    } catch {
      setResult(buildFallbackResult(profile.sun || '', person2.sun, ''));
    } finally {
      setLoading(false);
    }
  };

  function buildFallbackResult(sun1: string, sun2: string, aiText: string): SynastryResult {
    const ELEMENTS: Record<string, string> = {
      'Bạch Dương': 'fire', 'Sư Tử': 'fire', 'Nhân Mã': 'fire',
      'Kim Ngưu': 'earth', 'Xử Nữ': 'earth', 'Ma Kết': 'earth',
      'Song Tử': 'air', 'Thiên Bình': 'air', 'Bảo Bình': 'air',
      'Cự Giải': 'water', 'Bọ Cạp': 'water', 'Song Ngư': 'water',
    };
    const e1 = ELEMENTS[sun1] || 'fire';
    const e2 = ELEMENTS[sun2] || 'earth';

    const p1Name = profile.name || 'Bạn';
    const p2Name = person2.name || 'Người thứ hai';

    const ascContext = (profile.ascendant || person2.ascendant)
      ? ` Cung Mọc ${profile.ascendant || 'đối ngoại'} và ${person2.ascendant || 'ấn tượng'} tạo nên sự thu hút đặc biệt trong ánh nhìn ban đầu, mở lối cho hai người cùng bước vào thế giới của nhau.`
      : '';

    const venusContext = (profile.venus || person2.venus)
      ? ` Ngôn ngữ yêu thương của Sao Kim ${profile.venus || 'cá nhân'} kết hợp cùng ${person2.venus || 'đối phương'} mang đến phong cách gắn kết tinh tế và sự nồng ấm trong từng cử chỉ quan tâm.`
      : '';

    const pair = [e1, e2].sort().join('-');
    const ARCHETYPES: Record<string, { base: number; love: number; comm: number; passion: number; spirit: number; summary: string; strengths: string; challenges: string; advice: string }> = {
      'fire-fire': {
        base: 85, love: 83, comm: 80, passion: 96, spirit: 79,
        summary: `Mối quan hệ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là cuộc hội ngộ rực rỡ của hai ngọn đuốc cùng bừng sáng giữa bầu trời đêm. Cả hai mang trong mình bản năng tiên phong, sự nồng nhiệt và khát vọng sống không giới hạn, tạo nên một kết nối tràn ngập năng lượng hành động. Đây không chỉ là sự hấp dẫn thể xác thông thường mà là cuộc gặp gỡ định mệnh thức tỉnh ngọn lửa nhiệt huyết bên trong mỗi người. Hai bạn luôn truyền cho nhau nguồn sinh khí dồi dào để cùng dấn thân vào những thử thách lớn lao của cuộc đời.${ascContext}`,
        strengths: `Điểm tựa vững chắc nhất của đôi bạn là sự thấu cảm tức thì về nhu cầu tự do và tính độc lập của đối phương. Tương tác cảm xúc giữa Mặt Trăng ${profile.moon || sun1} của ${p1Name} và Mặt Trăng ${person2.moon || sun2} của ${p2Name} giúp cả hai cổ vũ nhau phục hồi tinh thần nhanh chóng sau những vấp váp mà không bị mắc kẹt trong nỗi buồn phiền.${venusContext} Sự chân thành, thẳng thắn và không toan tính giúp mối quan hệ luôn giữ được sự trong sáng, tươi trẻ và ngập tràn tiếng cười.`,
        challenges: `Vùng kích hoạt xung đột (triggers) xuất phát từ cái tôi quá lớn và tính hiếu thắng tự nhiên của hai cung Lửa. Khi xảy ra bất đồng quan điểm, cả hai đều dễ bị cuốn vào cuộc chiến chứng minh mình đúng thay vì tĩnh tâm lắng nghe cảm nhận của người kia. Sự thiếu kiên nhẫn và phản ứng bộc phát có thể vô tình để lại những vết thương cảm xúc sâu sắc. Nếu không kiểm soát ngọn lửa giận dữ, hai bạn có thể thiêu rụi chiếc cầu nối tình cảm chỉ vì những chuyện vụn vặt.`,
        advice: `Chìa khóa chuyển hóa vàng cho đôi bạn là học nghệ thuật nhường bước và chuyển hóa năng lượng cạnh tranh thành sự nâng đỡ vô điều kiện. ${p1Name} (${sun1}) cần học cách hạ bớt sự thống trị và lắng nghe nhịp thở cảm xúc của ${p2Name}; trong khi ${p2Name} (${sun2}) hãy chủ động chia sẻ những góc yếu đuối thay vì cố tỏ ra mạnh mẽ. Hãy cùng nhau kiến tạo những khoảng lặng tĩnh tại để lắng nghe chiều sâu tâm hồn, và luôn nhớ rằng sự dịu dàng không làm giảm đi bản lĩnh của ngọn lửa bên trong bạn.`,
      },
      'air-fire': {
        base: 90, love: 88, comm: 94, passion: 91, spirit: 85,
        summary: `Sự kết hợp giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) giống như ngọn lửa bùng cháy rực rỡ khi được làn gió tri thức tiếp thêm dưỡng khí dồi dào. Lửa mang lại cảm hứng hành động quyết liệt và trái tim quả cảm; trong khi Khí mở rộng tầm nhìn, đưa ra những ý tưởng đột phá và kích thích trí tuệ. Đôi bạn sinh ra như một cặp bài trùng lý tưởng để truyền cảm hứng và nâng tầm thế giới quan của nhau. Cuộc sống chung của hai bạn sẽ luôn ngập tràn những chuyến phiêu lưu mới mẻ và sự khám phá không ngừng nghỉ.${ascContext}`,
        strengths: `Giao tiếp là điểm sáng tuyệt đối khi các cuộc đối thoại giữa ${p1Name} và ${p2Name} dường như không bao giờ cạn kiệt đề tài. Thế giới cảm xúc nội tâm của Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} nâng đỡ nhau hài hòa, giúp cả hai vừa thấu hiểu lý trí vừa đồng điệu tâm hồn.${venusContext} ${p1Name} tìm thấy ở ${p2Name} một người bạn tri kỷ thông thái luôn biết cách làm dịu bớt sự nóng nảy, trong khi ${p2Name} bị cuốn hút bởi sự dũng cảm và tấm lòng hào sảng của ${p1Name}.`,
        challenges: `Điểm mù tâm lý là xu hướng bay bổng trên tầng ý tưởng mà thiếu đi sự bám rễ (grounding) vào hiện thực đời sống thực tế. Đôi khi Khí quá duy lý và khách quan, khiến ngọn lửa cảm xúc của Lửa cảm thấy bị hụt hẫng và lạnh lẽo. Ngược lại, sự đòi hỏi phản hồi tức thì và tính bộc phát của Lửa có thể khiến Khí cảm thấy ngột ngạt và muốn lùi lại phòng thủ. Khoảng cách giữa kỳ vọng tinh thần và trách nhiệm đời thường có thể tạo ra những rạn nứt âm thầm nếu không được nhìn nhận thẳng thắn.`,
        advice: `Hai bạn cần xây dựng những nghi thức gắn kết cảm xúc hữu hình thay vì chỉ dừng lại ở các cuộc trò chuyện tri thức bay bổng. Hãy mở lòng bày tỏ tình cảm mộc mạc không qua bộ lọc phân tích, trao cho đối phương những cử chỉ ấm áp cụ thể. Đồng thời, hãy kiên nhẫn cho nhau không gian tự do chiêm nghiệm mà không vội vàng phán xét hay nghi ngờ. Cùng nhau hoàn thành những mục tiêu thực tế chính là chiếc neo giữ ngọn lửa tình yêu luôn bền vững.`,
      },
      'earth-fire': {
        base: 74, love: 75, comm: 70, passion: 80, spirit: 72,
        summary: `Cuộc hội ngộ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là sự giao thoa sâu sắc giữa ngọn lửa đam mê và vùng đất vững chãi kiên định. Đây là mối liên kết mang tính kiến tạo phi thường: Lửa mang đến nhiệt huyết, sự táo bạo và tinh thần lạc quan; còn Đất cung cấp bệ phóng kiên cố, tính kỷ luật và sự bảo đảm thực tế. Cả hai tạo thành một liên minh có thể hiện thực hóa những hoài bão lớn nhất mà một người đơn độc không thể làm được. Mối duyên này dạy cho cả hai bài học về sự cân bằng giữa khát vọng và sự kiên trì.${ascContext}`,
        strengths: `Sự bù trừ năng lượng hoàn hảo giúp đôi bạn tạo nên một cuộc sống vừa phong phú vừa vững bền. Mặt Trăng ${profile.moon || sun1} tìm thấy điểm tựa bình yên nơi Mặt Trăng ${person2.moon || sun2}, xua tan những bất an vô thức.${venusContext} Lửa kéo Đất bước ra khỏi vùng an toàn để nắm bắt cơ hội bứt phá; ngược lại, Đất chính là mỏ neo định hình các nguồn năng lượng phân tán của Lửa thành những thành tựu cụ thể.`,
        challenges: `Xung đột nảy sinh từ sự lệch nhịp tự nhiên trong tốc độ sống: Lửa muốn hành động nhanh, ngẫu hứng và bộc phát; trong khi Đất đòi hỏi thời gian, kế hoạch bài bản và sự kiểm chứng thận trọng. ${p1Name} dễ rơi vào cảm giác bị kiềm hãm và tẻ nhạt, trong khi ${p2Name} cảm thấy kiệt sức trước sự bốc đồng và thiếu kiên định của đối phương. Khi cãi vã, tính bướng bỉnh của Đất gặp sự nóng nảy của Lửa có thể dẫn đến sự bế tắc kéo dài.`,
        advice: `Nghệ thuật đồng hành đòi hỏi cả hai phải tôn trọng sâu sắc nhịp điệu tự nhiên của nhau. ${p1Name} (${sun1}) hãy học bài học về sự nhẫn nại và thấu hiểu giá trị của sự tích lũy âm thầm từ ${p2Name}; trong khi ${p2Name} (${sun2}) hãy mở rộng lòng đón nhận những trải nghiệm mới mẻ và khích lệ lòng nhiệt thành của ${p1Name}. Hãy phân chia vai trò rõ ràng: để Lửa truyền cảm hứng dẫn đường và để Đất quản lý nền tảng thực thi bền vững.`,
      },
      'fire-water': {
        base: 70, love: 78, comm: 66, passion: 89, spirit: 77,
        summary: `Mối quan hệ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là sự gặp gỡ kỳ diệu giữa biển lửa rực cháy và đại dương sâu thẳm. Lực hút vô thức giữa hai thái cực vô cùng mãnh liệt, tạo nên một tình yêu nồng nàn, bí ẩn và có khả năng chuyển hóa tâm thức mạnh mẽ. Lửa bị mê hoặc bởi chiều sâu nội tâm huyền bí của Nước, còn Nước khao khát hơi ấm và sức sống bừng sáng từ Lửa. Đây là mối liên kết nghiệp quả sâu sắc giúp cả hai soi chiếu những góc khuất tâm hồn của nhau.${ascContext}`,
        strengths: `Khả năng khơi gợi những tầng cảm xúc sâu kín nhất mà hai bạn chưa từng bộc lộ với ai khác trong đời. Tương tác giữa Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} tạo ra sự cộng hưởng trực giác tinh tế khi cả hai thực sự tin tưởng nhau.${venusContext} Lửa truyền sự tự tin giúp Nước dũng cảm vượt qua nỗi sợ tổn thương; trong khi Nước dạy Lửa chạm vào lòng trắc ẩn, sự mềm mại và chiều sâu tâm linh vi mô.`,
        challenges: `Vùng kích hoạt vết thương (triggers) rất nhạy cảm và dễ bùng nổ: Lối biểu đạt bộc trực, thẳng thắn của Lửa dễ vô tình làm tổn thương tâm hồn mỏng manh của Nước. Ngược lại, sự im lặng thu mình hoặc phản ứng cảm xúc gián tiếp của Nước có thể dập tắt ngọn lửa nhiệt huyết của Lửa, gây ra sự ức chế tột cùng. Sự hiểu lầm về cách yêu thương có thể khiến hai bạn tự làm khổ nhau dù trong lòng luôn hướng về đối phương.`,
        advice: `Cần thiết lập ranh giới cảm xúc an toàn và học ngôn ngữ thấu cảm của đối phương. ${p1Name} (${sun1}) cần học cách hạ giọng, chậm lại một nhịp và lắng nghe với sự dịu dàng khi ${p2Name} có tâm trạng nhạy cảm; còn ${p2Name} (${sun2}) hãy dũng cảm nói thẳng cảm xúc và nhu cầu của mình thay vì kỳ vọng đối phương phải tự đoán qua sự im lặng. Khi Lửa biết dịu dàng và Nước biết cởi mở, tình yêu này sẽ trở thành nguồn sức mạnh chuyển hóa kỳ diệu.`,
      },
      'earth-earth': {
        base: 89, love: 87, comm: 85, passion: 79, spirit: 91,
        summary: `Sự kết hợp giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là sự gắn kết vững chắc của hai khối thạch bàn cùng dựng xây một vương quốc bền vững qua năm tháng. Mối quan hệ được nuôi dưỡng bởi lòng trung thành tuyệt đối, sự tin cậy, trách nhiệm và tính thực tế sâu sắc. Hai bạn tìm thấy ở nhau sự bình yên vững chãi, nơi mọi lời hứa đều mang giá trị vàng mười. Đây là hình mẫu lý tưởng của một mối quan hệ đồng hành dài hạn, kiên định trước mọi phong ba bão táp của cuộc đời.${ascContext}`,
        strengths: `Sự đồng thuận cao độ về hệ giá trị sống, quan niệm tài chính và mục tiêu tương lai giúp đôi bạn hiếm khi gặp mâu thuẫn lớn về định hướng. Sự tương thích cảm xúc giữa Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} mang lại cảm giác an tâm tuyệt đối, không có chỗ cho sự hoài nghi hay ghen tuông vô cớ.${venusContext} Cả hai đều có năng lực chăm sóc đối phương bằng những hành động thiết thực, chu đáo và xây dựng nền tảng vật chất ấm no.`,
        challenges: `Nguy cơ lớn nhất là mối quan hệ dễ bị cuốn vào vòng lặp thói quen khô khan, đơn điệu và thiếu vắng ngọn lửa lãng mạn bất ngờ. Khi xảy ra bất đồng ý kiến, tính bướng bỉnh và cố chấp đặc trưng của nguyên tố Đất có thể biến một mâu thuẫn nhỏ thành một cuộc chiến tranh lạnh kéo dài dai dẳng. Việc quá tập trung vào trách nhiệm và sự an toàn có thể khiến cảm xúc ái tình dần bị phai nhạt theo thời gian.`,
        advice: `Hãy chủ động đưa những sắc màu tươi mới và những rung động lãng mạn vào đời sống chung mỗi tuần. ${p1Name} (${sun1}) và ${p2Name} (${sun2}) cần tập thói quen bộc lộ tình cảm bằng những lời nói ngọt ngào, cùng nhau đi du lịch ngẫu hứng hay tham gia các hoạt động nghệ thuật. Hãy học cách mở rộng lòng mình để đón nhận sự đổi mới và linh hoạt hơn trong cách nhìn nhận vấn đề.`,
      },
      'earth-water': {
        base: 94, love: 96, comm: 89, passion: 88, spirit: 95,
        summary: `Mối quan hệ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là hình mẫu kinh điển của sự nuôi dưỡng tự nhiên: Dòng suối mát lành tưới tắm cho mảnh đất màu mỡ đơm hoa kết trái. Đất mang lại cho Nước bờ bến an toàn, sự định hướng và che chở vững vàng; còn Nước mang đến cho Đất sự mềm mại, tình yêu thương vô điều kiện và chiều sâu cảm xúc màu nhiệm. Đây là mối liên kết hài hòa bẩm sinh, nơi hai tâm hồn tìm thấy sự bình yên và trọn vẹn nhất.${ascContext}`,
        strengths: `Sự hòa hợp tâm hồn sâu sắc và khả năng thấu cảm không cần nhiều lời nói. Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} đan cài vào nhau như một dòng chảy tự nhiên, giúp cả hai dễ dàng xoa dịu những áp lực ngoại cảnh và chữa lành những tổn thương xưa cũ.${venusContext} ${p1Name} và ${p2Name} cùng nhau kiến tạo nên một không gian gia đình ấm cúng, giàu tính gắn kết thiêng liêng và tình yêu đằm thắm theo năm tháng.`,
        challenges: `Đôi khi phía mang năng lượng Nước bị chìm đắm trong những con sóng cảm xúc mơ hồ, khiến phía mang năng lượng Đất cảm thấy bế tắc vì không thể dùng tư duy logic để giải quyết. Ngược lại, sự thực tế quá mức và tính nguyên tắc của Đất có thể vô tình làm Nước cảm thấy tâm hồn mình chưa được nâng niu trọn vẹn. Sự bảo bọc quá mức cũng có thể khiến mối quan hệ trở nên khép kín với thế giới bên ngoài.`,
        advice: `Phía Đất hãy học cách ôm ấp cảm xúc của người kia bằng sự hiện diện tĩnh lặng và cái ôm ấm áp thay vì vội vàng đưa ra lời khuyên logic; còn phía Nước hãy trân quý những nỗ lực thực tế và sự chung thủy thầm lặng mà đối phương đang dành trọn cho bạn. Hãy cùng nhau bước ra ngoài giao lưu xã hội để nguồn năng lượng của cặp đôi luôn tươi mới và tràn ngập sinh khí.`,
      },
      'air-earth': {
        base: 75, love: 72, comm: 80, passion: 71, spirit: 75,
        summary: `Sự gặp gỡ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là sự kết hợp giữa mặt đất hiện thực và tầng trời tư tưởng rộng lớn. Đây là mối liên kết giàu tiềm năng phát triển trí tuệ và sự nghiệp: Khí mang đến những tầm nhìn chiến lược, sự linh hoạt và cách tiếp cận tiến bộ; còn Đất kiểm chứng tính khả thi, hiện thực hóa các ý tưởng trừu tượng thành những giá trị cụ thể. Đôi bạn có thể trở thành đối tác cuộc đời xuất sắc cùng nhau xây dựng cơ đồ bền vững.${ascContext}`,
        strengths: `Khả năng phân tích sắc sảo kết hợp với sự bền bỉ giúp cả hai đạt được nhiều mục tiêu lớn trong xã hội. Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} giúp duy trì sự tôn trọng lẫn nhau và tinh thần bình đẳng, văn minh trong mối quan hệ.${venusContext} ${p1Name} học được cách tư duy đa chiều từ ${p2Name}, trong khi ${p2Name} tìm thấy ở ${p1Name} sự tin cậy và điểm tựa thực tế không thể lay chuyển.`,
        challenges: `Khoảng cách cảm xúc là thử thách hàng đầu: Khí có xu hướng sống trên lý trí và ưa thích tự do ngôn luận, trong khi Đất cần những biểu hiện tình cảm hữu hình và sự cam kết kiên định. Nếu không chú trọng vun đắp cảm xúc, mối quan hệ dễ chuyển thành quan hệ đối tác công việc khô khan, thiếu vắng sự lãng mạn. Sự hoài nghi của Đất trước những ý tưởng viển vông của Khí cũng có thể làm tổn thương lòng tự hào của đối phương.`,
        advice: `Hãy dành không gian riêng cho những rung động trái tim, tách bạch công việc và những khoảnh khắc riêng tư ấm áp. Phía Khí cần học cách thể hiện tình cảm bằng hành động cụ thể và sự quan tâm chu đáo; còn phía Đất hãy lắng nghe những ý tưởng bay bổng của đối phương với nụ cười bao dung thay vì vội vàng phán xét tính thực tế.`,
      },
      'air-air': {
        base: 86, love: 82, comm: 98, passion: 81, spirit: 83,
        summary: `Mối quan hệ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) như hai làn gió tự do cùng khiêu vũ giữa không gian tri thức bao la vô tận. Đây là một kết nối tâm giao đích thực, nơi hai trí tuệ hòa quyện trong những cuộc trò chuyện bất tận về cuộc sống, triết học và tương lai. Cả hai tìm thấy ở nhau người bạn đồng hành hiểu mình nhất, luôn tôn trọng tự do và khát vọng khám phá của đối phương. Tình yêu của đôi bạn luôn tươi mới, văn minh và tràn đầy cảm hứng sáng tạo.${ascContext}`,
        strengths: `Giao tiếp là điểm sáng tuyệt đối của đôi bạn: không có chủ đề nào là cấm kỵ, sự hài hước thông minh và tinh tế giúp hai người luôn cảm thấy cuộc sống tràn ngập niềm vui. Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} tạo điều kiện cho một tình yêu hiện đại, không ràng buộc ngột ngạt mà cùng nâng đỡ nhau phát triển trên con đường cá nhân.${venusContext} Hai bạn luôn là nguồn cổ vũ tinh thần số một của nhau trước mọi dự định lớn.`,
        challenges: `Sự thiếu hụt yếu tố neo giữ (grounding) và chiều sâu cảm xúc gắn kết ruột thịt. Cả hai đều có xu hướng 'lý trí hóa' cảm xúc khi gặp tổn thương, phân tích nỗi đau bằng tư duy thay vì thực sự cảm nhận và chữa lành từ trái tim. Mối quan hệ có thể rơi vào trạng thái hời hợt hoặc né tránh những cam kết ràng buộc sâu xa khi đối diện với thử thách đời thường.`,
        advice: `Hãy học cách bước xuống khỏi tầng trí óc để chạm vào nhịp đập mộc mạc và chân thành của trái tim. ${p1Name} (${sun1}) và ${p2Name} (${sun2}) hãy dám bộc lộ những góc yếu đuối, những nỗi sợ thầm kín và cùng nhau tạo dựng những thói quen đời thường gắn bó. Đưa những cam kết cụ thể vào mối quan hệ chính là chiếc chìa khóa giúp đôi bạn giữ được hạnh phúc bền lâu.`,
      },
      'air-water': {
        base: 72, love: 78, comm: 74, passion: 77, spirit: 82,
        summary: `Cuộc hội ngộ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) như sự giao hòa kỳ ảo đầy chất thơ giữa mây trời lãng đãng và đại dương bao la. Đây là mối liên kết giàu chất nghệ thuật nhưng cũng chứa đựng nhiều điều bí ẩn cần giải mã. Khí mở rộng tầm nhận thức của Nước bằng tư duy khách quan và góc nhìn mới mẻ; còn Nước dẫn lối Khí thâm nhập vào chiều sâu huyền nhiệm của trực giác và thế giới tâm linh. Hai bạn mang đến cho nhau những bài học tiến hóa tâm hồn sâu sắc.${ascContext}`,
        strengths: `Sự kích thích trí tưởng tượng và khả năng thấu cảm tinh thần ở mức độ vi mô. ${p1Name} và ${p2Name} có thể truyền cảm hứng sáng tạo nghệ thuật và nâng đỡ nhau vượt qua những giới hạn suy nghĩ thông thường. Tương tác Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} giúp đôi bạn nhìn thấy những góc khuất tâm hồn mà người ngoài không thể chạm tới.${venusContext} Sự nhạy bén của cả hai giúp mối quan hệ luôn giữ được nét thi vị độc đáo.`,
        challenges: `Sự xung đột cố hữu giữa 'Lý trí logic' và 'Trực giác cảm xúc': Khí phân tích mọi chuyện bằng lập luận sắc bén khiến Nước cảm thấy bị ngắt kết nối và thiếu sự đồng cảm sâu xa. Ngược lại, những cơn sóng tâm trạng thất thường của Nước khiến Khí cảm thấy bối rối, ngột ngạt và có xu hướng lùi lại phòng thủ. Khoảng cách giao tiếp cảm xúc có thể dẫn đến những hiểu lầm không đáng có.`,
        advice: `Khí cần học bài học về sự thấu cảm không phán xét, chấp nhận rằng có những cảm xúc thiêng liêng không thể giải thích bằng logic thuần túy; còn Nước hãy nỗ lực diễn đạt cảm xúc thành lời nói rõ ràng để đối phương có thể hiểu và cùng sẻ chia thấu đáo. Hãy tạo dựng không gian an toàn để cả hai cùng bày tỏ lòng mình mà không sợ bị tổn thương.`,
      },
      'water-water': {
        base: 92, love: 98, comm: 83, passion: 90, spirit: 98,
        summary: `Mối quan hệ giữa ${p1Name} (${sun1}) và ${p2Name} (${sun2}) là cuộc hội lưu của hai dòng sông thiêng hòa vào biển lớn đại dương bao la. Đây là một kết nối tâm linh vô cùng sâu sắc, nơi hai tâm hồn có thể đọc thấu cảm xúc của nhau qua từng ánh mắt và nhịp thở. Tình yêu của đôi bạn mang màu sắc thiêng liêng, lãng mạn tột cùng và sự gắn bó định mệnh vượt qua mọi giới hạn trần tục. Hai bạn tạo nên một thế giới riêng đầy sự thấu hiểu và che chở lẫn nhau.${ascContext}`,
        strengths: `Lòng trắc ẩn vô bờ bến và sự chở che tâm hồn tuyệt đối. Cả hai tạo ra một không gian thiền định, an yên, nơi mọi tổn thương trong quá khứ đều được xoa dịu và chữa lành kỳ diệu. Tương tác kỳ diệu giữa Mặt Trăng ${profile.moon || sun1} và Mặt Trăng ${person2.moon || sun2} tạo nên một sợi dây thần giao cách cảm bền chặt, giúp hai người gắn kết sâu sắc như thể sinh ra là dành riêng cho nhau.${venusContext}`,
        challenges: `Nguy cơ lớn nhất là sự quá tải cảm xúc (emotional overwhelm) và hiện tượng cộng hưởng tiêu cực: Khi một người buồn rầu, người kia dễ bị cuốn theo vào xoáy nước lo âu đó. Sự thiếu vắng nguyên tố Lửa và Đất có thể khiến đôi bạn né tránh đối diện với những áp lực thực tế của đời sống vật chất. Sự nhạy cảm quá mức cũng có thể biến những chuyện nhỏ thành nỗi ám ảnh tâm lý kéo dài.`,
        advice: `Cần thiết lập ranh giới cá nhân lành mạnh và học cách phân định đâu là cảm xúc của mình, đâu là cảm xúc của người kia. ${p1Name} (${sun1}) và ${p2Name} (${sun2}) hãy cùng nhau thiết lập những mục tiêu đời sống cụ thể, rèn luyện thể chất và cùng nhau bám rễ vững vàng vào thực tại để tình yêu luôn giữ được sự tươi sáng, tích cực và cân bằng.`,
      },
    };

    const arch = ARCHETYPES[pair] || ARCHETYPES['air-fire'];

    return {
      overall: arch.base,
      love: arch.love,
      communication: arch.comm,
      passion: arch.passion,
      spiritual: arch.spirit,
      summary: (aiText && aiText.length > 50) ? aiText : arch.summary,
      strengths: arch.strengths,
      challenges: arch.challenges,
      advice: arch.advice,
    };
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return '#4ade80';
    if (score >= 65) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/match')} className="text-purple-300 hover:text-white text-sm">← Về Tìm Bạn</button>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold gradient-text font-display">💑 Bản Đồ Đôi — Synastry</h1>
        <p className="text-purple-300 opacity-70 mt-1">Phân tích chiều sâu tương hợp giữa hai lá số</p>
      </motion.div>

      {/* Two people cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Person 1 — current user */}
        <div className="glass-card p-4" style={{ border: `1px solid ${colors[0]}40` }}>
          <p className="text-xs text-purple-400 mb-2 font-medium">Người 1 (Bạn)</p>
          <div className="text-center">
            {profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl"
                style={{ background: `linear-gradient(135deg, ${colors[0]}40, ${colors[1]}30)` }}>
                {ZODIAC_SYMBOLS[profile.sun || ''] || '✦'}
              </div>
            )}
            <p className="text-white font-semibold text-sm">{profile.name || 'Bạn'}</p>
            <p className="text-purple-300 text-xs opacity-70">{profile.sun} · {profile.moon}</p>
          </div>
        </div>

        {/* Person 2 — input */}
        <div className="glass-card p-4">
          <p className="text-xs text-purple-400 mb-2 font-medium">Người 2</p>
          <input
            type="text"
            placeholder="Tên..."
            value={person2.name}
            onChange={e => setPerson2(p => ({ ...p, name: e.target.value }))}
            className="w-full glass px-2 py-1.5 rounded-lg text-white text-xs mb-2 placeholder-purple-400/60 outline-none border border-purple-500/20"
          />
          <div className="text-center text-3xl mb-2">
            {ZODIAC_SYMBOLS[person2.sun] || '?'}
          </div>
          <p className="text-purple-300 text-xs opacity-70 text-center">
            {person2.sun || '—'} · {person2.moon || '—'}
          </p>
        </div>
      </div>

      {/* Form for Person 2 */}
      {!result && (
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-white font-semibold">Thông Tin Người Thứ Hai</h2>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'sun', label: 'Mặt Trời ☉ *' },
              { key: 'moon', label: 'Mặt Trăng ☽ *' },
              { key: 'ascendant', label: 'Cung Mọc ↑' },
              { key: 'venus', label: 'Sao Kim ♀' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-purple-300 text-xs mb-1 block">{label}</label>
                <select
                  value={person2[key as keyof typeof person2]}
                  onChange={e => setPerson2(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full glass px-2 py-2 rounded-lg text-white text-xs outline-none border border-purple-500/20 bg-transparent"
                >
                  <option value="">— chọn —</option>
                  {ZODIAC_SIGNS.map(s => (
                    <option key={s} value={s} style={{ background: '#1e1b4b' }}>{ZODIAC_SYMBOLS[s]} {s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!isFormValid || loading}
            className="btn-cosmic w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isFormValid ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` : undefined }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang phân tích...
              </span>
            ) : '✨ Phân Tích Tương Hợp'}
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Top Results: Độ tương hợp tổng thể & Phân tích dạng thanh ngang hàng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {/* Overall score */}
              <div className="glass-card p-6 text-center flex flex-col justify-center" style={{ border: `1px solid ${scoreColor(result.overall)}40` }}>
                <p className="text-purple-300 text-sm mb-1">Độ Tương Hợp Tổng Thể</p>
                <div className="text-6xl font-bold font-display mb-1" style={{ color: scoreColor(result.overall) }}>
                  {result.overall}%
                </div>
                <p className="text-purple-200 text-sm">
                  {profile.name} × {person2.name}
                </p>
                <p className="text-purple-300 text-xs mt-2 opacity-80 italic">
                  {result.overall >= 80 ? '💫 Sự kết hợp của các vì sao!' : result.overall >= 65 ? '✨ Tiềm năng tốt, cần vun đắp' : '🌱 Thử thách giúp cả hai trưởng thành'}
                </p>
              </div>

              {/* Score breakdown dạng thanh */}
              <div className="glass-card p-5 flex flex-col justify-center">
                <h2 className="text-white font-semibold text-base mb-3.5 flex items-center gap-2">
                  <UiIcon name="chart" label="Phân tích chi tiết" className="text-purple-400 text-sm" />
                  <span>Phân Tích Chi Tiết</span>
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Tình Cảm', value: result.love, icon: 'heart' as const },
                    { label: 'Giao Tiếp', value: result.communication, icon: 'message' as const },
                    { label: 'Đam Mê', value: result.passion, icon: 'flame' as const },
                    { label: 'Tâm Linh', value: result.spiritual, icon: 'sparkles' as const },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-purple-300 flex items-center gap-1.5">
                          <UiIcon name={item.icon} label={item.label} className="text-purple-400 text-xs" />
                          <span>{item.label}</span>
                        </span>
                        <span className="font-semibold text-xs sm:text-sm" style={{ color: scoreColor(item.value) }}>{item.value}%</span>
                      </div>
                      <div className="cosmic-progress">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1.2, delay: 0.2 }}
                          style={{ height: '100%', background: `linear-gradient(90deg, ${scoreColor(item.value)}88, ${scoreColor(item.value)})`, borderRadius: 3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text analysis */}
            {[
              { label: 'Tóm Tắt', key: 'summary' },
              { label: 'Điểm Mạnh Đôi Bạn', key: 'strengths' },
              { label: 'Thách Thức Cần Vượt', key: 'challenges' },
              { label: 'Lời Khuyên Vũ Trụ', key: 'advice' },
            ].map(({ label, key }) => (
              <div key={key} className="glass-card p-5">
                <h3 className="text-white font-semibold text-base mb-2 flex items-center gap-2">
                  <UiIcon name="star-4" label="Sao 4 cánh" className="text-purple-300 text-sm flex-shrink-0" />
                  <span>{label}</span>
                </h3>
                <p className="text-purple-100 text-sm leading-relaxed opacity-90 border-l-2 pl-3 italic whitespace-pre-line"
                  style={{ borderColor: colors[0] }}>
                  {result[key as keyof SynastryResult] as string}
                </p>
              </div>
            ))}

            <button onClick={() => setResult(null)}
              className="text-purple-400 text-sm hover:text-purple-300 underline w-full text-center">
              ↻ Phân tích cặp đôi khác
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
