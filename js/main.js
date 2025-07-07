// main.js - Sistema principal CORRIGIDO E LIMPO

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
    
    // Carregar dados do calendário
    carregarCalendario();
    
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

console.log('✅ main.js CORRIGIDO carregado e limpo!');
console.log('📋 Para testar o sistema completo, use: testarSistemaCompleto()');