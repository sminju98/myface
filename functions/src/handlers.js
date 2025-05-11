const OpenAI = require('openai');
const path = require('path');
const functions = require('firebase-functions');
const axios = require('axios');
const os = require('os');
const fs = require('fs');

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
      console.error('OpenAI 응답 파싱 실패:', result); // 원본 응답 로그
      parsed = { 
        job: '', 
        lookalike: '', 
        mbti: '', 
        personality: '', 
        hobby: '', 
        love_style: '', 
        raw: result,
        error: 'AI 응답 파싱 실패'
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
    spouseTarget = '미래 남편(이성)의 닮은꼴(반드시 남자 연예인, 유튜버, 인플루언서 등 남성 유명인 중 한 명만, 여자 연예인/여성 유명인은 절대 넣지 마세요. 못생기거나 평범하게 생긴 연예인도 포함하세요.)';
  } else if (spouseGender === 'wife') {
    spouseTarget = '미래 아내(이성)의 닮은꼴(반드시 여자 연예인, 유튜버, 인플루언서 등 여성 유명인 중 한 명만, 남자 연예인/남성 유명인은 절대 넣지 마세요. 못생기거나 평범하게 생긴 연예인도 포함하세요.)';
  } else {
    spouseTarget = '닮은꼴(연예인, 유튜버, 인플루언서 등 유명인 중 한 명)';
  }
  return `이 사진을 바탕으로 아래 항목을 반드시 JSON 형식으로 반환해. 각 항목은 한 줄로 써줘.\n- job: 직업 (예: 의사 등 의료계열, 바리스타 등 커피 업종 등)\n- job_group: 대표적인 직업군 중 하나 (IT/개발, 디자인/예술, 교육/연구, 의료/보건, 서비스/요식업, 영업/마케팅, 금융/회계, 공무원/공공기관, 미디어/방송, 기타)\n- lookalike: ${spouseTarget}, 예: 차은우\n- similarity: 닮은 정도 (0~100 사이의 숫자, 예: 94)\n- mbti: MBTI (예: ENTP)\n- personality: 성격 (한 문장, 단순하게)\n- hobby: 취미 (한 문장, 단순하게)\n- love_style: 연애스타일 (한 문장, 단순하게)\n코드블록 없이 JSON만 반환해. 예시:\n{\n  \"job\": \"의사 등 의료계열\",\n  \"job_group\": \"의료/보건\",\n  \"lookalike\": \"차은우\",\n  \"similarity\": 94,\n  \"mbti\": \"ENTP\",\n  \"personality\": \"호기심 많고 유쾌함\",\n  \"hobby\": \"카페 투어를 즐김\",\n  \"love_style\": \"티 안 내지만 은근히 챙겨주는 스타일\"\n}`;
}

async function analyzeCelebrity(req, res) {
  const { imageData } = req.body;
  try {
    const prompt = `이 사진과 가장 닮은 실제 한국 연예인, 유튜버, 인플루언서 등 유명인을 찾아서 아래 JSON 형식으로 반환해줘. 
- 예쁘거나 잘생긴 사용자는 예쁘거나 잘생긴 연예인으로 찾고 못생긴 사용자는 못생긴 연예인으로 찾아줘.
- 외모가 평범하거나 못생기거나 개성 있는 인물도 포함해서 찾아줘.
- 닮은 정도는 0~100%로 표현하되, 실제로 닮은 정도보다 10~20% 정도 낮게 평가해줘.
- '없음', '특정할 수 없음' 등으로 답하지 말고, 무조건 실제 인물 이름을 써줘.
- 코드블록(\`\`\`) 없이 JSON만 반환해.

예시:
{
  "name": "유재석",
  "similarity": 65
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
      temperature: 1.2
    });
    let content = completion.choices[0].message.content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/```json|```/g, '').trim();
    }
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error('OpenAI 응답 파싱 실패:', content); // 원본 응답 로그
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
  const prompts = [
    // 90% 이상
    {
      min: 90,
      texts: [
        "쌍둥이도 이 정도는 아닐 거예요!",
        "DNA 검사해도 이 정도는 안 나올 거예요!",
        "가족도 헷갈릴 정도로 닮았어요!",
        "본인도 헷갈릴 정도로 닮았어요!",
        "이 정도면 닮은꼴 대회 1등감이에요!"
      ]
    },
    // 80-89%
    {
      min: 80,
      texts: [
        "KTX 타고 가면서 보면 닮았어요!",
        "지하철에서 우연히 마주치면 헷갈릴 거예요!",
        "이 정도면 닮은꼴 대회 출전 가능해요!",
        "가족들도 인정하는 닮은꼴이에요!",
        "본인도 인정하는 닮은꼴이에요!"
      ]
    },
    // 70-79%
    {
      min: 70,
      texts: [
        "억울하게 닮았어요!",
        "이 정도면 닮은꼴이라고 해도 될 것 같아요!",
        "분위기가 비슷해서 닮아 보여요!",
        "특정 각도에서 보면 닮았어요!",
        "옆모습이 특히 닮았어요!"
      ]
    },
    // 60-69%
    {
      min: 60,
      texts: [
        "어딘가 분위기가 비슷해요!",
        "특정 표정에서 닮은 점이 보여요!",
        "눈빛이 비슷해요!",
        "웃을 때 닮은 점이 보여요!",
        "분위기가 닮았어요!"
      ]
    },
    // 50-59%
    {
      min: 50,
      texts: [
        "조금 닮은 것 같기도...?",
        "분위기만 비슷한 것 같아요!",
        "특정 각도에서만 닮아 보여요!",
        "눈빛만 비슷한 것 같아요!",
        "웃을 때만 닮은 것 같아요!"
      ]
    },
    // 50% 미만
    {
      min: 0,
      texts: [
        "음... 닮은 점을 찾아보는 중이에요!",
        "분위기가 조금 비슷한 것 같아요!",
        "특정 표정에서 닮은 점이 보여요!",
        "눈빛이 조금 비슷해요!",
        "웃을 때 조금 닮은 것 같아요!"
      ]
    }
  ];

  // 해당하는 범위의 텍스트 배열 찾기
  const range = prompts.find(p => percent >= p.min);
  if (!range) return "음... 닮은 점을 찾아보는 중이에요!";

  // 랜덤하게 텍스트 선택
  const randomIndex = Math.floor(Math.random() * range.texts.length);
  return range.texts[randomIndex];
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
      temperature: 1.2
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

async function analyzeSurgery(req, res) {
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

    const prompt = `당신은 20년 경력의 성형외과 전문의입니다. 고객에게 성형 상담을 해주어야 합니다.

- 수익을 최대화해야 하므로, 조금이라도 개선 여지가 보이면 적극적으로 성형을 권장하세요.
- 단, 고객이 미인인 경우에는 성형은 지양하고, 가벼운 피부과 시술 0~2개 정도만 추천하세요.
- 이미 예쁘거나 잘생긴 부위에는 성형을 권하지 말고, 자연스러운 아름다움을 유지하라고 안내하세요.
- 고객의 외모에서 개선이 필요한 부분에만 성형 또는 피부과 시술을 추천하세요.
- 추천 항목은 총 10개 미만으로 제한하세요 (최대 9개).
- 고객이 보통 외모거나 개선 여지가 많다면, 총 견적은 가능한 한 높게 설정하세요 (최소 1,000만원 이상 권장).
- 시술 가격은 현실적이어야 합니다. 비정상적인 가격을 책정하지마세요.
- 일반적인 시술 가격 범위:
  * 보톡스: 10~30만원
  * 필러: 30~100만원
  * 레이저 시술: 20~50만원
  * 눈 성형: 200~400만원
  * 코 성형: 300~500만원
  * 턱 성형: 300~500만원
  * 광대 축소: 200~400만원
  * 지방흡입: 200~400만원
  * 리프팅: 300~500만원

- recommend는 반드시 각 시술을 아래와 같은 객체 배열로 반환 (문자열 배열 금지)
예시:
"recommend": [
  { "name": "턱 보톡스", "description": "턱 근육 축소로 갸름한 턱선", "price": 20, "type": "성형" },
  { "name": "피부 리프팅", "description": "탄력 개선 및 주름 완화", "price": 300, "type": "피부과" }
]
- estimate: 총 견적(만원)
- feedback: 총체적 평가 한 줄

코드블록, 설명, 예시, 기타 텍스트 절대 넣지 말고, JSON만 반환해.`;

    try {
      console.log('OpenAI API 호출 시작');
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.9,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageData } }
            ]
          }
        ]
      });

      console.log('OpenAI API 호출 성공');
      console.log('응답 데이터:', {
        model: completion.model,
        finish_reason: completion.choices[0].finish_reason,
        message_length: completion.choices[0].message.content.length
      });

      let content = completion.choices[0].message.content.trim();
      console.log('원본 응답:', content);

      if (content.startsWith('```')) {
        content = content.replace(/```json|```/g, '').trim();
        console.log('코드블록 제거 후:', content);
      }

      let result;
      try {
        result = JSON.parse(content);
      } catch (e) {
        console.error('OpenAI 응답 파싱 실패:', content); // 원본 응답 로그
        result = {
          recommend: [
            { name: "이마 지방이식", description: "납작한 이마에 볼륨감을 더해 입체감 부여", price: 180, type: "성형" },
            { name: "눈 성형", description: "속쌍꺼풀 라인 개선 및 눈매 교정", price: 250, type: "성형" },
            { name: "레이저토닝", description: "피부톤 균일화 및 광채 개선", price: 30, type: "피부과" }
          ],
          estimate: 460,
          feedback: "전반적으로 개선이 필요한 얼굴입니다.",
          error: 'AI 응답 파싱 실패',
          raw: content
        };
      }

      res.json({ result });
    } catch (error) {
      console.error('성형 견적 분석 중 오류:', error);
      res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
    }
  } catch (error) {
    console.error('성형 견적 분석 중 오류:', error);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
}

async function analyzeHusbandSalary(req, res) {
  try {
    const { imageData, analysisType } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: '이미지가 필요합니다.' });
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

    const prompt = `당신은 결혼정보회사 매니저입니다. 사용자의 얼굴을 분석하여 미래 남편의 연봉과 직업을 예측해주세요. 사용자의 얼굴이 예쁠수록 결혼정보회사 등급이 높아서 고연봉 남성을 만나게 됩니다. description에는 재미있는 고백멘트를 써주세요.

다음과 같은 기준으로 분석해주세요:
1. 결혼정보회사 등급:
   - 상위 5%: 10억원 이상 (성공한 스타트업 대표, 스타강사, 배우, 아이돌, 건물주 등)
   - 상위 10%: 3억원 이상 (대기업 임원, 증권맨, 치과의사, 성형외과 의사, 변호사, 구독자 100만 유튜버, 국가대표 운동선수 등)
   - 상위 20%: 1억원 이상 (대기업 직원, 자영업 사장님, 변리사, 세무사)
   - 상위 50%: 5천만원 이상 (중견기업 직원, 개발자, 영업직)
   - 상위 60%: 4천만원 이상 (중소기업 직원, 공무원, 기자 등)
   - 상위 70%: 2천만원~3천만원 (일반 사무직, 서비스업, 비정규직 등)
   - 상위 80%: 1천만원~1500만원 (편의점 아르바이트생, 쿠팡맨, 배달 라이더, 예술가, 음악인 등)
   - 상위 90%~100%: 0원 (무직, 학생 등)

2. 직업군:
   - IT/기술: 개발자, 엔지니어, 데이터 사이언티스트, IT 서포터, 웹디자이너 등
   - 금융: 투자은행, 증권, 자산관리, 은행원, 보험설계사, 세무사무직 등
   - 의료: 의사, 약사, 의료기기, 병원 행정직, 의료기사 등
   - 법률: 변호사, 법무사, 법원 행정직, 법률사무직 등
   - 교육: 교수, 강사, 교사, 학원강사, 교육행정직 등
   - 기업: 대기업 직원, 스타트업 대표, 중소기업 직원, 영업직, 마케팅직 등
   - 전문직: 건축가, 회계사, 세무사, 공인중개사, 요리사, 미용사 등
   - 서비스업: 요식업, 소매업, 운수업, 숙박업, 미용업 등
   - 공공기관: 공무원, 공기업 직원, 비정규직 등
   - 자영업: 소상공인, 프랜차이즈 점주, 온라인 쇼핑몰 운영 등
   - 무직 : 학생, 백수

다음 JSON 형식으로 응답해주세요:
{
    "salary": "연봉 금액 (숫자만)",
    "job": "예상 직업",
    "description": "상세 설명"
}

예시 응답:
{
    "salary": "8500",
    "job": "IT 기업 개발팀장",
    "description": "당신의 얼굴에 반한 개발팀장이 사랑의 하트 코드를 선물합니다."
}

{
    "salary": "1500",
    "job": "편의점 아르바이트생",
    "description": "편의점 아르바이트생이 당신에게 삼각김밥을 선물합니다."
}`;

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
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json({ result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다.' });
  }
}

async function analyzeMbti(req, res) {
    try {
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ error: '이미지가 필요합니다.' });
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

        const prompt = `당신은 MBTI 전문가입니다. 이 사람의 얼굴 표정, 눈빛, 포즈, 전체적인 분위기를 분석하여 MBTI를 예측해주세요.

MBTI 분석 시 다음 요소들을 고려해주세요:
1. E/I (외향/내향): 표정의 활발함, 눈빛의 방향, 포즈의 개방성
2. S/N (감각/직관): 시선의 집중도, 표정의 현실감/몽환감
3. T/F (사고/감정): 표정의 논리성/감성적 표현
4. J/P (판단/인식): 포즈의 정돈됨/자유로움, 표정의 결정성/유연성

다음 형식으로만 응답해주세요:
{
    "mbti": "예측된 MBTI (예: INTJ)",
    "description": "이 MBTI의 특징과 설명 (2-3문장)",
    "traits": {
        "e_i": "외향/내향 설명",
        "s_n": "감각/직관 설명",
        "t_f": "사고/감정 설명",
        "j_p": "판단/인식 설명"
    }
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
            max_tokens: 1000,
            temperature: 1.2
        });

        let content = completion.choices[0].message.content.trim();
        if (content.startsWith('```')) {
            content = content.replace(/```json|```/g, '').trim();
        }

        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            console.error('OpenAI 응답 파싱 실패:', content);
            result = {
                mbti: "INTJ",
                description: "논리적이고 창의적인 성격의 소유자입니다.",
                traits: {
                    e_i: "내향적인 성향이 강합니다.",
                    s_n: "직관적인 사고방식을 가졌습니다.",
                    t_f: "논리적인 판단을 선호합니다.",
                    j_p: "체계적인 계획을 좋아합니다."
                }
            };
        }

        res.json({ result });
    } catch (error) {
        console.error('MBTI 분석 중 오류:', error);
        res.status(500).json({ error: 'MBTI 분석 중 오류가 발생했습니다.' });
    }
}

module.exports = {
  analyzeImage,
  generateSilhouette,
  analyzeCelebrity,
  getImage,
  getWikipediaImage,
  analyzeAnimal,
  analyzeSurgery,
  analyzeHusbandSalary,
  analyzeMbti
}; 