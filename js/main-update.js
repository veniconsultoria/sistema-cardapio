// main-updated.js - Sistema principal REFATORADO (SEM DUPLICAÇÕES)

console.log('📁 Carregando main.js refatorado...');

// ===== IMPORTAÇÕES DOS MÓDULOS =====
// Nota: Em produção, use import estático ou dynamic imports
// Por compatibilidade com HTML atual, carregamos via script tags

// Verificar se módulos foram carregados
function verificarModulos() {
    const modulosNecessarios = ['Utils', 'Toast'];
    const modulosFaltando = modulosNecessarios.filter(modulo => !window[modulo]);
    
    if (modulosFaltando.length > 0) {
        console.warn('⚠️ Módulos não carregados:', modulosFaltando);
        console.log('💡 Certifique-se de carregar utils.js e toast.js antes do main.js');
    } else {
        console.log('✅ Todos os módulos carregados');
    }
}

// Verificar módulos quando carregado
setTimeout(verificarModulos, 100);

// ===== VARIÁVEIS GLOBAIS SIMPLIFICADAS =====
let mainCardapios = {};

// Data atual para calendário
let dataAtual = new Date();
let mesAtual = dataAtual.getMonth();
let anoAtual = dataAtual.getFullYear();
let diaSelecionado = null;
let calendarioVisivel = true;

// ===== INICIALIZAÇÃO PRINCIPAL LIMPA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - main.js refatorado');
    inicializarSistemaMain();
});

function inicializarSistemaMain() {
    console.log('🚀 Inicializando sistema principal...');
    
    // Configurar eventos básicos (sem duplicar utilitários)
    configurarEventosMain();
    
    // Configurar data atual usando utilitário
    const inputData = document.getElementById('dataCardapio');
    if (inputData && window.Utils) {
        inputData.value = Utils.obterDataHoje();
    } else if (inputData) {
        inputData.value = new Date().toISOString().split('T')[0];
    }
    
    console.log('✅ Sistema principal inicializado');
}

function configurarEventosMain() {
    console.log('⚙️ Configurando eventos principais...');
    
    // ===== FORMATAÇÃO DE TELEFONE (usando módulo Utils) =====
    const telefoneInput = document.getElementById('telefoneCliente');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            if (window.Utils) {
                // Usar módulo utilitário
                e.target.value = Utils.formatarTelefone(e.target.value);
            } else {
                // Fallback simples se módulo não carregou
                let value = e.target.value.replace(/\D/g, '');
                if (value.length <= 11) {
                    value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1)$2-$3');
                    value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1)$2-$3');
                    value = value.replace(/^(\d{2})(\d{1,5})$/, '($1)$2');
                    value = value.replace(/^(\d{1,2})$/, '($1');
                }
                e.target.value = value;
            }
        });
    }

    console.log('✅ Eventos principais configurados');
}

// ===== FUNÇÕES DE CALENDÁRIO ESPECÍFICAS =====

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

// ===== FUNÇÃO SHOW TAB MELHORADA =====
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
    
    // ===== INICIALIZAÇÃO DE MÓDULOS ESPECÍFICOS =====
    setTimeout(() => {
        switch(tabName) {
            case 'produtos-novo':
                console.log('🛒 Inicializando produtos...');
                if (typeof inicializarProdutosNovo === 'function') {
                    inicializarProdutosNovo();
                } else if (typeof inicializarProdutos === 'function') {
                    inicializarProdutos();
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
                if (typeof inicializarClientes === 'function') {
                    inicializarClientes().then(() => {
                        console.log('✅ Clientes inicializados');
                        if (window.Toast) {
                            Toast.info('Sistema de clientes carregado');
                        }
                    }).catch(error => {
                        console.error('❌ Erro ao inicializar clientes:', error);
                        if (window.Toast) {
                            Toast.erro('Erro ao inicializar clientes: ' + error.message);
                        }
                    });
                } else {
                    console.warn('⚠️ Função inicializarClientes não encontrada');
                    if (window.Toast) {
                        Toast.aviso('Sistema de clientes não disponível');
                    }
                }
                break;
                
            case 'cardapio':
                console.log('📅 Inicializando cardápio...');
                if (typeof inicializarCardapio === 'function') {
                    inicializarCardapio();
                } else if (typeof inicializarSistemaSeguro === 'function') {
                    inicializarSistemaSeguro();
                }
                break;
                
            default:
                console.log('ℹ️ Aba sem inicialização específica:', tabName);
        }
    }, 300);
}

// ===== FUNÇÕES AUXILIARES LIMPAS =====

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== EVENTOS GLOBAIS =====

// Fechar modais ao clicar fora
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
window.showTab = showTab;
window.carregarCalendario = carregarCalendario;
window.atualizarCalendario = atualizarCalendario;

// ===== FUNÇÕES DE COMPATIBILIDADE =====

// Função auxiliar para verificar se módulos estão carregados
function verificarModulosCarregados() {
    console.log('🔍 === VERIFICAÇÃO DOS MÓDULOS ===');
    console.log('🛒 Produtos:', typeof inicializarProdutosNovo);
    console.log('🍽️ Receitas:', typeof inicializarReceitas);
    console.log('🍽️ Tipos:', typeof inicializarTiposRefeicoes);
    console.log('👥 Clientes:', typeof inicializarClientes);
    console.log('📅 Cardápio:', typeof inicializarCardapio);
    console.log('🔧 Utils:', typeof window.Utils);
    console.log('🍞 Toast:', typeof window.Toast);
}

// ===== FUNÇÃO DE TESTE DO SISTEMA =====
window.testarSistemaCompleto = function() {
    console.log('🧪 === TESTE COMPLETO DO SISTEMA REFATORADO ===');
    
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
    
    // Testar módulos carregados
    console.log('📬 Testando módulos...');
    if (window.Toast) {
        Toast.sucesso('Sistema principal testado com sucesso!');
        Toast.info('Módulos carregados corretamente');
    } else {
        alert('✅ Sistema testado - Toast não disponível');
    }
    
    if (window.Utils) {
        console.log('📅 Data formatada:', Utils.formatarDataBrasil('2024-12-25'));
        console.log('💰 Moeda formatada:', Utils.formatarMoeda(1234.56));
    }
    
    console.log('✅ Teste completo finalizado!');
};

// Disponibilizar função de verificação
window.verificarModulosCarregados = verificarModulosCarregados;

// ===== VERIFICAÇÃO FINAL AO CARREGAR =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - verificando sistema refatorado...');
    
    setTimeout(() => {
        console.log('🔍 === VERIFICAÇÃO DO SISTEMA REFATORADO ===');
        console.log('📋 Funções principais disponíveis:');
        console.log('  - showTab:', typeof window.showTab);
        console.log('  - toggleCalendar:', typeof window.toggleCalendar);
        console.log('  - mudarMes:', typeof window.mudarMes);
        console.log('  - selecionarDia:', typeof window.selecionarDia);
        console.log('  - Utils:', typeof window.Utils);
        console.log('  - Toast:', typeof window.Toast);
        
        console.log('🎯 Elementos DOM encontrados:');
        console.log('  - Container principal:', !!document.querySelector('.container'));
        console.log('  - Calendário:', !!document.getElementById('calendarContainer'));
        console.log('  - Botões de tab:', document.querySelectorAll('.tab').length);
        
        if (window.Toast) {
            Toast.sucesso('Sistema principal refatorado carregado!', 2000);
        }
        
        console.log('✅ Sistema principal refatorado e funcionando!');
    }, 1000);
});

console.log('✅ main.js REFATORADO carregado com sucesso!');
console.log('📋 Módulos necessários: utils.js, toast.js');
console.log('🧪 Para testar: testarSistemaCompleto()');