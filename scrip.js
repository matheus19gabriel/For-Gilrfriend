// ===== 1) Lógica SIM / NÃO =====
const perg = document.getElementById("perg");
const surpresa = document.getElementById("surpresa");
const ameaca = document.getElementById("ameaca");
const btnSim = document.getElementById("btn-sim");
const btnNao = document.getElementById("btn-nao");
const esconde = document.getElementById("esconde");

let fugas = 0;

// SIM: esconde a pergunta, a ameaça e o coração; abre a galeria 3D
btnSim.addEventListener("click", () => {
    perg.classList.add("escondido");
    ameaca.classList.add("escondido");
    esconde.classList.add("escondido");
    surpresa.classList.remove("escondido");
    window.scrollTo(0, 0);

    try {
        if (window.iniciarGaleria) window.iniciarGaleria();
    } catch (erro) {
        console.error("Erro na galeria 3D:", erro);
    }
});

// NÃO: foge nos primeiros cliques e, no 5º, some e mostra a ameaça
btnNao.addEventListener("click", () => {
    fugas++;

    if (fugas >= 5) {
        btnNao.style.display = "none";
        ameaca.classList.remove("escondido");
        return;
    }

    const maxX = window.innerWidth - btnNao.offsetWidth;
    const maxY = window.innerHeight - btnNao.offsetHeight;

    btnNao.style.position = "fixed";
    btnNao.style.left = Math.random() * maxX + "px";
    btnNao.style.top = Math.random() * maxY + "px";
});

// ===== 2) Efeitos dos botões (se falharem, a lógica acima continua funcionando) =====
try {
    // Molas: movimento suave, igual ao "spring" do Framer Motion
    const RIGIDEZ = 200;
    const AMORTECIMENTO = 20;
    const molas = [];
    let animando = false;
    let ultimoTempo = 0;

    function criarMola(inicial, aplicar, precisao) {
        const mola = {
            valor: inicial, alvo: inicial, vel: 0,
            ativa: false, aplicar: aplicar, precisao: precisao || 0.01
        };
        molas.push(mola);
        aplicar(inicial);
        return mola;
    }

    function mirar(mola, alvo) {
        if (mola.alvo === alvo) return;
        mola.alvo = alvo;
        mola.ativa = true;
        if (!animando) {
            animando = true;
            ultimoTempo = performance.now();
            requestAnimationFrame(quadro);
        }
    }

    function quadro(agora) {
        const dt = Math.max(0, Math.min((agora - ultimoTempo) / 1000, 1 / 30));
        ultimoTempo = agora;
        let algumaAtiva = false;

        molas.forEach((m) => {
            if (!m.ativa) return;
            const passos = 4;
            const h = dt / passos;
            for (let i = 0; i < passos; i++) {
                const aceleracao = -RIGIDEZ * (m.valor - m.alvo) - AMORTECIMENTO * m.vel;
                m.vel += aceleracao * h;
                m.valor += m.vel * h;
            }
            if (Math.abs(m.vel) < m.precisao && Math.abs(m.valor - m.alvo) < m.precisao) {
                m.valor = m.alvo;
                m.vel = 0;
                m.ativa = false;
            } else {
                algumaAtiva = true;
            }
            m.aplicar(m.valor);
        });

        if (algumaAtiva) requestAnimationFrame(quadro);
        else animando = false;
    }

    function div(classe) {
        const el = document.createElement("div");
        el.className = classe;
        return el;
    }

    // SIM: brilho laranja que segue o cursor
    function ativarBotaoCursor(btn) {
        const frag = document.createDocumentFragment();
        const camadas = [];

        for (let i = 0; i < 5; i++) {
            const t = 1 - i / 5;
            const camada = div("camada");
            const corte = div("corte desfoque");
            const a = div("blob");
            const b = div("blob");
            a.style.left = (40 + t * 40) + "%";
            b.style.left = (60 - t * 60) + "%";
            corte.append(a, b);
            camada.append(corte);
            frag.append(camada);

            camadas.push({
                t: t,
                mA: criarMola(Math.sqrt(t), (v) => {
                    a.style.transform = "translateX(-50%) scale(" + Math.max(0, v) + ")";
                }, 0.001),
                mB: criarMola(0, (v) => {
                    b.style.transform = "translateX(-50%) scale(" + Math.max(0, v) + ")";
                }, 0.001)
            });
        }

        const corteBrilho = div("corte");
        const brilho = div("brilho");
        corteBrilho.append(brilho);
        frag.append(corteBrilho);
        frag.append(div("camada fundo-claro"));
        btn.prepend(frag);

        const mBrilho = criarMola(btn.clientWidth, (v) => {
            brilho.style.left = v + "px";
        }, 0.05);

        let x = null; // posição do mouse dentro do botão (null = fora)

        function atualizar() {
            const centro = btn.clientWidth / 2 || 1;
            const rx = x === null ? 1e4 : x - centro;
            camadas.forEach((c) => {
                const d = Math.pow(Math.min(Math.abs(rx * c.t) / centro, c.t), 0.5);
                mirar(c.mA, rx < 0 ? 0 : d);
                mirar(c.mB, rx < 0 ? d : 0);
            });
            mirar(mBrilho, x === null ? btn.clientWidth : x);
        }

        function mover(e) {
            x = e.clientX - btn.getBoundingClientRect().left;
            atualizar();
        }
        function sair() {
            x = null;
            atualizar();
        }

        btn.addEventListener("pointerenter", mover);
        btn.addEventListener("pointermove", mover);
        btn.addEventListener("pointerleave", sair);
        btn.addEventListener("pointercancel", sair);
        window.addEventListener("resize", atualizar);
    }

    // NÃO: borda escura com luz laranja deslizando
    function ativarBotaoBorda(btn) {
        const corte = div("corte");
        const barra = div("barra");
        corte.append(barra);
        btn.prepend(corte, div("camada borda"), div("camada fundo-escuro"));

        const mBarra = criarMola(100, (v) => {
            barra.style.right = v + "%";
        });

        function mover(e) {
            const larg = btn.clientWidth;
            const centro = larg / 2 || 1;
            const x = e.clientX - btn.getBoundingClientRect().left;
            const dist = Math.min(Math.max((larg - x) / centro, 0), 1);
            mirar(mBarra, 100 + dist * 50);
        }
        function sair() {
            mirar(mBarra, 100);
        }

        btn.addEventListener("pointerenter", mover);
        btn.addEventListener("pointermove", mover);
        btn.addEventListener("pointerleave", sair);
        btn.addEventListener("pointercancel", sair);
    }

    ativarBotaoCursor(btnSim);
    ativarBotaoBorda(btnNao);
    console.log("Efeitos dos botões ativos");
} catch (erro) {
    console.error("Erro nos efeitos dos botões:", erro);
}

// ===== 3) Farol de letras: um feixe de caracteres que aponta para o mouse/dedo =====
try {
    // Ajustes
    const OPCOES = {
        tamanhoGrade: 15,      // tamanho de cada "célula" em pixels (5 a 50)
        deBaixo: 5,            // altura da origem do feixe, em células (0 a 20)
        tamanhoTexto: 1.2,     // tamanho das letras (0.1 a 3)
        desenharTexto: true,   // false = quadradinhos em vez de letras
        corFogo: false,        // true = feixe em tons de fogo (vermelho, laranja, amarelo)
        alcance: 1.8,          // comprimento do feixe (1 = original; maior = vai mais longe)
        forca: 0.7,            // brilho do feixe (1 = original; maior = mais forte)
        abertura: 0.85         // largura do feixe em radianos (original = 0.7)
    };

    const caracteres = " .-:=+*#%@".split("");

    const canvas = document.createElement("canvas");
    canvas.style.cssText =
        "position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;";
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d");

    let L = 0, A = 0;
    function ajustar() {
        const dpr = window.devicePixelRatio || 1; // deixa as letras nítidas em telas de celular
        L = window.innerWidth;
        A = window.innerHeight;
        canvas.width = L * dpr;
        canvas.height = A * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    ajustar();
    window.addEventListener("resize", ajustar);

    // Posição do mouse/dedo (null = ainda não mexeu: o feixe aponta para cima)
    let ponteiro = null;
    window.addEventListener("mousemove", (e) => {
        ponteiro = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("touchmove", (e) => {
        const toque = e.touches[0];
        if (toque) ponteiro = { x: toque.clientX, y: toque.clientY };
    }, { passive: true });

    // Intensidade (0 a 1) de uma célula, conforme o ângulo e a distância até a origem
    function calcularIntensidade(px, py, anguloAlvo, raioMax) {
        let dif = Math.abs(Math.atan2(py, px) - anguloAlvo);
        if (dif > Math.PI) dif = 2 * Math.PI - dif;

        const dist = Math.hypot(px, py);
        if (dist > raioMax || dif > OPCOES.abertura) return 0;

        const intAngulo = Math.max(0, 1 - dif / (OPCOES.abertura * 1.25));
        const intDistancia = Math.pow(Math.max(0, 1 - dist / raioMax), 0.7);

        const bruto = Math.pow(intAngulo * intDistancia * 1.05, 1.2) * OPCOES.forca;
        return Math.min(1, bruto);
    }

    // Ruído suave no tempo, para o feixe "tremeluzir"
    function ruido(x, y, t) {
        return (Math.sin(x + t) + Math.sin(1.5 * y + 0.8 * t) + Math.sin(2.5 * (x + y) + 1.2 * t)) / 3;
    }

    function desenharFarol(t) {
        // A galeria 3D liga essa trava para o farol parar de gastar bateria
        if (window.pararFarol) {
            ctx.clearRect(0, 0, L, A);
            return;
        }
        ctx.clearRect(0, 0, L, A);

        const g = OPCOES.tamanhoGrade;
        const baixoPx = OPCOES.deBaixo * g;
        const centroX = L / 2;
        const centroY = A - baixoPx;

        let mx = 0, my = baixoPx;
        if (ponteiro) {
            mx = ponteiro.x - centroX;
            my = centroY - ponteiro.y;
        }
        mx /= g;
        my /= g;

        const largura = Math.floor(L / g);
        const altura = Math.floor(A / g);
        const anguloAlvo = Math.atan2(my, mx);
        const comprimento = Math.hypot(mx, my);
        const raio = altura * OPCOES.alcance *
            (0.5 + 0.5 * Math.min(comprimento / (0.9 * Math.max(largura, altura)), 1));

        ctx.font = (g * OPCOES.tamanhoTexto) + "px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let x = -Math.floor(largura / 2); x <= Math.ceil(largura / 2); x++) {
            for (let y = -OPCOES.deBaixo; y <= altura; y++) {
                const base = calcularIntensidade(x, y, anguloAlvo, raio);
                if (base === 0) continue;

                const intensidade = Math.min(1, base * (0.1 * ruido(0.2 * x, 0.2 * y, t * 0.005) + 0.95));

                const sx = centroX + x * g;
                const sy = A - (y + OPCOES.deBaixo) * g;

                if (OPCOES.corFogo) {
                    const i = Math.min(1, Math.max(0, intensidade));
                    const verde = Math.floor(255 * Math.min(1, i * 1.25));
                    const azul = Math.floor(255 * Math.max(0, (i - 0.6) * 2.5));
                    const alfa = Math.min(1, i * 1.2);
                    ctx.fillStyle = "rgba(255," + verde + "," + azul + "," + alfa + ")";
                } else {
                    ctx.fillStyle = "rgba(255,255,255," + intensidade + ")";
                }

                if (!OPCOES.desenharTexto) {
                    ctx.fillRect(sx - g / 2, sy - g / 2, g, g);
                    continue;
                }

                const indice = Math.min(caracteres.length - 1, Math.floor(intensidade * caracteres.length));
                if (indice === 0) continue;
                ctx.fillText(caracteres[indice], sx, sy);
            }
        }

        requestAnimationFrame(desenharFarol);
    }
    requestAnimationFrame(desenharFarol);

    console.log("Farol ativo");
} catch (erro) {
    console.error("Erro no farol:", erro);
}

// ===== 4) Galeria 3D: cartões flutuando, arrasta para girar, rola para dar zoom =====
try {
    // Ajustes
    const GAL = {
        larguraCartao: 110,   // tamanho de cada cartão em pixels
        alturaCartao: 150,
        raioMin: 260,         // distância mínima do centro até os cartões
        raioMax: 400,         // distância máxima (maior = nuvem mais espalhada)
        giroAutomatico: 0.0012 // velocidade do giro sozinho (0 = parado)
    };

    // Estilos da galeria (injetados aqui, não precisa mexer no style.css)
    const estilo = document.createElement("style");
    estilo.textContent = `
    .gal{position:fixed;inset:0;z-index:100;background:#05060a;overflow:hidden;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
    .gal:active{cursor:grabbing}
    .gal canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
    .gal-cena{position:absolute;inset:0;perspective:900px}
    .gal-mundo{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}
    .cartao{position:absolute;overflow:hidden;border-radius:8px;border:2px solid #2b2b33;background:#1b1b22;box-shadow:0 0 18px rgba(0,0,0,.7);cursor:pointer}
    .cartao img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;border-radius:0}
    .cartao span{position:absolute;left:0;right:0;bottom:0;padding:16px 6px 5px;font:600 9px sans-serif;color:#fff;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(transparent,rgba(0,0,0,.85))}
    .gal-titulo{position:absolute;left:20px;top:18px;max-width:75vw;text-align:left;pointer-events:none}
    .gal-titulo h1{margin:0 0 6px;font-size:clamp(18px,4.5vw,30px);color:#fff}
    .gal-titulo p{margin:0;font-size:13px;color:#a9a9b3}
    .det{position:fixed;inset:0;z-index:110;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
    .det.aberto{display:flex;animation:detEntra .25s ease-out}
    @keyframes detEntra{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    .det-caixa{width:min(92vw,720px);max-height:92vh;overflow-y:auto;padding:16px;color:#fff;text-align:center}
    .det-fotos{display:flex;gap:8px;justify-content:center}
    .det-fotos img{flex:1 1 0;width:auto;min-width:0;max-width:100%;max-height:55vh;object-fit:contain;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,.7)}
    .det-caixa h2{margin:16px 0 8px;font-size:clamp(18px,4vw,24px);color:#fff}
    .det-caixa p{margin:0 0 10px;font-size:15px;line-height:1.55;color:#ddd;text-align:left}
    .det button{position:fixed;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:18px;cursor:pointer}
    .det button:hover{background:rgba(255,255,255,.3)}
    .det-x{top:14px;right:14px}
    .det-ant{left:10px;top:50%}
    .det-prox{right:10px;top:50%}
    `;
    document.head.appendChild(estilo);

    let iniciada = false;

    window.iniciarGaleria = function () {
        if (iniciada) return;

        // ---- 1) Lê as fotos e textos que já estão no HTML da surpresa ----
        // Cada foto (ou fotos seguidas) + o h1 + os p que vêm depois = um cartão
        const itens = [];
        let atual = null;
        let ultimoFoiImg = false;

        Array.from(surpresa.children).forEach((el) => {
            if (el.tagName === "IMG") {
                if (!atual || !ultimoFoiImg) {
                    atual = { imgs: [], titulo: "", textos: [] };
                    itens.push(atual);
                }
                atual.imgs.push(el.src);
                ultimoFoiImg = true;
            } else if (atual) {
                ultimoFoiImg = false;
                if (el.tagName === "H1") atual.titulo = el.textContent.trim();
                else if (el.tagName === "P") atual.textos.push(el.textContent.trim());
            }
        });
        if (!itens.length) throw new Error("Nenhuma foto encontrada dentro de #surpresa");

        // ---- 2) Monta a cena ----
        const gal = document.createElement("div");
        gal.className = "gal";

        const estrelas = document.createElement("canvas");
        const cena = document.createElement("div");
        cena.className = "gal-cena";
        const mundo = document.createElement("div");
        mundo.className = "gal-mundo";
        cena.appendChild(mundo);

        const cab = document.createElement("div");
        cab.className = "gal-titulo";
        const cabH1 = document.createElement("h1");
        cabH1.textContent = GAL.titulo;
        const cabP = document.createElement("p");
        cabP.textContent = GAL.subtitulo;
        cab.append(cabH1, cabP);

        gal.append(estrelas, cena, cab);

        // Cartões espalhados numa esfera (espiral de Fibonacci), cada um torto de um jeito
        const rand = (a) => (Math.random() * 2 - 1) * a;
        const n = itens.length;
        const cartoes = itens.map((item, i) => {
            const c = document.createElement("div");
            c.className = "cartao";
            c.style.cssText = "width:" + GAL.larguraCartao + "px;height:" + GAL.alturaCartao + "px;" +
                "margin:" + (-GAL.alturaCartao / 2) + "px 0 0 " + (-GAL.larguraCartao / 2) + "px;";

            const foto = document.createElement("img");
            foto.src = item.imgs[0];
            foto.alt = item.titulo;
            const rotulo = document.createElement("span");
            rotulo.textContent = item.titulo;
            c.append(foto, rotulo);

            const fi = Math.acos(1 - 2 * (i + 0.5) / n);
            const teta = Math.PI * (1 + Math.sqrt(5)) * i;
            const r = GAL.raioMin + Math.random() * (GAL.raioMax - GAL.raioMin);
            const x = r * Math.sin(fi) * Math.cos(teta);
            const y = r * Math.cos(fi) * 0.8;
            const z = r * Math.sin(fi) * Math.sin(teta);

            c.style.transform = "translate3d(" + x + "px," + y + "px," + z + "px) " +
                "rotateX(" + rand(40) + "deg) rotateY(" + rand(55) + "deg) rotateZ(" + rand(25) + "deg)";
            c.dataset.i = i;
            mundo.appendChild(c);
            return c;
        });

        // ---- 3) Tela de detalhe: foto inteira + texto embaixo ----
        const det = document.createElement("div");
        det.className = "det";
        const caixa = document.createElement("div");
        caixa.className = "det-caixa";
        const btnX = document.createElement("button");
        btnX.className = "det-x";
        btnX.textContent = "✕";
        const btnAnt = document.createElement("button");
        btnAnt.className = "det-ant";
        btnAnt.textContent = "◀";
        const btnProx = document.createElement("button");
        btnProx.className = "det-prox";
        btnProx.textContent = "▶";
        det.append(caixa, btnX, btnAnt, btnProx);

        let aberto = -1;

        function abrir(i) {
            aberto = (i + n) % n;
            const item = itens[aberto];
            caixa.innerHTML = "";

            const fotos = document.createElement("div");
            fotos.className = "det-fotos";
            item.imgs.forEach((src) => {
                const im = document.createElement("img");
                im.src = src;
                fotos.appendChild(im);
            });
            caixa.appendChild(fotos);

            if (item.titulo) {
                const t = document.createElement("h2");
                t.textContent = item.titulo;
                caixa.appendChild(t);
            }
            item.textos.forEach((txt) => {
                const p = document.createElement("p");
                p.textContent = txt;
                caixa.appendChild(p);
            });
            caixa.scrollTop = 0;
            det.classList.add("aberto");
        }
        function fechar() {
            aberto = -1;
            det.classList.remove("aberto");
        }

        btnX.addEventListener("click", fechar);
        btnAnt.addEventListener("click", () => abrir(aberto - 1));
        btnProx.addEventListener("click", () => abrir(aberto + 1));
        det.addEventListener("click", (e) => { if (e.target === det) fechar(); });
        window.addEventListener("keydown", (e) => {
            if (aberto < 0) return;
            if (e.key === "Escape") fechar();
            if (e.key === "ArrowLeft") abrir(aberto - 1);
            if (e.key === "ArrowRight") abrir(aberto + 1);
        });

        // ---- 4) Estrelas de fundo (desenhadas uma vez) ----
        function desenharEstrelas() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = window.innerWidth, h = window.innerHeight;
            estrelas.width = w * dpr;
            estrelas.height = h * dpr;
            const c = estrelas.getContext("2d");
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, w, h);
            for (let i = 0; i < 260; i++) {
                c.globalAlpha = 0.25 + Math.random() * 0.75;
                c.fillStyle = "#fff";
                const t = Math.random() < 0.9 ? 1 : 2;
                c.fillRect(Math.random() * w, Math.random() * h, t, t);
            }
        }
        desenharEstrelas();
        window.addEventListener("resize", desenharEstrelas);

        // ---- 5) Câmera: arrastar, zoom, pinça e giro automático ----
        let rx = -0.15, ry = 0, vx = 0, vy = 0;
        let zoom = -1400;          // começa longe e se aproxima (entrada suave)
        let alvoZoom = -150;
        const ZOOM_MIN = -700, ZOOM_MAX = 380;

        const ponteiros = new Map();
        let moveu = 0, distPinca = 0;

        gal.addEventListener("pointerdown", (e) => {
            if (aberto >= 0) return;
            ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (ponteiros.size === 1) moveu = 0;
            if (ponteiros.size === 2) {
                const [a, b] = Array.from(ponteiros.values());
                distPinca = Math.hypot(a.x - b.x, a.y - b.y);
            }
        });

        window.addEventListener("pointermove", (e) => {
            const p = ponteiros.get(e.pointerId);
            if (!p) return;
            const dx = e.clientX - p.x, dy = e.clientY - p.y;
            p.x = e.clientX;
            p.y = e.clientY;

            if (ponteiros.size === 1) {
                moveu += Math.abs(dx) + Math.abs(dy);
                ry += dx * 0.005;
                rx -= dy * 0.005;
                vy = dx * 0.005;
                vx = -dy * 0.005;
            } else if (ponteiros.size === 2) {
                const [a, b] = Array.from(ponteiros.values());
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                alvoZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, alvoZoom + (d - distPinca) * 1.6));
                distPinca = d;
                moveu = 99; // pinça nunca conta como clique
            }
        });

        function soltou(e) {
            if (!ponteiros.has(e.pointerId)) return;
            const foiUnico = ponteiros.size === 1;
            ponteiros.delete(e.pointerId);
            // Toque curto, sem arrastar = clique no cartão
            if (foiUnico && moveu < 8 && e.type === "pointerup") {
                const alvo = e.target.closest && e.target.closest(".cartao");
                if (alvo) abrir(Number(alvo.dataset.i));
            }
        }
        window.addEventListener("pointerup", soltou);
        window.addEventListener("pointercancel", soltou);

        gal.addEventListener("wheel", (e) => {
            e.preventDefault();
            alvoZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, alvoZoom - e.deltaY * 0.6));
        }, { passive: false });

        function quadroGaleria() {
            if (aberto < 0) {
                if (ponteiros.size === 0) {
                    ry += vy + GAL.giroAutomatico;
                    rx += vx;
                    vx *= 0.95;
                    vy *= 0.95;
                }
                rx = Math.max(-1.4, Math.min(1.4, rx));
                zoom += (alvoZoom - zoom) * 0.08;
                mundo.style.transform =
                    "translateZ(" + zoom + "px) rotateX(" + rx + "rad) rotateY(" + ry + "rad)";
            }
            requestAnimationFrame(quadroGaleria);
        }

        // ---- 6) Tudo pronto: coloca na tela e esconde o conteúdo antigo ----
        document.body.append(gal, det);
        document.body.style.overflow = "hidden";
        window.pararFarol = true;
        Array.from(surpresa.children).forEach((el) => { el.style.display = "none"; });

        iniciada = true;
        requestAnimationFrame(quadroGaleria);
        console.log("Galeria 3D ativa (" + n + " cartões)");
    };

    console.log("Galeria 3D pronta");
} catch (erro) {
    console.error("Erro na galeria 3D:", erro);
}