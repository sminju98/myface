# 지니어스캣 (GeniusCat)

AI 기반 얼굴 분석 및 재미있는 테스트 웹사이트  
[https://www.geniuscat.co.kr](https://www.geniuscat.co.kr)

---

## 주요 기능

- **동물상 테스트**: 사진을 업로드하면 닮은 동물상과 설명, 대표 이미지를 AI가 분석
- **운명의 배우자 테스트**: AI가 사진을 분석해 미래 배우자의 닮은꼴, 성격, 직업군 등 예측
- **닮은꼴 연예인 테스트**: 사진을 업로드하면 닮은 연예인과 닮은 정도, 대표 이미지를 AI가 분석
- **사이트맵, RSS, robots.txt** 등 검색엔진 최적화(SEO) 지원

---

## 폴더 구조

```
myface/
├── functions/         # Firebase Functions (AI 분석, API 핸들러)
├── public/            # 정적 파일 (HTML, CSS, JS, sitemap.xml, rss.xml 등)
├── myface-mirror/     # (옵션) Git 미러 저장소
├── firebase.json      # Firebase Hosting/Functions 설정
├── package.json       # 프로젝트 의존성
└── README.md
```

---

## 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **로컬 개발 서버 실행**
   ```bash
   firebase emulators:start
   ```

3. **배포**
   ```bash
   firebase deploy
   ```

---

## 환경 변수

- OpenAI API 키 등 민감 정보는 환경 변수 또는 Firebase Functions config로 관리합니다.

---

## 배포 주소

- 운영: [https://www.geniuscat.co.kr](https://www.geniuscat.co.kr)

---

## 라이선스

MIT License

---

## 문의

- 이슈는 [GitHub Issues](https://github.com/sminju98/myface/issues)로 남겨주세요. 