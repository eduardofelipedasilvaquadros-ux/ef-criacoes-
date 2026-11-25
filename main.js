/* Troque pelo seu número com DDI e DDD, só números. Ex.: 5542999998888 */
const WHATSAPP = "5542991339702";
(function(){
  const base = "https://wa.me/" + WHATSAPP;
  const padrao = "Olá, vim pelo site e quero um orçamento.";
  document.querySelectorAll(".wa-link").forEach(a => { if (a.id !== "f-send") a.href = base + "?text=" + encodeURIComponent(padrao); });
  const ids = ["f-nome","f-empresa","f-tipo","f-msg"];
  const send = document.getElementById("f-send");
  function build(){
    const v = id => document.getElementById(id).value.trim();
    let t = "Olá! Vim pelo site da EF Criações.";
    if (v("f-nome")) t += "\nNome: " + v("f-nome");
    if (v("f-empresa")) t += "\nEmpresa: " + v("f-empresa");
    t += "\nPreciso de: " + v("f-tipo");
    if (v("f-msg")) t += "\nSobre o projeto: " + v("f-msg");
    send.href = base + "?text=" + encodeURIComponent(t);
  }
  ids.forEach(id => document.getElementById(id).addEventListener("input", build));
  document.getElementById("orc").addEventListener("submit", e => e.preventDefault());
  build();
})();
