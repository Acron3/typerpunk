const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let wordBuffer = [];

async function fetchWords() {
    try {
        const response = await fetch(
            "https://random-words-api.kushcreates.com/api?language=en&words=50",
        );
        const data = await response.json();
        wordBuffer = data.map((word) => word.word.toUpperCase());
        wordBuffer = wordBuffer.filter((w) => !w.includes(" "));
        console.log("Kata baru berhasil di-fetch!");
    } catch (err) {
        console.error("Gagal ambil kata, pake cadangan:", err);
        wordBuffer = [
            "ATTACK",
            "DASH",
            "SHIELD",
            "BREAK",
            "ESCAPE",
            "RUN",
            "JUMP",
            "COMBO",
            "SURVIVE",
            "BUNKER",
        ];
    }
}

fetchWords();

let score = 0;
let gameOver = false;
let highScore = localStorage.getItem("highScore") || 0;

let startTime = null;
let totalCorrectLetters = 0;
let currentWPM = 0;

let baseSpeed = 3;

let player = {
    x: 100,
    y: 200,
    width: 50,
    height: 50,
};

let obstacle = {
    x: canvas.width,
    y: 200,
    width: 120,
    height: 50,
    speed: baseSpeed,
    word: "",
    targetIndex: 0,
};

let laser = {
    active: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    startTime: 0,
    duration: 200,
};

function spawnObstacle() {
    if (wordBuffer.length === 0) {
        fetchWords();
        obstacle.word = "LOADING";
    } else {
        obstacle.word = wordBuffer.shift().toUpperCase();
    }
    obstacle.targetIndex = 0;

    ctx.font = "bold 22px monospace";
    obstacle.width = ctx.measureText(obstacle.word).width + 50;

    obstacle.x = canvas.width;
    obstacle.y = player.y + player.height / 2 - obstacle.height / 2;

    obstacle.speed = obstacle.speed + 0.05;
    if (obstacle.speed >= 5) obstacle.speed = 5; // LIMIT SPEED
}

spawnObstacle();

window.addEventListener("keydown", (e) => {
    if (gameOver && e.key === " ") {
        window.location.reload();
    }

    if (gameOver) return;

    if (startTime === null) {
        startTime = Date.now();
    }

    let pressedKey = e.key.toUpperCase();
    let requiredLetter = obstacle.word[obstacle.targetIndex];

    if (pressedKey === requiredLetter) {
        obstacle.targetIndex++;

        if (obstacle.targetIndex === obstacle.word.length) {
            score += 10;

            if (score > highScore) {
                localStorage.setItem("highScore", score);
                highScore = score;
            }

            totalCorrectLetters += obstacle.word.length;

            laser.active = true;
            laser.startTime = Date.now();

            laser.startX = player.x + 50;
            laser.startY = player.y + 18;

            laser.endX = obstacle.x + obstacle.width / 2;
            laser.endY = obstacle.y + obstacle.height / 2;

            spawnObstacle();
        }
    } else {
        if (e.key.length === 1) {
            obstacle.targetIndex = 0; 
        }
    }
});

function update() {
    if (gameOver) return;

    obstacle.x -= obstacle.speed;

    // Hitung WPM real-time
    if (startTime !== null) {
        let timeElapsedInMinutes = (Date.now() - startTime) / 1000 / 60;
        if (timeElapsedInMinutes > 0) {
            currentWPM = Math.round(totalCorrectLetters / 5 / timeElapsedInMinutes);
        }
    }
    // UPDATE ANIMASI
    if (laser.active) {
        if (Date.now() - laser.startTime > laser.duration) {
            laser.active = false;
        }
    }

    if (obstacle.x <= player.x + player.width) {
        gameOver = true;
    }
}

let stars = [];
for (let i = 0; i < 30; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1,
    });
}

function render() {
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    stars.forEach((star) => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        if (!gameOver) {
            star.x -= star.speed * (obstacle.speed * 0.5);
            if (star.x < 0) star.x = canvas.width;
        }
    });

    ctx.strokeStyle = "#1f2833";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(canvas.width, 50);
    ctx.stroke();

    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff007f";
    ctx.beginPath();
    ctx.moveTo(0, player.y + player.height + 5);
    ctx.lineTo(canvas.width, player.y + player.height + 5);
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (gameOver) {
        ctx.fillStyle = "rgba(11, 12, 16, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff3333";
        ctx.fillStyle = "#ff3333";
        ctx.font = "bold 42px monospace";

        ctx.fillText(
            "GAME OVER",
            canvas.width / 2 - ctx.measureText("GAME OVER").width / 2,
            canvas.height / 2 - 100,
        );

        ctx.shadowColor = "#00ffcc";
        ctx.fillStyle = "#00ffcc";
        ctx.font = "18px monospace";

        ctx.fillText(`TYPING SPEED\t\t\t: ${currentWPM} wpm`, 10, canvas.height / 2 + 10);
        ctx.fillText(`FINAL SCORE\t\t\t\t: ${score} pts`, 10, canvas.height / 2 + 30);
        ctx.fillText(`HIGH SCORE\t\t\t\t\t: ${score} pts`, 10, canvas.height / 2 + 50);

        ctx.shadowBlur = 0;
        let pulse = (Math.sin(Date.now() / 300) + 1) / 2;
        ctx.save();

        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + pulse * 0.8})`;
        ctx.shadowBlur = 5 + pulse * 10;
        ctx.shadowColor = "#ffffff";

        ctx.font = "500 18px monospace";
        ctx.fillText(
            `Press SPACE to Restart`,
            canvas.width / 2 - ctx.measureText(`Press SPACE to Restart`).width / 2,
            canvas.height / 2 + 80,
        );
        ctx.shadowBlur = 0;
        return;
    }

    ctx.fillStyle = "#66fcf1";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#45f3ff";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#66fcf1";
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#1f2833";
    ctx.fillRect(player.x + 20, player.y + 12, 30, 12);
    ctx.fillStyle = "#ff007f";
    ctx.fillRect(player.x + 25, player.y + 17, 25, 2);

    ctx.save();

    let chamfer = 15;

    ctx.beginPath();
    ctx.moveTo(obstacle.x + chamfer, obstacle.y);
    ctx.lineTo(obstacle.x + obstacle.width - chamfer, obstacle.y);
    // Ujung kanan lancip
    ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height / 2);
    ctx.lineTo(obstacle.x + obstacle.width - chamfer, obstacle.y + obstacle.height);
    ctx.lineTo(obstacle.x + chamfer, obstacle.y + obstacle.height);
    // Ujung kiri lancip
    ctx.lineTo(obstacle.x, obstacle.y + obstacle.height / 2);
    ctx.closePath();

    ctx.fillStyle = "#1f2833";
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ff5e00";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff5e00";
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ff5e00";
    ctx.fillRect(obstacle.x + obstacle.width / 2 - 15, obstacle.y - 4, 30, 4);
    ctx.fillRect(obstacle.x + obstacle.width / 2 - 15, obstacle.y + obstacle.height, 30, 4);

    ctx.fillStyle = "#ff007f";
    ctx.beginPath();
    ctx.arc(obstacle.x + 15, obstacle.y + obstacle.height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.font = "bold 22px monospace";
    let typedWord = obstacle.word.substring(0, obstacle.targetIndex);
    let remainingWord = obstacle.word.substring(obstacle.targetIndex);

    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;

    ctx.fillStyle = "#00ffcc";
    ctx.fillText(typedWord, obstacle.x + 25, obstacle.y + obstacle.height - 18);

    let typedWidth = ctx.measureText(typedWord).width;
    ctx.fillStyle = "#a9b7c6";
    ctx.fillText(remainingWord, obstacle.x + 25 + typedWidth, obstacle.y + obstacle.height - 18);
    ctx.shadowBlur = 0;

    if (laser.active) {
        let elapsed = Date.now() - laser.startTime;
        let progress = elapsed / laser.duration;
        let opacity = 1 - progress;

        ctx.save();

        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff007f";

        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(laser.endX, laser.endY);

        ctx.lineWidth = 10 * opacity;
        ctx.strokeStyle = `rgba(255, 0, 127, ${opacity})`;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.lineWidth = 4 * opacity;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.stroke();

        ctx.restore();
    }
    ctx.font = "600 15px monospace";

    ctx.fillStyle = "#c5c6c7";
    ctx.fillText("SCORE:", 25, 32);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(score.toString().padStart(4, "0"), 80, 32);

    ctx.fillStyle = "#c5c6c7";
    ctx.fillText("HIGH SCORE:", 150, 32);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(highScore.toString().padStart(4, "0"), 250, 32);

    ctx.fillStyle = "#c5c6c7";
    ctx.fillText("ANALYTICS:", 320, 32);
    ctx.fillStyle = "#66fcf1";
    ctx.fillText(`${currentWPM} WPM`, 410, 32);

    ctx.fillStyle = "#c5c6c7";
    ctx.fillText("CORE SPEED:", 480, 32);
    ctx.fillStyle = "#ff9f43";
    ctx.fillText(`${obstacle.speed.toFixed(2)}x`, 580, 32);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();
