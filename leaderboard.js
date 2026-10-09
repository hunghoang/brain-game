// LeaderboardScene.js
class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    init(data) {
        if (typeof SoundManager !== 'undefined' && SoundManager.stopMenuBGM) {
            SoundManager.stopMenuBGM();
        }
        // Nhận tham số từ scene gọi tới để kích hoạt đúng tab
        this.selectedTab = (data && data.gameType) ? data.gameType : 'schulte_table';
        this.contentElements = [];
        this.fetchId = 0;
    }

    create() {
        const { width, height } = this.scale;

        // 1. Nền tối chủ đạo (Cyber Dark)
        this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115);

        // 2. Tiêu đề
        this.add.text(width / 2, 38, '🏆 LEADERBOARD', {
            fontSize: '22px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Tabs chuyển đổi [ Schulte 5x5 ] [ Memo 3x3 ]
        this.createTabs();

        // 4. Tải dữ liệu theo tab ban đầu
        this.loadLeaderboard(this.selectedTab);

        // 5. Nút BACK (Flat UI Style & Soft Mint Accent)
        let btnX = width / 2;
        let btnY = height * 0.80;
        
        let shadowBg = this.add.rectangle(btnX, btnY + 2, 200, 44, 0x111318, 1).setOrigin(0.5).setStrokeStyle(1, 0x21262D);
        let faceBg = this.add.rectangle(btnX, btnY, 200, 44, 0x1F242C).setInteractive().setOrigin(0.5);
        faceBg.setStrokeStyle(2, 0x2EA043);

        let btnText = this.add.text(btnX, btnY, '← BACK', {
            fontSize: '15px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#3FB950',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        faceBg.on('pointerover', () => { 
            faceBg.setFillStyle(0x2A323D); 
            btnText.setColor('#FFFFFF');
        });
        faceBg.on('pointerout', () => { 
            faceBg.setFillStyle(0x1F242C); 
            btnText.setColor('#3FB950');
        });
        faceBg.on('pointerdown', () => { 
            faceBg.y = btnY + 2; 
            btnText.y = btnY + 2; 
        });
        faceBg.on('pointerup', () => {
            faceBg.y = btnY; 
            btnText.y = btnY;
            this.scene.start('MenuScene'); 
        });
    }

    createTabs() {
        const { width } = this.scale;
        const tabs = [
            { key: 'schulte_table', label: 'Schulte 5x5', x: width / 2 - 76 },
            { key: 'schulte_memo', label: 'Memo 3x3', x: width / 2 + 76 }
        ];

        this.tabButtons = {};

        tabs.forEach(tab => {
            let tabW = 142;
            let tabH = 36;
            let tabY = 90;

            let shadow = this.add.rectangle(tab.x, tabY + 2, tabW, tabH, 0x111318, 0.9).setOrigin(0.5);
            let bg = this.add.rectangle(tab.x, tabY, tabW, tabH, 0x161B22)
                .setInteractive()
                .setOrigin(0.5);

            let text = this.add.text(tab.x, tabY, tab.label, {
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#8B949E'
            }).setOrigin(0.5);

            bg.on('pointerdown', () => {
                if (this.selectedTab !== tab.key) {
                    this.switchTab(tab.key);
                }
            });

            bg.on('pointerover', () => {
                if (this.selectedTab !== tab.key) {
                    bg.setFillStyle(0x22272E);
                    text.setColor('#E6EDF3');
                }
            });

            bg.on('pointerout', () => {
                if (this.selectedTab !== tab.key) {
                    bg.setFillStyle(0x161B22);
                    text.setColor('#8B949E');
                }
            });

            this.tabButtons[tab.key] = { bg, text, shadow };
        });

        this.updateTabStyles();
    }

    updateTabStyles() {
        Object.keys(this.tabButtons).forEach(key => {
            let { bg, text } = this.tabButtons[key];
            if (key === this.selectedTab) {
                bg.setFillStyle(0x1F242C);
                bg.setStrokeStyle(2, 0x2EA043);
                text.setColor('#3FB950');
                text.setFontStyle('bold');
            } else {
                bg.setFillStyle(0x161B22);
                bg.setStrokeStyle(1, 0x30363D);
                text.setColor('#8B949E');
                text.setFontStyle('normal');
            }
        });
    }

    switchTab(tabKey) {
        this.selectedTab = tabKey;
        this.updateTabStyles();
        this.loadLeaderboard(tabKey);
    }

    loadLeaderboard(gameType) {
        const { width, height } = this.scale;

        this.clearContent();

        this.fetchId++;
        const currentFetchId = this.fetchId;

        let loadingText = this.add.text(width / 2, height * 0.38, 'Loading data...', {
            fontSize: '14px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);
        this.contentElements.push(loadingText);

        const myUserId = LeaderboardManager.getUserId();

        Promise.all([
            LeaderboardManager.getTopScores(gameType),
            LeaderboardManager.getUserScore(myUserId, gameType)
        ]).then(([topScores, myScoreData]) => {
            if (this.fetchId !== currentFetchId) return;
            loadingText.destroy();
            this.renderScores(topScores, myScoreData, myUserId);
        }).catch(err => {
            if (this.fetchId !== currentFetchId) return;
            loadingText.setText('Failed to load data.');
        });
    }

    clearContent() {
        if (this.contentElements) {
            this.contentElements.forEach(item => {
                if (item && item.destroy) item.destroy();
            });
        }
        this.contentElements = [];
    }

    renderScores(topScores, myScoreData, myUserId) {
        const { width } = this.scale;

        // Tiêu đề cột nhỏ phía trên
        let headerY = 140;
        let colHeaderLeft = this.add.text(width * 0.1, headerY, 'RANK  PLAYER', {
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0, 0.5);

        let colHeaderRight = this.add.text(width * 0.9, headerY, 'TIME', {
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(1, 0.5);

        this.contentElements.push(colHeaderLeft, colHeaderRight);

        if (!topScores || topScores.length === 0) {
            let noDataText = this.add.text(width / 2, 230, 'No ranking data yet.', {
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                fill: '#8B949E'
            }).setOrigin(0.5);
            this.contentElements.push(noDataText);
        } else {
            let startY = 170;
            let rowHeight = 38;

            topScores.slice(0, 5).forEach((item, index) => {
                let rankNum = index + 1;
                let isMe = item.userId === myUserId;
                let color = isMe ? '#7EE787' : '#E6EDF3';
                let style = isMe ? 'bold' : 'normal';
                let currentY = startY + (index * rowHeight);

                let rowBg = this.add.rectangle(width / 2, currentY, width * 0.82, 32, 0x161B22, 0.85).setOrigin(0.5);
                rowBg.setStrokeStyle(1, isMe ? 0x3FB950 : 0x21262D);

                let leftText = `${rankNum}. ${item.name}${isMe ? ' (you)' : ''}`;
                let leftNode = this.add.text(width * 0.1 + 8, currentY, leftText, {
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: color,
                    fontStyle: style
                }).setOrigin(0, 0.5);

                let rightText = `${item.time}s`;
                let rightNode = this.add.text(width * 0.9 - 8, currentY, rightText, {
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: color,
                    fontStyle: style
                }).setOrigin(1, 0.5);

                this.contentElements.push(rowBg, leftNode, rightNode);
            });
        }

        // Đường phân cách giữa Top List và Khung thứ hạng của bạn
        let separatorY = 360;
        let separator = this.add.rectangle(width / 2, separatorY, width * 0.82, 1, 0x30363D).setOrigin(0.5);
        this.contentElements.push(separator);

        // Khung "📍 Your Rank: #12 (19.8s)"
        let myRankY = 405;
        let myBg = this.add.rectangle(width / 2, myRankY, width * 0.82, 44, 0x161B22, 0.9).setOrigin(0.5);

        let rankStr = '';
        let rankColor = '#7EE787';

        if (myScoreData && myScoreData.rank) {
            myBg.setStrokeStyle(1.5, 0x3FB950);
            rankStr = `📍 Your Rank: #${myScoreData.rank} (${myScoreData.time}s)`;
        } else {
            myBg.setStrokeStyle(1, 0x30363D);
            rankStr = `📍 Your Rank: -- (No score yet)`;
            rankColor = '#8B949E';
        }

        let rankNode = this.add.text(width / 2, myRankY, rankStr, {
            fontSize: '15px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: rankColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.contentElements.push(myBg, rankNode);
    }
}

const LeaderboardManager = {
    getUserId() {
        let userId = localStorage.getItem('schulte_user_id');
        if (!userId) {
            // Tạo chuỗi ID ngẫu nhiên kết hợp thời gian để đảm bảo độc nhất
            userId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('schulte_user_id', userId);
        }
        return userId;
    },
    // Lấy tên đã lưu hoặc trả về mặc định
    getPlayerName() {
        return localStorage.getItem('schulte_player_name') || "";
    },

    // Lưu tên mới vào máy
    setPlayerName(name) {
        if (name && name.trim() !== "") {
            localStorage.setItem('schulte_player_name', name.trim());
        }
    },
    // 1. Lưu điểm kèm theo loại game (ví dụ: type: "schulte_table")
    // Lưu điểm và trả về thứ hạng hiện tại của người chơi
    async save(playerName, timeScore, gameType = "schulte_table") {
        try {
            if (!window.db) return 1;
            
            const { collection, addDoc, getDocs, updateDoc, doc, query, where, getCountFromServer } = window.firebaseFunctions;
            const userId = this.getUserId();
            const leaderboardRef = collection(window.db, "leaderboard");

            // 1. Kiểm tra xem user này đã có bản ghi nào trước đó chưa
            const qUser = query(leaderboardRef, where("userId", "==", userId), where("type", "==", gameType));
            const userSnapshot = await getDocs(qUser);

            if (!userSnapshot.empty) {
                // Đã tồn tại, kiểm tra xem có cần cập nhật kỷ lục mới không
                let userDoc = userSnapshot.docs[0];
                let oldData = userDoc.data();
                let bestScore = Math.min(timeScore, oldData.time);
                if (timeScore < oldData.time || userDoc.name !== playerName) {
                    // Phá kỷ lục cá nhân -> Cập nhật điểm mới và tên mới
                    await updateDoc(doc(window.db, "leaderboard", userDoc.id), {
                        time: parseFloat(bestScore),
                        name: playerName,
                        updatedAt: new Date()
                    });
                }
            } else {
                // Chưa có -> Thêm mới hoàn toàn
                await addDoc(leaderboardRef, {
                    userId: userId,
                    name: playerName,
                    time: parseFloat(timeScore),
                    type: gameType,
                    createdAt: new Date()
                });
            }
        } catch (e) {
            console.error("Lỗi khi lưu điểm hoặc tính rank:", e);
            return null;
        }
    },

    async getUserScore(userId, gameType = "schulte_table") {
        try {
            if (!userId) return null;
            if (!window.db) return null;
            const { collection, getDocs, getCountFromServer, query, where } = window.firebaseFunctions;
            
            // 1. Lấy dữ liệu của chính user này từ collection
            const leaderboardRef = collection(window.db, "leaderboard");
            const qUser = query(leaderboardRef, where("userId", "==", userId), where("type", "==", gameType));
            const userSnapshot = await getDocs(qUser);

            if (userSnapshot.empty) {
                return null;
            }
            // Đã tồn tại, kiểm tra xem có cần cập nhật kỷ lục mới không
            let userDoc = userSnapshot.docs[0];

            let userData = userDoc.data();
            let myTime = userData.time;

            // 2. Tính thứ hạng bằng cách đếm số lượng người chơi có thời gian NHANH HƠN (< myTime)
            // Vì Schulte Table tính thời gian thấp hơn là tốt hơn (thời gian chạy đua)

            const qBetter = query(
                leaderboardRef, 
                where("type", "==", gameType),
                where("time", "<", parseFloat(myTime))
            );
            
            // Dùng getCountFromServer để đếm siêu nhanh mà không phải tải toàn bộ tài liệu về
            const snapshot = await getCountFromServer(qBetter);
            let rank = snapshot.data().count + 1

            return {
                rank: rank,
                name: userData.name || 'Anonymous',
                time: myTime,
                userId: userId
            };

        } catch (error) {
            console.error("Error getting my score and rank:", error);
            return null;
        }
    },

    async getRank(timeScore, gameType = "schulte_table") {
        try {
            if (!window.db) return 1;
            
            const { collection, query, where, getCountFromServer } = window.firebaseFunctions;
            const leaderboardRef = collection(window.db, "leaderboard");

            // 2. Tính thứ hạng: Đếm số lượng người có thời gian nhỏ hơn (nhanh hơn) điểm này
            const qBetter = query(
                leaderboardRef, 
                where("type", "==", gameType),
                where("time", "<", parseFloat(timeScore))
            );
            
            // Dùng getCountFromServer để đếm siêu nhanh mà không phải tải toàn bộ tài liệu về
            const snapshot = await getCountFromServer(qBetter);
            let betterCount = snapshot.data().count;

            // Thứ hạng = Số người nhanh hơn + 1
            let myRank = betterCount + 1;
            return myRank;

        } catch (e) {
            console.error("Lỗi khi lưu điểm hoặc tính rank:", e);
            return null;
        }
    },

    // 2. Chỉ lấy top điểm của riêng loại game đó
    async getTopScores(gameType = "schulte_table") {
        try {
            if (!window.db) return [];
            const { collection, getDocs, query, where, orderBy, limit } = window.firebaseFunctions;

            // Truy vấn kết hợp: Lọc theo game đúng type -> Sắp xếp thời gian tăng dần -> Lấy top 5
            const q = query(
                collection(window.db, "leaderboard"), 
                where("type", "==", gameType),
                orderBy("time", "asc"), 
                limit(5)
            );
            
            const querySnapshot = await getDocs(q);
            let scores = [];
            querySnapshot.forEach((doc) => {
                scores.push(doc.data());
            });
            return scores;
        } catch (e) {
            console.error("Lỗi khi tải bảng xếp hạng:", e);
            return [];
        }
    }
};