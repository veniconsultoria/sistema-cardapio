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
/* ===== TOAST NOTIFICATIONS CSS ===== */
/* Adicionar ao final do arquivo main.css */

.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    min-width: 300px;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: toastSlideIn 0.3s ease-out;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.toast-content {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 10px;
    position: relative;
    border-radius: 8px;
}

.toast-icon {
    font-size: 18px;
    flex-shrink: 0;
}

.toast-message {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
}

.toast-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
    transition: background-color 0.2s ease;
}

/* Estilos por tipo de toast */
.toast-success .toast-content {
    background: #d4edda;
    color: #155724;
    border-left: 4px solid #28a745;
}

.toast-success .toast-close:hover {
    background: rgba(21, 87, 36, 0.1);
}

.toast-error .toast-content {
    background: #f8d7da;
    color: #721c24;
    border-left: 4px solid #dc3545;
}

.toast-error .toast-close:hover {
    background: rgba(114, 28, 36, 0.1);
}

.toast-warning .toast-content {
    background: #fff3cd;
    color: #856404;
    border-left: 4px solid #ffc107;
}

.toast-warning .toast-close:hover {
    background: rgba(133, 100, 4, 0.1);
}

.toast-info .toast-content {
    background: #d1ecf1;
    color: #0c5460;
    border-left: 4px solid #17a2b8;
}

.toast-info .toast-close:hover {
    background: rgba(12, 84, 96, 0.1);
}

/* Animações */
@keyframes toastSlideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.toast-fade-out {
    animation: toastFadeOut 0.3s ease-in forwards;
}

@keyframes toastFadeOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

/* Responsividade */
@media (max-width: 768px) {
    .toast-notification {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        max-width: none;
    }
    
    .toast-content {
        padding: 10px 12px;
    }
    
    .toast-message {
        font-size: 13px;
    }
}

/* ===== ESTILOS PARA RECEITAS NO CARDÁPIO ===== */
.receita-item {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    margin-bottom: 10px;
    padding: 15px;
    transition: all 0.3s ease;
}

.receita-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-1px);
}

.receita-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #dee2e6;
}

.receita-nome {
    font-weight: 600;
    color: #495057;
    font-size: 14px;
}

.receita-detalhes {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    margin-top: 10px;
}

.receita-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.receita-info label {
    font-size: 12px;
    font-weight: 600;
    color: #6c757d;
    margin: 0;
}

.receita-info span {
    font-size: 14px;
    color: #495057;
    font-weight: 500;
}

.receita-info input {
    padding: 6px 8px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 13px;
    width: 100%;
}

.receita-info input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.total-calculado {
    background: #e7f3ff;
    color: #0066cc;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    text-align: center;
}

/* Container para receitas dentro dos tipos */
.receitas-container {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
}

.receitas-container:empty {
    display: none;
}

/* Responsividade para receitas */
@media (max-width: 768px) {
    .receita-detalhes {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    
    .receita-header {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
    
    .receita-nome {
        text-align: center;
    }
}

// ===== CORREÇÃO PARA FUNÇÃO SHOWTAB =====
// Adicionar ao final do arquivo js/main.js OU como script no index.html

// Função showTab corrigida e melhorada
function showTab(tabName) {
    console.log('📂 Abrindo aba:', tabName);
    
    try {
        // Ocultar todas as abas
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
            tab.classList.add('hidden');
        });
        
        // Remover active de todos os botões de aba
        const allTabButtons = document.querySelectorAll('.tab');
        allTabButtons.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        const tabContent = document.getElementById(tabName);
        if (tabContent) {
            tabContent.classList.remove('hidden');
            console.log('✅ Aba mostrada:', tabName);
        } else {
            console.error('❌ Aba não encontrada:', tabName);
            return;
        }
        
        // Marcar botão como ativo (encontrar pelo evento ou pelo texto)
        const clickedButton = event?.target;
        if (clickedButton && clickedButton.classList.contains('tab')) {
            clickedButton.classList.add('active');
        }
        
        // Inicializar módulos específicos quando necessário
        setTimeout(() => {
            initializeTabModule(tabName);
        }, 100);
        
    } catch (error) {
        console.error('❌ Erro ao mostrar aba:', error);
        mostrarToast?.('Erro ao navegar entre as abas', 'error');
    }
}

// Função para inicializar módulos específicos de cada aba
function initializeTabModule(tabName) {
    console.log('🚀 Inicializando módulo:', tabName);
    
    try {
        switch(tabName) {
            case 'produtos-novo':
                if (typeof inicializarProdutosNovo === 'function') {
                    inicializarProdutosNovo();
                } else {
                    console.warn('⚠️ Função inicializarProdutosNovo não encontrada');
                }
                break;
                
            case 'receitas':
                if (typeof inicializarReceitas === 'function') {
                    inicializarReceitas();
                } else {
                    console.warn('⚠️ Função inicializarReceitas não encontrada');
                }
                break;
                
            case 'tipos-refeicoes':
                if (typeof inicializarTiposRefeicoes === 'function') {
                    inicializarTiposRefeicoes();
                } else {
                    console.warn('⚠️ Função inicializarTiposRefeicoes não encontrada');
                }
                break;
                
            case 'clientes':
                if (typeof inicializarClientes === 'function') {
                    inicializarClientes();
                } else {
                    console.warn('⚠️ Função inicializarClientes não encontrada');
                }
                break;
                
            case 'cardapio':
                if (typeof inicializarCardapio === 'function') {
                    inicializarCardapio();
                } else {
                    console.warn('⚠️ Função inicializarCardapio não encontrada');
                }
                break;
                
            default:
                console.log('📄 Aba sem inicialização específica:', tabName);
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo:', error);
    }
}

// Exportar função para uso global
window.showTab = showTab;
window.initializeTabModule = initializeTabModule;

// ===== FUNÇÃO MOSTRARTOAST GLOBAL (caso não exista) =====
if (typeof window.mostrarToast === 'undefined') {
    window.mostrarToast = function(mensagem, tipo = 'info', duracao = 3000) {
        // Remover toast existente se houver
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        
        // Definir ícones por tipo
        const icones = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icones[tipo] || icones.info}</span>
                <span class="toast-message">${mensagem}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
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
    };
}

console.log('✅ Função showTab carregada e exportada!');