const OpenAI = require('openai');
const path = require('path');
const functions = require('firebase-functions');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (functions.config().openai && functions.config().openai.api_key)
});

// 이미지 유효성 검사 함수
function validateImage(base64Image) {
  try {
    // base64 헤더 제거
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 파일 크기 체크 (5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('이미지 크기는 5MB를 초과할 수 없습니다.');
    }

    // 이미지 형식 체크
    const mimeType = base64Image.match(/data:image\/([a-zA-Z]+);base64/)?.[1];
    if (!['jpeg', 'jpg', 'png', 'webp'].includes(mimeType?.toLowerCase())) {
      throw new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, WEBP만 가능)');
    }

    return true;
  } catch (error) {
    throw new Error(`이미지 검증 실패: ${error.message}`);
  }
}

async function analyzeImage(req, res) {
  try {
    const { imageData, analysisType } = req.body;

    if (!imageData) {
      return res.status(400).json({ 
        error: '이미지가 없습니다.',
        errorCode: 'NO_IMAGE'
      });
    }

    // 이미지 유효성 검사
    try {
      validateImage(imageData);
    } catch (error) {
      return res.status(400).json({ 
        error: error.message,
        errorCode: 'INVALID_IMAGE'
      });
    }

    const prompt = getSpouseGenderSpecificPrompt(analysisType);
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageData,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('AI 응답이 올바르지 않습니다.');
    }

    let result = response.choices[0].message.content;
    let parsed;
    try {
      parsed = typeof result === 'string' ? JSON.parse(result) : result;
    } catch (e) {
      parsed = { 
        job: '', 
        lookalike: '', 
        mbti: '', 
        personality: '', 
        hobby: '', 
        love_style: '', 
        raw: result,
        error: '결과 파싱에 실패했습니다.'
      };
    }

    // lookalike(닮은 연예인) 항목이 있으면 이미지 검색
    if (parsed.lookalike) {
      try {
        const celebMatch = parsed.lookalike.match(/[가-힣]{2,}/);
        const celebName = celebMatch ? celebMatch[0] : '';
        if (celebName) {
          const imageUrl = await getImage(celebName);
          parsed.image = imageUrl;
          if (analysisType === 'husband' || analysisType === 'wife') {
            parsed.spouseImage = imageUrl;
          }
        }
      } catch (error) {
        console.error('이미지 검색 실패:', error);
        parsed.imageError = '연예인 이미지를 찾을 수 없습니다.';
      }
    }

    // 닮은 정도(퍼센트)와 텍스트 생성
    const percent = typeof parsed.similarity === 'number' ? parsed.similarity : (Math.floor(Math.random() * 21) + 80);
    parsed.similarity = percent;
    parsed.similarityText = getFunnySimilarityText(percent);
    parsed.description = getFunnySimilarityText(percent);

    res.json({ result: parsed });
  } catch (error) {
    console.error('이미지 분석 중 오류 발생:', error);
    res.status(500).json({ 
      error: '이미지 분석에 실패했습니다. 잠시 후 다시 시도해주세요.',
      errorCode: 'ANALYSIS_FAILED'
    });
  }
}

function generateSilhouette(req, res) {
  const { type } = req.query;
  const imageName = type === 'wife' ? 'wife.png' : 'husband.png';
  res.json({ 
    imageUrl: `https://storage.googleapis.com/myface-837d6.appspot.com/silhouettes/${imageName}`
  });
}

function getSpouseGenderSpecificPrompt(spouseGender) {
  let spouseTarget = '';
  if (spouseGender === 'husband') {
    spouseTarget = '미래 남편(이성)의 닮은꼴(반드시 남자 연예인, 유튜버, 인플루언서 등 남성 유명인 중 한 명만, 여자 연예인/여성 유명인은 절대 넣지 마세요)';
  } else if (spouseGender === 'wife') {
    spouseTarget = '미래 아내(이성)의 닮은꼴(반드시 여자 연예인, 유튜버, 인플루언서 등 여성 유명인 중 한 명만, 남자 연예인/남성 유명인은 절대 넣지 마세요)';
  } else {
    spouseTarget = '닮은꼴(연예인, 유튜버, 인플루언서 등 유명인 중 한 명)';
  }
  return `이 사진을 바탕으로 아래 항목을 반드시 JSON 형식으로 반환해. 각 항목은 한 줄로 써줘.\n- job: 직업 (예: 의사 등 의료계열, 바리스타 등 커피 업종 등)\n- job_group: 대표적인 직업군 중 하나 (IT/개발, 디자인/예술, 교육/연구, 의료/보건, 서비스/요식업, 영업/마케팅, 금융/회계, 공무원/공공기관, 미디어/방송, 기타)\n- lookalike: ${spouseTarget}, 예: 차은우\n- similarity: 닮은 정도 (0~100 사이의 숫자, 예: 94)\n- mbti: MBTI (예: ENTP)\n- personality: 성격 (한 문장, 단순하게)\n- hobby: 취미 (한 문장, 단순하게)\n- love_style: 연애스타일 (한 문장, 단순하게)\n코드블록 없이 JSON만 반환해. 예시:\n{\n  \"job\": \"의사 등 의료계열\",\n  \"job_group\": \"의료/보건\",\n  \"lookalike\": \"차은우\",\n  \"similarity\": 94,\n  \"mbti\": \"ENTP\",\n  \"personality\": \"호기심 많고 유쾌함\",\n  \"hobby\": \"카페 투어를 즐김\",\n  \"love_style\": \"티 안 내지만 은근히 챙겨주는 스타일\"\n}`;
}

async function analyzeCelebrity(req, res) {
  const { imageData } = req.body;
  try {
    const prompt = `이 사진과 가장 닮은 실제 한국 연예인, 유튜버, 인플루언서 등 유명인(외모가 평범하거나 개성 있는 인물도 포함) 중 한 명을 아래 JSON 형식으로 반환해줘.\n- 반드시 실제 인물 이름과 닮은 정도(0~100%)만 반환해.\n- '없음', '특정할 수 없음' 등으로 답하지 말고, 무조건 실제 인물 이름을 써줘.\n- 코드블록(\`\`\`) 없이 JSON만 반환해.\n\n예시:\n{\n  \"name\": \"유재석\",\n  \"similarity\": 87\n}`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    let content = completion.choices[0].message.content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/```json|```/g, '').trim();
    }
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = {
        name: "알 수 없음",
        image: "",
        similarity: Math.floor(Math.random() * 71) + 30 // 30~100% 랜덤
      };
    }
    // Google 이미지 검색으로 실제 이미지 URL 보정
    if (result.name) {
      const googleImage = await getImage(result.name);
      if (googleImage) result.image = googleImage;
    }
    // description을 similarity 점수로 항상 생성
    if (typeof result.similarity === 'number') {
      result.description = getFunnySimilarityText(result.similarity);
    } else {
      // similarity가 없으면 랜덤 점수로 생성
      const percent = Math.floor(Math.random() * 71) + 30;
      result.similarity = percent;
      result.description = getFunnySimilarityText(percent);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'AI 분석 실패' });
  }
}

async function getImage(celebrityName) {
  // 1. 위키피디아 대표 이미지 우선 시도
  const wikiImage = await getWikipediaImage(celebrityName);
  if (wikiImage) return wikiImage;

  // 2. 없으면 기존 Google 이미지 검색 사용
  const apiKey = 'AIzaSyA81SWKhyGx_VMv111iRAY6dJcrpvx3Vnw';
  const cx = '066d790d4472d4280';
  let query = `${celebrityName} 프로필 사진 유튜버 인플루언서 연예인`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=10&safe=active&imgSize=large&imgType=photo`;
  try {
    const res = await axios.get(url);
    if (res.data.items && res.data.items.length > 0) {
      // 유효한 이미지 URL 필터링
      const validImageUrls = res.data.items
        .map(item => ({
          link: item.link,
          title: item.title,
          snippet: item.snippet
        }))
        .filter(item => {
          const link = item.link;
          const title = item.title.toLowerCase();
          const snippet = item.snippet.toLowerCase();
          const celebName = celebrityName.toLowerCase();

          // 제한된 도메인 체크
          const restrictedDomains = [
            'tiktok.com',
            'instagram.com',
            'facebook.com',
            'twitter.com',
            'pinterest.com',
            'linkedin.com',
            'naver.com',
            'daum.net',
            'cafe.naver.com',
            'blog.naver.com',
            'post.naver.com',
            'news.naver.com',
            'theqoo.net',
            'dcinside.com',
            'fmkorea.com',
            'ruliweb.com',
            'inven.co.kr',
            'gall.dcinside.com',
            'cafe.daum.net',
            'blog.daum.net',
            'm.cafe.daum.net',
            'm.blog.daum.net',
            'm.post.naver.com',
            'm.cafe.naver.com',
            'm.blog.naver.com',
            'm.news.naver.com',
            'm.theqoo.net',
            'm.dcinside.com',
            'm.fmkorea.com',
            'm.ruliweb.com',
            'm.inven.co.kr',
            'm.gall.dcinside.com'
          ];
          
          // 제한된 도메인 체크
          if (restrictedDomains.some(domain => link.includes(domain))) {
            return false;
          }

          // 이미지 파일 확장자 확인
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          if (!imageExtensions.some(ext => link.toLowerCase().endsWith(ext))) {
            return false;
          }

          // 제목이나 설명에 연예인 이름이 포함되어 있는지 확인
          if (!title.includes(celebName) && !snippet.includes(celebName)) {
            return false;
          }

          // 부적절한 키워드 필터링
          const inappropriateKeywords = ['사망', '고인', '추모', '장례', '병원', '사고', '사고사', '사망사', '부고'];
          if (inappropriateKeywords.some(keyword => title.includes(keyword) || snippet.includes(keyword))) {
            return false;
          }

          return true;
        });
      
      // 필터링된 결과가 있으면 첫 번째 이미지 반환, 없으면 원본 검색 결과의 첫 번째 이미지 반환
      return validImageUrls.length > 0 ? validImageUrls[0].link : res.data.items[0].link;
    }
    return '';
  } catch (err) {
    console.error('Google Search API error:', err.message);
    return '';
  }
}

async function getWikipediaImage(celebrityName) {
  const url = `https://ko.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(celebrityName)}&pithumbsize=400&origin=*`;
  try {
    const res = await axios.get(url);
    const pages = res.data.query.pages;
    const page = Object.values(pages)[0];
    if (page && page.thumbnail && page.thumbnail.source) {
      return page.thumbnail.source;
    }
    return '';
  } catch (e) {
    return '';
  }
}

function getFunnySimilarityText(percent) {
  if (percent >= 90) return "쌍둥이처럼 닮았어요!";
  if (percent >= 80) return "가족도 헷갈릴 정도로 닮았어요!";
  if (percent >= 70) return "KTX 타고 가면서 보면 닮았어요!";
  if (percent >= 60) return "억울하게 닮았어요!";
  if (percent >= 50) return "어딘가 분위기가 비슷해요!";
  return "조금 닮은 것 같기도...?";
}

async function analyzeAnimal(req, res) {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ 
        error: '이미지가 없습니다.',
        errorCode: 'NO_IMAGE'
      });
    }

    // 이미지 유효성 검사
    try {
      validateImage(imageData);
    } catch (error) {
      return res.status(400).json({ 
        error: error.message,
        errorCode: 'INVALID_IMAGE'
      });
    }

    const prompt = `이 사진을 보고 아래 항목을 반드시 JSON 형식으로 반환해.
- animal_type: 닮은 동물상 (고양이상, 강아지상, 여우상, 곰상, 토끼상, 사슴상, 늑대상, 판다상, 호랑이상, 사자상, 다람쥐상, 햄스터상, 부엉이상, 펭귄상, 원숭이상, 돼지상, 악어상, 코끼리상, 말상, 양상, 치타상, 수달상, 라쿤상 등 중 하나)
- similarity: 닮은 정도 (0~100 사이의 숫자)
- description: 해당 동물상에 대한 한 문장 설명 (예: "귀엽고 호기심 많은 성격")
코드블록 없이 JSON만 반환해. 예시:
{
  "animal_type": "라쿤상",
  "similarity": 88,
  "description": "장난기 많고 영리한 매력의 소유자"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    let content = completion.choices[0].message.content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/```json|```/g, '').trim();
    }
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = {
        animal_type: "고양이상",
        similarity: Math.floor(Math.random() * 51) + 50,
        description: "귀엽고 호기심 많은 성격"
      };
    }

    // 동물 이미지 검색
    try {
      const animalName = result.animal_type.replace('상', '');
      const imageUrl = await getImage(animalName);
      if (imageUrl) {
        result.image = imageUrl;
      } else {
        result.image = "https://images.unsplash.com/photo-1518717758536-85ae29035b6d"; // 기본 이미지
      }
    } catch (error) {
      console.error('동물 이미지 검색 실패:', error);
      result.image = "https://images.unsplash.com/photo-1518717758536-85ae29035b6d"; // 기본 이미지
    }

    res.json({ result });
  } catch (error) {
    console.error('동물상 분석 중 오류:', error);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
}

module.exports = {
  analyzeImage,
  generateSilhouette,
  analyzeCelebrity,
  getImage,
  getWikipediaImage,
  analyzeAnimal
}; 