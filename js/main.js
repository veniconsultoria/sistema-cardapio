// Variáveis globais compartilhadas
let produtos = [];
let receitas = [];
let tiposRefeicoes = [];
let clientes = [];
let cardapios = {};
let ingredientesReceita = [];
let ingredientesReceitaTemp = [];
let tiposRefeicaoTemp = [];
let receitasSelecionadas = [];
let editandoProduto = null;
let editandoReceita = null;
let editandoTipoRefeicao = null;
let editandoCliente = null;
let clienteAtualCardapio = null;
let tipoRefeicaoAtualCardapio = null;
let dataAtualCardapio = null;

// Contadores
let proximoCodigoProduto = 1;
let proximoCodigoReceita = 1;
let proximoCodigoTipoRefeicao = 1;
let proximoCodigoCliente = 1;

// Data atual para calendário
let dataAtual = new Date();
let mesAtual = dataAtual.getMonth();
let anoAtual = dataAtual.getFullYear();
let diaSelecionado = null;
let calendarioVisivel = true;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema iniciado');
    inicializarSistema();
});

function inicializarSistema() {
    // Configurar eventos básicos
    configurarEventos();
    
    // Gerar códigos iniciais
    gerarProximoCodigoProduto();
    gerarProximoCodigoReceita();
    gerarProximoCodigoTipoRefeicao();
    gerarProximoCodigoCliente();
    
    // Carregar dados do calendário
    carregarCalendario();
    carregarClientesCardapio();
}

function configurarEventos() {
    // Formatação de telefone
    const telefoneInput = document.getElementById('telefoneCliente');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1)$2-$3');
                value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1)$2-$3');
                value = value.replace(/^(\d{2})(\d{1,5})$/, '($1)$2');
                value = value.replace(/^(\d{1,2})$/, '($1');
            }
            e.target.value = value;
        });
    }

    // Formulários
    const formProduto = document.getElementById('formProduto');
    if (formProduto) formProduto.addEventListener('submit', salvarProduto);
    
    const formReceita = document.getElementById('formReceita');
    if (formReceita) formReceita.addEventListener('submit', salvarReceita);
    
    const formTipoRefeicao = document.getElementById('formTipoRefeicao');
    if (formTipoRefeicao) formTipoRefeicao.addEventListener('submit', salvarTipoRefeicao);
    
    const formCliente = document.getElementById('formCliente');
    if (formCliente) formCliente.addEventListener('submit', salvarCliente);
}

// Funções de navegação
function showTab(tabName) {
    // Ocultar todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remover active de todas as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(tabName).classList.remove('hidden');
    event.target.classList.add('active');
    
    // Carregar dados específicos da aba se necessário
    if (tabName === 'cardapio') {
        carregarClientesCardapio();
    }
    // ADICIONAR ESTA LINHA:
    if (tabName === 'receitas' && typeof onReceitasTabOpened === 'function') {
        onReceitasTabOpened();
    }
}
    

// Funções de código
function gerarProximoCodigoProduto() {
    const element = document.getElementById('codigoProduto');
    if (element) {
        element.value = proximoCodigoProduto.toString().padStart(14, '0');
    }
}

function gerarProximoCodigoReceita() {
    const element = document.getElementById('codigoReceita');
    if (element) {
        element.value = proximoCodigoReceita.toString().padStart(14, '0');
    }
}

function gerarProximoCodigoTipoRefeicao() {
    const element = document.getElementById('codigoTipoRefeicao');
    if (element) {
        element.value = proximoCodigoTipoRefeicao.toString().padStart(14, '0');
    }
}

function gerarProximoCodigoCliente() {
    const element = document.getElementById('codigoCliente');
    if (element) {
        element.value = 'CLI' + proximoCodigoCliente.toString().padStart(11, '0');
    }
}

// Funções auxiliares
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function mostrarAlerta(mensagem, tipo) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensagem;
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 3000);
}

// Fechar modais ao clicar fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Função para toggle do calendário
function toggleCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    const toggleText = document.getElementById('calendar-toggle-text');
    
    if (calendarioVisivel) {
        calendarContainer.classList.add('hidden');
        toggleText.textContent = 'Mostrar Calendário';
        calendarioVisivel = false;
    } else {
        calendarContainer.classList.remove('hidden');
        toggleText.textContent = 'Ocultar Calendário';
        calendarioVisivel = true;
    }
}

// Funções de calendário básicas
function carregarCalendario() {
    const hoje = new Date();
    const dataInput = document.getElementById('dataCardapio');
    if (dataInput) {
        dataInput.value = hoje.toISOString().split('T')[0];
    }
    atualizarCalendario();
}

function atualizarCalendario() {
    const mesAnoElement = document.getElementById('mesAno');
    const gridElement = document.getElementById('calendarGrid');
    
    if (!mesAnoElement || !gridElement) return;
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    mesAnoElement.textContent = `${meses[mesAtual]} ${anoAtual}`;
    
    // Limpar grid
    gridElement.innerHTML = '';
    
    // Dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    diasSemana.forEach(dia => {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.style.fontWeight = 'bold';
        div.textContent = dia;
        gridElement.appendChild(div);
    });
    
    // Primeiro dia do mês
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    
    // Espaços vazios antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        gridElement.appendChild(div);
    }
    
    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = dia;
        
        const dataStr = `${anoAtual}-${(mesAtual + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        
        // Verificar se tem cardápio
        if (cardapios[dataStr]) {
            div.classList.add('has-menu');
        }
        
        // Verificar se é o dia selecionado
        const dataInput = document.getElementById('dataCardapio');
        if (dataInput && dataInput.value === dataStr) {
            div.classList.add('active');
        }
        
        div.onclick = () => selecionarDia(dataStr);
        gridElement.appendChild(div);
    }
}

function selecionarDia(data) {
    const dataInput = document.getElementById('dataCardapio');
    if (dataInput) {
        dataInput.value = data;
    }
    diaSelecionado = data;
    atualizarCalendario();
    if (typeof carregarCardapioData === 'function') {
        carregarCardapioData();
    }
}

function mudarMes(direcao) {
    mesAtual += direcao;
    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    } else if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }
    atualizarCalendario();
}

function carregarClientesCardapio() {
    const select = document.getElementById('clienteCardapio');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione...</option>';

    clientes.filter(cliente => cliente.tiposRefeicao && cliente.tiposRefeicao.length > 0).forEach((cliente, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = cliente.descricao;
        select.appendChild(option);
    });
}