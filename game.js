class UIHelpers {
    /**
     * Tạo một Flat Button chuẩn phong cách Cyber Dark & Soft Mint
     * @param {Phaser.Scene} scene - Scene hiện tại đang gọi
     * @param {number} x - Tọa độ X
     * @param {number} y - Tọa độ Y
     * @param {string} text - Nội dung chữ trên nút
     * @param {Function} onClick - Callback khi bấm nút
     * @param {object} options - Tùy chọn mở rộng (nếu cần thay đổi kích thước)
     */
    static createFlatButton(scene, btnX, btnY, text, onClick) {
        
        let shadowBg = scene.add.rectangle(btnX, btnY + 2, 220, 46, 0x111318, 1).setOrigin(0.5).setStrokeStyle(1, 0x21262D);
        
        let faceBg = scene.add.rectangle(btnX, btnY, 220, 46, 0x1F242C)
            .setInteractive()
            .setOrigin(0.5);
        faceBg.setStrokeStyle(2, 0x3FB950);
        faceBg.setDepth(35);

        let btnText = scene.add.text(btnX, btnY, text, {
            fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(36);

        faceBg.on('pointerover', () => { 
            faceBg.setFillStyle(0x2A323D); 
            btnText.setColor('#FFFFFF');
        });
        faceBg.on('pointerout', () => { 
            faceBg.setFillStyle(0x1F242C); 
            btnText.setColor('#7EE787');
        });
        faceBg.on('pointerdown', () => { 
            faceBg.y = btnY + 2; 
            btnText.y = btnY + 2; 
        });
        faceBg.on('pointerup', () => {
            faceBg.y = btnY; 
            btnText.y = btnY;
            onClick();
        });
        return {
            shadowBg,
            faceBg,
            btnText,
            // Viết sẵn một hàm tiện ích nhỏ bên trong object để destroy luôn cho gọn
            destroy: function() {
                shadowBg.destroy();
                faceBg.destroy();
                btnText.destroy();
            }
        };
    };
}

const SoundManager = {
    // Đảm bảo AudioContext được khởi tạo sau tương tác đầu tiên của người chơi
    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    },

    // Hàm tạo tiếng Bip với tần số và thời lượng tùy chỉnh
    playBeep(frequency = 440, duration = 0.15) {
        try {
            const ctx = this.getAudioContext();
            let osc = ctx.createOscillator();
            let gain = ctx.createGain();

            osc.type = 'sine'; // Sóng sin tạo tiếng kêu tròn, dễ nghe
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);

            // Điều chỉnh âm lượng nhỏ dần để không bị chói tai
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.log("Audio not allowed yet");
        }
    },

    // 1. Âm thanh Bấm Đúng (Tiếng Ting vui tai, trong trẻo)
    playCorrect() {
        try {
            const ctx = this.getAudioContext();
            
            // Phát nhanh 2 nốt nhạc vút lên (C5 -> G5)
            [523.25, 783.99].forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle'; // Âm thanh mượt, không bị chói tai
                osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.05);

                gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.05 + 0.12);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + index * 0.05);
                osc.stop(ctx.currentTime + index * 0.05 + 0.12);
            });
        } catch (e) {}
    },

    // 2. Âm thanh Bấm Sai (Tiếng trầm, vấp nhẹ)
    playWrong() {
        try {
            const ctx = this.getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine'; // Sóng sine thuần, cực kỳ mượt mà, không bị chói
            
            // Tụt tần số nhanh từ 200Hz xuống 100Hz trong 0.12 giây
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (e) {}
    },

    // 3. Âm thanh Chiến Thắng (Giai điệu tưng bừng đi lên khi hoàn thành)
    playWin() {
        try {
            const ctx = this.getAudioContext();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // Đồ - Mi - Sol - Đố
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

                gain.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.08 + 0.2);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(ctx.currentTime + index * 0.08);
                osc.stop(ctx.currentTime + index * 0.08 + 0.2);
            });
        } catch (e) {}
    }
};

class SchulteScene extends Phaser.Scene {

    constructor() {
        super('SchulteScene');
    }

    init() {
        this.currentNumber = 1;
        this.maxNumber = 25;
        this.startTime = 0;
        this.timerText = null;
        this.isGameOver = false;
        this.isGameStarted = false;
        this.correctColor = 0x555555;
        this.wrongColor = 0xaa0000;
        this.rightColor = 0x333333;
        this.hoverColor = 0x444444;
        let savedBest = localStorage.getItem('schulte_best_time');
        this.bestTime = savedBest ? parseFloat(savedBest) : '';
    }

    preload() {
        // Tải các tài nguyên nếu cần (hình ảnh, âm thanh)
        // Với Schulte Table, bạn có thể vẽ trực tiếp bằng graphics hoặc UI thuần để tiết kiệm thời gian tải.
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x121212).setDepth(-1);
      
        // 1. Tiêu đề và Đồng hồ bấm giờ
        this.add.text(width / 2, 35, 'SCHULTE TABLE', {
            fontSize: '22px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.timerText = this.add.text(width / 2, 68, `Time: 0.0s`, {
            fontSize: '15px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);

        // 2. Tạo lưới số ngẫu nhiên (5x5)
        let numbers = Array.from({ length: this.maxNumber }, (_, i) => i + 1);
        Phaser.Utils.Array.Shuffle(numbers); // Trộn ngẫu nhiên các số từ 1-25

        const gridSize = 5;
        const startX = width / 2 - 132;
        const startY = 150;
        const cellSize = 60;

        let allCells = [];

        let index = 0;
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                let num = numbers[index++];
                let x = startX + col * (cellSize + 5);
                let y = startY + row * (cellSize + 5);

                // Vẽ ô vuông nền
                let bg = this.add.rectangle(x, y, cellSize, cellSize, this.rightColor)
                    .setInteractive()
                    .setStrokeStyle(1, 0x666666);

                // Hiển thị chữ số (BAN ĐẦU ĐỂ TRỐNG ĐỂ NGƯỜI CHƠI KHÔNG NHÌN LÉN)
                let text = this.add.text(x, y, '', {
                    fontSize: '28px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#E6EDF3',
                }).setOrigin(0.5);

                // Lưu con số chính xác vào đối tượng text để sau này fill vào
                text.correctNum = num;
                text.isRevealed = false;

                // Lưu vào mảng để quản lý
                allCells.push({ bg, text });

                // Xử lý sự kiện khi người chơi bấm vào ô số
                bg.on('pointerdown', () => {
                    if (this.isGameOver) return;
                    if (!this.isGameStarted) return;
                    

                    // Nếu bấm đúng số tiếp theo
                    if (num === this.currentNumber) {
                        bg.setFillStyle(this.correctColor); // Đổi sang màu xanh khi đúng
                        this.currentNumber++;
                        SoundManager.playCorrect();
                        // Kiểm tra chiến thắng
                        if (this.currentNumber > this.maxNumber) {
                            SoundManager.playWin();
                            this.endGame(true);
                        }
                    } else {
                        // Bấm sai (hiệu ứng nháy đỏ nhẹ hoặc phạt tùy logic của bạn)
                        bg.setFillStyle(this.wrongColor);
                        SoundManager.playWrong();
                        if (num === this.currentNumber - 1) {
                            // if click to last number, then change it to green afterward
                            this.time.delayedCall(150, () => bg.setFillStyle(this.correctColor));
                        } else {
                            this.time.delayedCall(150, () => bg.setFillStyle(this.rightColor));
                        }
                    }
                });
                bg.on('pointerover', () => {
                    // Chỉ đổi màu hover nếu game đã cho phép chơi và ô này đang ở màu mặc định
                    if (!this.isGameOver && bg.fillColor === this.rightColor) {
                        bg.setFillStyle(this.hoverColor); // Màu sáng hơn một chút so với 0x333333
                    }
                });

                bg.on('pointerout', () => {
                    // Trả về màu mặc định nếu ô đang ở trạng thái bình thường
                    if (!this.isGameOver && bg.fillColor === this.hoverColor) {
                        bg.setFillStyle(this.rightColor);
                    }
                });
            }
        }

         let overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9)
            .setDepth(10); // Đặt độ sâu cao

        let count = 3;
        let countText = this.add.text(width / 2, height / 2, count, {
            fontSize: '72px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(50);

        // Tiếng bip đầu tiên cho số 3
        SoundManager.playBeep(440, 0.15); // A4

        const revealCellsFraction = (fraction) => {
            let hiddenCells = allCells.filter(item => !item.text.isRevealed);
            let amountToFill = Math.ceil(hiddenCells.length * fraction);

            for (let i = 0; i < amountToFill && hiddenCells.length > 0; i++) {
                let randIdx = Phaser.Math.Between(0, hiddenCells.length - 1);
                let cellObj = hiddenCells[randIdx];

                cellObj.text.setText(cellObj.text.correctNum);
                cellObj.text.isRevealed = true;

                // Hiệu ứng scale nảy nhẹ khi số xuất hiện vào ô
                cellObj.text.setScale(0.3);
                this.tweens.add({
                    targets: cellObj.text,
                    scale: 1,
                    duration: 200,
                    ease: 'Back.out'
                });

                hiddenCells.splice(randIdx, 1);
            }
        };
        let displayCount = 0.05;
        this.time.addEvent({
            delay: 500,
            repeat: 6, 
            callback: () => {
                displayCount += displayCount;
                revealCellsFraction(displayCount);
            }
        });
        // Vòng lặp đếm ngược mỗi 1 giây (Sửa repeat thành 2 để chạy cho số 2 và 1, tổng chuỗi: 3 -> 2 -> 1 -> GO!)
        this.time.addEvent({
            delay: 1000,
            repeat: 3, 
            callback: () => {
                count--;
                if (count > 0) {
                    countText.setText(count);
                    SoundManager.playBeep(440, 0.15); // Tiếng bip cho số 2 và 1
                } else if (count === 0) {
                    countText.setText('GO!');
                    countText.setFill('#3FB950'); // Xanh lá nhẹ chủ đạo đồng bộ
                    SoundManager.playBeep(880, 0.3); // Tiếng "GO!" âm cao hơn
                } else {
                    // Hết đếm ngược -> Xóa chữ, bắt đầu tính giờ và cho phép click
                    countText.destroy();
                    if (typeof overlay !== 'undefined' && overlay) {
                        overlay.destroy();
                    }
                    this.isGameStarted = true;
                    this.startTime = this.time.now; // Cố định mốc thời gian bắt đầu thật sự
                }
            }
        });
       
        if (window.ytgame && window.ytgame.game && window.ytgame.game.firstFrameReady) {
            window.ytgame.game.firstFrameReady();
        }
    }

    update() {
        if (!this.isGameOver && this.startTime > 0) {
            let elapsedTime = ((performance.now() - this.startTime) / 1000).toFixed(1);
            this.timerText.setText(`Time: ${elapsedTime}s`);
        }
    }

    async endGame(isWin) {
        let thresholdToSave = 25;
        this.isGameOver = true;
        let playTime = (performance.now() - this.startTime) / 1000;
        let finalTime = parseFloat(playTime.toFixed(1));
        
        let isSave = finalTime < thresholdToSave;

        // --- SỬA LỖI LOGIC KỶ LỤC MỚI ---
        let previousBest = this.bestTime ? parseFloat(this.bestTime) : null;
        let isNewRecord = false;

        if (previousBest === null || finalTime < previousBest) {
            this.bestTime = finalTime;
            localStorage.setItem('schulte_best_time', this.bestTime);
            // Chỉ tính là kỷ lục mới nếu trước đó đã có lịch sử chơi và lần này nhanh hơn
            if (previousBest !== null) {
                isNewRecord = true;
            }
        }

        const processSavingAndDisplay = (playerName) => {
            const { width, height } = this.scale;
            
            // Nền mờ overlay xuất hiện tức thì
            this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115, 0.85);

            // --- XÁC ĐỊNH THÔNG ĐIỆP THEO 3 TRẠNG THÁI ---
            let titleText = '';
            let titleColor = '#7EE787';
            let subMessage = '';

            if (!isSave) {
                // 1. Người chơi chưa vượt threshold -> Khích lệ
                titleText = '💪 CỐ GẮNG LÊN NÀO!';
                titleColor = '#D29922'; // Màu vàng ấm khích lệ
                subMessage = 'Chưa đạt mục tiêu 25s, hãy thử lại nhé!';
            } else {
                // 2. Người chơi vượt threshold -> Khen ngợi xuất sắc
                titleText = '🎉 XUẤT SẮC TUYỆT VỜI!';
                titleColor = '#7EE787'; // Xanh lá sáng
                subMessage = 'Bạn đã vượt qua mốc thử thách!';
            }

            // 1. Hiển thị ngay thông tin cơ bản
            this.add.text(width / 2, height * 0.28, titleText, {
                fontSize: '22px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: titleColor,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.add.text(width / 2, height * 0.35, `Time: ${finalTime}s`, {
                fontSize: '18px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#E6EDF3'
            }).setOrigin(0.5);

            // 3. Hiển thị thông báo nếu chơi tốt hơn lần trước (Phá kỷ lục)
            let infoY = 0.41;
            if (isNewRecord) {
                this.add.text(width / 2, height * infoY, '⭐ KỶ LỤC MỚI CỦA BẠN!', {
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#F85149',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
                infoY += 0.05;
            } else if (subMessage) {
                this.add.text(width / 2, height * infoY, subMessage, {
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#8B949E'
                }).setOrigin(0.5);
                infoY += 0.05;
            }

            // 2. Dòng trạng thái thứ hạng (Loading nhẹ nhàng)
            let rankTextNode = this.add.text(width / 2, height * (infoY + 0.02), isSave ? 'Syncing score...' : '', {
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#8B949E'
            }).setOrigin(0.5);

            // 3. Hiển thị luôn các nút bấm tương tác
            let btnHTML = `
                <button style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 220px;
                    height: 46px;
                    background-color: #1F242C;
                    border: 2px solid #3FB950;
                    border-radius: 2px;
                    color: #7EE787;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    outline: none;
                ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.66-5.66"></path>
                    </svg>
                    PLAY AGAIN
                </button>
            `;

            let playAgainBtn = this.add.dom(width / 2, height * 0.58, 'div').createFromHTML(btnHTML);
            
            playAgainBtn.addListener('click');
            playAgainBtn.on('click', () => {
                this.scene.restart();
            });

            UIHelpers.createFlatButton(this, width / 2, height * 0.68, '🏆 LEADERBOARD', () => {
                this.scene.start('LeaderboardScene');
            });

            // Show current rank if playTime is below threshold
            if (isSave) {
                LeaderboardManager.getRank(finalTime, "schulte_table").then((myRank) => {
                    if (this && this.scene && this.scene.isActive()) {
                        let rankString = myRank ? `Your Rank: #${myRank}` : 'Your Rank: --';
                        rankTextNode.setText(rankString);
                        rankTextNode.setFontSize('16px');
                        rankTextNode.setFill('#7EE787');
                        rankTextNode.setFontStyle('bold');
                    }
                }).catch((err) => {
                    if (this && this.scene && this.scene.isActive()) {
                        rankTextNode.setText('Your Rank: -- (Offline)');
                        rankTextNode.setFill('#8B949E');
                    }
                });
                // Gọi lưu Firebase ngầm
                LeaderboardManager.save(playerName, finalTime, "schulte_table");
            }
        };

        if (isSave) {
            let existingName = localStorage.getItem('schulte_player_name');

            if (!existingName) {
                this.showNameInputDialog(finalTime, (newName) => {
                    processSavingAndDisplay(newName);
                });
            } else {
                processSavingAndDisplay(existingName);
            }

            // GỬI ĐIỂM SỐ LÊN YOUTUBE
            if (window.ytgame && window.ytgame.engagement && window.ytgame.engagement.sendScore) {
                let score = Math.max(1000 - Math.floor(finalTime * 10), 0);
                window.ytgame.engagement.sendScore({ value: score });
            }
        }
    }

    createButton3D(x, y, w, h, faceColor, shadowColor, label, callback) {
        let shadow = this.add.rectangle(x, y + 4, w, h, shadowColor).setOrigin(0.5).setDepth(21);
        let face = this.add.rectangle(x, y, w, h, faceColor).setInteractive().setOrigin(0.5).setDepth(22);
        let text = this.add.text(x, y, label, {
            fontSize: '16px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(23);

        face.on('pointerover', () => { face.y = y - 2; text.y = y - 2; });
        face.on('pointerout', () => { face.y = y; text.y = y; });
        face.on('pointerdown', () => { face.y = y + 4; text.y = y + 4; });
        face.on('pointerup', () => { callback(); });
    }


    showNameInputDialog(finalTime, onNameSubmitted) {
        const { width, height } = this.scale;

        // 1. Lớp nền tối mờ che toàn màn hình
        let overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(30);

        // 2. Khung nền popup (Modal Box)
        let modalBg = this.add.rectangle(width / 2, height / 2, width * 0.85, 280, 0x161B22)
            .setStrokeStyle(2, 0x3FB950)
            .setOrigin(0.5)
            .setDepth(31);

        let titleText = this.add.text(width / 2, height / 2 - 75, '🏆 NEW RECORD!', {
            fontSize: '22px', 
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787', 
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(32);

        let subText = this.add.text(width / 2, height / 2 - 30, `Time: ${finalTime}s\nEnter your name to save score!`, {
            fontSize: '13px', 
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E', 
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5).setDepth(32);

        // 4. Ô Input HTML DOM (Tăng chiều rộng lên một chút từ 140px lên 220px cho rộng rãi)
        let savedName = localStorage.getItem('schulte_player_name') || '';
        let nameInput = this.add.dom(width/2, height / 2 + 25, 'div', `
            width: 220px;
            height: 46px;
            position: relative;
        `).setDepth(32);

        nameInput.node.innerHTML = `
                <style>
                    .cyber-input::placeholder { 
                        color: #6e7681 !important; 
                        opacity: 1 !important;
                        transition: opacity 0.2s ease;
                    }
                    .cyber-input:focus::placeholder { 
                        color: transparent !important; 
                        opacity: 0 !important;
                    }
                </style>
                <input type="text"
                    class="cyber-input"
                    value="${savedName}" 
                    placeholder="Enter your name..." 
                    maxLength="15" 
                    autocomplete="off" 
                    autocorrect="off" 
                    autocapitalize="off"
                    style="
                        width: 100% !important;
                        height: 100% !important;
                        font-size: 16px !important;
                        font-family: 'JetBrains Mono', monospace !important;
                        text-align: center !important;
                        background-color: #1F242C !important;
                        color: #7EE787 !important;
                        -webkit-text-fill-color: #7EE787 !important;
                        border: 2px solid #3FB950 !important;
                        border-radius: 10px !important;
                        outline: none !important;
                        font-weight: 600 !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
                        padding: 0 14px !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                    "
                />
            `;

        // 5. Nút Xác Nhận dạng phẳng (Xanh lá đậm -> Xanh sáng hơn khi hover)
        let btnY = height / 2 + 90;
        let confirmBtn = UIHelpers.createFlatButton(this, width / 2, btnY, 'CONFIRM', () => {
            let inputElement = nameInput.node.querySelector('input');
            let enteredName = inputElement.value.trim();
            if (!enteredName) {
                nameInput.node.style.borderColor = '#ff3333';
                return;
            }
            localStorage.setItem('schulte_player_name', enteredName);
            // Dọn dẹp giao diện popup
            overlay.destroy();
            modalBg.destroy();
            titleText.destroy();
            subText.destroy();
            nameInput.destroy();
            confirmBtn.destroy();
            onNameSubmitted(enteredName);
        });
        
        // Tạo một container/tracker riêng cho nút xác nhận trong popup để dọn dẹp dễ dàng
        // let btnBg = this.add.rectangle(width / 2, btnY, 160, 40, 0x008800)
        //     .setInteractive().setOrigin(0.5).setDepth(33);
        // let btnText = this.add.text(width / 2, btnY, 'XÁC NHẬN', {
        //     fontSize: '15px', fill: '#ffffff', fontStyle: 'bold'
        // }).setOrigin(0.5).setDepth(34);

        // btnBg.on('pointerover', () => { btnBg.setFillStyle(0x00aa00); });
        // btnBg.on('pointerout', () => { btnBg.setFillStyle(0x008800); });
        // btnBg.on('pointerdown', () => { btnBg.setScale(0.97); });
        
        // btnBg.on('pointerup', () => {
            
        // });
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Nền tối chủ đạo (Cyber Dark)
        this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115);

        // 2. Tiêu đề game & Phụ đề
        this.add.text(width / 2, height / 3 - 40, 'SCHULTE TABLE', {
            fontSize: '32px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 5, 'Focus - Reflex Training', {
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 30, 'Improve speed reading \nand periperal vision', {
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);


        // 4. Nút PLAY (Flat UI & Soft Mint Accent)
        let btnX = width / 2;
        let btnY = height / 2 + 55;
        UIHelpers.createFlatButton(this, btnX, btnY, '5x5 Classic', () => {
            this.scene.start('SchulteScene');
        });

        btnY = height / 2 + 130;
        UIHelpers.createFlatButton(this, btnX, btnY, '3x3 Memory', () => {
            this.scene.start('SchulteMemoScene');
        });

        // 5. Nút xem Leaderboard (Thêm bổ trợ để mở bảng xếp hạng từ menu)
        btnY = height / 2 + 210;
        UIHelpers.createFlatButton(this, btnX, btnY, '🏆 LEADERBOARD', () => {
            this.scene.start('LeaderboardScene');
        });


        // Báo hiệu frame đầu tiên sẵn sàng cho YouTube Playables
        if (window.ytgame && window.ytgame.game && window.ytgame.game.firstFrameReady) {
            window.ytgame.game.firstFrameReady();
        }
    }
}

// Cấu hình game Phaser 3
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    scale: {
        mode: Phaser.Scale.FIT,       // Tự động co giãn vừa khung hình, giữ nguyên tỷ lệ
        autoCenter: Phaser.Scale.CENTER_BOTH // Tự động căn giữa màn hình (cả dọc và ngang)
    },
    dom: {
        createContainer: true // <-- BẮT BUỘC để hiển thị HTML input trong Phaser
    },
    resolution: window.devicePixelRatio || 1,
    roundPixels: true,
    scene: [MenuScene, SchulteScene, LeaderboardScene]
};

const game = new Phaser.Game(config);