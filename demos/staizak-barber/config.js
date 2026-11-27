/* =========================================================
   DADOS DA BARBEARIA  (base EF Criações para barbearias)
   Para outra barbearia: copie a pasta, troque as logos e edite só este arquivo.
   Serviços, preços, barbeiros e horários abaixo são EXEMPLOS editáveis.
   ========================================================= */
window.BARBEARIA = {
  id: "staizak",                       // prefixo dos dados salvos (um por cliente)
  nome: "Staizak Barber",
  slogan: "Corte clássico, atendimento de respeito.",
  cidade: "Ponta Grossa-PR",
  endereco: "R. Haiti, 685 - Jardim Carvalho, Ponta Grossa-PR",
  mapa: "https://www.google.com/maps/search/?api=1&query=R.+Haiti,+685+-+Jardim+Carvalho,+Ponta+Grossa+-+PR",
  telefone: "(42) 99909-3342",
  whatsapp: "5542999093342",
  instagram: "",                       // ex.: "staizakbarber" (sem @)
  logo: "logo-512.png",
  logoArte: "arte-branca.png",
  temaPadrao: "preto-prata",           // preto-dourado | preto-prata | bordo-cobre
  intervaloMin: 30,                    // grade de horários (minutos)
  diasAgenda: 21,                      // quantos dias o cliente pode agendar à frente

  servicos: [
    { id: "corte",      nome: "Corte",                 duracao: 30, preco: 40,  desc: "Tesoura e/ou máquina, lavagem e finalização." },
    { id: "degrade",    nome: "Degradê / Fade",        duracao: 40, preco: 45,  desc: "Degradê navalhado com acabamento na navalha." },
    { id: "barba",      nome: "Barba",                 duracao: 30, preco: 30,  desc: "Toalha quente, navalha e balm." },
    { id: "corte-barba",nome: "Corte + Barba",         duracao: 60, preco: 65,  desc: "O combo completo da casa." },
    { id: "sobrancelha",nome: "Sobrancelha",           duracao: 10, preco: 15,  desc: "Alinhamento na navalha ou pinça." },
    { id: "pigmentacao",nome: "Pigmentação",           duracao: 30, preco: 30,  desc: "Disfarça falhas na barba ou no corte." },
    { id: "infantil",   nome: "Corte infantil",        duracao: 30, preco: 35,  desc: "Até 12 anos." },
    { id: "luzes",      nome: "Luzes / Platinado",     duracao: 120,preco: 120, desc: "Valor a partir de; avaliamos na hora." }
  ],

  produtos: [
    { id: "pomada",  nome: "Pomada modeladora", preco: 35 },
    { id: "oleo",    nome: "Óleo para barba",   preco: 30 },
    { id: "shampoo", nome: "Shampoo para barba",preco: 28 },
    { id: "refri",   nome: "Refrigerante lata", preco: 6 },
    { id: "cerveja", nome: "Cerveja long neck", preco: 9 }
  ],

  // dias: 0=domingo ... 6=sábado
  barbeiros: [
    { id: "b1", nome: "Rafael", especialidade: "Degradê e navalha", dias: [2,3,4,5,6], inicio: "", fim: "", comissao: 50 },
    { id: "b2", nome: "Diego",  especialidade: "Barba e visagismo", dias: [2,3,4,5,6], inicio: "", fim: "", comissao: 50 },
    { id: "b3", nome: "Lucas",  especialidade: "Cortes clássicos",  dias: [3,4,5,6],   inicio: "13:00", fim: "", comissao: 40 }
  ],

  expediente: [
    { dia: 0, aberto: false, abre: "09:00", fecha: "12:00", pausaIni: "",      pausaFim: "" },
    { dia: 1, aberto: false, abre: "09:00", fecha: "19:00", pausaIni: "",      pausaFim: "" },
    { dia: 2, aberto: true,  abre: "09:00", fecha: "19:00", pausaIni: "12:00", pausaFim: "13:00" },
    { dia: 3, aberto: true,  abre: "09:00", fecha: "19:00", pausaIni: "12:00", pausaFim: "13:00" },
    { dia: 4, aberto: true,  abre: "09:00", fecha: "19:00", pausaIni: "12:00", pausaFim: "13:00" },
    { dia: 5, aberto: true,  abre: "09:00", fecha: "20:00", pausaIni: "12:00", pausaFim: "13:00" },
    { dia: 6, aberto: true,  abre: "08:00", fecha: "17:00", pausaIni: "",      pausaFim: "" }
  ]
};
