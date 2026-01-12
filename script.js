const timeDisplay = document.getElementById('timeDisplay');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const millisecondsDisplay = document.getElementById('milliseconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const lapBtn = document.getElementById('lapBtn');
const lapsList = document.getElementById('lapsList');
const lapsWrapper = document.getElementById('lapsWrapper');
const statusText = document.getElementById('statusText');
const circle = document.getElementById('progressCircle');
const copyBtn = document.getElementById('copyBtn');
const clockFace = document.getElementById('clockFace');

let startTime = 0;
let elapsedTime = 0;
let lastLapTime = 0; 
let timerInterval;
let lapCounter = 1;
let isRunning = false;

const circumference = 2 * Math.PI * 128;
circle.style.strokeDasharray = circumference;
circle.style.strokeDashoffset = circumference;

function createClockFace() {
    for (let i = 0; i < 60; i++) {
        const tick = document.createElement('div');
        tick.classList.add('tick');
        
        if (i % 5 === 0) {
            tick.classList.add('major');
        }

        tick.style.transform = `rotate(${i * 6}deg) translateY(-135px)`;
        clockFace.appendChild(tick);
    }
}
createClockFace();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq = 600, dur = 0.1) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
}

function formatTime(time) {
    let date = new Date(time);
    let m = date.getUTCMinutes();
    let s = date.getUTCSeconds();
    let ms = date.getUTCMilliseconds();
    return {
        m: m < 10 ? '0' + m : m,
        s: s < 10 ? '0' + s : s,
        ms: ms < 10 ? '00' + ms : ms < 100 ? '0' + ms : ms,
        rawSeconds: s + (ms / 1000)
    };
}

function updateDisplay() {
    const formatted = formatTime(elapsedTime);
    minutesDisplay.textContent = formatted.m;
    secondsDisplay.textContent = formatted.s;
    millisecondsDisplay.textContent = formatted.ms;
    
    const offset = circumference - (formatted.rawSeconds / 60) * circumference;
    circle.style.strokeDashoffset = offset;
}

function startTimer() {
    if (isRunning) return;
    playBeep(800);
    isRunning = true;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateDisplay();
    }, 10);
    toggleControls('running');
    timeDisplay.classList.add('active');
    statusText.textContent = "Running";
}

function pauseTimer() {
    if (!isRunning) return;
    playBeep(400);
    isRunning = false;
    clearInterval(timerInterval);
    toggleControls('paused');
    timeDisplay.classList.remove('active');
    statusText.textContent = "Paused";
}

function resetTimer() {
    playBeep(300, 0.2);
    isRunning = false;
    clearInterval(timerInterval);
    elapsedTime = 0;
    lastLapTime = 0; 
    lapCounter = 1;
    updateDisplay();
    
    circle.style.strokeDashoffset = circumference;
    timeDisplay.classList.remove('active');
    lapsList.innerHTML = '';
    
    lapsWrapper.classList.add('hidden');
    
    toggleControls('stopped');
    statusText.textContent = "Press Space to Start";
}

function recordLap() {
    if (!isRunning) return;
    playBeep(1200, 0.05);

    if (lapsWrapper.classList.contains('hidden')) {
        lapsWrapper.classList.remove('hidden');
    }

    const diff = elapsedTime - lastLapTime;
   
    const formattedTotal = formatTime(elapsedTime);
    const formattedDiff = formatTime(diff);

    const li = document.createElement('li');
    li.classList.add('lap-item');
   
    li.innerHTML = `
        <span class="lap-number">#${String(lapCounter).padStart(2, '0')}</span> 
        <span class="lap-diff">+${formattedDiff.m}:${formattedDiff.s}.${formattedDiff.ms}</span>
        <span class="lap-total">${formattedTotal.m}:${formattedTotal.s}.${formattedTotal.ms}</span>
    `;
    
    lapsList.prepend(li);
   
    lastLapTime = elapsedTime;
    lapCounter++;
}

function toggleControls(state) {
    if (state === 'running') {
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        lapBtn.disabled = false;
        resetBtn.disabled = true;
    } else if (state === 'paused') {
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        startBtn.textContent = "Resume";
        lapBtn.disabled = true;
        resetBtn.disabled = false;
    } else {
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        startBtn.textContent = "Start";
        lapBtn.disabled = true;
        resetBtn.disabled = false;
    }
}

copyBtn.addEventListener('click', () => {
    const laps = Array.from(document.querySelectorAll('.lap-item'))
        .map(item => {
            const num = item.querySelector('.lap-number').innerText;
            const diff = item.querySelector('.lap-diff').innerText;
            const total = item.querySelector('.lap-total').innerText;
            return `${num} | Split: ${diff} | Total: ${total}`;
        }).join('\n');
    
    navigator.clipboard.writeText(laps);
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy", 1500);
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
lapBtn.addEventListener('click', recordLap);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); isRunning ? pauseTimer() : startTimer(); }
    if (e.code === 'KeyL') recordLap();
    if (e.code === 'KeyR') resetTimer();

});
