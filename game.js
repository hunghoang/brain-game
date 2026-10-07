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
        faceBg.setStrokeStyle(1.5, 0x2A6A3A);
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

    /**
     * Tạo hiệu ứng tung hoa giấy (confetti) rực rỡ khi phá kỷ lục
     * @param {Phaser.Scene} scene - Scene hiện tại đang gọi
     */
    static spawnConfetti(scene) {
        const { width, height } = scene.scale;
        const colors = [0x7EE787, 0x3FB950, 0xD29922, 0xF85149, 0x58A6FF, 0xBC8CFF, 0xF0883E, 0xFFE600];
        const pieceCount = 45;

        for (let i = 0; i < pieceCount; i++) {
            let startX = Phaser.Math.Between(width * 0.15, width * 0.85);
            let startY = Phaser.Math.Between(-20, height * 0.25);
            let color = Phaser.Utils.Array.GetRandom(colors);
            let w = Phaser.Math.Between(6, 12);
            let h = Phaser.Math.Between(8, 16);

            let piece = scene.add.rectangle(startX, startY, w, h, color)
                .setOrigin(0.5)
                .setDepth(29)
                .setAngle(Phaser.Math.Between(0, 360));

            let targetX = startX + Phaser.Math.Between(-120, 120);
            let targetY = height + Phaser.Math.Between(20, 100);
            let duration = Phaser.Math.Between(2200, 3800);
            let delay = Phaser.Math.Between(0, 800);

            scene.tweens.add({
                targets: piece,
                x: targetX,
                y: targetY,
                angle: piece.angle + Phaser.Math.Between(360, 1080),
                scaleX: { from: 1, to: 0.2 },
                alpha: { from: 1, to: 0 },
                delay: delay,
                duration: duration,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    piece.destroy();
                }
            });
        }
    }
}

const SoundManager = {
    // Đảm bảo AudioContext được khởi tạo sau tương tác đầu tiên của người chơi
    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
    },

    // Quản lý trạng thái BGM
    isMenuMode: false,
    isMuted: false,

    // ==========================================
    // BGM: Ambient Chill Synth + Sóng Alpha Wave (10Hz)
    // ==========================================
    bgmState: {
        isPlaying: false,
        masterGain: null,
        loopTimer: null,
        activeOscs: []
    },

    startMenuBGM() {
        this.isMenuMode = true;
        if (this.isMuted) return;
        if (this.bgmState.isPlaying) return;

        try {
            const ctx = this.getAudioContext();
            
            // Nếu trình duyệt đang chặn (suspended do chính sách Autoplay), thử resume
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    if (this.isMenuMode && !this.isMuted && !this.bgmState.isPlaying) {
                        this._initBGMNodes(ctx);
                    }
                }).catch(() => {});
                return;
            }

            this._initBGMNodes(ctx);
        } catch (e) {
            console.log("Audio not allowed yet:", e);
        }
    },

    _initBGMNodes(ctx) {
        if (this.bgmState.isPlaying) return;
        if (this.isMuted || !this.isMenuMode) return;
        this.bgmState.isPlaying = true;
        this.bgmState.activeOscs = [];

        // Master Gain cho BGM (Fade-in êm ái 1.5s, mức âm lượng rõ ràng 0.22)
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.5);
        masterGain.connect(ctx.destination);
        this.bgmState.masterGain = masterGain;

        // 1. Alpha Wave Generator (Binaural Beats: 200Hz L, 210Hz R -> 10Hz nhịp sóng Alpha)
        try {
            const alphaGain = ctx.createGain();
            alphaGain.gain.setValueAtTime(0.06, ctx.currentTime);
            alphaGain.connect(masterGain);

            // Tai trái: 200 Hz
            const leftOsc = ctx.createOscillator();
            leftOsc.type = 'sine';
            leftOsc.frequency.setValueAtTime(200, ctx.currentTime);

            // Tai phải: 210 Hz
            const rightOsc = ctx.createOscillator();
            rightOsc.type = 'sine';
            rightOsc.frequency.setValueAtTime(210, ctx.currentTime);

            if (ctx.createStereoPanner) {
                const pannerL = ctx.createStereoPanner();
                pannerL.pan.setValueAtTime(-0.85, ctx.currentTime);
                leftOsc.connect(pannerL);
                pannerL.connect(alphaGain);

                const pannerR = ctx.createStereoPanner();
                pannerR.pan.setValueAtTime(0.85, ctx.currentTime);
                rightOsc.connect(pannerR);
                pannerR.connect(alphaGain);
            } else {
                leftOsc.connect(alphaGain);
                rightOsc.connect(alphaGain);
            }

            leftOsc.start();
            rightOsc.start();
            this.bgmState.activeOscs.push(leftOsc, rightOsc);

            // 2. 10 Hz Isochronic Pulse (Giúp tạo nhịp sóng Alpha cả khi nghe loa ngoài mono)
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(10, ctx.currentTime); // 10 Hz Alpha
            lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
            lfo.connect(lfoGain);
            lfoGain.connect(masterGain.gain);
            lfo.start();
            this.bgmState.activeOscs.push(lfo);
        } catch (err) {}

        // 3. Ambient Chill Synth Pads (Vòng hợp âm mượt mà Cmaj7 -> Am7 -> Fmaj7 -> G6)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime); // Tần số ấm áp, đầy đặn
        filter.Q.setValueAtTime(0.7, ctx.currentTime);
        filter.connect(masterGain);

        const chordList = [
            [130.81, 196.00, 246.94, 329.63], // Cmaj7 (C3, G3, B3, E4)
            [110.00, 164.81, 220.00, 261.63], // Am7 (A2, E3, A3, C4)
            [87.31, 130.81, 174.61, 220.00],  // Fmaj7 (F2, C3, F3, A3)
            [98.00, 146.83, 196.00, 246.94]   // G6 (G2, D3, G3, B3)
        ];

        let chordIdx = 0;
        const chordDuration = 4.0;

        const playNextChord = () => {
            if (!this.bgmState.isPlaying || !this.isMenuMode) return;
            const now = ctx.currentTime;
            const freqs = chordList[chordIdx];
            chordIdx = (chordIdx + 1) % chordList.length;

            freqs.forEach(f => {
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now);

                // Envelope êm ái: vuốt lên và nhả chậm
                noteGain.gain.setValueAtTime(0.0001, now);
                noteGain.gain.linearRampToValueAtTime(0.14, now + 1.2);
                noteGain.gain.setValueAtTime(0.14, now + chordDuration - 1.0);
                noteGain.gain.exponentialRampToValueAtTime(0.0001, now + chordDuration + 1.2);

                osc.connect(noteGain);
                noteGain.connect(filter);

                osc.start(now);
                osc.stop(now + chordDuration + 1.3);
                this.bgmState.activeOscs.push(osc);
            });
        };

        playNextChord();

        this.bgmState.loopTimer = setInterval(() => {
            if (this.bgmState.isPlaying && this.isMenuMode) {
                playNextChord();
            } else {
                clearInterval(this.bgmState.loopTimer);
                this.bgmState.loopTimer = null;
            }
        }, chordDuration * 1000);
    },

    stopMenuBGM() {
        this.isMenuMode = false;
        try {
            this.bgmState.isPlaying = false;

            if (this.bgmState.loopTimer) {
                clearInterval(this.bgmState.loopTimer);
                this.bgmState.loopTimer = null;
            }

            const ctx = this.audioCtx;
            if (ctx && this.bgmState.masterGain) {
                try {
                    this.bgmState.masterGain.gain.cancelScheduledValues(ctx.currentTime);
                    this.bgmState.masterGain.gain.setValueAtTime(0, ctx.currentTime);
                    this.bgmState.masterGain.disconnect();
                } catch (e) {}
                this.bgmState.masterGain = null;
            }

            if (this.bgmState.activeOscs) {
                this.bgmState.activeOscs.forEach(osc => {
                    try {
                        osc.stop();
                        osc.disconnect();
                    } catch (e) {}
                });
                this.bgmState.activeOscs = [];
            }
        } catch (e) {}
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMenuBGM();
        } else if (this.isMenuMode) {
            this.startMenuBGM();
        }
        return !this.isMuted;
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
    },

    // 4. Âm thanh Chúc Mừng Phá Kỷ Lục (~4.5s arcade victory jingle đầy năng lượng)
    playCelebration() {
        try {
            const ctx = this.getAudioContext();
            const now = ctx.currentTime;

            // Nhịp tiết tấu 16th-note nhanh, vui tai phong cách 8-bit / Arcade Jingle
            // Lead melody (square/triangle pha trộn, phong phú và cuốn hút)
            const leadNotes = [
                // Phase 1: Fanfare mở màn dồn dập (0.0s - 1.2s)
                { f: 523.25, t: 0.00, d: 0.10, v: 0.16 }, // C5
                { f: 523.25, t: 0.11, d: 0.10, v: 0.16 }, // C5
                { f: 523.25, t: 0.22, d: 0.10, v: 0.16 }, // C5
                { f: 659.25, t: 0.35, d: 0.28, v: 0.22 }, // E5
                { f: 783.99, t: 0.65, d: 0.20, v: 0.22 }, // G5
                { f: 1046.50, t: 0.88, d: 0.40, v: 0.24 }, // C6!

                // Phase 2: Rung chuông arpeggio vui vẻ (1.3s - 2.5s)
                { f: 880.00, t: 1.30, d: 0.12, v: 0.18 }, // A5
                { f: 1046.50, t: 1.44, d: 0.12, v: 0.18 }, // C6
                { f: 1318.51, t: 1.58, d: 0.24, v: 0.22 }, // E6
                { f: 1174.66, t: 1.84, d: 0.14, v: 0.20 }, // D6
                { f: 1046.50, t: 2.00, d: 0.14, v: 0.20 }, // C6
                { f: 1174.66, t: 2.16, d: 0.32, v: 0.22 }, // D6

                // Phase 3: Cao trào chiến thắng bùng nổ (2.6s - 4.4s)
                { f: 1046.50, t: 2.55, d: 0.12, v: 0.20 }, // C6
                { f: 1174.66, t: 2.70, d: 0.12, v: 0.20 }, // D6
                { f: 1318.51, t: 2.85, d: 0.14, v: 0.22 }, // E6
                { f: 1567.98, t: 3.02, d: 0.22, v: 0.24 }, // G6
                { f: 1760.00, t: 3.28, d: 0.22, v: 0.24 }, // A6
                { f: 2093.00, t: 3.54, d: 0.80, v: 0.26 }  // C7 Grand Finale!
            ];

            // Chơi lead melody với sóng square mượt để tạo nét arcade retro sống động
            leadNotes.forEach(n => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + n.t;
                const end = start + n.d;

                osc.type = 'square';
                osc.frequency.setValueAtTime(n.f, start);

                // Attack nhanh, decay tự nhiên
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.linearRampToValueAtTime(n.v, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, end);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(start);
                osc.stop(end);
            });

            // Bè hòa âm đệm (Chords / Chime arpeggio tạo độ lung linh, sang trọng)
            const harmonyNotes = [
                // Phase 1 chords
                { f: 261.63, t: 0.00, d: 0.30, v: 0.12 }, // C4
                { f: 329.63, t: 0.35, d: 0.28, v: 0.12 }, // E4
                { f: 392.00, t: 0.65, d: 0.22, v: 0.12 }, // G4
                { f: 523.25, t: 0.88, d: 0.45, v: 0.14 }, // C5
                // Phase 2 chords
                { f: 440.00, t: 1.30, d: 0.40, v: 0.12 }, // A4
                { f: 523.25, t: 1.84, d: 0.40, v: 0.12 }, // C5
                { f: 587.33, t: 2.16, d: 0.35, v: 0.12 }, // D5
                // Phase 3 grand finale chord
                { f: 523.25, t: 2.55, d: 0.50, v: 0.13 }, // C5
                { f: 659.25, t: 3.02, d: 0.50, v: 0.13 }, // E5
                { f: 783.99, t: 3.54, d: 0.90, v: 0.14 }, // G5
                { f: 1046.50, t: 3.54, d: 0.90, v: 0.14 } // C6
            ];

            harmonyNotes.forEach(n => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + n.t;
                const end = start + n.d;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(n.f, start);

                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.linearRampToValueAtTime(n.v, start + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, end);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(start);
                osc.stop(end);
            });

            // Tiếng sparkling chimes lấp lánh ở cuối (3.6s - 4.5s) tạo cảm giác phần thưởng lớn
            [2093.00, 2349.32, 2637.02, 3135.96].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + 3.65 + idx * 0.09;
                const end = start + 0.35;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, end);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(start);
                osc.stop(end);
            });

        } catch (e) {}
    }
};

class SchulteScene extends Phaser.Scene {

    constructor() {
        super('SchulteScene');
    }

    init() {
        SoundManager.stopMenuBGM();
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
        SoundManager.stopMenuBGM();
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

        // Nút BACK về Menu trong màn chơi
        UIHelpers.createFlatButton(this, width / 2, 495, '← MENU', () => {
            this.scene.start('MenuScene');
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
            this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115, 0.85).setDepth(20);

            // --- XÁC ĐỊNH THÔNG ĐIỆP THEO 3 TRẠNG THÁI ---
            let titleText = '';
            let titleColor = '#7EE787';
            let subMessage = '';

            if (!isSave) {
                // 1. Người chơi chưa vượt threshold -> Khích lệ
                titleText = 'KEEP PUSHING!';
                titleColor = '#D29922'; // Màu vàng ấm khích lệ
                subMessage = 'Under 25s required to rank. Try again!';
            } else {
                // 2. Người chơi vượt threshold -> Khen ngợi xuất sắc
                titleText = '🎉 EXCELLENT!';
                titleColor = '#7EE787'; // Xanh lá sáng
                subMessage = 'Great job completing the challenge!';
            }

            // 1. Hiển thị ngay thông tin cơ bản
            this.add.text(width / 2, height * 0.28, titleText, {
                fontSize: '22px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: titleColor,
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(21);

            this.add.text(width / 2, height * 0.35, `Time: ${finalTime}s`, {
                fontSize: '18px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#E6EDF3'
            }).setOrigin(0.5).setDepth(21);

            // 3. Hiển thị thông báo nếu chơi tốt hơn lần trước (Phá kỷ lục)
            let infoY = 0.41;
            if (isNewRecord) {
                this.add.text(width / 2, height * infoY, '⭐ NEW PERSONAL RECORD!', {
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#F85149',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(21);
                infoY += 0.05;

                // Tung hoa giấy chúc mừng khi đạt ngưỡng và phá kỷ lục cũ
                if (isSave) {
                    UIHelpers.spawnConfetti(this);
                    SoundManager.playCelebration();
                }
            } else if (subMessage) {
                this.add.text(width / 2, height * infoY, subMessage, {
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#8B949E'
                }).setOrigin(0.5).setDepth(21);
                infoY += 0.05;
            }

            // 2. Dòng trạng thái thứ hạng (Loading nhẹ nhàng)
            let rankTextNode = this.add.text(width / 2, height * (infoY + 0.02), isSave ? 'Syncing score...' : '', {
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#8B949E'
            }).setOrigin(0.5).setDepth(21);

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
                    border: 1.5px solid #2A6A3A;
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

            let playAgainBtn = this.add.dom(width / 2, height * 0.58, 'div').createFromHTML(btnHTML).setDepth(22);
            
            playAgainBtn.addListener('click');
            playAgainBtn.on('click', () => {
                this.scene.restart();
            });

            let lbBtn = UIHelpers.createFlatButton(this, width / 2, height * 0.68, '🏆 LEADERBOARD', () => {
                this.scene.start('LeaderboardScene', { gameType: 'schulte_table' });
            });
            if (lbBtn.faceBg) lbBtn.faceBg.setDepth(22);
            if (lbBtn.btnText) lbBtn.btnText.setDepth(23);
            if (lbBtn.shadowBg) lbBtn.shadowBg.setDepth(21);

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
        } else {
            processSavingAndDisplay(localStorage.getItem('schulte_player_name') || '');
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
       
    }
}

class SchulteMemoScene extends Phaser.Scene {

    constructor() {
        super('SchulteMemoScene');
    }

    init() {
        SoundManager.stopMenuBGM();
        this.currentNumber = 1;
        this.maxNumber = 9;
        this.startTime = 0;
        this.timerText = null;
        this.statusText = null;
        this.isGameOver = false;
        this.isMemorizing = true;
        this.isGameStarted = false;
        this.isLocked = false; // Khóa click khi đang bị phạt do click sai
        this.penaltyCooldown = 300; // Thời gian phạt không được click sang ô khác (ms)
        this.correctColor = 0x183424; // Xanh lá thật nhẹ / trầm tinh tế trên nền tối
        this.wrongColor = 0xaa0000;
        this.defaultCellColor = 0x1F242C;
        this.hoverColor = 0x2A323D;
        let savedBest = localStorage.getItem('schulte_memo_best_time');
        this.bestTime = savedBest ? parseFloat(savedBest) : '';
    }

    preload() {}

    create() {
        SoundManager.stopMenuBGM();
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x121212).setDepth(-1);

        // 1. Tiêu đề và Đồng hồ bấm giờ
        this.add.text(width / 2, 35, '3x3 MEMO', {
            fontSize: '22px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.timerText = this.add.text(width / 2, 68, 'Time: 0.0s', {
            fontSize: '15px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);

        // 2. Dòng trạng thái (Ghi nhớ / Tìm số)
        this.statusText = this.add.text(width / 2, 102, 'MEMORIZE: 3s', {
            fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#D29922',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Tạo lưới số ngẫu nhiên (3x3)
        let numbers = Array.from({ length: this.maxNumber }, (_, i) => i + 1);
        Phaser.Utils.Array.Shuffle(numbers);

        const gridSize = 3;
        const cellSize = 80;
        const gap = 12;
        const totalSize = gridSize * cellSize + (gridSize - 1) * gap;
        const startX = (width - totalSize) / 2 + cellSize / 2;
        const startY = 165 + cellSize / 2;

        let allCells = [];
        let index = 0;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                let num = numbers[index++];
                let x = startX + col * (cellSize + gap);
                let y = startY + row * (cellSize + gap);

                let bg = this.add.rectangle(x, y, cellSize, cellSize, this.defaultCellColor)
                    .setInteractive()
                    .setStrokeStyle(2, 0x30363D)
                    .setDepth(1);

                // Số hiển thị ban đầu trong 3 giây để người chơi ghi nhớ vị trí
                let text = this.add.text(x, y, num.toString(), {
                    fontSize: '32px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#E6EDF3',
                    fontStyle: ''
                }).setOrigin(0.5).setDepth(2);

                text.correctNum = num;
                text.isFound = false;

                allCells.push({ bg, text });

                // Xử lý sự kiện bấm ô
                bg.on('pointerdown', () => {
                    if (this.isGameOver) return;
                    if (this.isMemorizing || !this.isGameStarted) return;
                    if (this.isLocked) return; // Đang trong thời gian phạt, không cho click
                    if (text.isFound) return;

                    if (num === this.currentNumber) {
                        // Bấm đúng số cần tìm
                        text.isFound = true;
                        text.setText(num.toString());
                        text.setFill('#7EE787');
                        bg.setFillStyle(this.correctColor);
                        bg.setStrokeStyle(1.5, 0x2EA043);

                        this.tweens.add({
                            targets: [bg, text],
                            scale: 1.08,
                            duration: 80,
                            yoyo: true
                        });

                        this.currentNumber++;
                        SoundManager.playCorrect();

                        if (this.currentNumber <= this.maxNumber) {
                            this.statusText.setText(`FIND NUMBER: ${this.currentNumber}`);
                        } else {
                            this.statusText.setText('');
                            SoundManager.playWin();
                            this.endGame(true);
                        }
                    } else {
                        // Bấm sai số: Khóa click và phạt cộng thêm 0.1s vào đồng hồ
                        this.isLocked = true;
                        this.startTime -= 500; // startTime lùi 500ms -> tương đương thời gian chơi bị +0.5s
                        bg.setFillStyle(this.wrongColor);
                        bg.setStrokeStyle(2, 0xF85149);
                        SoundManager.playWrong();

                        // Hiệu ứng nháy chữ đỏ +0.5s cạnh đồng hồ
                        let penaltyText = this.add.text(x, y - 25, '+0.5s', {
                            fontSize: '16px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fill: '#f7372d',
                            fontStyle: 'bold'
                        }).setOrigin(0.5).setDepth(15);

                        this.tweens.add({
                            targets: penaltyText,
                            y: y - 80,
                            alpha: 0,
                            duration: 1000,
                            ease: 'Power1',
                            onComplete: () => penaltyText.destroy()
                        });

                        // Rung nhẹ ô bị bấm sai
                        this.tweens.add({
                            targets: [bg, text],
                            x: x + 4,
                            duration: 45,
                            yoyo: true,
                            repeat: 3,
                            onComplete: () => {
                                bg.x = x;
                                text.x = x;
                            }
                        });

                        this.time.delayedCall(this.penaltyCooldown, () => {
                            if (!text.isFound) {
                                bg.setFillStyle(this.defaultCellColor);
                                bg.setStrokeStyle(2, 0x30363D);
                            }
                            this.isLocked = false; // Mở lại quyền click sau khi hết phạt
                        });
                    }
                });

                bg.on('pointerover', () => {
                    if (!this.isGameOver && !this.isMemorizing && !this.isLocked && !text.isFound) {
                        bg.setFillStyle(this.hoverColor);
                        bg.setStrokeStyle(2, 0x58A6FF);
                    }
                });

                bg.on('pointerout', () => {
                    if (!this.isGameOver && !this.isMemorizing && !this.isLocked && !text.isFound) {
                        bg.setFillStyle(this.defaultCellColor);
                        bg.setStrokeStyle(2, 0x30363D);
                    }
                });
            }
        }

        // Nút BACK về Menu trong màn chơi
        UIHelpers.createFlatButton(this, width / 2, 495, '← MENU', () => {
            this.scene.start('MenuScene');
        });

        // 4. Đếm ngược 3 giây ghi nhớ (3s -> 2s -> 1s -> biến mất & bắt đầu)
        SoundManager.playBeep(440, 0.15);
        let countdown = 3;

        this.time.addEvent({
            delay: 1000,
            repeat: 2,
            callback: () => {
                countdown--;
                if (countdown > 0) {
                    this.statusText.setText(`MEMORIZE: ${countdown}s`);
                    SoundManager.playBeep(440, 0.15);
                } else {
                    // Hết 3 giây -> Ẩn toàn bộ số, phát âm thanh hiệu lệnh và bắt đầu tính giờ
                    allCells.forEach(cell => {
                        cell.text.setText('');
                    });

                    SoundManager.playBeep(880, 0.25);
                    this.isMemorizing = false;
                    this.isGameStarted = true;
                    this.startTime = performance.now();
                    this.statusText.setText('FIND NUMBER: 1');
                    this.statusText.setFill('#7EE787');
                }
            }
        });

        if (window.ytgame && window.ytgame.game && window.ytgame.game.firstFrameReady) {
            window.ytgame.game.firstFrameReady();
        }
    }

    update() {
        if (!this.isGameOver && this.isGameStarted && this.startTime) {
            let elapsedTime = ((performance.now() - this.startTime) / 1000).toFixed(1);
            this.timerText.setText(`Time: ${elapsedTime}s`);
        }
    }

    async endGame(isWin) {
        let thresholdToSave = 15;
        this.isGameOver = true;
        let playTime = (performance.now() - this.startTime) / 1000;
        let finalTime = parseFloat(playTime.toFixed(1));
        
        let isSave = finalTime < thresholdToSave;

        let previousBest = this.bestTime ? parseFloat(this.bestTime) : null;
        let isNewRecord = false;

        if (previousBest === null || finalTime < previousBest) {
            this.bestTime = finalTime;
            localStorage.setItem('schulte_memo_best_time', this.bestTime);
            if (previousBest !== null) {
                isNewRecord = true;
            }
        }

        const processSavingAndDisplay = (playerName) => {
            const { width, height } = this.scale;
            
            this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115, 0.85).setDepth(20);

            let titleText = '';
            let titleColor = '#7EE787';
            let subMessage = '';

            if (!isSave) {
                titleText = 'KEEP PUSHING!';
                titleColor = '#D29922';
                subMessage = 'Under 15s required to rank. Try again!';
            } else {
                titleText = '🎉 EXCELLENT!';
                titleColor = '#7EE787';
                subMessage = 'Great job completing the challenge!';
            }

            this.add.text(width / 2, height * 0.28, titleText, {
                fontSize: '22px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: titleColor,
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(21);

            this.add.text(width / 2, height * 0.35, `Time: ${finalTime}s`, {
                fontSize: '18px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#E6EDF3'
            }).setOrigin(0.5).setDepth(21);

            let infoY = 0.41;
            if (isNewRecord) {
                this.add.text(width / 2, height * infoY, '⭐ NEW PERSONAL RECORD!', {
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#F85149',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(21);
                infoY += 0.05;

                // Tung hoa giấy chúc mừng khi đạt ngưỡng và phá kỷ lục cũ
                if (isSave) {
                    UIHelpers.spawnConfetti(this);
                    SoundManager.playCelebration();
                }
            } else if (subMessage) {
                this.add.text(width / 2, height * infoY, subMessage, {
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#8B949E'
                }).setOrigin(0.5).setDepth(21);
                infoY += 0.05;
            }

            let rankTextNode = this.add.text(width / 2, height * (infoY + 0.02), isSave ? 'Syncing score...' : '', {
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#8B949E'
            }).setOrigin(0.5).setDepth(21);

            let btnHTML = `
                <button style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 220px;
                    height: 46px;
                    background-color: #1F242C;
                    border: 1.5px solid #2A6A3A;
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

            let playAgainBtn = this.add.dom(width / 2, height * 0.58, 'div').createFromHTML(btnHTML).setDepth(22);
            playAgainBtn.addListener('click');
            playAgainBtn.on('click', () => {
                this.scene.restart();
            });

            let lbBtn = UIHelpers.createFlatButton(this, width / 2, height * 0.68, '🏆 LEADERBOARD', () => {
                this.scene.start('LeaderboardScene', { gameType: 'schulte_memo' });
            });
            if (lbBtn.faceBg) lbBtn.faceBg.setDepth(22);
            if (lbBtn.btnText) lbBtn.btnText.setDepth(23);
            if (lbBtn.shadowBg) lbBtn.shadowBg.setDepth(21);

            if (isSave) {
                LeaderboardManager.getRank(finalTime, "schulte_memo").then((myRank) => {
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
                LeaderboardManager.save(playerName, finalTime, "schulte_memo");
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

            if (window.ytgame && window.ytgame.engagement && window.ytgame.engagement.sendScore) {
                let score = Math.max(1000 - Math.floor(finalTime * 15), 0);
                window.ytgame.engagement.sendScore({ value: score });
            }
        } else {
            processSavingAndDisplay(localStorage.getItem('schulte_player_name') || '');
        }
    }

    showNameInputDialog(finalTime, onNameSubmitted) {
        const { width, height } = this.scale;

        let overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setDepth(30);

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

        let savedName = localStorage.getItem('schulte_player_name') || '';
        let nameInput = this.add.dom(width / 2, height / 2 + 25, 'div', `
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

        let btnY = height / 2 + 90;
        let confirmBtn = UIHelpers.createFlatButton(this, width / 2, btnY, 'CONFIRM', () => {
            let inputElement = nameInput.node.querySelector('input');
            let enteredName = inputElement.value.trim();
            if (!enteredName) {
                nameInput.node.style.borderColor = '#ff3333';
                return;
            }
            localStorage.setItem('schulte_player_name', enteredName);
            overlay.destroy();
            modalBg.destroy();
            titleText.destroy();
            subText.destroy();
            nameInput.destroy();
            confirmBtn.destroy();
            onNameSubmitted(enteredName);
        });
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Tự động thử phát nhạc nền ngay khi vào Menu
        SoundManager.startMenuBGM();

        // Chỉ mở khóa âm thanh khi người dùng tương tác trong MenuScene
        const unlockBGM = () => {
            if (this.scene && this.scene.isActive('MenuScene')) {
                SoundManager.startMenuBGM();
            }
        };
        this.input.on('pointerdown', unlockBGM);

        // Khi rời khỏi MenuScene thì dọn dẹp listener và dừng BGM ngay lập tức
        this.events.once('shutdown', () => {
            this.input.off('pointerdown', unlockBGM);
            SoundManager.stopMenuBGM();
        });

        const { width, height } = this.scale;

        // 1. Cyber Dark Background (Cho phép click để kích hoạt nhạc nếu autoplay bị chặn)
        let bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115).setInteractive();
        bg.on('pointerdown', unlockBGM);

        // Icon loa bật/tắt nhạc nhỏ gọn ở góc trên bên phải (không viền vuông bao quanh)
        let soundBtnText = this.add.text(width - 24, 24, SoundManager.isMuted ? '🔇' : '🔊', {
            fontSize: '15px'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .setAlpha(0.65)
            .setDepth(11);

        soundBtnText.on('pointerover', () => { soundBtnText.setAlpha(1); });
        soundBtnText.on('pointerout', () => { soundBtnText.setAlpha(0.65); });
        soundBtnText.on('pointerdown', (pointer) => {
            if (pointer && pointer.event) pointer.event.stopPropagation();
            const isSoundOn = SoundManager.toggleMute();
            soundBtnText.setText(isSoundOn ? '🔊' : '🔇');
        });

        // Subtle floating background particles for depth
        for (let i = 0; i < 20; i++) {
            let x = Phaser.Math.Between(0, width);
            let y = Phaser.Math.Between(0, height);
            let particle = this.add.circle(x, y, Phaser.Math.Between(1, 2.5), 0x3FB950, Phaser.Math.FloatBetween(0.2, 0.6));
            
            this.tweens.add({
                targets: particle,
                y: y - Phaser.Math.Between(50, 150),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000),
                onRepeat: () => {
                    particle.x = Phaser.Math.Between(0, width);
                    particle.y = height + 10;
                    particle.alpha = Phaser.Math.FloatBetween(0.2, 0.6);
                }
            });
        }

        // 2. Title & Subtitle
        let titleText = this.add.text(width / 2, height * 0.18, 'SCHULTE TABLE', {
            fontSize: '28px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Gentle pulse effect for title
        this.tweens.add({
            targets: titleText,
            scale: { from: 1, to: 1.03 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(width / 2, height * 0.26, 'Focus - Reflex & Memory Training', {
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);

        // 3. Game Modes Section
        let startY = height * 0.40;
        let spacing = 65;

        this.add.text(width / 2, startY - 20, '--- SELECT MODE ---', {
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#484F58'
        }).setOrigin(0.5);

        // Short and clean button texts
        UIHelpers.createFlatButton(this, width / 2, startY + 15, '5x5 CLASSIC', () => {
            SoundManager.stopMenuBGM();
            this.scene.start('SchulteScene');
        });

        UIHelpers.createFlatButton(this, width / 2, startY + 15 + spacing, '3x3 MEMORY', () => {
            SoundManager.stopMenuBGM();
            this.scene.start('SchulteMemoScene');
        });

        // 4. System Section
        let utilityY = startY + 15 + spacing * 2.3;

        this.add.text(width / 2, utilityY - 10, '--- SYSTEM ---', {
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#484F58'
        }).setOrigin(0.5);

        UIHelpers.createFlatButton(this, width / 2, utilityY + 20, 'LEADERBOARD', () => {
            SoundManager.stopMenuBGM();
            this.scene.start('LeaderboardScene', { gameType: 'schulte_table' });
        });

        // Signal first frame ready for YouTube Playables
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
    scene: [MenuScene, SchulteScene, SchulteMemoScene, LeaderboardScene]
};

const game = new Phaser.Game(config);