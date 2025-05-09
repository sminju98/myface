document.addEventListener('DOMContentLoaded', () => {
    // 업로드 버튼 id/type 매핑
    const uploadTypes = [
        { id: 'husband-photo-upload', type: 'husband' },
        { id: 'wife-photo-upload', type: 'wife' },
        { id: 'celebrity-photo-upload', type: 'celebrity' }
    ];
    const uploadSection = document.querySelector('.upload-section');
    uploadTypes.forEach(({ id, type }) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => handlePhotoUpload(e.target.files[0], type));
        }
    });

    function getApiUrl(type) {
        const base =
            (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
                ? 'http://localhost:5001/myface-837d6/us-central1/api'
                : 'https://us-central1-myface-837d6.cloudfunctions.net/api';
        if (type === 'celebrity') {
            return `${base}/analyze-celebrity`;
        } else if (type === 'animal') {
            return `${base}/analyze-animal`;
        } else {
            return `${base}/analyze-soulmate`;
        }
    }

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
            showLoading(type);
            if (uploadSection) uploadSection.style.display = 'none';
            const reader = new FileReader();
            reader.onload = async function(e) {
                const imageData = e.target.result;
                try {
                    const apiUrl = getApiUrl(type);
                    const body = (type === 'celebrity')
                        ? JSON.stringify({ imageData })
                        : JSON.stringify({ analysisType: type, imageData });
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body
                    });
                    if (!response.ok) throw new Error('API 호출 실패');
                    const data = await response.json();
                    showResult(type, data.result || data);
                } catch (err) {
                    alert('AI 분석에 실패했습니다. 다시 시도해 주세요.');
                    location.reload();
                }
            };
            reader.readAsDataURL(file);
        }
    }

    function showLoading(type) {
        // type별 메시지 분기
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        let title = '', messages = [];
        if (type === 'celebrity') {
            title = '닮은 연예인을 찾고 있어요...';
            messages = [
                '🔍 얼굴형을 분석 중...',
                '👀 눈, 코, 입의 특징을 파악 중...',
                '🎬 연예인 데이터와 비교 중...',
                '✨ 최적의 닮은꼴을 찾고 있어요...'
            ];
        } else if (type === 'animal') {
            title = '동물상 분석 중...';
            messages = [
                '🐾 얼굴 특징을 분석 중...',
                '🦊 다양한 동물상과 비교 중...',
                '😺 귀여운 동물상 후보를 찾는 중...',
                '✨ AI가 결과를 준비 중...'
            ];
        } else {
            title = '운명의 배우자를 점치는 중...';
            messages = [
                '🔮 관상 특징을 분석 중...',
                '💡 성격과 직업을 예측 중...',
                '❤️ 미래의 인연을 점치는 중...',
                '✨ AI가 결과를 준비 중...'
            ];
        }
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
                <h3>${title}</h3>
                <div class="progress-bar-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="loading-messages"></div>
            </div>
        `;
        document.body.appendChild(loadingScreen);
        const loadingMessages = loadingScreen.querySelector('.loading-messages');
        let currentMessageIndex = 0;
        function updateMessage() {
            if (currentMessageIndex < messages.length) {
                const messageElement = document.createElement('p');
                messageElement.textContent = messages[currentMessageIndex];
                messageElement.style.opacity = '0';
                loadingMessages.appendChild(messageElement);
                setTimeout(() => {
                    messageElement.style.opacity = '1';
                }, 100);
                if (loadingMessages.children.length > 3) {
                    loadingMessages.removeChild(loadingMessages.children[0]);
                }
                currentMessageIndex++;
                setTimeout(updateMessage, 1200);
            }
        }
        updateMessage();
    }

    function showResult(type, result) {
        hideLoading();
        if (type === 'celebrity') {
            console.log('celebrity similarityText:', result.similarityText);
            // celebrity 결과 카드
            const percent = result.similarity || (Math.floor(Math.random() * 21) + 80);
            const similarityText = result.similarityText ? ` (${result.similarityText})` : '';
            const resultHTML = `
                <div id="header"></div>
                <div class="container-celebrity">
                    <div class="result-card">
                        <p class="subtitle-celebrity">나랑 닮은 연예인</p>
                        <img src="${result.image}" alt="${result.name}" class="celebrity-image">
                        <div class="analysis-text">
                            <b>${result.name}</b><br>
                            <span style="color:#4b6cb7;font-weight:600;">닮은 정도: ${percent}%${similarityText}</span><br>
                            ${result.description}<br>
                        </div>
                        <div class="button-container">
                            <button class="share-button" onclick="shareLink()">
                                <i class="fas fa-link"></i> 링크로 공유하기
                            </button>
                            <button class="retry-button" onclick="location.reload()">다시 해보기 🔄</button>
                        </div>
                    </div>
                </div>
                <div id="footer"></div>
            `;
            document.body.innerHTML = resultHTML;
            if (typeof loadComponent === 'function') {
                loadComponent('header.html', 'header');
                loadComponent('footer.html', 'footer');
            }
        } else {
            console.log('soulmate similarityText:', result.similarityText);
            // soulmate 결과 카드 복구
            const spouseImg = result.spouseImage || result.image || (type === 'husband' ? 'husband.png' : 'wife.png');
            const resultHTML = `
                <div id="header"></div>
                <div class="container-soulmate">
                    <div class="fortune-teller">
                        <div class="result-card">
                            <p class="subtitle">당신의 운명의 배우자✨</p>
                            <img src="${spouseImg}" alt="미래의 ${type === 'husband' ? '남편' : '아내'}" class="spouse-image">
                            <div class="analysis-text">
                              <b>직업:</b> ${result.job || ''}<br>
                              <b>외모:</b> <span style="color:#4b6cb7;font-weight:600;">${result.lookalike || ''}</span>${result.similarityText ? ', ' + result.similarityText : ''}<br>
                              <b>MBTI:</b> ${result.mbti || ''}<br>
                              <b>성격:</b> ${result.personality || ''}<br>
                              <b>취미:</b> ${result.hobby || ''}<br>
                              <b>연애:</b> ${result.love_style || ''}<br>
                            </div>
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
            if (typeof loadComponent === 'function') {
                loadComponent('header.html', 'header');
                loadComponent('footer.html', 'footer');
            }
        }
    }

    function hideLoading() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) loadingScreen.remove();
    }

    window.shareLink = function() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('링크가 클립보드에 복사되었습니다!');
        }).catch(err => {
            console.error('링크 복사 실패:', err);
            alert('링크 복사에 실패했습니다. 다시 시도해주세요.');
        });
    };

    function showError(message, errorCode) {
        hideLoading();
        const errorHTML = `
            <div class="error-container">
                <div class="error-message">
                    <h3>😿 ${message}</h3>
                    ${errorCode === 'INVALID_IMAGE' ? `
                        <p>이미지 요구사항:</p>
                        <ul>
                            <li>최대 크기: 5MB</li>
                            <li>지원 형식: JPG, PNG, WEBP</li>
                        </ul>
                    ` : ''}
                    <button class="retry-button" onclick="location.reload()">다시 시도하기 🔄</button>
                </div>
            </div>
        `;
        document.body.innerHTML = errorHTML;
    }

    async function analyzeImage(imageData, type) {
        try {
            showLoading(type);
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageData,
                    analysisType: type
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '분석 중 오류가 발생했습니다.');
            }

            if (data.result.error) {
                throw new Error(data.result.error);
            }

            showResult(type, data.result);
        } catch (error) {
            console.error('분석 중 오류:', error);
            showError(error.message, error.errorCode);
        }
    }

    // === 나는 어떤 동물상일까 (animal.html) 전용 ===
    if (document.body.classList.contains('animal')) {
        const animalInput = document.getElementById('animal-photo-upload');
        if (animalInput) {
            animalInput.addEventListener('change', (e) => handleAnimalPhotoUpload(e.target.files[0]));
        }

        function handleAnimalPhotoUpload(file) {
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드 가능합니다.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기가 너무 큽니다. 10MB 이하의 파일을 업로드해주세요.');
                return;
            }
            showLoading('animal');
            const reader = new FileReader();
            reader.onload = async function(e) {
                const imageData = e.target.result;
                try {
                    const apiUrl = getApiUrl('animal');
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageData })
                    });
                    if (!response.ok) throw new Error('AI 분석 실패');
                    const data = await response.json();
                    showAnimalResult(data.result || data);
                } catch (err) {
                    alert('AI 분석에 실패했습니다. 다시 시도해 주세요.');
                    location.reload();
                }
            };
            reader.readAsDataURL(file);
        }

        function showAnimalResult(result) {
            hideLoading();
            const resultHTML = `
                <div id="header"></div>
                <div class="container-animal">
                    <div class="result-card">
                        <p class="subtitle-animal">나의 동물상 결과 🐾</p>
                        <img src="${result.image || ''}" alt="${result.animal_type || ''}" class="animal-image">
                        <div class="analysis-text">
                            <b>동물상:</b> <span style="color:#4b6cb7;font-weight:600;">${result.animal_type || ''}</span><br>
                            <b>닮은 정도:</b> ${result.similarity || ''}%<br>
                            <b>설명:</b> ${result.description || ''}<br>
                        </div>
                        <div class="button-container">
                            <button class="share-button" onclick="shareLink()">
                                <i class="fas fa-link"></i> 링크로 공유하기
                            </button>
                            <button class="retry-button" onclick="location.reload()">다시 해보기 🔄</button>
                        </div>
                    </div>
                </div>
                <div id="footer"></div>
            `;
            document.body.innerHTML = resultHTML;
            if (typeof loadComponent === 'function') {
                loadComponent('header.html', 'header');
                loadComponent('footer.html', 'footer');
            }
        }
    }
}); 