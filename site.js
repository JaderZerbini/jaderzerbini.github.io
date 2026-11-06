// Monta as listas de projetos a partir de projetos.js e cuida do painel com o vídeo em loop.
(function () {
  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  const poucoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Celular ou economia de dados: nada de vídeo tocando sozinho (o fundo tem ~6 MB e cada projeto 1 a 3 MB)
  const economia = window.matchMedia("(max-width: 760px)").matches || (navigator.connection && navigator.connection.saveData);

  let fundo = document.querySelector(".fundo video");
  if (fundo && (economia || poucoMovimento)) {
    const img = document.createElement("img"); img.src = fundo.poster; img.alt = "";
    fundo.replaceWith(img); fundo = null;
  }

  const dlg = document.getElementById("painel");
  if (!dlg || typeof PROJETOS === "undefined") return; // o guia só tem o fundo

  // As miniaturas da lista são os próprios vídeos: tocam quando aparecem na tela e param quando saem
  const tocaSozinho = !economia && !poucoMovimento && "IntersectionObserver" in window;
  const vigia = tocaSozinho && new IntersectionObserver((entradas) => {
    entradas.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (!v.src) v.src = v.dataset.src;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { rootMargin: "120px 0px" });

  function miniatura(p) {
    if (!tocaSozinho) {
      const img = el("img", "mini"); img.src = `videos/${p.video}.jpg`; img.alt = ""; img.loading = "lazy";
      return img;
    }
    const v = el("video", "mini");
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.poster = `videos/${p.video}.jpg`; v.dataset.src = `videos/${p.video}.webm`;
    v.setAttribute("aria-hidden", "true");
    vigia.observe(v);
    return v;
  }

  // Listas
  const ordem = [];
  ["profissional", "pessoal"].forEach((prat) => {
    const ul = document.getElementById("lista-" + prat);
    if (!ul) return;
    PROJETOS.filter((p) => p.prateleira === prat).forEach((p) => {
      const i = ordem.push(p) - 1;
      const li = el("li"), b = el("button");
      b.type = "button";
      b.setAttribute("aria-haspopup", "dialog");
      b.append(el("span", "num", String(i + 1).padStart(2, "0")), miniatura(p));
      const txt = el("div");
      txt.append(el("h3", "", p.titulo), el("p", "", p.resumo));
      const tags = el("div", "tags");
      tags.append(el("span", "tipo", p.tipo), ...p.tags.map((t) => el("span", "", t)));
      txt.append(tags);
      b.append(txt, el("span", "abrir", "ABRIR ▸"));
      b.addEventListener("click", () => abrir(i));
      li.append(b);
      ul.append(li);
    });
  });

  // Painel
  const video = dlg.querySelector("video");
  const legenda = dlg.querySelector("figcaption");
  let atual = 0;

  function preencher(p) {
    dlg.querySelector("[data-titulo]").textContent = p.titulo;
    dlg.querySelector("[data-tipo]").textContent = `${p.tipo} · ${p.tags.join(" · ")}`;
    ["problema", "fiz", "como", "resultado"].forEach((k) => { dlg.querySelector(`[data-${k}]`).textContent = p[k]; });
    const links = dlg.querySelector("[data-links]");
    links.replaceChildren();
    p.links.forEach((l) => { const a = el("a", "", l.texto); a.href = l.url; a.target = "_blank"; a.rel = "noopener"; links.append(a); });
    if (p.nota) links.append(el("span", "", p.nota));
    legenda.textContent = "// " + (p.legenda || "tela real do projeto");
    video.poster = `videos/${p.video}.jpg`;
    video.src = `videos/${p.video}.webm`;
    if (!poucoMovimento) video.play().catch(() => {});
    dlg.querySelector("[data-pos]").textContent = `${String(atual + 1).padStart(2, "0")} / ${String(ordem.length).padStart(2, "0")}`;
  }

  function abrir(i) { atual = i; preencher(ordem[i]); if (!dlg.open) dlg.showModal(); }
  function andar(d) { atual = (atual + d + ordem.length) % ordem.length; preencher(ordem[atual]); }

  dlg.querySelector("[data-ant]").addEventListener("click", () => andar(-1));
  dlg.querySelector("[data-prox]").addEventListener("click", () => andar(1));
  dlg.querySelector("[data-fechar]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => { video.pause(); video.removeAttribute("src"); video.load(); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // clique fora do conteúdo
  dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") andar(1); if (e.key === "ArrowLeft") andar(-1); });

  // Quem pede menos movimento: o vídeo do painel só toca se a pessoa mandar
  if (poucoMovimento) { video.removeAttribute("autoplay"); video.controls = true; }
})();
