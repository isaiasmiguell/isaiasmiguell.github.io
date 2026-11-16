/* =========================================================
   Isaías Miguel — Página principal
   Cabeçalho, menu, revelação ao scroll e cidade 3D
   ========================================================= */
(function () {
  'use strict';

  var movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cabeçalho: visível só no início ---------- */
  var cabecalho = document.getElementById('cabecalho');
  var aoTopo = document.getElementById('ao-topo');
  var LIMITE = 80;

  function aoFazerScroll() {
    var longe = window.scrollY > LIMITE;
    if (!cabecalho.classList.contains('menu-aberto')) {
      cabecalho.classList.toggle('escondido', longe);
    }
    aoTopo.classList.toggle('visivel', window.scrollY > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', aoFazerScroll, { passive: true });
  aoFazerScroll();

  /* ---------- Menu no telemóvel ---------- */
  var botaoMenu = document.querySelector('.menu-botao');
  function fecharMenu() {
    cabecalho.classList.remove('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
  }
  botaoMenu.addEventListener('click', function () {
    var aberto = cabecalho.classList.toggle('menu-aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = aberto ? 'hidden' : '';
  });
  document.querySelectorAll('.menu a').forEach(function (a) { a.addEventListener('click', fecharMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(); });

  /* ---------- Revelação ao fazer scroll ---------- */
  var revelar = document.querySelectorAll('.revelar');
  if ('IntersectionObserver' in window && !movimentoReduzido) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visivel'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revelar.forEach(function (el) { obs.observe(el); });
  } else {
    revelar.forEach(function (el) { el.classList.add('visivel'); });
  }

  /* ---------- Cidade 3D: desenha-se bloco a bloco e gira ---------- */
  var contentor = document.getElementById('cidade');
  var canvas = document.getElementById('cidade-canvas');

  function semTresD() { contentor.classList.add('sem-3d'); }

  function iniciarCidade() {
    var THREE = window.THREE;
    if (!THREE) return semTresD();
    var renderizador;
    try {
      renderizador = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { return semTresD(); }
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var OURO = 0xC5A059, CREME = 0xF8F6F0;
    var cena = new THREE.Scene();
    var camara = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    camara.position.set(20, 15.5, 20);
    camara.lookAt(0, 3, 0);

    var cidade = new THREE.Group();
    cena.add(cidade);

    // Materiais partilhados
    var matLinha = new THREE.LineBasicMaterial({ color: OURO, transparent: true, opacity: 0.9 });
    var matLinhaSuave = new THREE.LineBasicMaterial({ color: OURO, transparent: true, opacity: 0.35 });
    var matFace = new THREE.MeshBasicMaterial({ color: CREME, transparent: true, opacity: 0.05, depthWrite: false });
    var matJanela = new THREE.MeshBasicMaterial({ color: OURO, transparent: true, opacity: 0.32, depthWrite: false });
    var cubo = new THREE.BoxGeometry(1, 1, 1);
    var arestas = new THREE.EdgesGeometry(cubo);

    // Gerador pseudo-aleatório fixo: a cidade é sempre a mesma
    var semente = 7;
    function aleatorio() { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; }

    var blocos = []; // { objeto, inicio }
    function bloco(x, y, z, janela, inicio, escala) {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(cubo, janela ? matJanela : matFace));
      g.add(new THREE.LineSegments(arestas, matLinha));
      g.position.set(x, y, z);
      g.scale.setScalar(0.0001);
      g.userData.escala = escala || 1;
      cidade.add(g);
      blocos.push({ objeto: g, inicio: inicio });
      return g;
    }

    // Plataforma (fundação)
    var plataforma = new THREE.Group();
    var base = new THREE.Mesh(new THREE.BoxGeometry(11, 0.7, 11), matFace);
    var baseLinhas = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(11, 0.7, 11)), matLinha);
    var grelha = new THREE.GridHelper(11, 11, OURO, OURO);
    grelha.material.transparent = true; grelha.material.opacity = 0.25;
    grelha.position.y = 0.351;
    plataforma.add(base, baseLinhas, grelha);
    plataforma.position.y = -0.35;
    plataforma.scale.set(0.0001, 1, 0.0001);
    cidade.add(plataforma);

    // Mapa de alturas das torres (7 × 7)
    var alturas = [
      [0, 1, 2, 2, 1, 0, 0],
      [1, 2, 3, 4, 3, 2, 1],
      [2, 3, 5, 6, 5, 3, 1],
      [2, 4, 6, 8, 6, 4, 2],
      [1, 3, 5, 7, 5, 3, 0],
      [0, 2, 3, 4, 3, 2, 1],
      [0, 1, 1, 2, 1, 0, 0]
    ];
    function altura(i, j) { return (alturas[i] && alturas[i][j]) || 0; }
    for (var i = 0; i < 7; i++) {
      for (var j = 0; j < 7; j++) {
        var h = altura(i, j);
        for (var y = 0; y < h; y++) {
          // só os blocos visíveis (com pelo menos uma face exposta)
          var exposto = y === h - 1 || altura(i - 1, j) <= y || altura(i + 1, j) <= y || altura(i, j - 1) <= y || altura(i, j + 1) <= y;
          if (!exposto) continue;
          var distancia = Math.hypot(i - 3, j - 3);
          bloco(i - 3, y + 0.5, j - 3, aleatorio() < 0.16, 0.9 + y * 0.38 + distancia * 0.06 + aleatorio() * 0.25);
        }
      }
    }

    // Cubos soltos a flutuar
    var soltos = [];
    for (var k = 0; k < 16; k++) {
      var ang = aleatorio() * Math.PI * 2;
      var raio = 6.2 + aleatorio() * 3;
      var c = bloco(Math.cos(ang) * raio, 1 + aleatorio() * 8, Math.sin(ang) * raio, aleatorio() < 0.3, 3.4 + aleatorio() * 1.4, 0.35 + aleatorio() * 0.45);
      c.userData.fase = aleatorio() * Math.PI * 2;
      c.userData.y0 = c.position.y;
      soltos.push(c);
    }

    // Anéis em órbita (o tempo)
    var aneis = [];
    [[7.6, 0.4, 0.12], [9.2, -0.3, -0.08]].forEach(function (a) {
      var pontos = [];
      for (var t = 0; t <= 128; t++) {
        var th = t / 128 * Math.PI * 2;
        pontos.push(new THREE.Vector3(Math.cos(th) * a[0], 0, Math.sin(th) * a[0]));
      }
      var anel = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pontos), matLinhaSuave);
      anel.rotation.x = a[1]; anel.rotation.z = a[2];
      anel.position.y = 3.2;
      anel.userData.velocidade = a[2] > 0 ? 0.12 : -0.09;
      anel.scale.setScalar(0.0001);
      cidade.add(anel);
      aneis.push(anel);
    });

    function ajustar() {
      var w = contentor.clientWidth, h = contentor.clientHeight;
      if (!w || !h) return;
      renderizador.setSize(w, h, false);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
    }
    window.addEventListener('resize', ajustar);
    ajustar();

    function suave(t) { t = Math.min(Math.max(t, 0), 1); return 1 - Math.pow(1 - t, 3); }
    function salto(t) { t = Math.min(Math.max(t, 0), 1); var s = 1.6; return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }

    var relogio = new THREE.Clock();
    var activo = true;
    var inicioTempo = movimentoReduzido ? -100 : 0;

    function quadro() {
      var t = relogio.getElapsedTime() - inicioTempo;
      if (movimentoReduzido) t = 100;

      // desenho: plataforma, blocos, anéis
      var p = suave(t / 1.1);
      plataforma.scale.set(Math.max(p, 0.0001), 1, Math.max(p, 0.0001));
      blocos.forEach(function (b) {
        var e = salto((t - b.inicio) / 0.55) * b.objeto.userData.escala;
        b.objeto.scale.setScalar(Math.max(e, 0.0001));
      });
      aneis.forEach(function (a) {
        a.scale.setScalar(Math.max(suave((t - 4.2) / 1.4), 0.0001));
        if (!movimentoReduzido) a.rotation.y += a.userData.velocidade * 0.016;
      });
      soltos.forEach(function (c) {
        if (movimentoReduzido) return;
        c.position.y = c.userData.y0 + Math.sin(t * 0.8 + c.userData.fase) * 0.35;
        c.rotation.x += 0.004; c.rotation.y += 0.006;
      });

      // rotação contínua
      if (!movimentoReduzido) cidade.rotation.y = t * 0.16;
      else cidade.rotation.y = 0.6;

      renderizador.render(cena, camara);
      if (activo && !movimentoReduzido) requestAnimationFrame(quadro);
    }

    // Só anima quando a abertura está visível
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        var visivel = e[0].isIntersecting;
        if (visivel && !activo) { activo = true; requestAnimationFrame(quadro); }
        activo = visivel;
      }).observe(contentor);
    }
    requestAnimationFrame(quadro);
  }

  if (document.readyState === 'complete') iniciarCidade();
  else window.addEventListener('load', iniciarCidade);
})();
