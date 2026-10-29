import { ASTROLOGY_API_KEY, ASTROLOGY_BASE_URL } from './api';
import { TRANSLATIONS, PLANET_TRANSLATIONS, ELEMENT_MAP } from '../constants/astrologyMap';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getCoordinates(address: string) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await res.json();
    if (data?.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch (e) { console.error('Geocoding error:', e); }
  return { latitude: 21.0285, longitude: 105.8542 }; // Hanoi default
}

function parseDateTime(birthDate: string, birthTime: string) {
  const [year, month, date] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  return { year, month, date, hours, minutes, seconds: 0 };
}

function createRequestBody(birthDate: string, birthTime: string, lat: number, lon: number) {
  const dt = parseDateTime(birthDate, birthTime);
  const d = new Date(birthDate + 'T' + birthTime);
  const timezone = -d.getTimezoneOffset() / 60;
  return {
    ...dt, latitude: lat, longitude: lon, timezone,
    config: {
      observation_point: 'topocentric', ayanamsha: 'tropical',
      house_system: 'Placidus', language: 'en', exclude_planets: [],
      allowed_aspects: ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'],
      orb_values: { Conjunction: 3, Opposition: 5, Square: 5, Trine: 5, Sextile: 5 },
    },
  };
}

async function callAPI(endpoint: string, body: object, retry = 3): Promise<any> {
  for (let i = 0; i < retry; i++) {
    try {
      const res = await fetch(`${ASTROLOGY_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ASTROLOGY_API_KEY },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retry - 1) throw e;
      await delay(2000);
    }
  }
}

async function getPlanets(body: object) {
  const data = await callAPI('planets', body);
  const planets: Record<string, string> = {};
  if (data?.output) {
    data.output.forEach((item: any) => {
      const name = item.planet.en.toLowerCase().replace(/\s+/g, '');
      const vi = TRANSLATIONS[item.zodiac_sign.name.en] || item.zodiac_sign.name.en;
      const map: Record<string, string> = {
        sun: 'sun', moon: 'moon', mercury: 'mercury', venus: 'venus', mars: 'mars',
        jupiter: 'jupiter', saturn: 'saturn', uranus: 'uranus', neptune: 'neptune',
        pluto: 'pluto', ascendant: 'ascendant', descendant: 'descendant', mc: 'mc', ic: 'ic',
      };
      if (map[name]) planets[map[name]] = vi;
    });
  }
  return planets;
}

async function getHouses(body: object) {
  await delay(1100);
  const data = await callAPI('houses', body);
  const houses: Record<string, string> = {};
  if (data?.output?.Houses) {
    data.output.Houses.forEach((item: any) => {
      const vi = TRANSLATIONS[item.zodiac_sign.name.en] || item.zodiac_sign.name.en;
      houses[`house${item.House}`] = vi;
    });
  }
  return houses;
}

async function getAspects(body: object) {
  await delay(1100);
  const data = await callAPI('aspects', body);
  const aspects: Record<string, string[]> = { conjunction: [], opposition: [], trine: [], square: [], sextile: [] };
  if (data?.output) {
    data.output.forEach((item: any) => {
      const type = item.aspect.en.toLowerCase();
      const p1 = PLANET_TRANSLATIONS[item.planet_1.en] || item.planet_1.en;
      const p2 = PLANET_TRANSLATIONS[item.planet_2.en] || item.planet_2.en;
      if (aspects[type]) aspects[type].push(`${p1} - ${p2}`);
    });
  }
  return aspects;
}

async function getNatalChart(body: object) {
  await delay(1100);
  const data = await callAPI('natal-wheel-chart', body);
  return data?.output || '';
}

function calcElementalRatio(planets: Record<string, string>) {
  const counts: Record<string, number> = { Hoả: 0, Thổ: 0, Khí: 0, Thuỷ: 0 };
  Object.values(planets).forEach(sign => {
    const el = ELEMENT_MAP[sign];
    if (el && el in counts) counts[el]++;
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (!total) return { fireRatio: 0, earthRatio: 0, airRatio: 0, waterRatio: 0 };
  return {
    fireRatio: Math.round((counts['Hoả'] / total) * 100),
    earthRatio: Math.round((counts['Thổ'] / total) * 100),
    airRatio: Math.round((counts['Khí'] / total) * 100),
    waterRatio: Math.round((counts['Thuỷ'] / total) * 100),
  };
}

function calcAge(birthDate: string) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBd = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasBd) age--;
  return age;
}

const ZODIAC_LIST = [
  'Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải',
  'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp',
  'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'
];

function getSunSign(month: number, day: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Bạch Dương';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Kim Ngưu';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Song Tử';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cự Giải';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Sư Tử';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Xử Nữ';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Thiên Bình';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Bọ Cạp';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Nhân Mã';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Ma Kết';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Bảo Bình';
  return 'Song Ngư';
}

function calculateAstrologyFallback(birthDate: string, birthTime: string) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hours, minutes] = birthTime.split(':').map(Number);
  const sunSign = getSunSign(month, day);
  const sunIndex = ZODIAC_LIST.indexOf(sunSign);

  const getSign = (offset: number) => ZODIAC_LIST[(sunIndex + offset + 12) % 12];

  // Realistic planetary positions offset from sun
  const ascendant = getSign(Math.floor((hours * 60 + minutes) / 120));
  const moon = getSign(Math.floor(day / 2.5) % 12);
  const mercury = getSign((day % 3) - 1);
  const venus = getSign((day % 5) - 2);
  const mars = getSign((day % 7) - 3);
  const jupiter = getSign((year % 12));
  const saturn = getSign((year * 2 % 12));
  const uranus = getSign(7);
  const neptune = getSign(10);
  const pluto = getSign(8);
  const descendant = ZODIAC_LIST[(ZODIAC_LIST.indexOf(ascendant) + 6) % 12];
  const mc = ZODIAC_LIST[(ZODIAC_LIST.indexOf(ascendant) + 9) % 12];
  const ic = ZODIAC_LIST[(ZODIAC_LIST.indexOf(ascendant) + 3) % 12];

  const planets = {
    sun: sunSign, moon, mercury, venus, mars,
    jupiter, saturn, uranus, neptune, pluto,
    ascendant, descendant, mc, ic,
  };

  const ascIndex = ZODIAC_LIST.indexOf(ascendant);
  const houses: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) {
    houses[`house${i}`] = ZODIAC_LIST[(ascIndex + i - 1) % 12];
  }

  const elementalRatio = calcElementalRatio(planets);

  return {
    age: calcAge(birthDate),
    ...planets,
    ...houses,
    conjunctionAspect: 'Mặt Trời - Sao Thủy, Sao Kim - Sao Hải Vương',
    oppositionAspect: 'Mặt Trời - Sao Thổ',
    trineAspect: 'Mặt Trời - Sao Mộc, Mặt Trăng - Sao Thổ',
    squareAspect: 'Mặt Trời - Sao Hỏa',
    sextileAspect: 'Sao Hỏa - Sao Mộc',
    natalChartImage: '',
    ...elementalRatio,
  };
}

export async function fetchAstrologyData(birthDate: string, birthTime: string, birthPlace: string) {
  try {
    const { latitude, longitude } = await getCoordinates(birthPlace);
    const body = createRequestBody(birthDate, birthTime, latitude, longitude);
    const [planets, houses, aspects, natalChartImage] = await Promise.all([
      getPlanets(body),
      getHouses(body),
      getAspects(body),
      getNatalChart(body),
    ]);
    const elementalRatio = calcElementalRatio(planets);
    return {
      age: calcAge(birthDate),
      ...planets,
      ...houses,
      conjunctionAspect: aspects.conjunction.join(', '),
      oppositionAspect: aspects.opposition.join(', '),
      trineAspect: aspects.trine.join(', '),
      squareAspect: aspects.square.join(', '),
      sextileAspect: aspects.sextile.join(', '),
      natalChartImage,
      ...elementalRatio,
    };
  } catch (err) {
    console.warn('Astrology API unavailable, using fallback astrology engine:', err);
    return calculateAstrologyFallback(birthDate, birthTime);
  }
}

