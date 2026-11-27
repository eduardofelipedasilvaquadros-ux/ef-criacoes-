/* Núcleo compartilhado entre o link do cliente e o painel da loja.
   Na demonstração os dados ficam no navegador (localStorage), então
   cliente e painel abertos no mesmo aparelho enxergam a mesma agenda. */
(function () {
  const C = window.BARBEARIA;
  const P = "bb_" + C.id + "_";
  const SEED_VER = 4;

  const S = {
    get(k, d) { try { const v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(P + k); } catch (e) {} },
    key(k) { return P + k; }
  };

  const pad = n => String(n).padStart(2, "0");
  const hoje = () => iso(new Date());
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function addDias(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  const min = h => { if (!h) return null; const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const hhmm = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  const agoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const brl = v => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const DIAS_C = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function dataLonga(s) { const d = parse(s); return DIAS[d.getDay()] + ", " + d.getDate() + " de " + MESES[d.getMonth()]; }
  function dataCurta(s) { const d = parse(s); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1); }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- configuração (editável no painel) ---------- */
  const cfg = {
    servicos: () => S.get("servicos", C.servicos),
    produtos: () => S.get("produtos", C.produtos),
    barbeiros: () => S.get("barbeiros", C.barbeiros),
    expediente: () => S.get("expediente", C.expediente),
    especiais: () => S.get("especiais", []),       // {id,data,tipo:'fechado'|'horario',abre,fecha,nome}
    folgas: () => S.get("folgas", []),             // {id,barbeiroId,data,motivo}
    tema: () => S.get("tema", C.temaPadrao)
  };
  const servico = id => cfg.servicos().find(s => s.id === id);
  const barbeiro = id => cfg.barbeiros().find(b => b.id === id);

  function aplicarTema(t) { document.documentElement.setAttribute("data-tema", t || cfg.tema()); }

  /* ---------- horários disponíveis ---------- */
  function horarioDoDia(data) {
    const esp = cfg.especiais().find(e => e.data === data);
    if (esp) {
      if (esp.tipo === "fechado") return { aberto: false, motivo: esp.nome || "Fechado" };
      const base = cfg.expediente()[parse(data).getDay()];
      return { aberto: true, abre: esp.abre, fecha: esp.fecha, pausaIni: base.pausaIni, pausaFim: base.pausaFim, especial: esp.nome };
    }
    const e = cfg.expediente()[parse(data).getDay()];
    return e.aberto ? Object.assign({}, e) : { aberto: false, motivo: "Fechado" };
  }

  function barbeiroTrabalha(b, data) {
    if (!b.dias.includes(parse(data).getDay())) return false;
    return !cfg.folgas().some(f => f.barbeiroId === b.id && f.data === data);
  }

  const ATIVOS = ["agendado", "chegou", "atendendo", "concluido"];
  function ocupados(barbeiroId, data, ignorarId) {
    return agendamentos().filter(a => a.barbeiroId === barbeiroId && a.data === data && ATIVOS.includes(a.status) && a.id !== ignorarId)
      .map(a => { const i = min(a.hora); return [i, i + (a.duracao || (servico(a.servicoId) || { duracao: 30 }).duracao)]; });
  }

  function livresDoBarbeiro(b, data, dur) {
    const h = horarioDoDia(data);
    if (!h.aberto || !barbeiroTrabalha(b, data)) return [];
    let ini = Math.max(min(h.abre), min(b.inicio) || 0);
    let fim = Math.min(min(h.fecha), min(b.fim) || 24 * 60);
    const pI = min(h.pausaIni), pF = min(h.pausaFim);
    const occ = ocupados(b.id, data);
    const limite = data === hoje() ? agoraMin() + 15 : -1;
    const out = [];
    for (let t = ini; t + dur <= fim; t += C.intervaloMin) {
      if (t <= limite) continue;
      if (pI != null && pF != null && t < pF && t + dur > pI) continue;
      if (occ.some(([a, z]) => t < z && t + dur > a)) continue;
      out.push(t);
    }
    return out;
  }

  // retorna [{hora:'09:00', barbeiros:[ids]}]
  function horariosLivres(data, servicoId, barbeiroId) {
    const s = servico(servicoId); if (!s) return [];
    const lista = barbeiroId && barbeiroId !== "qualquer" ? cfg.barbeiros().filter(b => b.id === barbeiroId) : cfg.barbeiros();
    const mapa = {};
    lista.forEach(b => livresDoBarbeiro(b, data, s.duracao).forEach(t => { (mapa[t] = mapa[t] || []).push(b.id); }));
    return Object.keys(mapa).map(Number).sort((a, b) => a - b).map(t => ({ hora: hhmm(t), barbeiros: mapa[t] }));
  }

  /* ---------- agendamentos e movimentos ---------- */
  const agendamentos = () => S.get("agendamentos", []);
  const salvarAgendamentos = l => S.set("agendamentos", l);
  const movimentos = () => S.get("movimentos", []);
  const salvarMovimentos = l => S.set("movimentos", l);

  function criarAgendamento(dados) {
    const s = servico(dados.servicoId);
    let bid = dados.barbeiroId;
    if (!bid || bid === "qualquer") {
      const livre = horariosLivres(dados.data, dados.servicoId, "qualquer").find(x => x.hora === dados.hora);
      if (!livre) return null;
      bid = livre.barbeiros[Math.floor(Math.random() * livre.barbeiros.length)];
    } else if (!horariosLivres(dados.data, dados.servicoId, bid).some(x => x.hora === dados.hora) && !dados.forcar) return null;
    const a = {
      id: uid(), cliente: dados.cliente, telefone: dados.telefone || "", servicoId: s.id, servicoNome: s.nome,
      duracao: s.duracao, preco: s.preco, barbeiroId: bid, data: dados.data, hora: dados.hora,
      status: dados.status || "agendado", origem: dados.origem || "app", criadoEm: Date.now(), pago: false
    };
    const l = agendamentos(); l.push(a); salvarAgendamentos(l);
    return a;
  }

  function atualizarAgendamento(id, mud) {
    const l = agendamentos(); const a = l.find(x => x.id === id); if (!a) return;
    Object.assign(a, mud); salvarAgendamentos(l); return a;
  }

  /* ---------- dados de demonstração ---------- */
  function rnd(seed) { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = x * 16807 % 2147483647) / 2147483647; }
  const NOMES = ["João Pedro", "Matheus", "Gabriel", "Lucas M.", "Felipe", "Guilherme", "Rodrigo", "Thiago", "Bruno", "André", "Vinícius", "Carlos", "Eduardo S.", "Henrique", "Leonardo", "Marcelo", "Paulo R.", "Igor", "Samuel", "Caio", "Renan", "Otávio", "Davi", "Murilo"];
  const FORMAS = ["pix", "pix", "pix", "dinheiro", "debito", "credito"];

  function semear(forcar) {
    const marca = S.get("seed", null);
    if (!forcar && marca && marca.dia === hoje() && marca.v === SEED_VER) return;
    // mantém o que foi criado de verdade, troca só os exemplos
    const reais = agendamentos().filter(a => !a.demo && a.data >= hoje());
    const movReais = movimentos().filter(m => !m.demo);
    const r = rnd(Number(hoje().replace(/-/g, "")));
    const ag = [], mov = [];
    const agora = agoraMin();
    for (let off = -6; off <= 12; off++) {
      const data = addDias(hoje(), off);
      const h = horarioDoDia(data); if (!h.aberto) continue;
      cfg.barbeiros().forEach(b => {
        if (!barbeiroTrabalha(b, data)) return;
        const ocup = [];
        const qtd = off < 0 ? 5 + Math.floor(r() * 4) : off === 0 ? 4 + Math.floor(r() * 3) : Math.max(0, 4 - Math.floor(off / 3) - Math.floor(r() * 3));
        let tent = 0;
        while (ocup.length < qtd && tent++ < 40) {
          const sv = cfg.servicos(); const ids = ["corte", "degrade", "corte-barba", "corte", "barba", "degrade", "corte-barba", "corte", "sobrancelha", "infantil"];
          const s = sv.find(x => x.id === ids[Math.floor(r() * ids.length)]) || sv[0];
          const ini = Math.max(min(h.abre), min(b.inicio) || 0), fim = Math.min(min(h.fecha), min(b.fim) || 1440);
          const t = ini + Math.floor(r() * ((fim - ini - s.duracao) / 30)) * 30;
          if (t + s.duracao > fim) continue;
          if (h.pausaIni && t < min(h.pausaFim) && t + s.duracao > min(h.pausaIni)) continue;
          if (ocup.some(([a, z]) => t < z && t + s.duracao > a)) continue;
          ocup.push([t, t + s.duracao]);
          const passado = off < 0 || (off === 0 && t + s.duracao < agora);
          const falta = passado && r() < .06;
          const a = {
            id: uid(), demo: true, cliente: NOMES[Math.floor(r() * NOMES.length)], telefone: "(42) 9" + (8000 + Math.floor(r() * 1999)) + "-" + (1000 + Math.floor(r() * 8999)),
            servicoId: s.id, servicoNome: s.nome, duracao: s.duracao, preco: s.preco, barbeiroId: b.id, data, hora: hhmm(t),
            status: falta ? "falta" : passado ? "concluido" : (off === 0 && t <= agora ? "atendendo" : "agendado"),
            origem: r() < .75 ? "app" : "balcao", criadoEm: Date.now(), pago: passado && !falta
          };
          ag.push(a);
          if (a.pago) {
            const f = FORMAS[Math.floor(r() * FORMAS.length)];
            const desc = r() < .1 ? 5 : 0;
            const itens = [{ tipo: "servico", id: s.id, nome: s.nome, preco: s.preco, qtd: 1 }];
            if (r() < .18) { const p = cfg.produtos()[Math.floor(r() * cfg.produtos().length)]; itens.push({ tipo: "produto", id: p.id, nome: p.nome, preco: p.preco, qtd: 1 }); }
            const sub = itens.reduce((x, i) => x + i.preco * i.qtd, 0);
            mov.push({ id: uid(), demo: true, data, hora: hhmm(t + s.duracao), tipo: "entrada", categoria: "Atendimento", descricao: s.nome + " - " + a.cliente,
              cliente: a.cliente, barbeiroId: b.id, agendamentoId: a.id, itens, subtotal: sub, desconto: desc, valor: sub - desc, forma: f });
          }
        }
      });
      if (off <= 0) {
        if (off === 0 ? agora > min(h.abre) : true)
          mov.push({ id: uid(), demo: true, data, hora: h.abre, tipo: "entrada", categoria: "Suprimento", descricao: "Troco inicial do caixa", valor: 100, forma: "dinheiro", interno: true });
        if (off === -3) mov.push({ id: uid(), demo: true, data, hora: "10:20", tipo: "saida", categoria: "Compras", descricao: "Lâminas e toalhas descartáveis", valor: 86.5, forma: "pix" });
        if (off === -5) mov.push({ id: uid(), demo: true, data, hora: "16:00", tipo: "saida", categoria: "Contas", descricao: "Conta de energia", valor: 214.9, forma: "pix" });
        if (off === -1) mov.push({ id: uid(), demo: true, data, hora: "18:40", tipo: "saida", categoria: "Sangria", descricao: "Retirada do dinheiro para depósito", valor: 250, forma: "dinheiro" });
      }
    }
    salvarAgendamentos(ag.concat(reais));
    salvarMovimentos(mov.concat(movReais));
    S.set("seed", { dia: hoje(), v: SEED_VER });
  }

  function zerarDemonstracao() {
    S.del("agendamentos"); S.del("movimentos"); S.del("seed"); S.del("meus");
    semear(true);
  }

  window.BB = {
    C, S, cfg, servico, barbeiro, aplicarTema, horarioDoDia, barbeiroTrabalha, horariosLivres,
    agendamentos, salvarAgendamentos, movimentos, salvarMovimentos, criarAgendamento, atualizarAgendamento,
    semear, zerarDemonstracao, util: { pad, hoje, iso, parse, addDias, min, hhmm, agoraMin, brl, uid, DIAS, DIAS_C, MESES, dataLonga, dataCurta, esc }
  };
  aplicarTema();
  semear(false);
})();
