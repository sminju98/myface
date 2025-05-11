# MyFace - AI 기반 성형 상담 서비스

MyFace는 인공지능을 활용한 성형 상담 서비스입니다. 사용자의 얼굴 사진을 분석하여 맞춤형 성형 상담과 견적을 제공합니다.

## 주요 기능

- AI 기반 얼굴 분석
- 맞춤형 성형 상담
- 현실적인 견적 산출
- 다양한 시술 추천

## 기술 스택

- Frontend: React.js
- Backend: Node.js, Firebase Functions
- AI: OpenAI GPT-4 Vision
- Database: Firebase
- Storage: Firebase Storage

## 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/yourusername/myface.git
cd myface
```

2. 의존성 설치
```bash
npm install
cd functions
npm install
```

3. 환경 변수 설정
- `.env` 파일을 생성하고 다음 변수들을 설정:
```
OPENAI_API_KEY=your_openai_api_key
```

4. 개발 서버 실행
```bash
npm run dev
```

## 배포

Firebase를 통한 배포:
```bash
firebase deploy
```

## 라이선스

MIT License

## 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 