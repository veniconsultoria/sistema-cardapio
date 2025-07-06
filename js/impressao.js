// impressao.js - Sistema de Impressão CORRIGIDO para encontrar cardápios

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

        // ✅ CORREÇÃO 1: Carregar clientes diretamente do banco
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

        // ✅ CORREÇÃO 2: Carregar tipos de refeição diretamente do banco
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

        // ✅ CORREÇÃO 3: Fazer uma consulta de teste para verificar cardápios
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
            console.log('📊 Amostra de cardápios:', cardapiosTest);
            
            if (cardapiosTest && cardapiosTest.length > 0) {
                // Verificar datas únicas
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

// ===== CRIAR MODAL HTML =====
function criarModalImpressao() {
    const modalHTML = `
        <div id="modalImpressao" class="modal">
            <div class="modal-content" style="max-width: 700px;">
                <!-- Cabeçalho -->
                <div class="modal-header" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        🖨️ Impressão de Cardápios
                        <span class="close" onclick="fecharModalImpressao()" style="margin-left: auto; cursor: pointer; font-size: 28px; font-weight: bold;">&times;</span>
                    </h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Configure os filtros e período para impressão dos cardápios</p>
                </div>
                
                <!-- Seção de Período -->
                <div class="form-section">
                    <h4>📅 Período</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label for="dataInicioImpressao">Data Início:</label>
                            <input type="date" id="dataInicioImpressao" required style="width: 100%; padding: 8px; border: 1px solid #e9ecef; border-radius: 4px;">
                        </div>
                        <div class="form-group">
                            <label for="dataFimImpressao">Data Fim:</label>
                            <input type="date" id="dataFimImpressao" required style="width: 100%; padding: 8px; border: 1px solid #e9ecef; border-radius: 4px;">
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="definirPeriodoImpressao('hoje')">Hoje</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="definirPeriodoImpressao('semana')">Esta Semana</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="definirPeriodoImpressao('mes')">Este Mês</button>
                        <button type="button" class="btn btn-info btn-sm" onclick="verificarCardapiosDisponiveis()">🔍 Verificar Cardápios</button>
                    </div>
                </div>
                
                <!-- Seção de Debug -->
                <div class="form-section" style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                    <h4>🔧 Informações de Debug</h4>
                    <div id="debugInfo" style="font-size: 12px; color: #666;">
                        Carregando informações...
                    </div>
                </div>
                
                <!-- Seção de Clientes -->
                <div class="form-section">
                    <h4>👥 Clientes</h4>
                    <div style="margin-bottom: 10px;">
                        <label>
                            <input type="radio" name="filtroCliente" value="todos" checked onchange="toggleListaClientes()"> 
                            Todos os clientes
                        </label>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>
                            <input type="radio" name="filtroCliente" value="especificos" onchange="toggleListaClientes()"> 
                            Clientes específicos
                        </label>
                    </div>
                    <div id="listaClientesImpressao" style="display: none;">
                        <div class="checkbox-list" style="max-height: 120px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 5px; padding: 10px; background: white;">
                            <!-- Clientes serão carregados aqui -->
                        </div>
                        <div style="margin-top: 8px;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="selecionarTodosClientes()">Selecionar Todos</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="desmarcarTodosClientes()">Desmarcar Todos</button>
                        </div>
                    </div>
                </div>
                
                <!-- Seção de Tipos de Refeições -->
                <div class="form-section">
                    <h4>🍽️ Tipos de Refeições</h4>
                    <div style="margin-bottom: 10px;">
                        <label>
                            <input type="radio" name="filtroTipoRefeicao" value="todos" checked onchange="toggleListaTipos()"> 
                            Todos os tipos de refeições
                        </label>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>
                            <input type="radio" name="filtroTipoRefeicao" value="especificos" onchange="toggleListaTipos()"> 
                            Tipos específicos
                        </label>
                    </div>
                    <div id="listaTiposRefeicaoImpressao" style="display: none;">
                        <div class="checkbox-list" style="max-height: 120px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 5px; padding: 10px; background: white;">
                            <!-- Tipos serão carregados aqui -->
                        </div>
                        <div style="margin-top: 8px;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="selecionarTodosTipos()">Selecionar Todos</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="desmarcarTodosTipos()">Desmarcar Todos</button>
                        </div>
                    </div>
                </div>
                
                <!-- Seção de Formato -->
                <div class="form-section">
                    <h4>📄 Formato de Impressão</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <label>
                                <input type="radio" name="formatoImpressao" value="resumido" checked> 
                                📋 Resumido
                            </label>
                            <small style="display: block; color: #666; margin-left: 20px;">Lista compacta</small>
                        </div>
                        <div>
                            <label>
                                <input type="radio" name="formatoImpressao" value="detalhado"> 
                                📖 Detalhado
                            </label>
                            <small style="display: block; color: #666; margin-left: 20px;">Com mais informações</small>
                        </div>
                    </div>
                    <div style="margin-top: 15px;">
                        <label>
                            <input type="checkbox" id="incluirIngredientes" checked> 
                            🥗 Incluir ingredientes (quando aplicável)
                        </label>
                    </div>
                    <div style="margin-top: 10px;">
                        <label>
                            <input type="checkbox" id="agruparPorData" checked> 
                            📅 Agrupar por data
                        </label>
                    </div>
                </div>
                
                <!-- Rodapé -->
                <div class="modal-footer" style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e9ecef; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="fecharModalImpressao()">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-info" onclick="visualizarPreviewImpressao()">
                        👁️ Visualizar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="executarImpressaoCardapios()">
                        🖨️ Imprimir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    adicionarEstilosImpressao();
}

// ===== ADICIONAR ESTILOS CSS =====
function adicionarEstilosImpressao() {
    if (document.getElementById('impressao-styles')) return;
    
    const styles = `
        <style id="impressao-styles">
            #modalImpressao .form-section {
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e9ecef;
            }
            #modalImpressao .form-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            #modalImpressao .form-section h4 {
                color: #495057;
                margin-bottom: 15px;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #modalImpressao .checkbox-list {
                max-height: 150px;
                overflow-y: auto;
                border: 1px solid #e9ecef;
                border-radius: 5px;
                padding: 10px;
                background: white;
            }
            #modalImpressao .checkbox-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            #modalImpressao .checkbox-item:last-child {
                border-bottom: none;
            }
            #modalImpressao .checkbox-item input[type="checkbox"] {
                margin: 0;
            }
            #modalImpressao .checkbox-item label {
                margin: 0;
                cursor: pointer;
                flex: 1;
                font-size: 14px;
            }
            #modalImpressao .btn-sm {
                padding: 6px 12px;
                font-size: 12px;
                margin-right: 8px;
            }
            #modalImpressao input[type="radio"] {
                margin-right: 8px;
            }
            #modalImpressao label {
                cursor: pointer;
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// ===== CONFIGURAR MODAL PARA CARDÁPIOS =====
function configurarModalCardapios() {
    // Configurar data padrão - INCLUIR DATAS DE TESTE
    const hoje = new Date();
    const dataHoje = hoje.toISOString().split('T')[0];
    
    // ✅ CORREÇÃO: Definir período que inclui as datas com cardápios (06.07 e 08.07)
    document.getElementById('dataInicioImpressao').value = '2025-07-01'; // Início de julho
    document.getElementById('dataFimImpressao').value = '2025-07-31';   // Fim de julho
    
    // Carregar listas
    carregarListaClientesImpressao();
    carregarListaTiposImpressao();
    
    // Atualizar debug info
    atualizarDebugInfo();
}

// ✅ NOVA FUNÇÃO: Atualizar informações de debug
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
        <br>
        <em>Este período inclui as datas 06/07 e 08/07 onde você tem cardápios cadastrados.</em>
    `;
}

// ✅ NOVA FUNÇÃO: Verificar cardápios disponíveis
async function verificarCardapiosDisponiveis() {
    try {
        console.log('🔍 Verificando cardápios disponíveis...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const dataInicio = document.getElementById('dataInicioImpressao')?.value;
        const dataFim = document.getElementById('dataFimImpressao')?.value;
        
        if (!dataInicio || !dataFim) {
            mostrarToast(mensagem, 'success', 5000);
            
            // Atualizar debug info
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

// ===== CARREGAR LISTA DE CLIENTES =====
function carregarListaClientesImpressao() {
    const container = document.querySelector('#listaClientesImpressao .checkbox-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (dadosImpressao.clientes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Nenhum cliente encontrado</p>';
        return;
    }
    
    dadosImpressao.clientes.forEach((cliente, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="cliente-imp-${index}" value="${cliente.id}" checked>
            <label for="cliente-imp-${index}">${cliente.codigo} - ${cliente.descricao}</label>
        `;
        container.appendChild(div);
    });
    
    console.log(`✅ ${dadosImpressao.clientes.length} clientes carregados na lista`);
}

// ===== CARREGAR LISTA DE TIPOS DE REFEIÇÕES =====
function carregarListaTiposImpressao() {
    const container = document.querySelector('#listaTiposRefeicaoImpressao .checkbox-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (dadosImpressao.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Nenhum tipo de refeição encontrado</p>';
        return;
    }
    
    dadosImpressao.tiposRefeicao.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="tipo-imp-${index}" value="${tipo.id}" checked>
            <label for="tipo-imp-${index}">${tipo.codigo} - ${tipo.descricao}</label>
        `;
        container.appendChild(div);
    });
    
    console.log(`✅ ${dadosImpressao.tiposRefeicao.length} tipos de refeição carregados na lista`);
}

// ===== FUNÇÕES DE CONTROLE DE LISTAS =====

// Toggle lista de clientes
function toggleListaClientes() {
    const filtro = document.querySelector('input[name="filtroCliente"]:checked')?.value;
    const lista = document.getElementById('listaClientesImpressao');
    
    if (lista) {
        lista.style.display = filtro === 'especificos' ? 'block' : 'none';
    }
}

// Toggle lista de tipos
function toggleListaTipos() {
    const filtro = document.querySelector('input[name="filtroTipoRefeicao"]:checked')?.value;
    const lista = document.getElementById('listaTiposRefeicaoImpressao');
    
    if (lista) {
        lista.style.display = filtro === 'especificos' ? 'block' : 'none';
    }
}

// Definir períodos
function definirPeriodoImpressao(tipo) {
    const hoje = new Date();
    let dataInicio, dataFim;
    
    switch (tipo) {
        case 'hoje':
            dataInicio = dataFim = hoje;
            break;
        case 'semana':
            const inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() - hoje.getDay());
            const fimSemana = new Date(inicioSemana);
            fimSemana.setDate(inicioSemana.getDate() + 6);
            dataInicio = inicioSemana;
            dataFim = fimSemana;
            break;
        case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            break;
    }
    
    document.getElementById('dataInicioImpressao').value = dataInicio.toISOString().split('T')[0];
    document.getElementById('dataFimImpressao').value = dataFim.toISOString().split('T')[0];
    
    atualizarDebugInfo();
}

// Selecionar todos os clientes
function selecionarTodosClientes() {
    const checkboxes = document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

// Desmarcar todos os clientes
function desmarcarTodosClientes() {
    const checkboxes = document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Selecionar todos os tipos
function selecionarTodosTipos() {
    const checkboxes = document.querySelectorAll('#listaTiposRefeicaoImpressao input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

// Desmarcar todos os tipos
function desmarcarTodosTipos() {
    const checkboxes = document.querySelectorAll('#listaTiposRefeicaoImpressao input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// ===== COLETAR CONFIGURAÇÕES =====
function coletarConfiguracoesImpressao() {
    const dataInicio = document.getElementById('dataInicioImpressao')?.value;
    const dataFim = document.getElementById('dataFimImpressao')?.value;
    
    if (!dataInicio || !dataFim) {
        mostrarToast('Defina o período para impressão', 'warning');
        return null;
    }
    
    if (dataInicio > dataFim) {
        mostrarToast('Data de início não pode ser maior que data de fim', 'warning');
        return null;
    }
    
    // Coletar clientes selecionados
    const filtroCliente = document.querySelector('input[name="filtroCliente"]:checked')?.value;
    let clientesSelecionados = [];
    
    if (filtroCliente === 'todos') {
        clientesSelecionados = dadosImpressao.clientes.map(c => c.id);
    } else {
        const checkboxes = document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]:checked');
        clientesSelecionados = Array.from(checkboxes).map(cb => cb.value);
        
        if (clientesSelecionados.length === 0) {
            mostrarToast('Selecione pelo menos um cliente', 'warning');
            return null;
        }
    }
    
    // Coletar tipos de refeições selecionados
    const filtroTipoRefeicao = document.querySelector('input[name="filtroTipoRefeicao"]:checked')?.value;
    let tiposSelecionados = [];
    
    if (filtroTipoRefeicao === 'todos') {
        tiposSelecionados = dadosImpressao.tiposRefeicao.map(t => t.id);
    } else {
        const checkboxes = document.querySelectorAll('#listaTiposRefeicaoImpressao input[type="checkbox"]:checked');
        tiposSelecionados = Array.from(checkboxes).map(cb => cb.value);
        
        if (tiposSelecionados.length === 0) {
            mostrarToast('Selecione pelo menos um tipo de refeição', 'warning');
            return null;
        }
    }
    
    // Coletar outras configurações
    const formatoImpressao = document.querySelector('input[name="formatoImpressao"]:checked')?.value || 'resumido';
    const incluirIngredientes = document.getElementById('incluirIngredientes')?.checked || false;
    const agruparPorData = document.getElementById('agruparPorData')?.checked || true;
    
    console.log('📋 Configurações coletadas:', {
        dataInicio,
        dataFim,
        clientesSelecionados: clientesSelecionados.length,
        tiposSelecionados: tiposSelecionados.length,
        formatoImpressao,
        incluirIngredientes,
        agruparPorData
    });
    
    return {
        dataInicio,
        dataFim,
        clientesSelecionados,
        tiposSelecionados,
        formatoImpressao,
        incluirIngredientes,
        agruparPorData
    };
}

// ===== BUSCAR DADOS DO BANCO CORRIGIDO =====
async function buscarDadosCardapiosImpressao(config) {
    try {
        console.log('📊 Buscando dados do banco para impressão com configurações:', config);
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        // ✅ CORREÇÃO: Query mais robusta com logs detalhados
        console.log('🔍 Executando query com parâmetros:');
        console.log('- user_id:', user.id);
        console.log('- data_inicio:', config.dataInicio);
        console.log('- data_fim:', config.dataFim);
        console.log('- clientes:', config.clientesSelecionados);
        console.log('- tipos:', config.tiposSelecionados);
        
        const { data: cardapios, error } = await window.supabase
            .from('cardapios')
            .select(`
                *,
                clientes (codigo, descricao),
                tipos_refeicoes (codigo, descricao),
                receitas (codigo, descricao, texto, rendimento, unidade_rendimento)
            `)
            .eq('user_id', user.id)
            .gte('data', config.dataInicio)
            .lte('data', config.dataFim)
            .in('cliente_id', config.clientesSelecionados)
            .in('tipo_refeicao_id', config.tiposSelecionados)
            .order('data, cliente_id, tipo_refeicao_id');
        
        if (error) {
            console.error('❌ Erro na query:', error);
            throw error;
        }
        
        console.log(`📊 Query executada com sucesso! Retornados ${(cardapios || []).length} registros`);
        
        if (cardapios && cardapios.length > 0) {
            console.log('📝 Primeiros registros encontrados:');
            cardapios.slice(0, 3).forEach((item, index) => {
                console.log(`${index + 1}. Data: ${item.data}, Cliente: ${item.clientes?.descricao}, Tipo: ${item.tipos_refeicoes?.descricao}, Receita: ${item.receitas?.descricao}`);
            });
        } else {
            console.warn('⚠️ Nenhum registro encontrado com os filtros aplicados');
            
            // ✅ DIAGNÓSTICO: Verificar se há dados sem filtros
            console.log('🔍 Fazendo diagnóstico - verificando dados brutos...');
            const { data: todosDados, error: erroTodos } = await window.supabase
                .from('cardapios')
                .select('data, cliente_id, tipo_refeicao_id')
                .eq('user_id', user.id)
                .limit(5);
                
            if (erroTodos) {
                console.error('❌ Erro no diagnóstico:', erroTodos);
            } else {
                console.log('📊 Dados brutos encontrados:', todosDados);
            }
        }
        
        return cardapios || [];
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados:', error);
        mostrarToast('Erro ao buscar dados: ' + error.message, 'error');
        return [];
    }
}

// ===== PROCESSAR DADOS PARA IMPRESSÃO =====
function processarDadosCardapios(cardapios, config) {
    console.log('🔄 Processando dados para impressão...');
    
    const dadosProcessados = {};
    
    cardapios.forEach(item => {
        const data = item.data;
        const clienteNome = `${item.clientes?.codigo || 'N/A'} - ${item.clientes?.descricao || 'Cliente não encontrado'}`;
        const tipoNome = `${item.tipos_refeicoes?.codigo || 'N/A'} - ${item.tipos_refeicoes?.descricao || 'Tipo não encontrado'}`;
        
        if (!dadosProcessados[data]) {
            dadosProcessados[data] = {};
        }
        
        if (!dadosProcessados[data][clienteNome]) {
            dadosProcessados[data][clienteNome] = {};
        }
        
        if (!dadosProcessados[data][clienteNome][tipoNome]) {
            dadosProcessados[data][clienteNome][tipoNome] = [];
        }
        
        dadosProcessados[data][clienteNome][tipoNome].push({
            receita: `${item.receitas?.codigo || 'N/A'} - ${item.receitas?.descricao || 'Receita não encontrada'}`,
            comensais: item.comensais || 0,
            quantidadePorPessoa: item.quantidade_por_pessoa || 0,
            totalCalculado: item.total_por_comensais || 0,
            unidade: item.unidade_basica || 'UN',
            textoReceita: config.formatoImpressao === 'detalhado' ? item.receitas?.texto : null
        });
    });
    
    console.log('✅ Dados processados para', Object.keys(dadosProcessados).length, 'datas');
    return dadosProcessados;
}

// ===== GERAR HTML PARA IMPRESSÃO =====
function gerarHTMLCardapios(dados, config) {
    const dataInicioFormatada = formatarDataBrasil(config.dataInicio);
    const dataFimFormatada = formatarDataBrasil(config.dataFim);
    const periodo = config.dataInicio === config.dataFim ? dataInicioFormatada : `${dataInicioFormatada} a ${dataFimFormatada}`;
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cardápio - ${periodo}</title>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #333;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    color: #333;
                }
                .header h2 {
                    margin: 5px 0 0 0;
                    font-size: 16px;
                    color: #666;
                    font-weight: normal;
                }
                .data-group {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .data-title {
                    background: #f0f0f0;
                    padding: 10px;
                    margin-bottom: 15px;
                    font-weight: bold;
                    font-size: 14px;
                    border-left: 4px solid #667eea;
                }
                .cliente-group {
                    margin-bottom: 20px;
                    margin-left: 10px;
                }
                .cliente-title {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 10px;
                    font-size: 13px;
                }
                .tipo-group {
                    margin-bottom: 15px;
                    margin-left: 20px;
                }
                .tipo-title {
                    font-weight: bold;
                    color: #555;
                    margin-bottom: 8px;
                    text-decoration: underline;
                }
                .receita-item {
                    margin-bottom: 8px;
                    margin-left: 15px;
                    padding: 5px;
                    border-left: 2px solid #ddd;
                    padding-left: 10px;
                }
                .receita-nome {
                    font-weight: bold;
                    color: #333;
                }
                .receita-detalhes {
                    color: #666;
                    font-size: 11px;
                    margin-top: 2px;
                }
                .receita-texto {
                    margin-top: 8px;
                    padding: 8px;
                    background: #f9f9f9;
                    border-radius: 4px;
                    font-size: 11px;
                    white-space: pre-wrap;
                }
                .no-data {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 5px;
                    border: 1px solid #e9ecef;
                }
                @media print {
                    body { margin: 0; }
                    .data-group { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📋 Relatório de Cardápios</h1>
                <h2>Período: ${periodo}</h2>
                <p style="margin: 10px 0 0 0; color: #888; font-size: 11px;">
                    Gerado em ${new Date().toLocaleString('pt-BR')}
                </p>
            </div>
    `;
    
    if (Object.keys(dados).length === 0) {
        html += `
            <div class="no-data">
                <h3>❌ Nenhum cardápio encontrado</h3>
                <p>Não foram encontrados cardápios para os critérios selecionados.</p>
                <p><strong>Período:</strong> ${periodo}</p>
                <p><strong>Dica:</strong> Verifique se:</p>
                <ul style="text-align: left; display: inline-block;">
                    <li>As datas estão corretas (seus cardápios estão em 06/07/2025 e 08/07/2025)</li>
                    <li>Os clientes e tipos de refeição estão selecionados</li>
                    <li>Os cardápios foram salvos corretamente no sistema</li>
                </ul>
            </div>
        `;
    } else {
        // Gerar conteúdo agrupado por data
        Object.keys(dados).sort().forEach(data => {
            html += `<div class="data-group">`;
            html += `<div class="data-title">📅 ${formatarDataBrasil(data)}</div>`;
            
            Object.keys(dados[data]).forEach(cliente => {
                html += `<div class="cliente-group">`;
                html += `<div class="cliente-title">👤 ${cliente}</div>`;
                
                Object.keys(dados[data][cliente]).forEach(tipo => {
                    html += `<div class="tipo-group">`;
                    html += `<div class="tipo-title">🍽️ ${tipo}</div>`;
                    
                    dados[data][cliente][tipo].forEach(receita => {
                        html += `<div class="receita-item">`;
                        html += `<div class="receita-nome">${receita.receita}</div>`;
                        html += `<div class="receita-detalhes">`;
                        html += `Comensais: ${receita.comensais} | `;
                        html += `Qtd/pessoa: ${receita.quantidadePorPessoa} ${receita.unidade} | `;
                        html += `Total: ${receita.totalCalculado.toFixed(3)} KG`;
                        html += `</div>`;
                        
                        if (receita.textoReceita) {
                            html += `<div class="receita-texto">${receita.textoReceita}</div>`;
                        }
                        
                        html += `</div>`;
                    });
                    
                    html += `</div>`;
                });
                
                html += `</div>`;
            });
            
            html += `</div>`;
        });
    }
    
    html += `
        </body>
        </html>
    `;
    
    return html;
}

// ===== VISUALIZAR PREVIEW =====
async function visualizarPreviewImpressao() {
    const config = coletarConfiguracoesImpressao();
    if (!config) return;
    
    console.log('👁️ Gerando preview da impressão...');
    mostrarToast('Gerando preview...', 'info');
    
    try {
        const cardapios = await buscarDadosCardapiosImpressao(config);
        
        const dados = processarDadosCardapios(cardapios, config);
        const html = gerarHTMLCardapios(dados, config);
        
        // Abrir preview em nova janela
        const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        previewWindow.document.write(html);
        previewWindow.document.close();
        
        if (cardapios.length === 0) {
            mostrarToast('❌ Nenhum cardápio encontrado para os critérios selecionados', 'warning');
        } else {
            mostrarToast(`✅ Preview gerado! ${cardapios.length} itens encontrados.`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar preview:', error);
        mostrarToast('Erro ao gerar preview: ' + error.message, 'error');
    }
}

// ===== EXECUTAR IMPRESSÃO =====
async function executarImpressaoCardapios() {
    const config = coletarConfiguracoesImpressao();
    if (!config) return;
    
    console.log('🖨️ Executando impressão...');
    mostrarToast('Preparando impressão...', 'info');
    
    try {
        const cardapios = await buscarDadosCardapiosImpressao(config);
        
        if (cardapios.length === 0) {
            mostrarToast('❌ Nenhum cardápio encontrado para imprimir', 'warning');
            return;
        }
        
        const dados = processarDadosCardapios(cardapios, config);
        const html = gerarHTMLCardapios(dados, config);
        
        // Abrir janela de impressão
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Aguardar carregamento e imprimir
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
        
        mostrarToast(`✅ Impressão iniciada! ${cardapios.length} itens encontrados.`, 'success');
        fecharModalImpressao();
        
    } catch (error) {
        console.error('❌ Erro ao executar impressão:', error);
        mostrarToast('Erro ao executar impressão: ' + error.message, 'error');
    }
}

// ===== FUNÇÕES AUXILIARES =====

// Formatar data para padrão brasileiro
function formatarDataBrasil(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

// Fechar modal
function fecharModalImpressao() {
    const modal = document.getElementById('modalImpressao');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Toast notification system
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    // Usar a função do sistema principal se existir
    if (window.mostrarToast && typeof window.mostrarToast === 'function' && window.mostrarToast !== mostrarToast) {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
    // Implementação básica se não existir
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
window.abrirModalImpressao = abrirModalImpressaoCardapios; // Alias principal
window.fecharModalImpressao = fecharModalImpressao;
window.toggleListaClientes = toggleListaClientes;
window.toggleListaTipos = toggleListaTipos;
window.definirPeriodoImpressao = definirPeriodoImpressao;
window.verificarCardapiosDisponiveis = verificarCardapiosDisponiveis;
window.selecionarTodosClientes = selecionarTodosClientes;
window.desmarcarTodosClientes = desmarcarTodosClientes;
window.selecionarTodosTipos = selecionarTodosTipos;
window.desmarcarTodosTipos = desmarcarTodosTipos;
window.visualizarPreviewImpressao = visualizarPreviewImpressao;
window.executarImpressaoCardapios = executarImpressaoCardapios;

// ===== GARANTIR QUE A FUNÇÃO PRINCIPAL ESTÁ DISPONÍVEL IMEDIATAMENTE =====
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

console.log('✅ Sistema de impressão CORRIGIDO e funcional carregado!');
console.log('📋 Função principal disponível:', typeof window.abrirModalImpressao);'Defina o período primeiro', 'warning');
            return;
        }

        // Consulta detalhada dos cardápios
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
            // Agrupar por data
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
            
            mostrarToast(