// LeaderboardScene.js
class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        const { width, height } = this.scale;

        // 1. Nền tối chủ đạo (Cyber Dark)
        this.add.rectangle(width / 2, height / 2, width, height, 0x0F1115);

        // 2. Tiêu đề
        this.add.text(width / 2, height * 0.12, '🏆 LEADERBOARD', {
            fontSize: '24px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        let loadingText = this.add.text(width / 2, height * 0.3, 'Loading data...', {
            fontSize: '15px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#8B949E'
        }).setOrigin(0.5);

        // 3. Tải dữ liệu Top 5 từ Firebase
        LeaderboardManager.getTopScores("schulte_table").then(async (topScores) => {
            loadingText.destroy();

            if (topScores.length === 0) {
                this.add.text(width / 2, height * 0.3, 'No ranking data yet.', {
                    fontSize: '15px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: '#8B949E'
                }).setOrigin(0.5);
                return;
            }

            let myUserId = LeaderboardManager.getUserId();
            let startY = height * 0.25;
            let rowHeight = 44; // Khoảng cách giữa các dòng

            // Tiêu đề cột nhỏ phía trên (Soft Gray & Mint)
            this.add.text(width * 0.12, startY - 30, 'RANKING', { 
                fontSize: '12px', 
                fontFamily: "'JetBrains Mono', monospace", 
                fill: '#8B949E' 
            }).setOrigin(0, 0.5);
            
            this.add.text(width * 0.88, startY - 30, 'TIME', { 
                fontSize: '12px', 
                fontFamily: "'JetBrains Mono', monospace", 
                fill: '#8B949E' 
            }).setOrigin(1, 0.5);
            
            topScores.forEach((item, index) => {
                let rankNum = index + 1;
                let isMe = item.userId === myUserId;
                
                // Phối màu: Bản thân màu xanh mint sáng (#7EE787), người khác màu trắng ngà (#E6EDF3)
                let color = isMe ? '#7EE787' : '#E6EDF3';
                let style = isMe ? 'bold' : 'normal';

                let currentY = startY + (index * rowHeight);

                // Thêm nền khối mờ nhẹ cho mỗi dòng giúp dễ nhìn
                let rowBg = this.add.rectangle(width / 2, currentY, width * 0.8, 36, 0x161B22, 0.8).setOrigin(0.5);
                if (isMe) {
                    rowBg.setStrokeStyle(1, 0x3FB950); // Viền nhẹ làm nổi bật dòng của chính mình
                }

                // --- CỘT TRÁI: STT + TÊN (Căn trái) ---
                let leftText = `#${rankNum}.  ${item.name}`;
                this.add.text(width * 0.12 + 10, currentY, leftText, {
                    fontSize: '15px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: color,
                    fontStyle: style
                }).setOrigin(0, 0.5);

                // --- CỘT PHẢI: THỜI GIAN (Căn phải tuyệt đối) ---
                let rightText = `${item.time}s`;
                this.add.text(width * 0.88 - 10, currentY, rightText, {
                    fontSize: '15px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fill: color,
                    fontStyle: style
                }).setOrigin(1, 0.5);
            });

            // --- KIỂM TRA XEM USER CÓ NẰM TRONG TOP 5 KHÔNG ---
            let isInTop5 = topScores.some(item => item.userId === myUserId);

            if (!isInTop5 && typeof LeaderboardManager.getUserScore === 'function') {
                // Lấy thông tin xếp hạng cá nhân nếu ngoài top 5 (Giả sử LeaderboardManager có hàm getMyScore hoặc tương tự)
                let myScoreData = await LeaderboardManager.getUserScore(myUserId, "schulte_table"); 
                
                if (myScoreData && myScoreData.rank > 5) {
                    let separatorY = startY + (5 * rowHeight) - 10;
                    
                    // Vẽ dấu chấm ngắt quãng phân cách giữa Top đầu và vị trí của mình
                    this.add.text(width / 2, separatorY, '. . .', {
                        fontSize: '14px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fill: '#8B949E'
                    }).setOrigin(0.5);

                    let myRowY = separatorY + 32;

                    // Khung nền nổi bật cho dòng của chính mình ở dưới
                    let myBg = this.add.rectangle(width / 2, myRowY, width * 0.8, 36, 0x161B22, 0.9).setOrigin(0.5);
                    myBg.setStrokeStyle(1, 0x3FB950);

                    let myLeftText = `#${myScoreData.rank}.  ${myScoreData.name} (you)`;
                    this.add.text(width * 0.12 + 10, myRowY, myLeftText, {
                        fontSize: '15px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fill: '#7EE787',
                        fontStyle: 'bold'
                    }).setOrigin(0, 0.5);

                    let myRightText = `${myScoreData.time}s`;
                    this.add.text(width * 0.88 - 10, myRowY, myRightText, {
                        fontSize: '15px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fill: '#7EE787',
                        fontStyle: 'bold'
                    }).setOrigin(1, 0.5);
                }
            }

        });

        // 4. Nút BACK (Flat UI Style & Soft Mint Accent)
        let btnX = width / 2;
        let btnY = height * 0.85;
        
        // Hiệu ứng bóng phẳng dưới nút
        let shadowBg = this.add.rectangle(btnX, btnY + 3, 200, 46, 0x111318, 1).setOrigin(0.5).setStrokeStyle(1, 0x21262D);
        let faceBg = this.add.rectangle(btnX, btnY, 200, 46, 0x1F242C).setInteractive().setOrigin(0.5);
        faceBg.setStrokeStyle(2, 0x3FB950); // Viền xanh lá nhẹ đặc trưng

        let btnText = this.add.text(btnX, btnY, '← BACK', {
            fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            fill: '#7EE787',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Tương tác hover / click mượt mà
        faceBg.on('pointerover', () => { 
            faceBg.setFillStyle(0x2A323D); 
            btnText.setFillStyle && btnText.setColor('#FFFFFF');
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
            this.scene.start('MenuScene'); 
        });
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