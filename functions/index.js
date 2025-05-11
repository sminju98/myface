if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const functions = require('firebase-functions');
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const { analyzeImage, getFunnySimilarityText, getImage, analyzeCelebrity, analyzeAnimal, analyzeSurgery } = require('./src/handlers');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || (functions.config().openai && functions.config().openai.api_key)
});

// 닮은꼴 연예인 분석 엔드포인트
app.post('/analyze-celebrity', analyzeCelebrity);

app.post('/analyze-image', analyzeImage);
// 운명의 배우자 엔드포인트
app.post('/analyze-soulmate', analyzeImage);

// 동물상 분석 엔드포인트
app.post('/analyze-animal', analyzeAnimal);

app.post('/analyze-surgery', analyzeSurgery);

// 남편 연봉 분석 엔드포인트
app.post('/husband-salary', analyzeHusbandSalary);

// MBTI 분석 엔드포인트
app.post('/analyze-mbti', analyzeMbti);

exports.analyzeAnimal = functions.https.onRequest(app);
exports.analyzeSurgery = functions.https.onRequest(app);
exports.analyzeHusbandSalary = functions.https.onRequest(app);
exports.analyzeMbti = functions.https.onRequest(app);

exports.api = functions.https.onRequest(app); 