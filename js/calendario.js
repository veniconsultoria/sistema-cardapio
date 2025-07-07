// js/calendario.js - Sistema de Calendário TOTALMENTE CORRIGIDO

console.log('📁 Carregando calendario.js CORRIGIDO...');

// ===== SISTEMA DE CALENDÁRIO ISOLADO =====

// Variáveis do calendário (isoladas)
let calendarioSistema = {
    dataAtual: new Date(),
    mesAtual: new Date().getMonth(),
    anoAtual: new Date().getFullYear(),
    diaSelecionado: null,
    calendarioVisivel: true,
    cardapiosDoMes: {},
    inicializado: false
};

// ===== FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO =====
function inicializarCalendarioSistema() {
    console.log('📅 Inicializando sistema de calendário...');
    
    try {
        // Garantir que elementos existam
        const mesAnoEl = document.getElementById('mesAno');
        const gridEl = document.getElementById('calendarGrid');
        
        if (!mesAnoEl || !gridEl) {
            console.warn('⚠️ Elementos do calendário não encontrados');
            return false;
        }
        
        // Inicializar variáveis
        calendarioSistema.dataAtual = new Date();
        calendarioSistema.mesAtual = calendarioSistema.dataAtual.getMonth();
        calendarioSistema.anoAtual = calendarioSistema.dataAtual.getFullYear();
        
        // Configurar data atual no input
        const hoje = new Date().toISOString().split('T')[0];
        const inputData = document.getElementById('dataCardapio');
        if (inputData) {
            inputData.value = hoje;
        }
        
        // Carregar cardápios do mês
        carregarCardapiosParaCalendario();
        
        // Renderizar calendário
        atualizarCalendarioSistema();
        
        calendarioSistema.inicializado = true;
        console.log('✅ Calendário inicializado com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar calendário:', error);
        return false;
    }
}

// ===== FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO =====
function atualizarCalendarioSistema() {
    console.log('🎨 Atualizando calendário...');
    
    const mesAnoElement = document.getElementById('mesAno');
    const gridElement = document.getElementById('calendarGrid');
    
    if (!mesAnoElement || !gridElement) {
        console.warn('⚠️ Elementos do calendário não encontrados para atualização');
        return;
    }
    
    // Nomes dos meses
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    // Atualizar título do mês/ano
    mesAnoElement.textContent = `${meses[calendarioSistema.mesAtual]} ${calendarioSistema.anoAtual}`;
    
    // Limpar grid
    gridElement.innerHTML = '';
    
    // Cabeçalho com dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasSemana.forEach(dia => {
        const div = document.createElement('div');
        div.className = 'calendar-day calendar-header';
        div.textContent = dia;
        div.style.cssText = `
            padding: 8px;
            text-align: center;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            font-size: 12px;
        `;
        gridElement.appendChild(div);
    });
    
    // Calcular primeiro dia e quantidade de dias
    const primeiroDia = new Date(calendarioSistema.anoAtual, calendarioSistema.mesAtual, 1).getDay();
    const diasNoMes = new Date(calendarioSistema.anoAtual, calendarioSistema.mesAtual + 1, 0).getDate();
    
    // Espaços vazios antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day calendar-empty';
        div.style.cssText = 'padding: 8px; text-align: center;';
        gridElement.appendChild(div);
    }
    
    // Data de hoje para comparação
    const hoje = new Date();
    const hojeFmt = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}-${hoje.getDate().toString().padStart(2, '0')}`;
    
    // Data selecionada no input
    const dataInput = document.getElementById('dataCardapio');
    const dataSelecionada = dataInput ? dataInput.value : null;
    
    // Renderizar dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = dia;
        
        // Formato da data
        const dataStr = `${calendarioSistema.anoAtual}-${(calendarioSistema.mesAtual + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
        
        // Estilos básicos
        div.style.cssText = `
            padding: 8px;
            text-align: center;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.2s ease;
            font-size: 13px;
            position: relative;
            min-height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Verificar se é hoje
        if (dataStr === hojeFmt) {
            div.classList.add('today');
            div.style.background = '#28a745';
            div.style.color = 'white';
            div.style.fontWeight = 'bold';
        }
        
        // Verificar se é o dia selecionado
        if (dataStr === dataSelecionada) {
            div.classList.add('active');
            div.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            div.style.color = 'white';
            div.style.fontWeight = 'bold';
        }
        
        // Verificar se tem cardápio
        const statusCardapio = verificarCardapioNaData(dataStr);
        if (statusCardapio.temCardapio) {
            if (statusCardapio.temCalculos) {
                div.classList.add('has-cardapio-completo');
                div.style.backgroundColor = '#d4edda';
                div.style.borderLeft = '3px solid #28a745';
                div.title = `📅 ${formatarDataBrasil(dataStr)}\n✅ Cardápio completo\n🍽️ ${statusCardapio.totalReceitas} receita(s)`;
            } else {
                div.classList.add('has-cardapio-incompleto');
                div.style.backgroundColor = '#fff3cd';
                div.style.borderLeft = '3px solid #ffc107';
                div.title = `📅 ${formatarDataBrasil(dataStr)}\n⚠️ Cardápio sem cálculos\n🍽️ ${statusCardapio.totalReceitas} receita(s)`;
            }
            
            // Adicionar indicador numérico
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: absolute;
                top: 2px;
                right: 2px;
                background: #007bff;
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            indicator.textContent = statusCardapio.totalReceitas;
            div.appendChild(indicator);
        } else {
            div.title = `📅 ${formatarDataBrasil(dataStr)}\n📝 Clique para criar cardápio`;
        }
        
        // Hover effect
        div.addEventListener('mouseenter', function() {
            if (!this.classList.contains('active') && !this.classList.contains('today')) {
                this.style.background = '#f8f9fa';
            }
        });
        
        div.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active') && !this.classList.contains('today')) {
                this.style.background = '';
            }
        });
        
        // Evento de clique CORRIGIDO
        div.onclick = () => selecionarDiaCalendarioSeguro(dataStr);
        
        gridElement.appendChild(div);
    }
    
    console.log('✅ Calendário atualizado');
}

// ===== FUNÇÃO CORRIGIDA: SELECIONAR DIA SEM LOOPS =====
function selecionarDiaCalendarioSeguro(dataISO) {
    console.log('📅 selecionarDiaCalendarioSeguro:', dataISO);
    
    // ✅ PREVENIR LOOP INFINITO
    if (window._processandoSelecaoData) {
        console.log('⚠️ Já processando seleção, ignorando...');
        return;
    }
    
    window._processandoSelecaoData = true;
    
    try {
        const inputData = document.getElementById('dataCardapio');
        if (!inputData) {
            console.error('❌ Campo dataCardapio não encontrado');
            return;
        }
        
        // ✅ ATUALIZAR CAMPO DE DATA
        inputData.value = dataISO;
        
        // ✅ ATUALIZAR VARIÁVEL GLOBAL
        if (typeof window.dataAtualCardapio !== 'undefined') {
            window.dataAtualCardapio = dataISO;
        }
        
        // ✅ CHAMAR FUNÇÃO DE CARREGAMENTO DO CARDÁPIO
        if (typeof window.carregarCardapioData === 'function') {
            setTimeout(() => {
                window.carregarCardapioData();
            }, 100);
        }
        
        // ✅ ATUALIZAR CALENDÁRIO VISUAL
        setTimeout(() => {
            atualizarCalendarioSistema();
        }, 200);
        
        // ✅ FEEDBACK
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(`📅 Data selecionada: ${formatarDataBrasil(dataISO)}`, 'info', 2000);
        }
        
        console.log('✅ Data selecionada com sucesso:', dataISO);
        
    } catch (error) {
        console.error('❌ Erro ao selecionar data:', error);
    } finally {
        // ✅ LIBERAR FLAG
        setTimeout(() => {
            window._processandoSelecaoData = false;
        }, 300);
    }
}

// ===== VERIFICAR CARDÁPIO NA DATA =====
function verificarCardapioNaData(data) {
    try {
        let totalReceitas = 0;
        let totalComensais = 0;
        let temCalculos = false;
        
        // Verificar nos cardápios carregados
        if (window.cardapiosCarregados && window.cardapiosCarregados[data]) {
            Object.values(window.cardapiosCarregados[data]).forEach(clienteData => {
                Object.values(clienteData).forEach(tipoData => {
                    totalReceitas += tipoData.length;
                    
                    tipoData.forEach(receita => {
                        const comensais = parseInt(receita.comensais || 0);
                        const qtdPorPessoa = parseFloat(receita.quantidadePorPessoa || 0);
                        const totalCalculado = parseFloat(receita.totalPorComensais || 0);
                        
                        if (comensais > totalComensais) {
                            totalComensais = comensais;
                        }
                        
                        if (qtdPorPessoa > 0 && totalCalculado > 0) {
                            temCalculos = true;
                        }
                    });
                });
            });
        }
        
        // Verificar também nos cardápios do mês (cache)
        if (calendarioSistema.cardapiosDoMes[data]) {
            const cardapiosData = calendarioSistema.cardapiosDoMes[data];
            totalReceitas += cardapiosData.length;
            
            cardapiosData.forEach(item => {
                const qtdPorPessoa = parseFloat(item.quantidade_por_pessoa || 0);
                const totalCalculado = parseFloat(item.total_por_comensais || 0);
                
                if (qtdPorPessoa > 0 && totalCalculado > 0) {
                    temCalculos = true;
                }
            });
        }
        
        return {
            temCardapio: totalReceitas > 0,
            temCalculos,
            totalReceitas,
            totalComensais
        };
        
    } catch (error) {
        console.error('Erro ao verificar cardápio:', error);
        return { temCardapio: false, temCalculos: false, totalReceitas: 0, totalComensais: 0 };
    }
}

// ===== CARREGAR CARDÁPIOS PARA CALENDÁRIO =====
async function carregarCardapiosParaCalendario() {
    try {
        // Verificar se Supabase está disponível
        if (!window.supabase || !window.supabase.auth) {
            console.warn('⚠️ Supabase não disponível para carregar cardápios');
            return;
        }
        
        console.log('📅 Carregando cardápios para calendário...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            console.warn('⚠️ Usuário não autenticado');
            return;
        }

        const inicioMes = `${calendarioSistema.anoAtual}-${(calendarioSistema.mesAtual + 1).toString().padStart(2, '0')}-01`;
        const fimMes = new Date(calendarioSistema.anoAtual, calendarioSistema.mesAtual + 1, 0);
        const fimMesFmt = `${calendarioSistema.anoAtual}-${(calendarioSistema.mesAtual + 1).toString().padStart(2, '0')}-${fimMes.getDate().toString().padStart(2, '0')}`;

        const { data: cardapios, error } = await window.supabase
            .from('cardapios')
            .select('data, receita_id, comensais, quantidade_por_pessoa, total_por_comensais')
            .eq('user_id', user.id)
            .gte('data', inicioMes)
            .lte('data', fimMesFmt);

        if (error) {
            console.warn('⚠️ Erro ao carregar cardápios do mês:', error);
            calendarioSistema.cardapiosDoMes = {};
            return;
        }

        // Organizar cardápios por data
        calendarioSistema.cardapiosDoMes = {};
        (cardapios || []).forEach(item => {
            if (!calendarioSistema.cardapiosDoMes[item.data]) {
                calendarioSistema.cardapiosDoMes[item.data] = [];
            }
            calendarioSistema.cardapiosDoMes[item.data].push(item);
        });

        console.log(`✅ ${Object.keys(calendarioSistema.cardapiosDoMes).length} datas com cardápio no mês`);

    } catch (error) {
        console.error('❌ Erro ao carregar cardápios para calendário:', error);
        calendarioSistema.cardapiosDoMes = {};
    }
}

// ===== NAVEGAÇÃO DO CALENDÁRIO =====
function mudarMesCalendario(direcao) {
    console.log(`📅 Mudando mês: ${direcao > 0 ? 'próximo' : 'anterior'}`);
    
    calendarioSistema.mesAtual += direcao;
    
    if (calendarioSistema.mesAtual < 0) {
        calendarioSistema.mesAtual = 11;
        calendarioSistema.anoAtual--;
    } else if (calendarioSistema.mesAtual > 11) {
        calendarioSistema.mesAtual = 0;
        calendarioSistema.anoAtual++;
    }
    
    // Recarregar cardápios do novo mês
    carregarCardapiosParaCalendario().then(() => {
        atualizarCalendarioSistema();
    });
}

// ===== TOGGLE DO CALENDÁRIO =====
function toggleCalendarioSistema() {
    console.log('🔄 Toggle calendário');
    
    const calendarContainer = document.getElementById('calendarContainer');
    const toggleText = document.getElementById('calendar-toggle-text');
    
    if (!calendarContainer || !toggleText) {
        console.warn('⚠️ Elementos de toggle não encontrados');
        return;
    }
    
    if (calendarioSistema.calendarioVisivel) {
        calendarContainer.classList.add('hidden');
        toggleText.textContent = 'Mostrar Calendário';
        calendarioSistema.calendarioVisivel = false;
    } else {
        calendarContainer.classList.remove('hidden');
        toggleText.textContent = 'Ocultar Calendário';
        calendarioSistema.calendarioVisivel = true;
        
        // Re-inicializar se necessário
        if (!calendarioSistema.inicializado) {
            setTimeout(() => {
                inicializarCalendarioSistema();
            }, 100);
        }
    }
}

// ===== FUNÇÃO DE FORÇAR ATUALIZAÇÃO =====
function forcarAtualizacaoCalendario() {
    console.log('🔄 Forçando atualização do calendário...');
    
    // Recarregar cardápios
    carregarCardapiosParaCalendario().then(() => {
        // Atualizar visual
        atualizarCalendarioSistema();
        console.log('✅ Calendário atualizado forçadamente');
    });
}

// ===== FUNÇÕES AUXILIARES =====
function formatarDataBrasil(dataISO) {
    if (!dataISO) return '';
    try {
        const data = new Date(dataISO + 'T00:00:00');
        return data.toLocaleDateString('pt-BR');
    } catch (error) {
        return dataISO;
    }
}

// ===== EXPORTAR FUNÇÕES PARA USO GLOBAL =====
window.inicializarCalendarioSistema = inicializarCalendarioSistema;
window.atualizarCalendarioSistema = atualizarCalendarioSistema;
window.mudarMesCalendario = mudarMesCalendario;
window.selecionarDiaCalendarioSeguro = selecionarDiaCalendarioSeguro;
window.toggleCalendarioSistema = toggleCalendarioSistema;
window.forcarAtualizacaoCalendario = forcarAtualizacaoCalendario;

// ===== ALIASES PARA COMPATIBILIDADE =====
window.toggleCalendar = toggleCalendarioSistema;
window.mudarMes = mudarMesCalendario;
window.selecionarDiaCalendario = selecionarDiaCalendarioSeguro;
window.selecionarDia = selecionarDiaCalendarioSeguro;
window.atualizarCalendario = atualizarCalendarioSistema;

// ===== AUTO-INICIALIZAÇÃO QUANDO DOM ESTIVER PRONTO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - calendario.js pronto');
    
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        // Verificar se estamos na aba de cardápio e inicializar
        const tabCardapio = document.getElementById('cardapio');
        if (tabCardapio && !tabCardapio.classList.contains('hidden')) {
            console.log('📅 Aba de cardápio ativa, inicializando calendário...');
            inicializarCalendarioSistema();
        }
    }, 500);
});

console.log('✅ calendario.js CORRIGIDO carregado com sucesso!');