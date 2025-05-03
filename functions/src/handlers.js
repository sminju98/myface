const OpenAI = require('openai');
const path = require('path');
const functions = require('firebase-functions');

const openai = new OpenAI({
  apiKey: functions.config().openai.api_key
});

async function analyzeImage(req, res) {
  try {
    const { image, jobCategory } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const prompt = getJobSpecificPrompt(jobCategory);
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    const result = response.choices[0].message.content;
    res.json({ result });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
}

function generateSilhouette(req, res) {
  const { type } = req.query;
  const imageName = type === 'wife' ? 'wife.png' : 'husband.png';
  res.json({ 
    imageUrl: `https://storage.googleapis.com/myface-837d6.appspot.com/silhouettes/${imageName}`
  });
}

function getJobSpecificPrompt(jobCategory) {
  const basePrompt = "Based on this photo, create a detailed character profile including: job title, job description, personality traits, hobbies, and relationship style. Make it creative and specific, focusing on unique characteristics. Format the response in Korean language.";
  
  const categoryPrompts = {
    "IT/개발": "특히 IT 업계나 개발자의 특성을 고려해서 분석해주세요.",
    "경영/비즈니스": "특히 경영진이나 비즈니스 전문가의 특성을 고려해서 분석해주세요.",
    "예술/엔터테인먼트": "특히 예술가나 엔터테인먼트 업계 종사자의 특성을 고려해서 분석해주세요.",
    "의료/건강": "특히 의료 전문가나 건강 관련 직종의 특성을 고려해서 분석해주세요.",
    "교육": "특히 교육자나 학계 종사자의 특성을 고려해서 분석해주세요.",
    "서비스업": "특히 서비스 업종 종사자의 특성을 고려해서 분석해주세요."
  };

  return `${basePrompt} ${categoryPrompts[jobCategory] || ""}`;
}

module.exports = {
  analyzeImage,
  generateSilhouette
}; 