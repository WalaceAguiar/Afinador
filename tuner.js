/* =======================================================
   LOGICA DO AFINADOR CROMÁTICO COM WEB AUDIO API
   ======================================================= */

// Lista com os nomes das 12 notas musicais
const NOMES_NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Elementos da interface HTML
const noteDisplay = document.getElementById('note-display');
const frequencyDisplay = document.getElementById('frequency-display');
const needle = document.getElementById('needle');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');

let audioContext;
let analyser;
let microphone;
let buffer = new Float32Array(2048);

// Inicia o microfone ao clicar no botão
startBtn.addEventListener('click', async () => {
    try {
        // Criar o contexto de áudio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Pedir permissão ao microfone do telemóvel
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        microphone.connect(analyser);

        startBtn.style.display = 'none'; // Esconde o botão após iniciar
        statusText.innerText = "Toque uma corda...";
        
        // Iniciar o loop de escuta contínua
        processarAudio();

    } catch (err) {
        alert("Erro ao aceder ao microfone. Verifique as permissões!");
        console.error(err);
    }
});

// Loop principal de análise de áudio
function processarAudio() {
    analyser.getFloatTimeDomainData(buffer);
    
    // Calcula a frequência fundamental usando o algoritmo de Autocorrelação
    const frequencia = autoCorrelacao(buffer, audioContext.sampleRate);

    if (frequencia !== -1) {
        // Se encontrou um som claro, calcula a nota
        atualizarAfinador(frequencia);
    }

    // Chama o próximo quadro da animação
    requestAnimationFrame(processarAudio);
}

// Algoritmo matemático para detecção de pitch/frequência
function autoCorrelacao(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;

    // Calcular o volume do som (RMS)
    for (let i = 0; i < SIZE; i++) {
        let val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Se o som for muito fraco (ruído de fundo), ignora
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buf[j] * buf[j + i];
        }
    }

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;

    return sampleRate / T0;
}

// Converte a Frequência em Hertz para a Nota Musical correspondente
function atualizarAfinador(frequencia) {
    // Cálculo da nota MIDI em relação ao A4 (440Hz)
    const numeroNota = 12 * (Math.log(frequencia / 440) / Math.log(2)) + 69;
    const notaArredondada = Math.round(numeroNota);
    
    // Nome da nota (ex: C, E, A)
    const nomeNota = NOMES_NOTAS[notaArredondada % 12];
    
    // Desvio em cents (de -50 a +50)
    const cents = Math.floor((numeroNota - notaArredondada) * 100);

    // Atualiza a tela
    noteDisplay.innerText = nomeNota;
    frequencyDisplay.innerText = `${frequencia.toFixed(1)} Hz`;

    // Move o ponteiro (0 cents = 50% centro)
    // Mapeamos de -50cents (0%) até +50cents (100%)
    let posicaoPonteiro = 50 + cents;
    posicaoPonteiro = Math.max(0, Math.min(100, posicaoPonteiro)); // Limita entre 0% e 100%
    
    needle.style.left = `${posicaoPonteiro}%`;

    // Atualiza cores e texto de status
    if (Math.abs(cents) < 5) {
        // AFINADO (Variação de menos de 5 cents)
        statusText.innerText = "Afinado! Perfect";
        statusText.style.color = "#2ed573";
        noteDisplay.style.color = "#2ed573";
        needle.style.backgroundColor = "#2ed573";
    } else if (cents < 0) {
        // ABAIXO DO TOM
        statusText.innerText = "Abaixo (Aporte a corda)";
        statusText.style.color = "#ffa502";
        noteDisplay.style.color = "#00d2ff";
        needle.style.backgroundColor = "#ffa502";
    } else {
        // ACIMA DO TOM
        statusText.innerText = "Acima (Afrouxe a corda)";
        statusText.style.color = "#ff4757";
        noteDisplay.style.color = "#00d2ff";
        needle.style.backgroundColor = "#ff4757";
    }
}
