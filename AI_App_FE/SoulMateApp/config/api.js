export const BASE_URL = "http://10.170.7.221:5001";

export const API = {
  generate: `${BASE_URL}/generate`,
  natalAnalysis: `${BASE_URL}/natal-analysis`,
  compatibilityAnalysis: `${BASE_URL}/compatibility-analysis`,
  astrology: (endpoint) => `${BASE_URL}/astrology/${endpoint}`,
};
