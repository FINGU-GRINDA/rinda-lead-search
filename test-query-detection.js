// Test query detection
const query = "일본 뷰티 유통사 찾아줘";

const leadKeywords = [
  // English keywords
  'lead', 'leads',
  'contact', 'contacts',
  'company', 'companies',
  'extract', 'extraction',
  'find', 'search',
  'email', 'emails',
  'phone', 'phones',
  'business', 'businesses',
  'client', 'clients',
  'prospect', 'prospects',
  'drive', 'documents',
  'vendor', 'vendors',
  'supplier', 'suppliers',
  'distributor', 'distributors',
  'manufacturer', 'manufacturers',

  // Korean keywords
  '리드', '연락처', '컨택',
  '회사', '기업', '업체',
  '추출', '찾아', '검색',
  '이메일', '전화', '연락',
  '고객', '거래처', '클라이언트',
  '제조사', '유통사', '공급사', '업체',
  '비즈니스', '사업자',
  '문서', '드라이브',
  '정보', '데이터',

  // Japanese keywords (bonus)
  '会社', '企業', '連絡先',
  '取引先', '顧客',
];

const lowerQuery = query.toLowerCase();
const isLeadQuery = leadKeywords.some(keyword => lowerQuery.includes(keyword));

console.log('Query:', query);
console.log('Is Lead Query:', isLeadQuery);
console.log('Matched keywords:', leadKeywords.filter(k => lowerQuery.includes(k)));
