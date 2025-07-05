// main.js - Sistema principal corrigido

console.log('📁 Carregando main.js...');

// Variáveis globais do sistema principal
let mainCardapios = {};

// Contadores
let proximoCodigoProdutoMain = 1;
let proximoCodigoReceitaMain = 1;
let proximoCodigoTipoRefeicaoMain = 1;
let proximoCodigoClienteMain = 1;

// Data atual para calendário
let dataAtual = new Date();
let mesAtual = dataAtual.getMonth();
let anoAtual = dataAtual.getFullYear();
let diaSelecionado = null;
let calendarioVisivel = true;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - main.js');
    inicializarSistemaMain();
});

function inicializarSistemaMain() {
    console.log('🚀 Inicializando sistema principal...');
    
    // Configurar eventos básicos
    configurarEventosMain();
    
    // Configurar data atual
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('dataCardapio');
    if (inputData) {
        inputData.value = hoje;
    }
    
    // Carregar dados do calendário
    carregarCalendario();
}

function configurarEventosMain() {
    console.log('⚙️ Configurando eventos principais...');
    
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

    console.log('✅ Eventos principais configurados');
}

// Funções de navegação
function showTab(tabName) {
    console.log('📂 Abrindo aba:', tabName);
    
    // Ocultar todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remover active de todas as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const tabContent = document.getElementById(tabName);
    const tabButton = event?.target;
    
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    // Inicializar módulos específicos quando necessário
    setTimeout(() => {
        if (tabName === 'produtos-novo') {
            if (typeof inicializarProdutosNovo === 'function') {
                inicializarProdutosNovo();
            }
        }
        
        if (tabName === 'receitas') {
            if (typeof inicializarReceitas === 'function') {
                inicializarReceitas();
            }
        }
        
        if (tabName === 'tipos-refeicoes') {
            if (typeof inicializarTiposRefeicoes === 'function') {
                inicializarTiposRefeicoes();
            }
        }
        
        if (tabName === 'clientes') {
            if (typeof inicializarClientes === 'function') {
                inicializarClientes();
            }
        }
        
        if (tabName === 'cardapio') {
            if (typeof inicializarCardapio === 'function') {
                inicializarCardapio();
            }
        }
    }, 100);
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
        if (mainCardapios[dataStr]) {
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

// Exportar funções para uso global
window.showTab = showTab;
window.fecharModal = fecharModal;
window.mostrarAlerta = mostrarAlerta;
window.toggleCalendar = toggleCalendar;
window.mudarMes = mudarMes;
window.selecionarDia = selecionarDia;

console.log('✅ main.js carregado e corrigido!');