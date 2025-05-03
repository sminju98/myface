document.addEventListener('DOMContentLoaded', () => {
    const HusbandPhotoUpload = document.getElementById('husband-photo-upload');
    const WifePhotoUpload = document.getElementById('wife-photo-upload');
    const fortuneTeller = document.querySelector('.fortune-teller');
    const uploadSection = document.querySelector('.upload-section');

    // 예시 분석 결과 데이터
    const possibleResults = [
        {
            job: "의사 / 외과 전문의",
            jobDetail: "대학병원이나 종합병원에서 환자들의 생명을 구하는 중요한 일을 하고 있을 것 같아. 특히 수술실에서의 뛰어난 손재주와 판단력이 돋보여.",
            appearance: "신뢰감 있는 인상, 깔끔하고 지적인 분위기",
            mbti: "ISTJ / INTJ",
            personality: [
                "신중하고 책임감 강함",
                "정확하고 체계적인 성격",
                "환자를 대할 때는 따뜻한 마음씨",
                "스트레스 관리 능력이 뛰어남"
            ],
            hobbies: [
                "의학 논문 연구",
                "클래식 음악 감상",
                "골프, 테니스 등 고급 스포츠"
            ],
            relationshipStyle: [
                "신중하게 진지한 만남을 가짐",
                "상대방의 건강을 세심하게 챙김",
                "바쁜 일정 속에서도 데이트 시간 확보"
            ]
        },
        {
            job: "스타트업 CEO / 연쇄 창업가",
            jobDetail: "혁신적인 아이디어로 여러 스타트업을 성공시키고 있을 것 같아. 특히 IT, 테크 분야에서 뛰어난 비즈니스 감각을 보여줘.",
            appearance: "카리스마 있는 눈빛, 세련된 패션 감각",
            mbti: "ENTJ / ENTP",
            personality: [
                "도전적이고 혁신적인 사고방식",
                "리더십이 뛰어나고 결단력 있음",
                "트렌드에 민감하고 선견지명 있음",
                "열정적이고 에너지 넘침"
            ],
            hobbies: [
                "새로운 기술 트렌드 탐구",
                "투자 및 재테크",
                "네트워킹 모임 참석"
            ],
            relationshipStyle: [
                "효율적이고 실용적인 데이트",
                "파트너의 성장을 응원하고 지원",
                "럭셔리한 데이트 코스 선호"
            ]
        },
        {
            job: "글로벌 투자은행 임원",
            jobDetail: "세계적인 투자은행에서 대규모 프로젝트를 이끌고 있을 것 같아. M&A, IPO 등 굵직한 딜을 성사시키는 실력자야.",
            appearance: "프로페셔널한 분위기, 날카로운 눈빛",
            mbti: "ESTJ / ENTJ",
            personality: [
                "분석력과 통찰력이 뛰어남",
                "목표 지향적이고 성과 중심적",
                "국제감각이 뛰어나고 언어 능력 우수",
                "스트레스에 강하고 추진력 있음"
            ],
            hobbies: [
                "와인 컬렉션",
                "요트 세일링",
                "해외 럭셔리 여행"
            ],
            relationshipStyle: [
                "고급스러운 데이트 선호",
                "장기적인 관계 계획 중시",
                "파트너의 사회적 성공 지원"
            ]
        },
        {
            job: "AI 연구소장 / 데이터 사이언티스트",
            jobDetail: "최첨단 AI 기술을 연구하고 개발하는 팀을 이끌고 있을 것 같아. 특히 머신러닝과 딥러닝 분야에서 혁신적인 성과를 내고 있어.",
            appearance: "지적이고 창의적인 분위기",
            mbti: "INTP / INTJ",
            personality: [
                "논리적이고 분석적인 사고",
                "끊임없는 호기심과 탐구심",
                "문제 해결 능력이 뛰어남",
                "독창적인 아이디어가 많음"
            ],
            hobbies: [
                "프로그래밍",
                "과학 서적 독서",
                "첨단 기기 수집"
            ],
            relationshipStyle: [
                "지적인 대화를 즐기는 데이트",
                "논리적이고 합리적인 관계",
                "파트너의 지적 성장 지원"
            ]
        },
        {
            job: "유명 건축가 / 디자인 스튜디오 대표",
            jobDetail: "세계적으로 인정받는 건축물을 디자인하고 있을 것 같아. 예술성과 실용성을 겸비한 작품으로 많은 상을 받았을 거야.",
            appearance: "예술가적인 감성, 독특한 패션 센스",
            mbti: "INFJ / ENFP",
            personality: [
                "창의적이고 예술적인 감각",
                "완벽주의적 성향",
                "공간에 대한 뛰어난 이해력",
                "환경과 지속가능성 중시"
            ],
            hobbies: [
                "스케치와 드로잉",
                "건축물 투어",
                "현대 미술 감상"
            ],
            relationshipStyle: [
                "감성적이고 로맨틱한 데이트",
                "예술적 취향을 공유",
                "아름다운 공간에서의 만남 선호"
            ]
        },
        {
            job: "글로벌 패션 브랜드 크리에이티브 디렉터",
            jobDetail: "세계적인 럭셔리 브랜드의 크리에이티브를 총괄하고 있을 것 같아. 트렌드를 선도하는 혁신적인 컬렉션으로 주목받고 있어.",
            appearance: "패셔너블하고 세련된 스타일",
            mbti: "ENFJ / ENFP",
            personality: [
                "트렌드에 대한 뛰어난 직관",
                "예술적 감각이 뛰어남",
                "커뮤니케이션 능력이 좋음",
                "리더십과 창의성 겸비"
            ],
            hobbies: [
                "아트 갤러리 방문",
                "빈티지 쇼핑",
                "패션 위크 참석"
            ],
            relationshipStyle: [
                "스타일리시한 데이트",
                "문화예술을 함께 즐김",
                "감각적인 선물 교환"
            ]
        },
        {
            job: "국제기구 고위 임원",
            jobDetail: "UN이나 국제기구에서 중요한 역할을 맡고 있을 것 같아. 글로벌 이슈 해결을 위해 전 세계를 누비며 활동하고 있어.",
            appearance: "품격 있고 신뢰감 있는 분위기",
            mbti: "ENFJ / INFJ",
            personality: [
                "글로벌 마인드",
                "뛰어난 언어 능력",
                "외교적 수완이 좋음",
                "사회 정의에 대한 강한 신념"
            ],
            hobbies: [
                "다양한 문화 체험",
                "국제 컨퍼런스 참석",
                "외국어 학습"
            ],
            relationshipStyle: [
                "문화적 다양성 존중",
                "지적이고 성숙한 관계",
                "사회적 가치 공유"
            ]
        },
        {
            job: "우주항공 연구원 / NASA 수석 연구원",
            jobDetail: "우주 탐사 프로젝트를 이끌고 있을 것 같아. 새로운 발견과 혁신적인 연구로 우주 과학 발전에 기여하고 있어.",
            appearance: "지적이고 진지한 분위기",
            mbti: "INTJ / INTP",
            personality: [
                "과학적 탐구심이 강함",
                "혁신적인 문제 해결 능력",
                "끊임없는 학구열",
                "정확하고 체계적인 성격"
            ],
            hobbies: [
                "천체 관측",
                "과학 다큐멘터리 시청",
                "로켓 모델 제작"
            ],
            relationshipStyle: [
                "지적 호기심을 공유",
                "함께 우주의 신비 탐구",
                "과학적이고 논리적인 소통"
            ]
        },
        {
            job: "글로벌 미디어 그룹 CEO",
            jobDetail: "세계적인 미디어 기업을 이끌고 있을 것 같아. 디지털 혁신과 콘텐츠 전략으로 업계를 선도하고 있어.",
            appearance: "카리스마 있고 세련된 이미지",
            mbti: "ENTJ / ENTP",
            personality: [
                "선견지명이 뛰어남",
                "전략적 사고 능력",
                "뛰어난 커뮤니케이션 스킬",
                "트렌드를 읽는 눈"
            ],
            hobbies: [
                "미디어 트렌드 분석",
                "글로벌 컨퍼런스 참석",
                "하이엔드 네트워킹"
            ],
            relationshipStyle: [
                "지적 대화가 있는 만남",
                "문화 예술 공유",
                "고급스러운 데이트"
            ]
        },
        {
            job: "세계적인 게임 개발사 대표",
            jobDetail: "혁신적인 게임을 개발하는 회사를 이끌고 있을 것 같아. e스포츠와 메타버스 분야에서 새로운 패러다임을 제시하고 있어.",
            appearance: "창의적이고 젊은 감각의 리더",
            mbti: "ENTP / INTP",
            personality: [
                "창의적인 아이디어가 풍부",
                "기술적 통찰력이 뛰어남",
                "트렌드에 민감",
                "도전정신이 강함"
            ],
            hobbies: [
                "게임 개발 및 테스트",
                "새로운 기술 탐구",
                "e스포츠 관람"
            ],
            relationshipStyle: [
                "게임과 취미 공유",
                "기술적 관심사 공유",
                "창의적인 데이트"
            ]
        }
    ];

    // 남편 사진 업로드
    HusbandPhotoUpload.addEventListener('change', async (event) => {
        handlePhotoUpload(event.target.files[0], 'husband');
    });

    // 아내 사진 업로드
    WifePhotoUpload.addEventListener('change', async (event) => {
        handlePhotoUpload(event.target.files[0], 'wife');
    });

    // 사진 처리 함수
    async function handlePhotoUpload(file, type) {
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.');
                return;
            }

            showLoading();
            uploadSection.style.display = 'none';

            // 재미있는 로딩 메시지들
            const loadingMessages = document.querySelector('.loading-messages');
            
            // 메시지 순차적으로 표시
            const messageInterval = setInterval(() => {
                if (loadingMessages.children.length > 3) {
                    loadingMessages.removeChild(loadingMessages.children[0]);
                }
            }, 2000);

            // 이미지 처리 및 API 호출
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const response = await fetch('https://asia-northeast3-myface-app-388888.cloudfunctions.net/api/analyze-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            analysisType: type,
                            imageData: e.target.result
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || '분석 중 오류가 발생했습니다.');
                    }

                    // 인터벌 정리
                    clearInterval(messageInterval);
                    showResult(e.target.result, type, data.analysis);
                } catch (error) {
                    console.error('Error:', error);
                    clearInterval(messageInterval);
                    alert(error.message || '분석 중 오류가 발생했습니다. 다시 시도해주세요.');
                    location.reload();
                }
            };

            reader.onerror = function() {
                console.error('FileReader error:', reader.error);
                clearInterval(messageInterval);
                alert('이미지 파일을 읽는 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.');
                location.reload();
            };

            reader.readAsDataURL(file);
        }
    }

    function showResult(imageUrl, type, analysis) {
        // 직업 추출
        const jobMatch = analysis.match(/💼 직업\n([^\n]+)/);
        const job = jobMatch ? jobMatch[1] : '미상';
        
        // 결과 화면 HTML 생성
        const resultHTML = `
            <div id="header"></div>
            <div class="container">
                <div class="fortune-teller">
                    <div class="result-card">
                        <p class="subtitle">당신의 운명의 배우자입니다.✨</p>
                        <img src="${type === 'husband' ? '/husband.png' : '/wife.png'}" alt="미래의 ${type === 'husband' ? '남편' : '아내'}" class="spouse-image">
                        <div class="analysis-text">${analysis}</div>
                        <div class="button-container">
                            <button class="share-button" onclick="shareLink()">
                                <i class="fas fa-link"></i> 링크로 공유하기
                            </button>
                            <button class="retry-button" onclick="location.reload()">다시 해보기 🔄</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="footer"></div>
        `;

        document.body.innerHTML = resultHTML;

        // 실루엣 이미지 생성
        generateSilhouette(job, type);

        // 헤더/푸터 다시 로드
        if (typeof loadComponent === 'function') {
            loadComponent('header.html', 'header');
            loadComponent('footer.html', 'footer');
        }
    }

    async function generateSilhouette(job, type) {
        try {
            const response = await fetch('https://asia-northeast3-myface-app-388888.cloudfunctions.net/api/generate-silhouette', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    job: job,
                    analysisType: type
                })
            });

            if (!response.ok) {
                throw new Error('실루엣 생성에 실패했습니다.');
            }

            const data = await response.json();
            const spouseImage = document.querySelector('.spouse-image');
            if (spouseImage) {
                spouseImage.src = data.imageUrl;
            }
        } catch (error) {
            console.error('Error generating silhouette:', error);
        }
    }

    // 공유 기능
    window.shareLink = function() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('링크가 클립보드에 복사되었습니다!');
        }).catch(err => {
            console.error('링크 복사 실패:', err);
            alert('링크 복사에 실패했습니다. 다시 시도해주세요.');
        });
    };

    // 드래그 앤 드롭 기능
    const uploadButtons = document.querySelectorAll('.upload-button');
    uploadButtons.forEach(button => {
        button.addEventListener('dragover', (e) => {
            e.preventDefault();
            button.style.background = '#2980b9';
        });

        button.addEventListener('dragleave', () => {
            button.style.background = button.classList.contains('husband-button') ? 
                'linear-gradient(45deg, #4b6cb7, #182848)' : 
                'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
        });

        button.addEventListener('drop', (e) => {
            e.preventDefault();
            button.style.background = button.classList.contains('husband-button') ? 
                'linear-gradient(45deg, #4b6cb7, #182848)' : 
                'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const type = button.classList.contains('husband-button') ? 'husband' : 'wife';
                const input = document.getElementById(`${type}-photo-upload`);
                input.files = e.dataTransfer.files;
                const event = new Event('change');
                input.dispatchEvent(event);
            }
        });
    });

    // 남자 연예인 목록
    const celebrities = [
        "송중기처럼 부드러운 외모",
        "정해인처럼 청량한 미소",
        "이종석처럼 시크한 분위기",
        "박보검처럼 순수한 이미지",
        "공유처럼 카리스마 있는 외모",
        "김수현처럼 깊이 있는 눈빛",
        "이동욱처럼 세련된 분위기",
        "남주혁처럼 훤칠한 외모",
        "서강준처럼 세련된 이목구비",
        "양세종처럼 따뜻한 미소",
        "차은우처럼 완벽한 이목구비",
        "이수혁처럼 모델같은 외모",
        "박서준처럼 젠틀한 분위기",
        "지창욱처럼 강인한 이미지"
    ];
    // 여자 연예인 목록 추가
    const femaleCelebrities = [
        "김연아처럼 우아한 외모",
        "송혜교처럼 청순한 미모",
        "전지현처럼 세련된 분위기",
        "수지처럼 청순한 이미지",
        "아이유처럼 사랑스러운 외모",
        "한가인처럼 고급스러운 미모",
        "신민아처럼 사랑스러운 분위기",
        "손예진처럼 우아한 외모",
        "김태희처럼 완벽한 이목구비",
        "박민영처럼 상큼한 미소",
        "문채원처럼 청순한 매력",
        "한효주처럼 깨끗한 이미지",
        "이나영처럼 지적인 분위기",
        "고아라처럼 밝은 미소"
    ];

    function showLoading() {
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        
        loadingScreen.innerHTML = `
            <div class="cat-container">
                <div class="cat">
                    <div class="cat-body"></div>
                    <div class="cat-head">
                        <div class="cat-ear left"></div>
                        <div class="cat-ear right"></div>
                        <div class="cat-face">
                            <div class="cat-eyes">
                                <div class="cat-eye"></div>
                                <div class="cat-eye"></div>
                            </div>
                        </div>
                    </div>
                    <div class="cat-tail"></div>
                </div>
            </div>
            <div class="loading-text">
                <h3>분석중...</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="loading-messages"></div>
            </div>
        `;

        document.body.appendChild(loadingScreen);

        const messages = [
            "🔍 얼굴형을 분석하고 있어요...",
            "👀 눈의 형태를 살펴보고 있어요...",
            "👃 코의 특징을 파악하고 있어요...",
            "👄 입술의 모양을 확인하고 있어요...",
            "✨ 전체적인 이미지를 분석하고 있어요...",
            "💫 운명의 상대를 찾고 있어요...",
            "💝 당신의 인연을 확인하고 있어요...",
            "🎯 최적의 매칭을 계산하고 있어요...",
            "📝 분석 결과를 정리하고 있어요...",
            "🌟 결과를 생성하고 있어요..."
        ];

        const loadingMessages = loadingScreen.querySelector('.loading-messages');
        let currentMessageIndex = 0;

        function updateMessage() {
            if (currentMessageIndex < messages.length) {
                const messageElement = document.createElement('p');
                messageElement.textContent = messages[currentMessageIndex];
                messageElement.style.opacity = '0';
                
                loadingMessages.appendChild(messageElement);
                
                // Fade in the message
                setTimeout(() => {
                    messageElement.style.opacity = '1';
                }, 100);

                // Keep only the last 3 messages visible
                if (loadingMessages.children.length > 3) {
                    loadingMessages.removeChild(loadingMessages.children[0]);
                }

                currentMessageIndex++;
                setTimeout(updateMessage, 2000); // Show new message every 2 seconds
            }
        }

        updateMessage();
    }

    function hideLoading() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.remove();
        }
    }
}); 