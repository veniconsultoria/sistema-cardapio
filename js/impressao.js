// impressao.js - Sistema de Impressão CORRIGIDO

console.log('📁 Carregando impressao.js - Sistema CORRIGIDO...');

// ===== SISTEMA DE IMPRESSÃO PARA CARDÁPIOS =====

// Variáveis globais
let dadosImpressao = {
    clientes: [],
    tiposRefeicao: [],
    cardapios: []
};

// ===== FUNÇÃO PRINCIPAL PARA ABRIR MODAL DE CARDÁPIOS =====
async function abrirModalImpressaoCardapios() {
    console.log('🖨️ Abrindo modal de impressão para cardápios...');
    
    // Buscar dados atualizados
    await carregarDadosParaImpressao();
    
    // Criar modal se não existir
    if (!document.getElementById('modalImpressao')) {
        criarModalImpressao();
    }
    
    // Configurar modal para cardápios
    configurarModalCardapios();
    
    // Mostrar modal
    document.getElementById('modalImpressao').style.display = 'block';
}

// ===== CARREGAR DADOS PARA IMPRESSÃO =====
async function carregarDadosParaImpressao() {
    try {
        console.log('📥 Carregando dados para impressão...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log('🔄 Carregando clientes do banco...');
        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) {
            console.warn('⚠️ Erro ao carregar clientes:', clientesError);
            dadosImpressao.clientes = [];
        } else {
            dadosImpressao.clientes = clientesData || [];
        }

        console.log('🔄 Carregando tipos de refeição do banco...');
        const { data: tiposData, error: tiposError } = await window.supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (tiposError) {
            console.warn('⚠️ Erro ao carregar tipos:', tiposError);
            dadosImpressao.tiposRefeicao = [];
        } else {
            dadosImpressao.tiposRefeicao = tiposData || [];
        }

        console.log('🔍 Verificando cardápios disponíveis...');
        const { data: cardapiosTest, error: cardapiosTestError } = await window.supabase
            .from('cardapios')
            .select('data, cliente_id, tipo_refeicao_id, receita_id')
            .eq('user_id', user.id)
            .limit(10);

        if (cardapiosTestError) {
            console.error('❌ Erro ao verificar cardápios:', cardapiosTestError);
        } else {
            console.log(`✅ Encontrados ${(cardapiosTest || []).length} registros de cardápio para o usuário`);
            if (cardapiosTest && cardapiosTest.length > 0) {
                const datasUnicas = [...new Set(cardapiosTest.map(c => c.data))];
                console.log('📅 Datas com cardápios:', datasUnicas);
            }
        }
        
        console.log(`✅ Dados carregados: ${dadosImpressao.clientes.length} clientes, ${dadosImpressao.tiposRefeicao.length} tipos`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        dadosImpressao = { clientes: [], tiposRefeicao: [], cardapios: [] };
        mostrarToast('Erro ao carregar dados: ' + error.message, 'error');
    }
}

// ===== VERIFICAR CARDÁPIOS DISPONÍVEIS =====
async function verificarCardapiosDisponiveis() {
    try {
        console.log('🔍 Verificando cardápios disponíveis...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const dataInicio = document.getElementById('dataInicioImpressao')?.value;
        const dataFim = document.getElementById('dataFimImpressao')?.value;
        
        if (!dataInicio || !dataFim) {
            mostrarToast('Defina o período primeiro', 'warning');
            return;
        }

        const { data: cardapios, error } = await window.supabase
            .from('cardapios')
            .select(`
                data,
                cliente_id,
                tipo_refeicao_id,
                receita_id,
                comensais,
                clientes (codigo, descricao),
                tipos_refeicoes (codigo, descricao),
                receitas (codigo, descricao)
            `)
            .eq('user_id', user.id)
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .order('data, cliente_id, tipo_refeicao_id');

        if (error) {
            console.error('❌ Erro na consulta:', error);
            mostrarToast('Erro ao consultar cardápios: ' + error.message, 'error');
            return;
        }

        console.log(`📊 Resultado da consulta: ${(cardapios || []).length} registros encontrados`);
        
        if (!cardapios || cardapios.length === 0) {
            mostrarToast(`❌ Nenhum cardápio encontrado entre ${formatarDataBrasil(dataInicio)} e ${formatarDataBrasil(dataFim)}`, 'warning');
        } else {
            const cardapiosPorData = {};
            cardapios.forEach(item => {
                if (!cardapiosPorData[item.data]) {
                    cardapiosPorData[item.data] = [];
                }
                cardapiosPorData[item.data].push(item);
            });
            
            let mensagem = `✅ ${cardapios.length} registros encontrados!\n\n`;
            Object.keys(cardapiosPorData).sort().forEach(data => {
                mensagem += `📅 ${formatarDataBrasil(data)}: ${cardapiosPorData[data].length} itens\n`;
            });
            
            mostrarToast(mensagem, 'success', 5000);
            
            const debugContainer = document.getElementById('debugInfo');
            if (debugContainer) {
                debugContainer.innerHTML = `
                    <strong>✅ Verificação concluída:</strong><br>
                    • ${cardapios.length} registros de cardápio encontrados<br>
                    • ${Object.keys(cardapiosPorData).length} datas diferentes<br>
                    • Período: ${formatarDataBrasil(dataInicio)} a ${formatarDataBrasil(dataFim)}<br>
                    <br>
                    <strong>Datas com cardápios:</strong><br>
                    ${Object.keys(cardapiosPorData).sort().map(data => 
                        `• ${formatarDataBrasil(data)}: ${cardapiosPorData[data].length} itens`
                    ).join('<br>')}
                `;
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar cardápios:', error);
        mostrarToast('Erro ao verificar cardápios: ' + error.message, 'error');
    }
}

// ===== RESTO DAS FUNÇÕES (simplificadas para corrigir o erro) =====

function criarModalImpressao() {
    // Modal HTML básico para evitar erros
    const modalHTML = `
        <div id="modalImpressao" class="modal">
            <div class="modal-content">
                <span class="close" onclick="fecharModalImpressao()">&times;</span>
                <h2>🖨️ Sistema de Impressão</h2>
                <p>Sistema em desenvolvimento...</p>
                <div id="debugInfo"></div>
                <input type="date" id="dataInicioImpressao">
                <input type="date" id="dataFimImpressao">
                <button onclick="verificarCardapiosDisponiveis()">Verificar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function configurarModalCardapios() {
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];
    
    document.getElementById('dataInicioImpressao').value = '2025-07-01';
    document.getElementById('dataFimImpressao').value = '2025-07-31';
    
    atualizarDebugInfo();
}

function atualizarDebugInfo() {
    const debugContainer = document.getElementById('debugInfo');
    if (!debugContainer) return;
    
    debugContainer.innerHTML = `
        <strong>Dados carregados:</strong><br>
        • ${dadosImpressao.clientes.length} clientes encontrados<br>
        • ${dadosImpressao.tiposRefeicao.length} tipos de refeição encontrados<br>
        <br>
        <strong>Período configurado:</strong><br>
        • Início: 01/07/2025<br>
        • Fim: 31/07/2025<br>
    `;
}

function formatarDataBrasil(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

function fecharModalImpressao() {
    const modal = document.getElementById('modalImpressao');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Toast notification system
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    if (window.mostrarToast && typeof window.mostrarToast === 'function' && window.mostrarToast !== mostrarToast) {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
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
    `;
    
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
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duracao);
}

// ===== EXPORTAR FUNÇÕES PARA USO GLOBAL =====
window.abrirModalImpressaoCardapios = abrirModalImpressaoCardapios;
window.abrirModalImpressao = abrirModalImpressaoCardapios;
window.fecharModalImpressao = fecharModalImpressao;
window.verificarCardapiosDisponiveis = verificarCardapiosDisponiveis;

// ===== GARANTIR QUE A FUNÇÃO PRINCIPAL ESTÁ DISPONÍVEL =====
if (typeof window.abrirModalImpressao === 'undefined') {
    window.abrirModalImpressao = function() {
        console.log('🖨️ Chamando função de impressão...');
        if (typeof abrirModalImpressaoCardapios === 'function') {
            return abrirModalImpressaoCardapios();
        } else {
            console.warn('⚠️ Função abrirModalImpressaoCardapios ainda não está disponível');
            mostrarToast('Sistema de impressão carregando...', 'info');
            setTimeout(() => {
                if (typeof abrirModalImpressaoCardapios === 'function') {
                    abrirModalImpressaoCardapios();
                } else {
                    mostrarToast('Erro: Sistema de impressão não foi carregado corretamente', 'error');
                }
            }, 1000);
        }
    };
}

console.log('✅ Sistema de impressão CORRIGIDO carregado!');
console.log('📋 Função principal disponível:', typeof window.abrirModalImpressao);