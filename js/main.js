// main.js - Sistema principal CORRIGIDO E COMPLETO

console.log('📁 Carregando main.js CORRIGIDO...');

// Variáveis globais do sistema principal
let mainCardapios = {};

// Data atual para calendário
let dataAtual = new Date();
let mesAtual = dataAtual.getMonth();
let anoAtual = dataAtual.getFullYear();
let diaSelecionado = null;
let calendarioVisivel = true;

// ✅ INICIALIZAÇÃO PRINCIPAL
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
    
    console.log('✅ Sistema principal inicializado');
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

// ===== FUNÇÕES DE CALENDÁRIO =====

// Função para toggle do calendário
function toggleCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    const toggleText = document.getElementById('calendar-toggle-text');
    
    if (!calendarContainer || !toggleText) {
        console.warn('⚠️ Elementos do calendário não encontrados');
        return;
    }
    
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
    
    // Inicializar variáveis do calendário
    dataAtual = hoje;
    mesAtual = hoje.getMonth();
    anoAtual = hoje.getFullYear();
    
    atualizarCalendario();
}

function atualizarCalendario() {
    const mesAnoElement = document.getElementById('mesAno');
    const gridElement = document.getElementById('calendarGrid');
    
    if (!mesAnoElement || !gridElement) {
        console.warn('⚠️ Elementos do calendário não encontrados');
        return;
    }
    
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

// ===== FUNÇÃO DE TOAST NOTIFICATION =====
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    // Remover toast existente se houver
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${tipo}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : tipo === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : tipo === 'warning' ? '#856404' : '#0c5460'};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: inherit;
        font-size: 14px;
        max-width: 400px;
        line-height: 1.4;
        animation: toastSlideIn 0.3s ease-out;
    `;
    
    // Definir ícones por tipo
    const icones = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px;">
            <span>${icones[tipo] || icones.info}</span>
            <div style="flex: 1;">${mensagem}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 16px; cursor: pointer; margin-left: 10px; opacity: 0.7;">&times;</button>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(toast);
    
    // Remover automaticamente
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duracao);
}

// ===== FUNÇÃO AUXILIAR PARA FECHAR MODAIS =====
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== FUNÇÃO SHOW TAB CORRIGIDA =====
function showTab(tabName) {
    console.log('📂 Navegando para aba:', tabName);
    
    // Ocultar todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remover active de todos os botões
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    // Marcar botão como ativo
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Se não há event (chamada programática), encontrar o botão correspondente
        const botaoTab = document.querySelector(`.tab[onclick*="${tabName}"]`);
        if (botaoTab) {
            botaoTab.classList.add('active');
        }
    }
    
    // ✅ CORREÇÃO ESPECÍFICA: Inicializar módulos específicos
    setTimeout(() => {
        switch(tabName) {
            case 'produtos-novo':
                console.log('🛒 Inicializando produtos...');
                if (typeof inicializarProdutosNovo === 'function') {
                    inicializarProdutosNovo();
                }
                break;
                
            case 'receitas':
                console.log('🍽️ Inicializando receitas...');
                if (typeof inicializarReceitas === 'function') {
                    inicializarReceitas();
                }
                break;
                
            case 'tipos-refeicoes':
                console.log('🍽️ Inicializando tipos de refeições...');
                if (typeof inicializarTiposRefeicoes === 'function') {
                    inicializarTiposRefeicoes();
                }
                break;
                
            case 'clientes':
                console.log('👥 Inicializando clientes...');
                // ✅ CORREÇÃO PRINCIPAL PARA CLIENTES
                if (typeof inicializarClientes === 'function') {
                    inicializarClientes().then(() => {
                        console.log('✅ Clientes inicializados - aguardando clique em "Listar Clientes"');
                    }).catch(error => {
                        console.error('❌ Erro ao inicializar clientes:', error);
                        mostrarToast('Erro ao inicializar clientes: ' + error.message, 'error');
                    });
                } else {
                    console.warn('⚠️ Função inicializarClientes não encontrada');
                    // Tentar aguardar carregamento
                    setTimeout(() => {
                        if (typeof inicializarClientes === 'function') {
                            inicializarClientes();
                        } else {
                            mostrarToast('Sistema de clientes não foi carregado corretamente', 'error');
                        }
                    }, 1000);
                }
                break;
                
            case 'cardapio':
                console.log('📅 Inicializando cardápio...');
                if (typeof inicializarCardapio === 'function') {
                    inicializarCardapio();
                }
                break;
                
            default:
                console.log('ℹ️ Aba sem inicialização específica:', tabName);
        }
    }, 300); // Delay maior para garantir que a aba foi mostrada
}

// ===== FECHAR MODAIS AO CLICAR FORA =====
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ===== EXPORTAR FUNÇÕES PARA USO GLOBAL =====
window.fecharModal = fecharModal;
window.toggleCalendar = toggleCalendar;
window.mudarMes = mudarMes;
window.selecionarDia = selecionarDia;
window.mostrarToast = mostrarToast;
window.showTab = showTab;
window.carregarCalendario = carregarCalendario;
window.atualizarCalendario = atualizarCalendario;

// ===== FUNÇÕES DE COMPATIBILIDADE PARA OUTROS MÓDULOS =====

// Função auxiliar para verificar se módulos estão carregados
function verificarModulosCarregados() {
    console.log('🔍 === VERIFICAÇÃO DOS MÓDULOS ===');
    console.log('🛒 Produtos:', typeof inicializarProdutosNovo);
    console.log('🍽️ Receitas:', typeof inicializarReceitas);
    console.log('🍽️ Tipos:', typeof inicializarTiposRefeicoes);
    console.log('👥 Clientes:', typeof inicializarClientes);
    console.log('📅 Cardápio:', typeof inicializarCardapio);
    console.log('');
    console.log('🔧 Funções de carregamento:');
    console.log('👥 recarregarClientes:', typeof window.recarregarClientes);
    console.log('🍽️ recarregarTipos:', typeof window.recarregarTipos);
    console.log('🛒 recarregarProdutos:', typeof window.recarregarProdutos);
}

// Disponibilizar função de verificação
window.verificarModulosCarregados = verificarModulosCarregados;

// ===== FUNÇÃO DE TESTE GERAL DO SISTEMA =====
window.testarSistemaCompleto = function() {
    console.log('🧪 === TESTE COMPLETO DO SISTEMA ===');
    
    // Verificar módulos
    verificarModulosCarregados();
    
    // Verificar elementos DOM principais
    console.log('🎯 Elementos DOM principais:');
    console.log('  - Container:', !!document.querySelector('.container'));
    console.log('  - Tabs:', document.querySelectorAll('.tab').length);
    console.log('  - Tab contents:', document.querySelectorAll('.tab-content').length);
    
    // Verificar cada aba específica
    console.log('📋 Elementos por aba:');
    console.log('  - Produtos tbody:', !!document.getElementById('produtos-tbody'));
    console.log('  - Receitas form:', !!document.getElementById('formReceita'));
    console.log('  - Tipos tbody:', !!document.getElementById('tipos-tbody'));
    console.log('  - Clientes tbody:', !!document.getElementById('clientes-tbody'));
    console.log('  - Cardápio container:', !!document.getElementById('tiposRefeicaoCardapio'));
    
    // Testar toast
    console.log('📬 Testando toast...');
    mostrarToast('Sistema testado com sucesso!', 'success');
    
    console.log('✅ Teste completo finalizado!');
};

// ===== GARANTIR QUE AS FUNÇÕES ESTÃO DISPONÍVEIS IMEDIATAMENTE =====
if (typeof window.showTab === 'undefined') {
    window.showTab = showTab;
}

if (typeof window.mostrarToast === 'undefined') {
    window.mostrarToast = mostrarToast;
}

// ===== VERIFICAÇÃO FINAL AO CARREGAR =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - verificando sistema...');
    
    setTimeout(() => {
        console.log('🔍 === VERIFICAÇÃO DO SISTEMA ===');
        console.log('📋 Funções principais disponíveis:');
        console.log('  - showTab:', typeof window.showTab);
        console.log('  - mostrarToast:', typeof window.mostrarToast);
        console.log('  - toggleCalendar:', typeof window.toggleCalendar);
        console.log('  - mudarMes:', typeof window.mudarMes);
        console.log('  - selecionarDia:', typeof window.selecionarDia);
        
        console.log('🎯 Elementos DOM encontrados:');
        console.log('  - Container principal:', !!document.querySelector('.container'));
        console.log('  - Calendário:', !!document.getElementById('calendarContainer'));
        console.log('  - Botões de tab:', document.querySelectorAll('.tab').length);
        
        console.log('✅ Sistema principal carregado corretamente!');
    }, 1000);
});

console.log('✅ main.js CORRIGIDO carregado!');
console.log('📋 Para testar o sistema completo, use: testarSistemaCompleto()');

/* ===== ESTILOS CORRIGIDOS PARA O MÓDULO CARDÁPIO ===== */
/* Adicione este CSS ao arquivo css/main.css ou crie um arquivo separado */

/* ===== CORREÇÃO DO LAYOUT TABULAR PARA RECEITAS ===== */
.receita-item-tabular {
    display: grid !important;
    grid-template-columns: 2fr 120px 150px 150px 80px !important;
    gap: 10px !important;
    align-items: center !important;
    padding: 12px !important;
    margin-bottom: 8px !important;
    background: white !important;
    border: 1px solid #e9ecef !important;
    border-radius: 6px !important;
    transition: all 0.2s ease !important;
}

.receita-item-tabular:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    border-color: #667eea !important;
}

/* ===== CABEÇALHO DA TABELA DE RECEITAS ===== */
.receitas-header {
    background: #f8f9fa !important;
    padding: 10px !important;
    border-radius: 5px !important;
    margin-bottom: 10px !important;
    border: 1px solid #e9ecef !important;
}

.receitas-header.visible {
    display: block !important;
}

.receitas-header-grid {
    display: grid !important;
    grid-template-columns: 2fr 120px 150px 150px 80px !important;
    gap: 10px !important;
    font-weight: 600 !important;
    color: #495057 !important;
    font-size: 13px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

.receitas-header-grid > div {
    text-align: center !important;
}

.receitas-header-grid > div:first-child {
    text-align: left !important;
}

/* ===== SEÇÃO DE COMENSAIS MELHORADA ===== */
.comensais-section {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin-bottom: 15px !important;
    padding: 12px !important;
    background: #fff3cd !important;
    border: 1px solid #ffeaa7 !important;
    border-radius: 6px !important;
    transition: all 0.2s ease !important;
}

.comensais-section:hover {
    background: #fff0b3 !important;
}

.comensais-section label {
    font-weight: 600 !important;
    color: #856404 !important;
    margin: 0 !important;
    font-size: 14px !important;
    white-space: nowrap !important;
}

.comensais-input {
    width: 80px !important;
    padding: 6px 8px !important;
    border: 2px solid #ffc107 !important;
    border-radius: 4px !important;
    text-align: center !important;
    font-weight: 600 !important;
    font-size: 14px !important;
}

.comensais-input:focus {
    outline: none !important;
    border-color: #ff9800 !important;
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2) !important;
}

/* ===== VALORES DESTACADOS NAS RECEITAS ===== */
.comensais-receita {
    display: inline-block !important;
    padding: 4px 8px !important;
    background: #e7f3ff !important;
    color: #0066cc !important;
    border-radius: 4px !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    border: 1px solid #bee5eb !important;
}

.total-calculado {
    display: inline-block !important;
    padding: 6px 10px !important;
    background: #e8f5e8 !important;
    color: #2e7d32 !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    border: 2px solid #4caf50 !important;
    font-size: 13px !important;
    text-align: center !important;
    transition: all 0.3s ease !important;
}

.total-calculado:hover {
    transform: scale(1.05) !important;
    background: #d4edda !important;
}

.total-calculado.updated {
    animation: pulse 0.6s ease !important;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* ===== BOTÕES COMPACTOS MELHORADOS ===== */
.compact-btn {
    padding: 8px 12px !important;
    font-size: 12px !important;
    border-radius: 6px !important;
    margin-right: 8px !important;
    margin-bottom: 5px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
}

.compact-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
}

/* ===== CONTAINER DE RECEITAS ===== */
.receitas-container {
    margin-top: 15px !important;
    padding-top: 15px !important;
    border-top: 1px solid #e9ecef !important;
}

.receitas-container:empty {
    display: none !important;
}

/* ===== RESPONSIVIDADE PARA MOBILE ===== */
@media (max-width: 768px) {
    .receita-item-tabular {
        grid-template-columns: 1fr !important;
        grid-template-rows: auto auto auto auto auto !important;
        gap: 8px !important;
        padding: 15px !important;
    }
    
    .receitas-header-grid {
        display: none !important; /* Esconder cabeçalho no mobile */
    }
    
    .receita-item-tabular > div {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 8px 0 !important;
        border-bottom: 1px solid #f0f0f0 !important;
    }
    
    .receita-item-tabular > div:last-child {
        border-bottom: none !important;
        justify-content: center !important;
    }
    
    /* Adicionar labels no mobile */
    .receita-item-tabular > div:nth-child(1)::before { content: "Receita: "; }
    .receita-item-tabular > div:nth-child(2)::before { content: "Comensais: "; }
    .receita-item-tabular > div:nth-child(3)::before { content: "Rendimento: "; }
    .receita-item-tabular > div:nth-child(4)::before { content: "Total: "; }
    
    .receita-item-tabular > div::before {
        font-weight: 600 !important;
        color: #495057 !important;
        font-size: 12px !important;
        min-width: 100px !important;
    }
    
    .comensais-section {
        flex-direction: column !important;
        align-items: stretch !important;
        text-align: center !important;
    }
    
    .comensais-input {
        width: 100% !important;
        max-width: 150px !important;
        margin: 0 auto !important;
    }
}

/* ===== ESTADOS DE FOCUS MELHORADOS ===== */
.receita-item-tabular:focus-within {
    outline: 2px solid #667eea !important;
    outline-offset: 2px !important;
}

/* ===== INDICADORES VISUAIS PARA ESTADOS ===== */
.receita-item-tabular.saved {
    border-left: 4px solid #28a745 !important;
    background: #f8fff9 !important;
}

.receita-item-tabular.new {
    border-left: 4px solid #007bff !important;
    background: #e7f3ff !important;
}

.receita-item-tabular.modified {
    border-left: 4px solid #ffc107 !important;
    background: #fffef8 !important;
}

/* ===== MELHORIAS PARA ACORDEÃO ===== */
.expandable {
    margin-bottom: 15px !important;
    border-radius: 10px !important;
    overflow: hidden !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    transition: all 0.3s ease !important;
}

.expandable:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
    transform: translateY(-1px) !important;
}

.expandable-header {
    background: linear-gradient(45deg, #667eea, #764ba2) !important;
    color: white !important;
    padding: 15px 20px !important;
    cursor: pointer !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    font-weight: 600 !important;
    transition: all 0.3s ease !important;
}

.expandable-header:hover {
    background: linear-gradient(45deg, #5a67d8, #6b46c1) !important;
}

.expandable-content {
    background: white !important;
    padding: 0 !important;
    display: none !important;
    border-top: 1px solid #e9ecef !important;
}

.expandable-content.active {
    display: block !important;
    padding: 20px !important;
    animation: slideDown 0.3s ease !important;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ===== ACTIONS MELHORADAS ===== */
.actions {
    display: flex !important;
    gap: 8px !important;
    flex-wrap: wrap !important;
    margin-top: 15px !important;
    padding-top: 15px !important;
    border-top: 1px solid #e9ecef !important;
}

@media (max-width: 768px) {
    .actions {
        flex-direction: column !important;
        align-items: stretch !important;
    }
    
    .actions .btn {
        margin-bottom: 5px !important;
        margin-right: 0 !important;
    }
}

/* ===== ESTILOS PARA CAMPOS EDITÁVEIS NO CARDÁPIO ===== */
/* Adicione este CSS ao arquivo css/main.css */

/* ===== CAMPOS EDITÁVEIS DE COMENSAIS ===== */
.campo-comensais-editavel {
    width: 80px !important;
    padding: 6px 8px !important;
    border: 2px solid #007bff !important;
    border-radius: 4px !important;
    text-align: center !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    background: #e7f3ff !important;
    color: #004085 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2) !important;
}

.campo-comensais-editavel:focus {
    outline: none !important;
    border-color: #0056b3 !important;
    background: #cce7ff !important;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25) !important;
    transform: scale(1.05) !important;
}

.campo-comensais-editavel:hover {
    border-color: #0056b3 !important;
    background: #d1ecf1 !important;
}

/* ===== CAMPOS EDITÁVEIS DE RENDIMENTO ===== */
.campo-rendimento-editavel {
    width: 100px !important;
    padding: 6px 8px !important;
    border: 2px solid #28a745 !important;
    border-radius: 4px !important;
    text-align: center !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    background: #d4edda !important;
    color: #155724 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2) !important;
}

.campo-rendimento-editavel:focus {
    outline: none !important;
    border-color: #1e7e34 !important;
    background: #c3e6cb !important;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.25) !important;
    transform: scale(1.05) !important;
}

.campo-rendimento-editavel:hover {
    border-color: #1e7e34 !important;
    background: #c3e6cb !important;
}

/* ===== TOTAL CALCULADO EDITÁVEL ===== */
.total-calculado-editavel {
    display: inline-block !important;
    padding: 8px 12px !important;
    background: #fff3cd !important;
    color: #856404 !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    border: 2px solid #ffc107 !important;
    font-size: 13px !important;
    min-width: 80px !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 4px rgba(255, 193, 7, 0.2) !important;
}

.total-calculado-editavel:hover {
    background: #ffeeba !important;
    transform: scale(1.02) !important;
    box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3) !important;
}

/* ===== BOTÕES DE AÇÃO COMPACTOS ===== */
.receita-item-tabular .btn {
    padding: 4px 8px !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    border-radius: 4px !important;
    transition: all 0.2s ease !important;
    border: none !important;
    cursor: pointer !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
}

.receita-item-tabular .btn-success {
    background: #28a745 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3) !important;
}

.receita-item-tabular .btn-success:hover {
    background: #218838 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4) !important;
}

.receita-item-tabular .btn-danger {
    background: #dc3545 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3) !important;
}

.receita-item-tabular .btn-danger:hover {
    background: #c82333 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4) !important;
}

/* ===== LAYOUT CORRIGIDO PARA CAMPOS EDITÁVEIS ===== */
.receita-item-tabular {
    display: grid !important;
    grid-template-columns: 2fr 120px 150px 150px 80px !important;
    gap: 10px !important;
    align-items: center !important;
    padding: 12px !important;
    margin-bottom: 8px !important;
    background: white !important;
    border: 1px solid #e9ecef !important;
    border-radius: 6px !important;
    transition: all 0.2s ease !important;
    position: relative !important;
}

.receita-item-tabular:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important;
    border-color: #667eea !important;
}

/* ===== INDICADOR DE EDIÇÃO ===== */
.receita-item-tabular.editada::before {
    content: "✏️ EDITADO";
    position: absolute;
    top: -8px;
    right: -8px;
    background: #ffc107;
    color: #856404;
    font-size: 8px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 10;
}

/* ===== SMALL LABELS MELHORADOS ===== */
.receita-item-tabular small {
    display: block !important;
    color: #666 !important;
    font-size: 10px !important;
    margin-top: 2px !important;
    font-weight: normal !important;
    text-align: center !important;
}

/* ===== ANIMAÇÕES DE FEEDBACK ===== */
@keyframes campo-atualizado {
    0% { 
        transform: scale(1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    50% { 
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0,123,255,0.3);
    }
    100% { 
        transform: scale(1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
}

.campo-atualizado {
    animation: campo-atualizado 0.6s ease !important;
}

/* ===== TOOLTIPS PARA CAMPOS EDITÁVEIS ===== */
.campo-comensais-editavel:hover::after {
    content: "👥 Clique para editar comensais desta receita";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
}

.campo-rendimento-editavel:hover::after {
    content: "⚖️ Clique para editar gramatura desta receita";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
}

/* ===== RESPONSIVIDADE PARA CAMPOS EDITÁVEIS ===== */
@media (max-width: 768px) {
    .receita-item-tabular {
        grid-template-columns: 1fr !important;
        grid-template-rows: auto auto auto auto auto !important;
        gap: 8px !important;
        padding: 15px !important;
    }
    
    .campo-comensais-editavel,
    .campo-rendimento-editavel {
        width: 120px !important;
        margin: 0 auto !important;
    }
    
    .receita-item-tabular > div {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        padding: 8px 0 !important;
        border-bottom: 1px solid #f0f0f0 !important;
    }
    
    .receita-item-tabular > div:last-child {
        border-bottom: none !important;
        justify-content: center !important;
        gap: 10px !important;
    }
    
    /* Labels para mobile */
    .receita-item-tabular > div:nth-child(1)::before { content: "📋 Receita: "; }
    .receita-item-tabular > div:nth-child(2)::before { content: "👥 Comensais: "; }
    .receita-item-tabular > div:nth-child(3)::before { content: "⚖️ Rendimento: "; }
    .receita-item-tabular > div:nth-child(4)::before { content: "📊 Total: "; }
    .receita-item-tabular > div:nth-child(5)::before { content: "🔧 Ações: "; }
    
    .receita-item-tabular > div::before {
        font-weight: 600 !important;
        color: #495057 !important;
        font-size: 12px !important;
        min-width: 100px !important;
        display: inline-block !important;
    }
    
    /* Esconder tooltips no mobile */
    .campo-comensais-editavel:hover::after,
    .campo-rendimento-editavel:hover::after {
        display: none !important;
    }
}

/* ===== ESTADOS DE VALIDAÇÃO ===== */
.campo-comensais-editavel.invalid,
.campo-rendimento-editavel.invalid {
    border-color: #dc3545 !important;
    background: #f8d7da !important;
    color: #721c24 !important;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25) !important;
}

.campo-comensais-editavel.valid,
.campo-rendimento-editavel.valid {
    border-color: #28a745 !important;
    background: #d4edda !important;
    color: #155724 !important;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.25) !important;
}

/* ===== MELHORIAS VISUAIS GERAIS ===== */
.receita-item-tabular:focus-within {
    outline: 2px solid #667eea !important;
    outline-offset: 2px !important;
}

/* Garantir que os inputs não quebrem o layout */
.receita-item-tabular input[type="number"] {
    box-sizing: border-box !important;
    -moz-appearance: textfield !important; /* Firefox */
}

.receita-item-tabular input[type="number"]::-webkit-outer-spin-button,
.receita-item-tabular input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none !important; /* Chrome/Safari */
    margin: 0 !important;
}

/* ===== FEEDBACK VISUAL PARA CÁLCULOS ===== */
@keyframes calculando {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.calculando {
    animation: calculando 0.5s ease-in-out !important;
}