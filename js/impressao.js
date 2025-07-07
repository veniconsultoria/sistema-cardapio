// js/impressao.js - Sistema de Impressão COMPLETO E FUNCIONAL

console.log('📁 Carregando impressao.js - Sistema COMPLETO...');

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

        // Carregar clientes
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

        // Carregar tipos de refeição
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
        
        console.log(`✅ Dados carregados: ${dadosImpressao.clientes.length} clientes, ${dadosImpressao.tiposRefeicao.length} tipos`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        dadosImpressao = { clientes: [], tiposRefeicao: [], cardapios: [] };
        mostrarToast('Erro ao carregar dados: ' + error.message, 'error');
    }
}

// ===== CRIAR MODAL DE IMPRESSÃO =====
function criarModalImpressao() {
    const modalHTML = `
        <div id="modalImpressao" class="modal" style="z-index: 2000;">
            <div class="modal-content" style="max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;">
                <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        🖨️ Imprimir Cardápios
                        <span class="close" onclick="fecharModalImpressao()" style="margin-left: auto; cursor: pointer; font-size: 28px; font-weight: bold;">&times;</span>
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Configure o período e opções de impressão</p>
                </div>

                <!-- Período de Datas -->
                <div class="form-section">
                    <h4>📅 Período de Impressão</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div class="form-group">
                            <label for="dataInicioImpressao">Data Inicial:</label>
                            <input type="date" id="dataInicioImpressao" required style="width: 100%; padding: 10px; border: 1px solid #e9ecef; border-radius: 5px;">
                        </div>
                        <div class="form-group">
                            <label for="dataFimImpressao">Data Final:</label>
                            <input type="date" id="dataFimImpressao" required style="width: 100%; padding: 10px; border: 1px solid #e9ecef; border-radius: 5px;">
                        </div>
                    </div>
                    <button type="button" class="btn btn-info btn-sm" onclick="verificarCardapiosDisponiveis()">
                        🔍 Verificar Cardápios Disponíveis
                    </button>
                </div>

                <!-- Seleção de Clientes -->
                <div class="form-section">
                    <h4>👥 Clientes</h4>
                    <div style="margin-bottom: 10px;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="selecionarTodosClientes()">Selecionar Todos</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="desmarcarTodosClientes()">Desmarcar Todos</button>
                    </div>
                    <div class="checkbox-list" id="listaClientesImpressao">
                        <!-- Clientes serão carregados aqui -->
                    </div>
                </div>

                <!-- Seleção de Tipos de Refeição -->
                <div class="form-section">
                    <h4>🍽️ Tipos de Refeição</h4>
                    <div style="margin-bottom: 10px;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="selecionarTodosTipos()">Selecionar Todos</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="desmarcarTodosTipos()">Desmarcar Todos</button>
                    </div>
                    <div class="checkbox-list" id="listaTiposImpressao">
                        <!-- Tipos serão carregados aqui -->
                    </div>
                </div>

                <!-- Opções de Impressão -->
                <div class="form-section">
                    <h4>⚙️ Opções de Impressão</h4>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="incluirIngredientes" checked>
                            Incluir detalhes dos ingredientes
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="incluirPrecos">
                            Incluir preços das receitas
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="agruparPorData" checked>
                            Agrupar por data
                        </label>
                    </div>
                </div>

                <!-- Informações de Debug -->
                <div class="form-section" style="background: #f8f9fa; border-radius: 5px; padding: 15px;">
                    <h4>📊 Informações</h4>
                    <div id="debugInfoImpressao" style="font-family: monospace; font-size: 12px; color: #666;">
                        Carregando informações...
                    </div>
                </div>

                <!-- Botões de Ação -->
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="fecharModalImpressao()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="executarImpressao()">
                        🖨️ Gerar Impressão
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== CONFIGURAR MODAL =====
function configurarModalCardapios() {
    // Configurar datas padrão (últimos 7 dias)
    const hoje = new Date();
    const semanaPassada = new Date();
    semanaPassada.setDate(hoje.getDate() - 7);
    
    document.getElementById('dataInicioImpressao').value = semanaPassada.toISOString().split('T')[0];
    document.getElementById('dataFimImpressao').value = hoje.toISOString().split('T')[0];
    
    // Carregar clientes
    carregarClientesModal();
    
    // Carregar tipos de refeição
    carregarTiposModal();
    
    // Atualizar informações
    atualizarInfoImpressao();
}

// ===== CARREGAR CLIENTES NO MODAL =====
function carregarClientesModal() {
    const container = document.getElementById('listaClientesImpressao');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (dadosImpressao.clientes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum cliente encontrado</p>';
        return;
    }
    
    dadosImpressao.clientes.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="cliente-${index}" value="${cliente.id}" checked>
            <label for="cliente-${index}">${cliente.codigo} - ${cliente.descricao}</label>
        `;
        container.appendChild(div);
    });
}

// ===== CARREGAR TIPOS NO MODAL =====
function carregarTiposModal() {
    const container = document.getElementById('listaTiposImpressao');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (dadosImpressao.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum tipo de refeição encontrado</p>';
        return;
    }
    
    dadosImpressao.tiposRefeicao.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="tipo-${index}" value="${tipo.id}" checked>
            <label for="tipo-${index}">${tipo.codigo} - ${tipo.descricao}</label>
        `;
        container.appendChild(div);
    });
}

// ===== FUNÇÕES DE SELEÇÃO =====
function selecionarTodosClientes() {
    const checkboxes = document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function desmarcarTodosClientes() {
    const checkboxes = document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
}

function selecionarTodosTipos() {
    const checkboxes = document.querySelectorAll('#listaTiposImpressao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function desmarcarTodosTipos() {
    const checkboxes = document.querySelectorAll('#listaTiposImpressao input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
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
                quantidade_por_pessoa,
                total_por_comensais,
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
            atualizarInfoImpressao('Nenhum cardápio encontrado no período selecionado');
        } else {
            // Organizar dados para análise
            const cardapiosPorData = {};
            const clientesEncontrados = new Set();
            const tiposEncontrados = new Set();
            
            cardapios.forEach(item => {
                if (!cardapiosPorData[item.data]) {
                    cardapiosPorData[item.data] = [];
                }
                cardapiosPorData[item.data].push(item);
                clientesEncontrados.add(item.clientes?.descricao || 'N/A');
                tiposEncontrados.add(item.tipos_refeicoes?.descricao || 'N/A');
            });
            
            let info = `✅ ${cardapios.length} registros encontrados!\n\n`;
            info += `📅 ${Object.keys(cardapiosPorData).length} datas diferentes\n`;
            info += `👥 ${clientesEncontrados.size} clientes diferentes\n`;
            info += `🍽️ ${tiposEncontrados.size} tipos de refeição diferentes\n\n`;
            
            info += `Datas com cardápios:\n`;
            Object.keys(cardapiosPorData).sort().forEach(data => {
                info += `• ${formatarDataBrasil(data)}: ${cardapiosPorData[data].length} itens\n`;
            });
            
            mostrarToast(info, 'success', 8000);
            atualizarInfoImpressao(info);
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar cardápios:', error);
        mostrarToast('Erro ao verificar cardápios: ' + error.message, 'error');
    }
}

// ===== ATUALIZAR INFORMAÇÕES =====
function atualizarInfoImpressao(infoExtra = '') {
    const debugContainer = document.getElementById('debugInfoImpressao');
    if (!debugContainer) return;
    
    const dataInicio = document.getElementById('dataInicioImpressao')?.value;
    const dataFim = document.getElementById('dataFimImpressao')?.value;
    
    let info = `Dados carregados:\n`;
    info += `• ${dadosImpressao.clientes.length} clientes encontrados\n`;
    info += `• ${dadosImpressao.tiposRefeicao.length} tipos de refeição encontrados\n\n`;
    
    if (dataInicio && dataFim) {
        info += `Período configurado:\n`;
        info += `• Início: ${formatarDataBrasil(dataInicio)}\n`;
        info += `• Fim: ${formatarDataBrasil(dataFim)}\n\n`;
    }
    
    if (infoExtra) {
        info += `Status:\n${infoExtra}`;
    }
    
    debugContainer.textContent = info;
}

// ===== EXECUTAR IMPRESSÃO =====
async function executarImpressao() {
    try {
        console.log('🖨️ Executando impressão...');
        
        // Validar período
        const dataInicio = document.getElementById('dataInicioImpressao')?.value;
        const dataFim = document.getElementById('dataFimImpressao')?.value;
        
        if (!dataInicio || !dataFim) {
            mostrarToast('Defina o período de datas', 'warning');
            return;
        }
        
        // Obter clientes selecionados
        const clientesSelecionados = Array.from(document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (clientesSelecionados.length === 0) {
            mostrarToast('Selecione pelo menos um cliente', 'warning');
            return;
        }
        
        // Obter tipos selecionados
        const tiposSelecionados = Array.from(document.querySelectorAll('#listaTiposImpressao input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (tiposSelecionados.length === 0) {
            mostrarToast('Selecione pelo menos um tipo de refeição', 'warning');
            return;
        }
        
        // Buscar dados para impressão
        mostrarToast('Carregando dados para impressão...', 'info');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: cardapios, error } = await window.supabase
            .from('cardapios')
            .select(`
                *,
                clientes (codigo, descricao),
                tipos_refeicoes (codigo, descricao),
                receitas (codigo, descricao, texto)
            `)
            .eq('user_id', user.id)
            .gte('data', dataInicio)
            .lte('data', dataFim)
            .in('cliente_id', clientesSelecionados)
            .in('tipo_refeicao_id', tiposSelecionados)
            .order('data, cliente_id, tipo_refeicao_id');

        if (error) throw error;
        
        if (!cardapios || cardapios.length === 0) {
            mostrarToast('Nenhum cardápio encontrado com os filtros selecionados', 'warning');
            return;
        }
        
        console.log(`📊 ${cardapios.length} itens encontrados para impressão`);
        
        // Gerar relatório
        await gerarRelatorioImpressao(cardapios, {
            dataInicio,
            dataFim,
            incluirIngredientes: document.getElementById('incluirIngredientes')?.checked || false,
            incluirPrecos: document.getElementById('incluirPrecos')?.checked || false,
            agruparPorData: document.getElementById('agruparPorData')?.checked || true
        });
        
    } catch (error) {
        console.error('❌ Erro na impressão:', error);
        mostrarToast('Erro ao gerar impressão: ' + error.message, 'error');
    }
}

// ===== GERAR RELATÓRIO DE IMPRESSÃO =====
async function gerarRelatorioImpressao(cardapios, opcoes) {
    console.log('📄 Gerando relatório de impressão...');
    
    const { dataInicio, dataFim, incluirIngredientes, incluirPrecos, agruparPorData } = opcoes;
    
    // Organizar dados
    const dadosOrganizados = {};
    
    cardapios.forEach(item => {
        const data = item.data;
        const clienteNome = item.clientes?.descricao || 'Cliente Desconhecido';
        const tipoNome = item.tipos_refeicoes?.descricao || 'Tipo Desconhecido';
        
        if (!dadosOrganizados[data]) {
            dadosOrganizados[data] = {};
        }
        
        if (!dadosOrganizados[data][clienteNome]) {
            dadosOrganizados[data][clienteNome] = {};
        }
        
        if (!dadosOrganizados[data][clienteNome][tipoNome]) {
            dadosOrganizados[data][clienteNome][tipoNome] = [];
        }
        
        dadosOrganizados[data][clienteNome][tipoNome].push(item);
    });
    
    // Gerar HTML do relatório
    let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Cardápios - ${formatarDataBrasil(dataInicio)} a ${formatarDataBrasil(dataFim)}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                    line-height: 1.4;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                
                .header h1 {
                    color: #667eea;
                    margin: 0 0 10px 0;
                    font-size: 28px;
                }
                
                .periodo {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                    font-weight: 600;
                    color: #495057;
                }
                
                .data-section {
                    margin-bottom: 40px;
                    page-break-inside: avoid;
                }
                
                .data-header {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .cliente-section {
                    margin-bottom: 30px;
                    padding: 15px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    background: #f8f9fa;
                }
                
                .cliente-header {
                    font-size: 16px;
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .tipo-section {
                    margin-bottom: 20px;
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    border-left: 4px solid #28a745;
                }
                
                .tipo-header {
                    font-weight: 600;
                    color: #28a745;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                
                .receita-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    margin-bottom: 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    border: 1px solid #e9ecef;
                }
                
                .receita-nome {
                    font-weight: 500;
                    color: #333;
                }
                
                .receita-detalhes {
                    text-align: right;
                    color: #666;
                    font-size: 13px;
                }
                
                .quantidade-destaque {
                    font-weight: 600;
                    color: #2e7d32;
                    font-size: 14px;
                }
                
                .total-section {
                    margin-top: 30px;
                    padding: 20px;
                    background: #e7f3ff;
                    border-radius: 8px;
                    border-left: 4px solid #2196f3;
                }
                
                .print-controls {
                    text-align: center;
                    margin: 20px 0;
                }
                
                .print-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 0 10px;
                }
                
                .print-btn:hover {
                    background: #5a67d8;
                }
                
                @media print {
                    .print-controls { display: none; }
                    body { padding: 10px; }
                    .data-section { page-break-before: always; }
                    .data-section:first-child { page-break-before: auto; }
                }
                
                @page {
                    margin: 2cm;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📋 Relatório de Cardápios</h1>
                <div class="periodo">
                    📅 Período: ${formatarDataBrasil(dataInicio)} a ${formatarDataBrasil(dataFim)}
                </div>
            </div>
            
            <div class="print-controls">
                <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
                <button class="print-btn" onclick="window.close()">❌ Fechar</button>
            </div>
    `;
    
    // Adicionar dados organizados
    let totalReceitas = 0;
    let totalComensais = 0;
    
    Object.keys(dadosOrganizados).sort().forEach(data => {
        html += `<div class="data-section">`;
        html += `<div class="data-header">📅 ${formatarDataBrasil(data)}</div>`;
        
        Object.keys(dadosOrganizados[data]).forEach(clienteNome => {
            html += `<div class="cliente-section">`;
            html += `<div class="cliente-header">👤 ${clienteNome}</div>`;
            
            Object.keys(dadosOrganizados[data][clienteNome]).forEach(tipoNome => {
                const receitas = dadosOrganizados[data][clienteNome][tipoNome];
                
                html += `<div class="tipo-section">`;
                html += `<div class="tipo-header">🍽️ ${tipoNome}</div>`;
                
                receitas.forEach(receita => {
                    totalReceitas++;
                    totalComensais += receita.comensais || 0;
                    
                    html += `<div class="receita-item">`;
                    html += `<div class="receita-nome">${receita.receitas?.codigo || 'N/A'} - ${receita.receitas?.descricao || 'Receita não encontrada'}</div>`;
                    html += `<div class="receita-detalhes">`;
                    html += `<div>Comensais: <span class="quantidade-destaque">${receita.comensais || 0}</span></div>`;
                    html += `<div>Quantidade/pessoa: <span class="quantidade-destaque">${parseFloat(receita.quantidade_por_pessoa || 0).toFixed(3)} ${receita.unidade_basica || 'UN'}</span></div>`;
                    html += `<div>Total: <span class="quantidade-destaque">${parseFloat(receita.total_por_comensais || 0).toFixed(3)} KG</span></div>`;
                    html += `</div>`;
                    html += `</div>`;
                });
                
                html += `</div>`;
            });
            
            html += `</div>`;
        });
        
        html += `</div>`;
    });
    
    // Adicionar totais
    html += `
        <div class="total-section">
            <h3>📊 Resumo Geral</h3>
            <p><strong>Total de receitas:</strong> ${totalReceitas}</p>
            <p><strong>Total de comensais:</strong> ${totalComensais}</p>
            <p><strong>Período:</strong> ${formatarDataBrasil(dataInicio)} a ${formatarDataBrasil(dataFim)}</p>
            <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        </body>
        </html>
    `;
    
    // Abrir em nova janela
    const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    printWindow.document.write(html);
    printWindow.document.close();
    
    console.log('✅ Relatório gerado com sucesso!');
    mostrarToast('Relatório gerado com sucesso!', 'success');
    
    // Fechar modal
    fecharModalImpressao();
}

// ===== FUNÇÕES AUXILIARES =====

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
window.selecionarTodosClientes = selecionarTodosClientes;
window.desmarcarTodosClientes = desmarcarTodosClientes;
window.selecionarTodosTipos = selecionarTodosTipos;
window.desmarcarTodosTipos = desmarcarTodosTipos;
window.executarImpressao = executarImpressao;

console.log('✅ Sistema de impressão COMPLETO carregado!');
console.log('📋 Função principal disponível:', typeof window.abrirModalImpressao);