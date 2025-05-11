# MyFace - AI 기반 얼굴 분석 서비스

MyFace는 사용자의 얼굴 사진을 분석하여 다양한 정보를 제공하는 AI 기반 서비스입니다.

## 주요 기능

- **연예인 닮은꼴 분석**: 얼굴을 분석하여 닮은 연예인을 찾아줍니다.
- **동물상 분석**: 얼굴을 분석하여 닮은 동물상을 찾아줍니다.
- **MBTI 분석**: 얼굴 표정과 포즈를 분석하여 MBTI를 예측합니다.
- **성형 상담**: 얼굴을 분석하여 성형 상담을 제공합니다.
- **미래 배우자 분석**: 얼굴을 분석하여 미래 배우자의 연봉과 직업을 예측합니다.

## 기술 스택

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- AI: OpenAI GPT-4 Vision
- Cloud: Firebase Functions, Firebase Hosting

## 시작하기

### 필수 조건

- Node.js 18 이상
- Firebase CLI
- OpenAI API 키

### 설치

1. 저장소 클론
```bash
git clone https://github.com/yourusername/myface.git
cd myface
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일에 OpenAI API 키 등 필요한 환경 변수 설정
```

4. Firebase 설정
```bash
firebase login
firebase init
```

5. 개발 서버 실행
```bash
npm run dev
```

## 배포

```bash
firebase deploy
```

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 