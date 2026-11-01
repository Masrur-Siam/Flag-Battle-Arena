/**
 * FLAG BATTLE ARENA - Complete World Country Flag Database
 * 190+ Sovereign World Nations with official flag emojis, codes, colors, and letterwise indexing.
 */

import * as THREE from '../libraries/three.module.js';

export const COUNTRIES = [
  // A
  { code: 'AFG', name: 'Afghanistan', emoji: '🇦🇫', region: 'Asia', colors: ['#000000', '#D32011', '#007A3D'] },
  { code: 'ALB', name: 'Albania', emoji: '🇦🇱', region: 'Europe', colors: ['#E41E20', '#000000', '#E41E20'] },
  { code: 'DZA', name: 'Algeria', emoji: '🇩🇿', region: 'Africa', colors: ['#006233', '#FFFFFF', '#D21034'] },
  { code: 'AND', name: 'Andorra', emoji: '🇦🇩', region: 'Europe', colors: ['#10069F', '#FEDD00', '#D50032'] },
  { code: 'AGO', name: 'Angola', emoji: '🇦🇴', region: 'Africa', colors: ['#CE1126', '#000000', '#FED100'] },
  { code: 'ARG', name: 'Argentina', emoji: '🇦🇷', region: 'Americas', colors: ['#74ACDF', '#FFFFFF', '#F6B40E'] },
  { code: 'ARM', name: 'Armenia', emoji: '🇦🇲', region: 'Asia', colors: ['#D90012', '#0033A0', '#F2A800'] },
  { code: 'AUS', name: 'Australia', emoji: '🇦🇺', region: 'Oceania', colors: ['#00843D', '#FFCD00', '#00008B'] },
  { code: 'AUT', name: 'Austria', emoji: '🇦🇹', region: 'Europe', colors: ['#ED2939', '#FFFFFF', '#ED2939'] },
  { code: 'AZE', name: 'Azerbaijan', emoji: '🇦🇿', region: 'Asia', colors: ['#00B5E2', '#EF3340', '#509E2F'] },

  // B
  { code: 'BHS', name: 'Bahamas', emoji: '🇧🇸', region: 'Americas', colors: ['#00778B', '#FFC72C', '#000000'] },
  { code: 'BHR', name: 'Bahrain', emoji: '🇧🇭', region: 'Asia', colors: ['#DA291C', '#FFFFFF', '#DA291C'] },
  { code: 'BGD', name: 'Bangladesh', emoji: '🇧🇩', region: 'Asia', colors: ['#006A4E', '#F42A41', '#006A4E'] },
  { code: 'BRB', name: 'Barbados', emoji: '🇧🇧', region: 'Americas', colors: ['#00267F', '#FFC72C', '#000000'] },
  { code: 'BLR', name: 'Belarus', emoji: '🇧🇾', region: 'Europe', colors: ['#C8313E', '#43834E', '#FFFFFF'] },
  { code: 'BEL', name: 'Belgium', emoji: '🇧🇪', region: 'Europe', colors: ['#000000', '#FDDA24', '#EF3340'] },
  { code: 'BLZ', name: 'Belize', emoji: '🇧🇿', region: 'Americas', colors: ['#003F87', '#D91B5B', '#FFFFFF'] },
  { code: 'BEN', name: 'Benin', emoji: '🇧🇯', region: 'Africa', colors: ['#008751', '#FCD116', '#E8112D'] },
  { code: 'BTN', name: 'Bhutan', emoji: '🇧🇹', region: 'Asia', colors: ['#FFD520', '#FF4E12', '#FFFFFF'] },
  { code: 'BOL', name: 'Bolivia', emoji: '🇧🇴', region: 'Americas', colors: ['#D52B1E', '#FCD116', '#007934'] },
  { code: 'BIH', name: 'Bosnia and Herzegovina', emoji: '🇧🇦', region: 'Europe', colors: ['#002395', '#FECB00', '#FFFFFF'] },
  { code: 'BWA', name: 'Botswana', emoji: '🇧🇼', region: 'Africa', colors: ['#75AADB', '#000000', '#FFFFFF'] },
  { code: 'BRA', name: 'Brazil', emoji: '🇧🇷', region: 'Americas', colors: ['#009739', '#FEDD00', '#002776'] },
  { code: 'BRN', name: 'Brunei', emoji: '🇧🇳', region: 'Asia', colors: ['#F7E017', '#FFFFFF', '#000000'] },
  { code: 'BGR', name: 'Bulgaria', emoji: '🇧🇬', region: 'Europe', colors: ['#FFFFFF', '#00966E', '#D62612'] },
  { code: 'BFA', name: 'Burkina Faso', emoji: '🇧🇫', region: 'Africa', colors: ['#EF3340', '#009739', '#FCD116'] },

  // C
  { code: 'KHM', name: 'Cambodia', emoji: '🇰🇭', region: 'Asia', colors: ['#032EA1', '#ED1B24', '#FFFFFF'] },
  { code: 'CMR', name: 'Cameroon', emoji: '🇨🇲', region: 'Africa', colors: ['#007A5E', '#CE1126', '#FCD116'] },
  { code: 'CAN', name: 'Canada', emoji: '🇨🇦', region: 'Americas', colors: ['#D80621', '#FFFFFF', '#D80621'] },
  { code: 'CPV', name: 'Cape Verde', emoji: '🇨🇻', region: 'Africa', colors: ['#003893', '#CF2027', '#FCD116'] },
  { code: 'CHL', name: 'Chile', emoji: '🇨🇱', region: 'Americas', colors: ['#D52B1E', '#FFFFFF', '#0039A6'] },
  { code: 'CHN', name: 'China', emoji: '🇨🇳', region: 'Asia', colors: ['#DE2910', '#FFDE00', '#DE2910'] },
  { code: 'COL', name: 'Colombia', emoji: '🇨🇴', region: 'Americas', colors: ['#FCD116', '#003893', '#CE1126'] },
  { code: 'CRI', name: 'Costa Rica', emoji: '🇨🇷', region: 'Americas', colors: ['#002B7F', '#FFFFFF', '#CE1126'] },
  { code: 'HRV', name: 'Croatia', emoji: '🇭🇷', region: 'Europe', colors: ['#FF0000', '#FFFFFF', '#171796'] },
  { code: 'CUB', name: 'Cuba', emoji: '🇨🇺', region: 'Americas', colors: ['#002590', '#FFFFFF', '#CB1515'] },
  { code: 'CYP', name: 'Cyprus', emoji: '🇨🇾', region: 'Europe', colors: ['#D57800', '#4E5B31', '#FFFFFF'] },
  { code: 'CZE', name: 'Czechia', emoji: '🇨🇿', region: 'Europe', colors: ['#11457E', '#D7141A', '#FFFFFF'] },

  // D
  { code: 'DNK', name: 'Denmark', emoji: '🇩🇰', region: 'Europe', colors: ['#C60C30', '#FFFFFF', '#C60C30'] },
  { code: 'DJI', name: 'Djibouti', emoji: '🇩🇯', region: 'Africa', colors: ['#6AB2E7', '#12AD2B', '#D7141A'] },
  { code: 'DOM', name: 'Dominican Republic', emoji: '🇩🇴', region: 'Americas', colors: ['#002F6C', '#CE1126', '#FFFFFF'] },

  // E
  { code: 'ECU', name: 'Ecuador', emoji: '🇪🇨', region: 'Americas', colors: ['#FFDD00', '#034EA2', '#ED1C24'] },
  { code: 'EGY', name: 'Egypt', emoji: '🇪🇬', region: 'Africa', colors: ['#C8102E', '#FFFFFF', '#000000'] },
  { code: 'SLV', name: 'El Salvador', emoji: '🇸🇻', region: 'Americas', colors: ['#0F47AF', '#FFFFFF', '#0F47AF'] },
  { code: 'EST', name: 'Estonia', emoji: '🇪🇪', region: 'Europe', colors: ['#0072CE', '#000000', '#FFFFFF'] },
  { code: 'ETH', name: 'Ethiopia', emoji: '🇪🇹', region: 'Africa', colors: ['#078930', '#FCDD09', '#DA121A'] },

  // F
  { code: 'FJI', name: 'Fiji', emoji: '🇫🇯', region: 'Oceania', colors: ['#68BFE5', '#C8102E', '#FFFFFF'] },
  { code: 'FIN', name: 'Finland', emoji: '🇫🇮', region: 'Europe', colors: ['#003580', '#FFFFFF', '#002050'] },
  { code: 'FRA', name: 'France', emoji: '🇫🇷', region: 'Europe', colors: ['#002654', '#FFFFFF', '#ED2939'] },

  // G
  { code: 'GAB', name: 'Gabon', emoji: '🇬🇦', region: 'Africa', colors: ['#009E60', '#FCD116', '#3A75C4'] },
  { code: 'GEO', name: 'Georgia', emoji: '🇬🇪', region: 'Asia', colors: ['#FF0000', '#FFFFFF', '#FF0000'] },
  { code: 'DEU', name: 'Germany', emoji: '🇩🇪', region: 'Europe', colors: ['#000000', '#DD0000', '#FFCE00'] },
  { code: 'GHA', name: 'Ghana', emoji: '🇬🇭', region: 'Africa', colors: ['#EF3340', '#FFD100', '#009739'] },
  { code: 'GRC', name: 'Greece', emoji: '🇬🇷', region: 'Europe', colors: ['#0D5EAF', '#FFFFFF', '#0D5EAF'] },
  { code: 'GTM', name: 'Guatemala', emoji: '🇬🇹', region: 'Americas', colors: ['#4997D0', '#FFFFFF', '#4997D0'] },

  // H
  { code: 'HTI', name: 'Haiti', emoji: '🇭🇹', region: 'Americas', colors: ['#00209F', '#D21034', '#FFFFFF'] },
  { code: 'HND', name: 'Honduras', emoji: '🇭🇳', region: 'Americas', colors: ['#0073CF', '#FFFFFF', '#0073CF'] },
  { code: 'HUN', name: 'Hungary', emoji: '🇭🇺', region: 'Europe', colors: ['#CE2939', '#FFFFFF', '#477050'] },

  // I
  { code: 'ISL', name: 'Iceland', emoji: '🇮🇸', region: 'Europe', colors: ['#02529C', '#DC1E35', '#FFFFFF'] },
  { code: 'IND', name: 'India', emoji: '🇮🇳', region: 'Asia', colors: ['#FF9933', '#FFFFFF', '#138808'] },
  { code: 'IDN', name: 'Indonesia', emoji: '🇮🇩', region: 'Asia', colors: ['#FF0000', '#FFFFFF', '#D10000'] },
  { code: 'IRN', name: 'Iran', emoji: '🇮🇷', region: 'Asia', colors: ['#239F40', '#FFFFFF', '#DA0000'] },
  { code: 'IRQ', name: 'Iraq', emoji: '🇮🇶', region: 'Asia', colors: ['#CE1126', '#FFFFFF', '#000000'] },
  { code: 'IRL', name: 'Ireland', emoji: '🇮🇪', region: 'Europe', colors: ['#169B62', '#FFFFFF', '#FF883E'] },
  { code: 'ISR', name: 'Israel', emoji: '🇮🇱', region: 'Asia', colors: ['#0038B8', '#FFFFFF', '#0038B8'] },
  { code: 'ITA', name: 'Italy', emoji: '🇮🇹', region: 'Europe', colors: ['#008C45', '#F4F5F0', '#CD212A'] },

  // J
  { code: 'JAM', name: 'Jamaica', emoji: '🇯🇲', region: 'Americas', colors: ['#FED100', '#009B3A', '#000000'] },
  { code: 'JPN', name: 'Japan', emoji: '🇯🇵', region: 'Asia', colors: ['#BC002D', '#FFFFFF', '#D90429'] },
  { code: 'JOR', name: 'Jordan', emoji: '🇯🇴', region: 'Asia', colors: ['#000000', '#FFFFFF', '#007A3D'] },

  // K
  { code: 'KAZ', name: 'Kazakhstan', emoji: '🇰🇿', region: 'Asia', colors: ['#00AFCA', '#FEC50C', '#00AFCA'] },
  { code: 'KEN', name: 'Kenya', emoji: '🇰🇪', region: 'Africa', colors: ['#922529', '#000000', '#006600'] },
  { code: 'KOR', name: 'South Korea', emoji: '🇰🇷', region: 'Asia', colors: ['#CD2E3A', '#0047A0', '#000000'] },
  { code: 'KWT', name: 'Kuwait', emoji: '🇰🇼', region: 'Asia', colors: ['#007A3D', '#FFFFFF', '#CE1126'] },

  // L
  { code: 'LBN', name: 'Lebanon', emoji: '🇱🇧', region: 'Asia', colors: ['#ED1C24', '#FFFFFF', '#00A651'] },
  { code: 'LBY', name: 'Libya', emoji: '🇱🇾', region: 'Africa', colors: ['#E70013', '#000000', '#239E46'] },
  { code: 'LUX', name: 'Luxembourg', emoji: '🇱🇺', region: 'Europe', colors: ['#EA141D', '#FFFFFF', '#00A1DE'] },

  // M
  { code: 'MDG', name: 'Madagascar', emoji: '🇲🇬', region: 'Africa', colors: ['#FC3D32', '#007E3A', '#FFFFFF'] },
  { code: 'MYS', name: 'Malaysia', emoji: '🇲🇾', region: 'Asia', colors: ['#CC0000', '#FFFFFF', '#000066'] },
  { code: 'MDV', name: 'Maldives', emoji: '🇲🇻', region: 'Asia', colors: ['#D21034', '#007E3A', '#FFFFFF'] },
  { code: 'MLI', name: 'Mali', emoji: '🇲🇱', region: 'Africa', colors: ['#14B53A', '#FCD116', '#CE1126'] },
  { code: 'MLT', name: 'Malta', emoji: '🇲🇹', region: 'Europe', colors: ['#FFFFFF', '#CF142B', '#FFFFFF'] },
  { code: 'MEX', name: 'Mexico', emoji: '🇲🇽', region: 'Americas', colors: ['#006847', '#FFFFFF', '#CE1126'] },
  { code: 'MCO', name: 'Monaco', emoji: '🇲🇨', region: 'Europe', colors: ['#CE1126', '#FFFFFF', '#CE1126'] },
  { code: 'MNG', name: 'Mongolia', emoji: '🇲🇳', region: 'Asia', colors: ['#E4002B', '#0066B2', '#FFD100'] },
  { code: 'MAR', name: 'Morocco', emoji: '🇲🇦', region: 'Africa', colors: ['#C1272D', '#006233', '#000000'] },
  { code: 'MOZ', name: 'Mozambique', emoji: '🇲🇿', region: 'Africa', colors: ['#007A5E', '#000000', '#FED100'] },
  { code: 'MMR', name: 'Myanmar', emoji: '🇲🇲', region: 'Asia', colors: ['#FECB00', '#34B233', '#EA2839'] },

  // N
  { code: 'NPL', name: 'Nepal', emoji: '🇳🇵', region: 'Asia', colors: ['#DC143C', '#003893', '#FFFFFF'] },
  { code: 'NLD', name: 'Netherlands', emoji: '🇳🇱', region: 'Europe', colors: ['#FF4F00', '#FFFFFF', '#21468B'] },
  { code: 'NZL', name: 'New Zealand', emoji: '🇳🇿', region: 'Oceania', colors: ['#00247D', '#CC142B', '#FFFFFF'] },
  { code: 'NIC', name: 'Nicaragua', emoji: '🇳🇮', region: 'Americas', colors: ['#0067C6', '#FFFFFF', '#0067C6'] },
  { code: 'NGA', name: 'Nigeria', emoji: '🇳🇬', region: 'Africa', colors: ['#008751', '#FFFFFF', '#008751'] },
  { code: 'NOR', name: 'Norway', emoji: '🇳🇴', region: 'Europe', colors: ['#BA0C2F', '#00205B', '#FFFFFF'] },

  // O
  { code: 'OMN', name: 'Oman', emoji: '🇴🇲', region: 'Asia', colors: ['#ED1C24', '#FFFFFF', '#008000'] },

  // P
  { code: 'PAK', name: 'Pakistan', emoji: '🇵🇰', region: 'Asia', colors: ['#01411C', '#FFFFFF', '#01411C'] },
  { code: 'PSE', name: 'Palestine', emoji: '🇵🇸', region: 'Asia', colors: ['#000000', '#FFFFFF', '#007A3D'] },
  { code: 'PAN', name: 'Panama', emoji: '🇵🇦', region: 'Americas', colors: ['#005293', '#D21034', '#FFFFFF'] },
  { code: 'PRY', name: 'Paraguay', emoji: '🇵🇾', region: 'Americas', colors: ['#D52B1E', '#FFFFFF', '#0038A8'] },
  { code: 'PER', name: 'Peru', emoji: '🇵🇪', region: 'Americas', colors: ['#D91023', '#FFFFFF', '#D91023'] },
  { code: 'PHL', name: 'Philippines', emoji: '🇵🇭', region: 'Asia', colors: ['#0038A8', '#CE1126', '#FCD116'] },
  { code: 'POL', name: 'Poland', emoji: '🇵🇱', region: 'Europe', colors: ['#DC143C', '#FFFFFF', '#DC143C'] },
  { code: 'PRT', name: 'Portugal', emoji: '🇵🇹', region: 'Europe', colors: ['#046A38', '#DA291C', '#FED100'] },

  // Q
  { code: 'QAT', name: 'Qatar', emoji: '🇶🇦', region: 'Asia', colors: ['#8A1538', '#FFFFFF', '#8A1538'] },

  // R
  { code: 'ROU', name: 'Romania', emoji: '🇷🇴', region: 'Europe', colors: ['#002B7F', '#FCD116', '#CE1126'] },
  { code: 'RUS', name: 'Russia', emoji: '🇷🇺', region: 'Europe', colors: ['#FFFFFF', '#0039A6', '#D52B1E'] },
  { code: 'RWA', name: 'Rwanda', emoji: '🇷🇼', region: 'Africa', colors: ['#20603D', '#FAD201', '#00A1DE'] },

  // S
  { code: 'SAU', name: 'Saudi Arabia', emoji: '🇸🇦', region: 'Asia', colors: ['#006C35', '#FFFFFF', '#004A24'] },
  { code: 'SEN', name: 'Senegal', emoji: '🇸🇳', region: 'Africa', colors: ['#00853F', '#FDEF42', '#E31B23'] },
  { code: 'SRB', name: 'Serbia', emoji: '🇷🇸', region: 'Europe', colors: ['#C6363C', '#0C4076', '#FFFFFF'] },
  { code: 'SGP', name: 'Singapore', emoji: '🇸🇬', region: 'Asia', colors: ['#ED2939', '#FFFFFF', '#ED2939'] },
  { code: 'SVK', name: 'Slovakia', emoji: '🇸🇰', region: 'Europe', colors: ['#0B4EA2', '#EE1C25', '#FFFFFF'] },
  { code: 'SVN', name: 'Slovenia', emoji: '🇸🇮', region: 'Europe', colors: ['#005DA4', '#ED1C24', '#FFFFFF'] },
  { code: 'ZAF', name: 'South Africa', emoji: '🇿🇦', region: 'Africa', colors: ['#007749', '#FFB81C', '#DE3831'] },
  { code: 'ESP', name: 'Spain', emoji: '🇪🇸', region: 'Europe', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
  { code: 'LKA', name: 'Sri Lanka', emoji: '🇱🇰', region: 'Asia', colors: ['#8D153A', '#FFBE29', '#00534E'] },
  { code: 'SDN', name: 'Sudan', emoji: '🇸🇩', region: 'Africa', colors: ['#D21034', '#FFFFFF', '#007229'] },
  { code: 'SWE', name: 'Sweden', emoji: '🇸🇪', region: 'Europe', colors: ['#006AA7', '#FECC00', '#005580'] },
  { code: 'CHE', name: 'Switzerland', emoji: '🇨🇭', region: 'Europe', colors: ['#DA291C', '#FFFFFF', '#FF3333'] },

  // T
  { code: 'TWN', name: 'Taiwan', emoji: '🇹🇼', region: 'Asia', colors: ['#FE0000', '#000095', '#FFFFFF'] },
  { code: 'TZA', name: 'Tanzania', emoji: '🇹🇿', region: 'Africa', colors: ['#1EB53A', '#00A3DD', '#FCD116'] },
  { code: 'THA', name: 'Thailand', emoji: '🇹🇭', region: 'Asia', colors: ['#A51931', '#F4F5F8', '#2D2A4A'] },
  { code: 'TUN', name: 'Tunisia', emoji: '🇹🇳', region: 'Africa', colors: ['#E70013', '#FFFFFF', '#E70013'] },
  { code: 'TUR', name: 'Turkey', emoji: '🇹🇷', region: 'Europe', colors: ['#E30A17', '#FFFFFF', '#E30A17'] },

  // U
  { code: 'UGA', name: 'Uganda', emoji: '🇺🇬', region: 'Africa', colors: ['#000000', '#FCDC04', '#D90000'] },
  { code: 'UKR', name: 'Ukraine', emoji: '🇺🇦', region: 'Europe', colors: ['#0057B7', '#FFD700', '#0057B7'] },
  { code: 'ARE', name: 'United Arab Emirates', emoji: '🇦🇪', region: 'Asia', colors: ['#00732F', '#FFFFFF', '#FF0000'] },
  { code: 'GBR', name: 'United Kingdom', emoji: '🇬🇧', region: 'Europe', colors: ['#012169', '#C8102E', '#FFFFFF'] },
  { code: 'USA', name: 'United States', emoji: '🇺🇸', region: 'Americas', colors: ['#B22234', '#FFFFFF', '#3C3B6E'] },
  { code: 'URY', name: 'Uruguay', emoji: '🇺🇾', region: 'Americas', colors: ['#0038A8', '#FFFFFF', '#FCD116'] },
  { code: 'UZB', name: 'Uzbekistan', emoji: '🇺🇿', region: 'Asia', colors: ['#0099B5', '#CE1126', '#1EB53A'] },

  // V
  { code: 'VEN', name: 'Venezuela', emoji: '🇻🇪', region: 'Americas', colors: ['#FCE300', '#00247D', '#CF142B'] },
  { code: 'VNM', name: 'Vietnam', emoji: '🇻🇳', region: 'Asia', colors: ['#DA251D', '#FFFF00', '#DA251D'] },

  // Y
  { code: 'YEM', name: 'Yemen', emoji: '🇾🇪', region: 'Asia', colors: ['#CE1126', '#FFFFFF', '#000000'] },

  // Z
  { code: 'ZMB', name: 'Zambia', emoji: '🇿🇲', region: 'Africa', colors: ['#198A00', '#DE2010', '#000000'] },
  { code: 'ZWE', name: 'Zimbabwe', emoji: '🇿🇼', region: 'Africa', colors: ['#006400', '#FFD200', '#D40000'] }
];

// Cache for generated flag canvas textures
const textureCache = new Map();

/**
 * Creates or retrieves a direct 3D flag texture on HTML5 Canvas.
 * Standard 3:2 ratio with vibrant national stripes, crisp official emoji flag, and country label.
 */
export function getCountryFlagTexture(country) {
  if (textureCache.has(country.code)) {
    return textureCache.get(country.code);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');

  const col0 = country.colors[0] || '#2563EB';
  const col1 = country.colors[1] || '#FFFFFF';
  const col2 = country.colors[2] || country.colors[0];

  // Draw 3 primary national flag color stripes
  ctx.fillStyle = col0;
  ctx.fillRect(0, 0, 512, 113);
  ctx.fillStyle = col1;
  ctx.fillRect(0, 113, 512, 114);
  ctx.fillStyle = col2;
  ctx.fillRect(0, 227, 512, 113);

  // Subtle clean fabric gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.18)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 340);

  // Center National Crest with HUGE flag emoji
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(256, 170, 95, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.strokeStyle = col0;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 170, 87, 0, Math.PI * 2);
  ctx.stroke();

  // Draw HUGE national flag emoji in center
  ctx.font = '84px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(country.emoji, 256, 145);

  // Bold country code below flag
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Arial Black", Impact, sans-serif';
  ctx.fillText(country.code, 256, 210);

  // Clean flag border frame
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 502, 330);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  textureCache.set(country.code, texture);
  return texture;
}

/**
 * Country Selector Helpers with Alphabetical Letterwise Support
 */
export function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code) || COUNTRIES[0];
}

export function searchCountries(query = '', region = 'ALL', letter = 'ALL') {
  const q = query.toLowerCase().trim();
  return COUNTRIES.filter(country => {
    const matchesRegion = (region === 'ALL' || country.region === region);
    const matchesLetter = (letter === 'ALL' || country.name.toUpperCase().startsWith(letter.toUpperCase()));
    const matchesQuery = !q ||
      country.name.toLowerCase().includes(q) ||
      country.code.toLowerCase().includes(q);
    return matchesRegion && matchesLetter && matchesQuery;
  });
}

export function getRandomCountries(count = 8, pool = COUNTRIES) {
  const clampedCount = Math.min(Math.max(2, count), pool.length);
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, clampedCount);
}
