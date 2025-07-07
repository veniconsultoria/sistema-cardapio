// cardapio.js - Sistema de Cardápios TOTALMENTE CORRIGIDO COM CALENDÁRIO

console.log('📁 Carregando cardapio.js - VERSÃO CORRIGIDA COM CALENDÁRIO...');

// ===== VARIÁVEIS GLOBAIS =====
let clientesCarregados = [];
let receitasCarregadas = [];
let tiposRefeicaoCarregados = [];
let cardapiosCarregados = {};
let clienteAtualCardapio = null;
let tipoRefeicaoAtualCardapio = null;
let dataAtualCardapio = null;
let cardapioInicializado = false;

// Receitas temporárias para o tipo selecionado
let receitasTemporarias = {};

// ===== FUNÇÕES PRINCIPAIS =====

// Aguardar Supabase estar disponível
function aguardarSupabaseCardapio(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para cardapio.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseCardapio(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        mostrarToast('Erro: Não foi possível conectar com o Supabase.', 'error');
    }
}

// Verificar autenticação
async function verificarAutenticacao() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            mostrarToast('Você precisa estar logado para acessar esta página.', 'error');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return false;
    }
}

// ===== INICIALIZAR CARDÁPIO PRINCIPAL =====
async function inicializarCardapio() {
    if (cardapioInicializado) {
        console.log('⚠️ Cardápio já inicializado');
        return;
    }

    console.log('🚀 Inicializando cardápio...');
    
    aguardarSupabaseCardapio(async () => {
        try {
            if (!await verificarAutenticacao()) {
                return;
            }
            
            console.log('📥 Carregando dados do cardápio...');
            await carregarDadosIniciais();
            
            // ✅ CORREÇÃO PRINCIPAL: Carregar clientes primeiro
            await carregarClientesCardapio();
            
            configurarEventos();
            
            // ✅ CORREÇÃO: Inicializar calendário após carregar dados
            await inicializarCalendarioIntegrado();
            
            // Configurar data atual
            const hoje = new Date();
            const hojeStr = hoje.toISOString().split('T')[0];
            const inputData = document.getElementById('dataCardapio');
            if (inputData) {
                inputData.value = hojeStr;
                dataAtualCardapio = hojeStr;
            }
            
            atualizarIndicadorData();
            
            cardapioInicializado = true;
            console.log('✅ Cardápio inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar cardápio:', error);
            mostrarToast('Erro ao carregar cardápio: ' + error.message, 'error');
        }
    });
}

// ===== INICIALIZAR CALENDÁRIO INTEGRADO =====
async function inicializarCalendarioIntegrado() {
    console.log('📅 Inicializando calendário integrado...');
    
    try {
        // Aguardar calendário estar disponível
        let tentativas = 0;
        while (typeof inicializarCalendarioSistema !== 'function' && tentativas < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            tentativas++;
        }
        
        if (typeof inicializarCalendarioSistema === 'function') {
            console.log('📅 Sistema de calendário encontrado, inicializando...');
            const sucesso = inicializarCalendarioSistema();
            
            if (sucesso) {
                console.log('✅ Calendário integrado com sucesso');
                
                // Forçar atualização após carregar dados
                setTimeout(() => {
                    if (typeof forcarAtualizacaoCalendario === 'function') {
                        forcarAtualizacaoCalendario();
                    }
                }, 500);
            } else {
                console.warn('⚠️ Falha na inicialização do calendário');
            }
        } else {
            console.warn('⚠️ Sistema de calendário não disponível');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar calendário integrado:', error);
    }
}

// Carregar dados iniciais
async function carregarDadosIniciais() {
    try {
        console.log('📥 Carregando dados iniciais...');
        await carregarClientes();
        await carregarReceitas();
        await carregarTiposRefeicao();
        await carregarCardapios();
        console.log('✅ Dados iniciais carregados');
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        throw error;
    }
}

// ===== CARREGAR CLIENTES CORRIGIDO =====
async function carregarClientes() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log('👥 Carregando clientes...');

        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) throw clientesError;

        if (!clientesData || clientesData.length === 0) {
            console.log('⚠️ Nenhum cliente encontrado');
            clientesCarregados = [];
            return;
        }

        console.log(`👥 ${clientesData.length} clientes encontrados`);

        const clientesComTipos = [];
        
        for (const cliente of clientesData) {
            try {
                const { data: tiposData, error: tiposError } = await window.supabase
                    .from('cliente_tipos_refeicao')
                    .select(`
                        tipos_refeicoes (
                            id,
                            codigo,
                            descricao
                        )
                    `)
                    .eq('cliente_id', cliente.id);

                if (tiposError) {
                    console.warn(`⚠️ Erro ao carregar tipos do cliente ${cliente.descricao}:`, tiposError);
                    clientesComTipos.push({
                        ...cliente,
                        tiposRefeicao: []
                    });
                } else {
                    const tiposRefeicao = (tiposData || [])
                        .map(rel => rel.tipos_refeicoes)
                        .filter(tipo => tipo !== null);
                    
                    clientesComTipos.push({
                        ...cliente,
                        tiposRefeicao: tiposRefeicao
                    });
                    
                    console.log(`✅ Cliente ${cliente.descricao}: ${tiposRefeicao.length} tipos vinculados`);
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao processar cliente ${cliente.descricao}:`, error);
                clientesComTipos.push({
                    ...cliente,
                    tiposRefeicao: []
                });
            }
        }

        clientesCarregados = clientesComTipos;
        console.log(`✅ ${clientesCarregados.length} clientes carregados com tipos`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        clientesCarregados = [];
        throw error;
    }
}

// ===== CARREGAR CLIENTES NO SELECT =====
function carregarClientesCardapio() {
    console.log('🔄 Carregando clientes no select...');
    
    const select = document.getElementById('clienteCardapio');
    if (!select) {
        console.warn('⚠️ Select de clientes não encontrado');
        return;
    }
    
    // Limpar options existentes
    select.innerHTML = '';
    
    // Option padrão
    const optionPadrao = document.createElement('option');
    optionPadrao.value = '';
    optionPadrao.textContent = 'Selecione um cliente';
    select.appendChild(optionPadrao);
    
    if (clientesCarregados.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '❌ Nenhum cliente cadastrado';
        option.disabled = true;
        select.appendChild(option);
        console.warn('⚠️ Nenhum cliente disponível para carregar');
        return;
    }

    // Adicionar clientes
    clientesCarregados.forEach((cliente, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = `${cliente.codigo} - ${cliente.descricao}`;
        
        if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
            option.textContent += ' ⚠️';
            option.title = 'Cliente sem tipos de refeição cadastrados';
        }
        
        select.appendChild(option);
    });
    
    console.log(`✅ ${clientesCarregados.length} clientes carregados no select`);
}

// Carregar receitas com ingredientes
async function carregarReceitas() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('receitas')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        receitasCarregadas = (data || []).map(receita => ({
            ...receita,
            ingredientes: []
        }));
        
        // Tentar carregar ingredientes
        for (const receita of receitasCarregadas) {
            try {
                const { data: ingredientesData } = await window.supabase
                    .from('ingredientes')
                    .select(`
                        *,
                        produtos (codigo, descricao, preco)
                    `)
                    .eq('receita_id', receita.id);

                if (ingredientesData) {
                    receita.ingredientes = ingredientesData;
                }
            } catch (error) {
                console.warn('Erro ao carregar ingredientes da receita:', receita.codigo);
            }
        }
        
        console.log(`✅ ${receitasCarregadas.length} receitas carregadas`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error);
        receitasCarregadas = [];
    }
}

// Carregar tipos de refeição
async function carregarTiposRefeicao() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        tiposRefeicaoCarregados = data || [];
        console.log(`✅ ${tiposRefeicaoCarregados.length} tipos de refeição carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar tipos de refeição:', error);
        tiposRefeicaoCarregados = [];
    }
}

// ===== CARREGAR CARDÁPIOS CORRIGIDO =====
async function carregarCardapios() {
    try {
        console.log('📥 Carregando cardápios...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('cardapios')
            .select(`
                *,
                clientes (codigo, descricao),
                tipos_refeicoes (codigo, descricao),
                receitas (codigo, descricao, rendimento, unidade_rendimento)
            `)
            .eq('user_id', user.id)
            .order('data, cliente_id, tipo_refeicao_id');

        if (error) {
            console.warn('⚠️ Erro ao carregar cardápios:', error);
            cardapiosCarregados = {};
            return;
        }

        // Organizar por data
        cardapiosCarregados = {};
        
        (data || []).forEach(item => {
            const data = item.data;
            const clienteCodigo = item.clientes?.codigo;
            const tipoCodigo = item.tipos_refeicoes?.codigo;
            
            if (!data || !clienteCodigo || !tipoCodigo) return;
            
            if (!cardapiosCarregados[data]) {
                cardapiosCarregados[data] = {};
            }
            
            if (!cardapiosCarregados[data][clienteCodigo]) {
                cardapiosCarregados[data][clienteCodigo] = {};
            }
            
            if (!cardapiosCarregados[data][clienteCodigo][tipoCodigo]) {
                cardapiosCarregados[data][clienteCodigo][tipoCodigo] = [];
            }
            
            cardapiosCarregados[data][clienteCodigo][tipoCodigo].push({
                id: item.id,
                receita_id: item.receita_id,
                codigo: item.receitas?.codigo || 'N/A',
                descricao: item.receitas?.descricao || 'Receita não encontrada',
                comensais: item.comensais,
                quantidadePorPessoa: item.quantidade_por_pessoa,
                totalPorComensais: item.total_por_comensais,
                unidadeBasica: item.unidade_basica,
                alterada: item.alterada || false
            });
        });
        
        // ✅ CORREÇÃO: Disponibilizar globalmente para o calendário
        window.cardapiosCarregados = cardapiosCarregados;
        
        console.log('✅ Cardápios carregados e disponibilizados globalmente');
        
    } catch (error) {
        console.error('❌ Erro ao carregar cardápios:', error);
        cardapiosCarregados = {};
        window.cardapiosCarregados = {};
    }
}

function configurarEventos() {
    console.log('⚙️ Configurando eventos...');
    
    const selectCliente = document.getElementById('clienteCardapio');
    if (selectCliente) {
        selectCliente.removeEventListener('change', carregarTiposRefeicaoCliente);
        selectCliente.addEventListener('change', carregarTiposRefeicaoCliente);
    }
    
    const inputData = document.getElementById('dataCardapio');
    if (inputData) {
        inputData.removeEventListener('change', carregarCardapioData);
        inputData.addEventListener('change', carregarCardapioData);
    }
}

function carregarCardapioData() {
    const dataInput = document.getElementById('dataCardapio');
    if (!dataInput) return;
    
    const novaData = dataInput.value;
    dataAtualCardapio = novaData;
    
    console.log(`📅 Data alterada para: ${novaData}`);
    
    atualizarIndicadorData();
    
    // ✅ CORREÇÃO: Atualizar calendário se disponível
    if (typeof forcarAtualizacaoCalendario === 'function') {
        forcarAtualizacaoCalendario();
    }
    
    carregarCardapioParaDataAtual();
}

function atualizarIndicadorData() {
    const dataInput = document.getElementById('dataCardapio');
    if (!dataInput) return;
    
    const data = new Date(dataInput.value + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    dataInput.classList.remove('data-hoje', 'data-passada', 'data-futura');
    
    if (data.getTime() === hoje.getTime()) {
        dataInput.classList.add('data-hoje');
        dataInput.title = 'Cardápio de hoje';
    } else if (data < hoje) {
        dataInput.classList.add('data-passada');
        dataInput.title = 'Cardápio de data passada';
    } else {
        dataInput.classList.add('data-futura');
        dataInput.title = 'Cardápio de data futura';
    }
}

function carregarTiposRefeicaoCliente() {
    const clienteIndex = document.getElementById('clienteCardapio').value;
    const container = document.getElementById('tiposRefeicaoCardapio');
    
    if (!container) return;
    container.innerHTML = '';

    if (clienteIndex === '') {
        clienteAtualCardapio = null;
        return;
    }

    const cliente = clientesCarregados[parseInt(clienteIndex)];
    if (!cliente) return;
    
    clienteAtualCardapio = cliente;

    if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Cliente não possui tipos de refeição cadastrados</p>';
        return;
    }

    // Criar seções expansíveis CORRIGIDAS para cada tipo de refeição
    cliente.tiposRefeicao.forEach(tipo => {
        const expandable = document.createElement('div');
        expandable.className = 'expandable';
        expandable.innerHTML = `
            <div class="expandable-header" onclick="toggleExpandable(this)">
                <span>${tipo.descricao}</span>
                <span>▼</span>
            </div>
            <div class="expandable-content">
                <!-- ✅ CORREÇÃO 1: Seção de comensais corrigida -->
                <div class="comensais-section">
                    <label>Comensais para ${tipo.descricao}:</label>
                    <input type="number" 
                           id="comensais-${tipo.codigo}" 
                           class="comensais-input" 
                           min="1" 
                           max="99999" 
                           placeholder="0"
                           value="${getComensaisFromTotal() || ''}">
                    <!-- ✅ CORREÇÃO PRINCIPAL: Botão que atualiza E calcula -->
                    <button class="btn btn-primary compact-btn" onclick="atualizarECalcularTipoFinal('${tipo.codigo}')">
                        📝 Atualizar e Calcular
                    </button>
                </div>

                <!-- ✅ BOTÃO DE AÇÃO CORRIGIDO (apenas adicionar receitas) -->
                <div class="actions" style="margin: 15px 0; padding: 15px 0; border-top: 1px solid #e9ecef;">
                    <button class="btn btn-primary compact-btn" onclick="abrirModalReceitasTipo('${tipo.codigo}')">
                        ➕ Adicionar Receitas
                    </button>
                </div>

                <!-- ✅ CORREÇÃO 3: Cabeçalho da tabela corrigido -->
                <div class="receitas-header visible">
                    <div class="receitas-header-grid" style="display: grid; grid-template-columns: 2fr 120px 150px 150px 80px; gap: 10px; font-weight: 600; color: #495057; font-size: 13px; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                        <div style="text-align: left;">Receita</div>
                        <div style="text-align: center;">Comensais</div>
                        <div style="text-align: center;">Rend. Receita</div>
                        <div style="text-align: center;">Total</div>
                        <div style="text-align: center;">Ações</div>
                    </div>
                </div>

                <!-- Container das receitas -->
                <div id="receitas-list-${tipo.codigo}" class="receitas-container"></div>
            </div>
        `;
        container.appendChild(expandable);
    });
    
    carregarCardapioParaDataAtual();
}

function getComensaisFromTotal() {
    const totalInput = document.getElementById('totalComensais');
    return totalInput ? totalInput.value : '';
}

function carregarCardapioParaDataAtual() {
    if (!dataAtualCardapio || !clienteAtualCardapio) {
        console.log('⚠️ Data ou cliente não definidos');
        return;
    }
    
    console.log(`📅 Carregando cardápio para data: ${dataAtualCardapio}`);
    
    // Limpar receitas temporárias
    receitasTemporarias = {};
    
    const cardapioData = cardapiosCarregados[dataAtualCardapio]?.[clienteAtualCardapio.codigo];
    
    if (cardapioData) {
        console.log('✅ Cardápio encontrado, carregando...');
        
        Object.keys(cardapioData).forEach(tipoCodigo => {
            const receitasTipo = cardapioData[tipoCodigo];
            
            // Armazenar em receitas temporárias
            receitasTemporarias[tipoCodigo] = [...receitasTipo];
            
            // Atualizar interface
            const container = document.getElementById(`receitas-list-${tipoCodigo}`);
            if (container) {
                container.innerHTML = '';
                receitasTipo.forEach(receita => {
                    adicionarReceitaNaLista(tipoCodigo, receita);
                });
            }
            
            // Atualizar comensais
            const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
            if (comensaisInput && receitasTipo.length > 0) {
                comensaisInput.value = receitasTipo[0].comensais || '';
            }
        });
    } else {
        console.log('⚠️ Nenhum cardápio encontrado para esta data');
    }
}

// ===== FUNÇÕES DE RECEITAS =====

function abrirModalReceitasTipo(tipoCodigo) {
    console.log('🍽️ Abrindo modal de receitas para tipo:', tipoCodigo);
    
    const tipo = tiposRefeicaoCarregados.find(t => t.codigo === tipoCodigo);
    if (!tipo) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }
    
    tipoRefeicaoAtualCardapio = tipo;
    
    // Criar modal se não existir
    if (!document.getElementById('modalReceitas')) {
        criarModalReceitas();
    }
    
    // Carregar receitas no modal
    carregarReceitasModal();
    
    // Mostrar modal
    document.getElementById('modalReceitas').style.display = 'block';
}

// Criar modal de receitas
function criarModalReceitas() {
    const modal = document.createElement('div');
    modal.id = 'modalReceitas';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
                <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                    🍽️ Selecionar Receitas
                    <span class="close" onclick="fecharModal('modalReceitas')" style="margin-left: auto; cursor: pointer; font-size: 28px; font-weight: bold;">&times;</span>
                </h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Escolha as receitas para este tipo de refeição</p>
            </div>
            
            <div class="search-box">
                <input type="text" id="searchReceitas" placeholder="🔍 Pesquisar por código ou nome da receita..." onkeyup="filtrarReceitas()" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 14px;">
            </div>
            
            <div id="listaReceitasModal" style="max-height: 400px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 8px; margin: 15px 0;">
                <!-- Receitas serão carregadas aqui -->
            </div>
            
            <div class="actions" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef;">
                <button type="button" class="btn btn-secondary" onclick="fecharModal('modalReceitas')">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" onclick="adicionarReceitasSelecionadas()">
                    ➕ Adicionar Selecionadas
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Carregar receitas no modal
function carregarReceitasModal() {
    const container = document.getElementById('listaReceitasModal');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (receitasCarregadas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhuma receita cadastrada</p>';
        return;
    }
    
    receitasCarregadas.forEach((receita, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #e9ecef; border-radius: 5px; margin-bottom: 5px; background: white;';
        
        const tipoCodigo = tipoRefeicaoAtualCardapio?.codigo;
        const jaAdicionado = receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receita.id);
        
        div.innerHTML = `
            <input type="checkbox" id="receita-${index}" value="${receita.id}" ${jaAdicionado ? 'disabled checked' : ''}>
            <label for="receita-${index}" style="flex: 1; margin: 0; cursor: pointer; ${jaAdicionado ? 'color: #6c757d;' : ''}">
                ${receita.codigo} - ${receita.descricao}${jaAdicionado ? ' ✅' : ''}
            </label>
            <span style="font-size: 12px; color: #666;">
                ${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}
            </span>
        `;
        container.appendChild(div);
    });
}

// Filtrar receitas
function filtrarReceitas() {
    const search = document.getElementById('searchReceitas').value.toLowerCase();
    const items = document.querySelectorAll('#listaReceitasModal .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// Adicionar receitas selecionadas
function adicionarReceitasSelecionadas() {
    const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked:not(:disabled)');
    
    if (checkboxes.length === 0) {
        mostrarToast('Selecione pelo menos uma receita para adicionar', 'warning');
        return;
    }
    
    const tipoCodigo = tipoRefeicaoAtualCardapio?.codigo;
    if (!tipoCodigo) {
        mostrarToast('Tipo de refeição não selecionado', 'error');
        return;
    }
    
    // Inicializar array se não existir
    if (!receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo] = [];
    }
    
    let adicionadas = 0;
    
    checkboxes.forEach(checkbox => {
        const receitaId = checkbox.value;
        const receita = receitasCarregadas.find(r => r.id === receitaId);
        
        if (!receita) return;
        
        // Verificar se já existe
        if (receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId)) {
            return;
        }
        
        // Obter comensais do campo
        const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
        const comensais = parseInt(comensaisInput?.value || 0);
        
        const receitaCardapio = {
            receita_id: receita.id,
            codigo: receita.codigo,
            descricao: receita.descricao,
            comensais: comensais,
            quantidadePorPessoa: 0,
            totalPorComensais: 0,
            unidadeBasica: receita.unidade_rendimento || 'UN',
            alterada: false
        };
        
        receitasTemporarias[tipoCodigo].push(receitaCardapio);
        adicionarReceitaNaLista(tipoCodigo, receitaCardapio);
        adicionadas++;
    });
    
    if (adicionadas > 0) {
        mostrarToast(`✅ ${adicionadas} receita(s) adicionada(s) com sucesso!`, 'success');
        fecharModal('modalReceitas');
        
        // ✅ CORREÇÃO: Atualizar calendário após adicionar receitas
        if (typeof forcarAtualizacaoCalendario === 'function') {
            setTimeout(() => {
                forcarAtualizacaoCalendario();
            }, 300);
        }
    }
}

// Adicionar receita na lista visual
function adicionarReceitaNaLista(tipoCodigo, receita) {
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'receita-item-tabular';
    div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
    
    div.innerHTML = `
        <div class="receita-nome">${receita.codigo} - ${receita.descricao}</div>
        <div>
            <input type="number" 
                   value="${receita.quantidadePorPessoa || 0}" 
                   step="0.001" 
                   min="0"
                   onchange="atualizarQuantidadePorPessoa('${tipoCodigo}', '${receita.receita_id}', this.value)"
                   placeholder="0,000">
            <small>${receita.unidadeBasica}/pessoa</small>
        </div>
        <div>
            <input type="number" 
                   value="${receita.totalPorComensais || 0}" 
                   step="0.001" 
                   min="0"
                   onchange="atualizarTotalPorComensais('${tipoCodigo}', '${receita.receita_id}', this.value)"
                   placeholder="0,000">
            <small>Total KG</small>
        </div>
        <div class="total-calculado" id="total-${tipoCodigo}-${receita.receita_id}">
            ${(receita.totalPorComensais || 0).toFixed(3)} KG
        </div>
        <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')">
            Excluir
        </button>
    `;
    
    container.appendChild(div);
}

// Atualizar comensais do tipo
function atualizarComensaisTipo(tipoCodigo) {
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (!comensaisInput) return;
    
    const comensais = parseInt(comensaisInput.value || 0);
    
    if (comensais <= 0) {
        mostrarToast('Informe um número válido de comensais', 'warning');
        return;
    }
    
    // Atualizar todas as receitas do tipo
    if (receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo].forEach(receita => {
            receita.comensais = comensais;
            
            // Recalcular se tem quantidade por pessoa
            if (receita.quantidadePorPessoa > 0) {
                receita.totalPorComensais = comensais * receita.quantidadePorPessoa;
                
                // Atualizar visual
                const totalEl = document.getElementById(`total-${tipoCodigo}-${receita.receita_id}`);
                if (totalEl) {
                    totalEl.textContent = `${receita.totalPorComensais.toFixed(3)} KG`;
                    totalEl.classList.add('updated');
                    setTimeout(() => totalEl.classList.remove('updated'), 600);
                }
            }
        });
    }
    
    mostrarToast(`✅ Comensais atualizado para ${comensais}`, 'success');
}

// Atualizar quantidade por pessoa
function atualizarQuantidadePorPessoa(tipoCodigo, receitaId, valor) {
    const qtd = parseFloat(valor || 0);
    
    if (receitasTemporarias[tipoCodigo]) {
        const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
        if (receita) {
            receita.quantidadePorPessoa = qtd;
            receita.alterada = true;
            
            // Recalcular total
            if (receita.comensais > 0) {
                receita.totalPorComensais = receita.comensais * qtd;
                
                // Atualizar campo total
                const totalInput = document.querySelector(`#receita-${tipoCodigo}-${receitaId} input:nth-of-type(2)`);
                if (totalInput) {
                    totalInput.value = receita.totalPorComensais.toFixed(3);
                }
                
                // Atualizar total calculado
                const totalEl = document.getElementById(`total-${tipoCodigo}-${receitaId}`);
                if (totalEl) {
                    totalEl.textContent = `${receita.totalPorComensais.toFixed(3)} KG`;
                    totalEl.classList.add('updated');
                    setTimeout(() => totalEl.classList.remove('updated'), 600);
                }
            }
        }
    }
}

// Atualizar total por comensais
function atualizarTotalPorComensais(tipoCodigo, receitaId, valor) {
    const total = parseFloat(valor || 0);
    
    if (receitasTemporarias[tipoCodigo]) {
        const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
        if (receita) {
            receita.totalPorComensais = total;
            receita.alterada = true;
            
            // Recalcular quantidade por pessoa
            if (receita.comensais > 0) {
                receita.quantidadePorPessoa = total / receita.comensais;
                
                // Atualizar campo quantidade
                const qtdInput = document.querySelector(`#receita-${tipoCodigo}-${receitaId} input:nth-of-type(1)`);
                if (qtdInput) {
                    qtdInput.value = receita.quantidadePorPessoa.toFixed(3);
                }
            }
            
            // Atualizar total calculado
            const totalEl = document.getElementById(`total-${tipoCodigo}-${receitaId}`);
            if (totalEl) {
                totalEl.textContent = `${total.toFixed(3)} KG`;
                totalEl.classList.add('updated');
                setTimeout(() => totalEl.classList.remove('updated'), 600);
            }
        }
    }
}

// Remover receita
function removerReceita(tipoCodigo, receitaId) {
    if (!confirm('Deseja remover esta receita?')) return;
    
    if (receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo] = receitasTemporarias[tipoCodigo].filter(r => r.receita_id !== receitaId);
    }
    
    const elemento = document.getElementById(`receita-${tipoCodigo}-${receitaId}`);
    if (elemento) {
        elemento.remove();
    }
    
    mostrarToast('Receita removida', 'info');
    
    // ✅ CORREÇÃO: Atualizar calendário após remover receita
    if (typeof forcarAtualizacaoCalendario === 'function') {
        setTimeout(() => {
            forcarAtualizacaoCalendario();
        }, 300);
    }
}

// ===== FUNÇÕES DE AÇÃO GLOBAL =====

// Atualizar todos os comensais
function atualizarParaTodos() {
    const totalInput = document.getElementById('totalComensais');
    if (!totalInput || !totalInput.value) {
        mostrarToast('Informe o total de comensais primeiro', 'warning');
        totalInput?.focus();
        return;
    }
    
    const totalComensais = parseInt(totalInput.value);
    if (totalComensais <= 0) {
        mostrarToast('Informe um número válido de comensais', 'warning');
        return;
    }
    
    // Atualizar todos os tipos
    if (clienteAtualCardapio?.tiposRefeicao) {
        clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
            const comensaisInput = document.getElementById(`comensais-${tipo.codigo}`);
            if (comensaisInput) {
                comensaisInput.value = totalComensais;
                atualizarComensaisTipo(tipo.codigo);
            }
        });
        
        mostrarToast(`✅ Todos os tipos atualizados para ${totalComensais} comensais`, 'success');
    }
}

// Calcular para todos
function calcularParaTodos() {
    if (!clienteAtualCardapio?.tiposRefeicao) {
        mostrarToast('Selecione um cliente primeiro', 'warning');
        return;
    }
    
    let totalCalculado = 0;
    
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        if (receitasTemporarias[tipo.codigo]) {
            receitasTemporarias[tipo.codigo].forEach(receita => {
                if (receita.comensais > 0 && receita.quantidadePorPessoa > 0) {
                    receita.totalPorComensais = receita.comensais * receita.quantidadePorPessoa;
                    totalCalculado++;
                    
                    // Atualizar visual
                    const totalEl = document.getElementById(`total-${tipo.codigo}-${receita.receita_id}`);
                    if (totalEl) {
                        totalEl.textContent = `${receita.totalPorComensais.toFixed(3)} KG`;
                        totalEl.classList.add('updated');
                    }
                }
            });
        }
    });
    
    if (totalCalculado > 0) {
        mostrarToast(`✅ ${totalCalculado} receitas calculadas com sucesso!`, 'success');
    } else {
        mostrarToast('Nenhuma receita para calcular', 'info');
    }
}

// ===== GRAVAR PARA TODOS CORRIGIDO =====
async function gravarParaTodos() {
    try {
        if (!clienteAtualCardapio || !dataAtualCardapio) {
            mostrarToast('Selecione cliente e data', 'warning');
            return;
        }
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        let totalGravado = 0;
        
        // Gravar cada tipo de refeição
        for (const tipo of clienteAtualCardapio.tiposRefeicao) {
            if (!receitasTemporarias[tipo.codigo] || receitasTemporarias[tipo.codigo].length === 0) {
                continue;
            }
            
            // Deletar cardápios existentes para este tipo/data
            await window.supabase
                .from('cardapios')
                .delete()
                .eq('user_id', user.id)
                .eq('cliente_id', clienteAtualCardapio.id)
                .eq('tipo_refeicao_id', tipo.id)
                .eq('data', dataAtualCardapio);
            
            // Inserir novas receitas
            for (const receita of receitasTemporarias[tipo.codigo]) {
                const cardapioData = {
                    user_id: user.id,
                    cliente_id: clienteAtualCardapio.id,
                    tipo_refeicao_id: tipo.id,
                    receita_id: receita.receita_id,
                    data: dataAtualCardapio,
                    comensais: receita.comensais || 0,
                    quantidade_por_pessoa: receita.quantidadePorPessoa || 0,
                    total_por_comensais: receita.totalPorComensais || 0,
                    unidade_basica: receita.unidadeBasica || 'UN',
                    alterada: receita.alterada || false
                };
                
                const { error } = await window.supabase
                    .from('cardapios')
                    .insert([cardapioData]);
                
                if (error) throw error;
                totalGravado++;
            }
        }
        
        if (totalGravado > 0) {
            mostrarToast(`✅ ${totalGravado} receitas gravadas com sucesso!`, 'success');
            
            // ✅ CORREÇÃO: Recarregar dados e atualizar calendário
            await carregarCardapios();
            
            if (typeof forcarAtualizacaoCalendario === 'function') {
                setTimeout(() => {
                    forcarAtualizacaoCalendario();
                }, 500);
            }
        } else {
            mostrarToast('Nenhuma receita para gravar', 'info');
        }
        
    } catch (error) {
        console.error('❌ Erro ao gravar:', error);
        mostrarToast('Erro ao gravar: ' + error.message, 'error');
    }
}

// Visualização semanal
function abrirVisualizacaoSemanal() {
    mostrarToast('Visualização semanal em desenvolvimento', 'info');
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

function toggleExpandable(header) {
    const content = header.nextElementSibling;
    const arrow = header.querySelector('span:last-child');
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        arrow.textContent = '▼';
    } else {
        content.classList.add('active');
        arrow.textContent = '▲';
    }
}

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    if (window.mostrarToast && typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
    console.log(`Toast: ${mensagem}`);
}

// Função para impressão
function abrirModalImpressao() {
    console.log('🖨️ Abrindo modal de impressão...');
    
    if (typeof abrirModalImpressaoCardapios === 'function') {
        abrirModalImpressaoCardapios();
    } else {
        setTimeout(() => {
            if (typeof abrirModalImpressaoCardapios === 'function') {
                abrirModalImpressaoCardapios();
            } else {
                mostrarToast('Sistema de impressão não está disponível', 'error');
            }
        }, 500);
    }
}

// ===== EXPORTAR FUNÇÕES =====
window.inicializarCardapio = inicializarCardapio;
window.toggleCalendar = toggleCalendarioSistema;
window.mudarMes = mudarMesCalendario;
window.selecionarDia = selecionarDiaCalendario;
window.atualizarCalendario = atualizarCalendarioSistema;
window.carregarTiposRefeicaoCliente = carregarTiposRefeicaoCliente;
window.toggleExpandable = toggleExpandable;
window.fecharModal = fecharModal;
window.abrirModalImpressao = abrirModalImpressao;
window.formatarDataBrasil = formatarDataBrasil;
window.abrirModalReceitasTipo = abrirModalReceitasTipo;
window.atualizarComensaisTipo = atualizarComensaisTipo;
window.adicionarReceitasSelecionadas = adicionarReceitasSelecionadas;
window.filtrarReceitas = filtrarReceitas;
window.atualizarQuantidadePorPessoa = atualizarQuantidadePorPessoa;
window.atualizarTotalPorComensais = atualizarTotalPorComensais;
window.removerReceita = removerReceita;
window.atualizarParaTodos = atualizarParaTodos;
window.calcularParaTodos = calcularParaTodos;
window.gravarParaTodos = gravarParaTodos;
window.abrirVisualizacaoSemanal = abrirVisualizacaoSemanal;
window.carregarCardapioData = carregarCardapioData;
window.atualizarECalcularTipoFinal = atualizarECalcularTipoFinal;


console.log('✅ cardapio.js TOTALMENTE CORRIGIDO carregado com sucesso!');

// ===== CORREÇÕES PARA O MÓDULO CARDÁPIO =====
// Adicione estas correções ao arquivo js/cardapio.js

// ===== FUNÇÃO CORRIGIDA: Carregar tipos de refeição cliente =====
function carregarTiposRefeicaoCliente() {
    const clienteIndex = document.getElementById('clienteCardapio').value;
    const container = document.getElementById('tiposRefeicaoCardapio');
    
    if (!container) return;
    container.innerHTML = '';

    if (clienteIndex === '') {
        clienteAtualCardapio = null;
        return;
    }

    const cliente = clientesCarregados[parseInt(clienteIndex)];
    if (!cliente) return;
    
    clienteAtualCardapio = cliente;

    if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Cliente não possui tipos de refeição cadastrados</p>';
        return;
    }

    // Criar seções expansíveis CORRIGIDAS para cada tipo de refeição
    cliente.tiposRefeicao.forEach(tipo => {
        const expandable = document.createElement('div');
        expandable.className = 'expandable';
        expandable.innerHTML = `
            <div class="expandable-header" onclick="toggleExpandable(this)">
                <span>${tipo.descricao}</span>
                <span>▼</span>
            </div>
            <div class="expandable-content">
                <!-- ✅ CORREÇÃO 1: Seção de comensais corrigida -->
                <div class="comensais-section">
                    <label>Comensais para ${tipo.descricao}:</label>
                    <input type="number" 
                           id="comensais-${tipo.codigo}" 
                           class="comensais-input" 
                           min="1" 
                           max="99999" 
                           placeholder="0"
                           value="${getComensaisFromTotal() || ''}">
                    <button class="btn btn-secondary compact-btn" onclick="atualizarComensaisTipoCorrigido('${tipo.codigo}')">
                        📝 Atualizar
                    </button>
                </div>

                <!-- ✅ BOTÕES DE AÇÃO CORRIGIDOS -->
                <div class="actions" style="margin: 15px 0; padding: 15px 0; border-top: 1px solid #e9ecef;">
                    <button class="btn btn-primary compact-btn" onclick="abrirModalReceitasTipo('${tipo.codigo}')">
                        ➕ Adicionar Receitas
                    </button>
                    <button class="btn btn-success compact-btn" onclick="calcularReceitasDoTipo('${tipo.codigo}')">
                        🧮 Calcular
                    </button>
                </div>

                <!-- ✅ CORREÇÃO 3: Cabeçalho da tabela corrigido -->
                <div class="receitas-header visible">
                    <div class="receitas-header-grid" style="display: grid; grid-template-columns: 2fr 120px 150px 150px 80px; gap: 10px; font-weight: 600; color: #495057; font-size: 13px; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                        <div style="text-align: left;">Receita</div>
                        <div style="text-align: center;">Comensais</div>
                        <div style="text-align: center;">Rend. Receita</div>
                        <div style="text-align: center;">Total</div>
                        <div style="text-align: center;">Ações</div>
                    </div>
                </div>

                <!-- Container das receitas -->
                <div id="receitas-list-${tipo.codigo}" class="receitas-container"></div>
            </div>
        `;
        container.appendChild(expandable);
    });
    
    carregarCardapioParaDataAtual();
}

// ===== CORREÇÃO 1: Função de atualizar comensais CORRIGIDA =====
function atualizarComensaisTipoCorrigido(tipoCodigo) {
    console.log(`📝 Atualizando comensais para tipo: ${tipoCodigo}`);
    
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (!comensaisInput) {
        mostrarToast('Campo de comensais não encontrado', 'error');
        return;
    }
    
    const comensais = parseInt(comensaisInput.value || 0);
    
    if (comensais <= 0) {
        mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
        comensaisInput.focus();
        return;
    }
    
    console.log(`✅ Atualizando ${comensais} comensais para tipo ${tipoCodigo}`);
    
    // ✅ CORREÇÃO: Atualizar todas as receitas do tipo
    if (receitasTemporarias[tipoCodigo]) {
        let receitasAtualizadas = 0;
        
        receitasTemporarias[tipoCodigo].forEach((receita, index) => {
            // Atualizar campo de comensais da receita
            receita.comensais = comensais;
            receitasAtualizadas++;
            
            console.log(`📋 Receita ${receita.codigo}: comensais atualizados para ${comensais}`);
            
            // Atualizar visualmente o campo de comensais na linha da receita
            const comensaisCell = document.querySelector(`#receita-${tipoCodigo}-${receita.receita_id} .comensais-receita`);
            if (comensaisCell) {
                comensaisCell.textContent = comensais;
                comensaisCell.style.background = '#e8f5e8';
                comensaisCell.style.fontWeight = 'bold';
                
                // Remover destaque após 2 segundos
                setTimeout(() => {
                    comensaisCell.style.background = '';
                    comensaisCell.style.fontWeight = '';
                }, 2000);
            }
        });
        
        mostrarToast(`✅ ${receitasAtualizadas} receita(s) atualizadas com ${comensais} comensais`, 'success');
        
        // Re-renderizar as receitas para mostrar os valores atualizados
        setTimeout(() => {
            renderizarReceitasDoTipo(tipoCodigo);
        }, 100);
    } else {
        mostrarToast(`ℹ️ Comensais definido para ${comensais}. Adicione receitas para aplicar o cálculo.`, 'info');
    }
}

// ===== CORREÇÃO 2: Função de calcular receitas do tipo =====
function calcularReceitasDoTipo(tipoCodigo) {
    console.log(`🧮 Calculando receitas do tipo: ${tipoCodigo}`);
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        mostrarToast('Nenhuma receita encontrada para calcular', 'warning');
        return;
    }
    
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    const comensais = parseInt(comensaisInput?.value || 0);
    
    if (comensais <= 0) {
        mostrarToast('Defina o número de comensais antes de calcular', 'warning');
        comensaisInput?.focus();
        return;
    }
    
    let receitasCalculadas = 0;
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        // Buscar dados da receita original para pegar rendimento
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        
        if (receitaOriginal && receitaOriginal.rendimento > 0) {
            // ✅ CORREÇÃO: Cálculo = comensais * rendimento da receita
            const rendimento = parseFloat(receitaOriginal.rendimento) || 0;
            const total = comensais * rendimento;
            
            // Atualizar dados da receita
            receita.comensais = comensais;
            receita.quantidadePorPessoa = rendimento;
            receita.totalPorComensais = total;
            receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
            receita.alterada = true;
            
            console.log(`✅ Receita ${receita.codigo}: ${comensais} × ${rendimento} = ${total} ${receita.unidadeBasica}`);
            receitasCalculadas++;
        } else {
            console.warn(`⚠️ Receita ${receita.codigo} sem rendimento definido`);
        }
    });
    
    if (receitasCalculadas > 0) {
        mostrarToast(`✅ ${receitasCalculadas} receita(s) calculadas com sucesso!`, 'success');
        
        // Re-renderizar as receitas para mostrar os valores calculados
        renderizarReceitasDoTipo(tipoCodigo);
        
        // ✅ CORREÇÃO: Atualizar calendário após cálculos
        if (typeof forcarAtualizacaoCalendario === 'function') {
            setTimeout(() => {
                forcarAtualizacaoCalendario();
            }, 300);
        }
    } else {
        mostrarToast('Nenhuma receita pôde ser calculada. Verifique se as receitas têm rendimento definido.', 'warning');
    }
}

// ===== CORREÇÃO 3: Função de renderizar receitas com colunas corretas =====
function renderizarReceitasDoTipo(tipoCodigo) {
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                📝 Nenhuma receita adicionada<br>
                <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
            </div>
        `;
        return;
    }
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        const div = document.createElement('div');
        div.className = 'receita-item-tabular';
        div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
        
        // ✅ LAYOUT CORRIGIDO COM COLUNAS CORRETAS
        div.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 120px 150px 150px 80px;
            gap: 10px;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            transition: all 0.2s ease;
        `;
        
        // Buscar dados da receita original
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        const rendimento = receitaOriginal ? parseFloat(receitaOriginal.rendimento || 0) : 0;
        const unidadeRendimento = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        div.innerHTML = `
            <!-- ✅ COLUNA 1: Código + Nome da Receita -->
            <div class="receita-nome" style="font-weight: 500; color: #333; font-size: 14px; line-height: 1.3;">
                ${receita.codigo} - ${receita.descricao}
            </div>
            
            <!-- ✅ COLUNA 2: Qtde de Comensais -->
            <div style="text-align: center;">
                <span class="comensais-receita" style="display: inline-block; padding: 4px 8px; background: #e7f3ff; color: #0066cc; border-radius: 4px; font-weight: 600; font-size: 13px;">
                    ${receita.comensais || 0}
                </span>
            </div>
            
            <!-- ✅ COLUNA 3: Rendimento da Receita + Unidade -->
            <div style="text-align: center;">
                <span style="font-weight: 500; color: #495057;">
                    ${rendimento.toFixed(3)} ${unidadeRendimento}
                </span>
                <small style="display: block; color: #666; font-size: 11px; margin-top: 2px;">
                    por pessoa
                </small>
            </div>
            
            <!-- ✅ COLUNA 4: Total + Unidade -->
            <div style="text-align: center;">
                <span class="total-calculado" id="total-${tipoCodigo}-${receita.receita_id}" 
                      style="display: inline-block; padding: 6px 10px; background: #e8f5e8; color: #2e7d32; border-radius: 6px; font-weight: 600; border: 2px solid #4caf50; font-size: 13px;">
                    ${(receita.totalPorComensais || 0).toFixed(3)} ${unidadeRendimento}
                </span>
            </div>
            
            <!-- ✅ COLUNA 5: Botão Excluir -->
            <div style="text-align: center;">
                <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 11px; width: 60px; border-radius: 4px;">
                    Excluir
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ===== SOBRESCREVER FUNÇÃO ORIGINAL DE ADICIONAR RECEITA =====
function adicionarReceitaNaListaCorrigida(tipoCodigo, receita) {
    // Usar a função de renderização completa em vez de adicionar individualmente
    if (!receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo] = [];
    }
    
    // Verificar se receita já existe
    const exists = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receita.receita_id);
    if (!exists) {
        receitasTemporarias[tipoCodigo].push(receita);
    }
    
    // Re-renderizar todas as receitas do tipo
    renderizarReceitasDoTipo(tipoCodigo);
}

// ===== ATUALIZAR EXPORTAÇÕES GLOBAIS =====
window.atualizarComensaisTipoCorrigido = atualizarComensaisTipoCorrigido;
window.calcularReceitasDoTipo = calcularReceitasDoTipo;
window.renderizarReceitasDoTipo = renderizarReceitasDoTipo;
window.adicionarReceitaNaListaCorrigida = adicionarReceitaNaListaCorrigida;

// ===== SOBRESCREVER FUNÇÃO ORIGINAL (Opcional - apenas se quiser substituir completamente) =====
// Descomente a linha abaixo se quiser substituir a função original
// window.atualizarComensaisTipo = atualizarComensaisTipoCorrigido;

console.log('✅ Correções do módulo cardápio carregadas com sucesso!');
console.log('📋 Novas funções disponíveis:');
console.log('  - atualizarComensaisTipoCorrigido()');
console.log('  - calcularReceitasDoTipo()');
console.log('  - renderizarReceitasDoTipo()');

// ===== CORREÇÃO: CAMPOS EDITÁVEIS PARA COMENSAIS E RENDIMENTO =====
// Adicione este código ao arquivo js/cardapio.js (após as correções anteriores)

// ===== FUNÇÃO CORRIGIDA: Renderizar receitas com campos editáveis =====
function renderizarReceitasDoTipoEditavel(tipoCodigo) {
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                📝 Nenhuma receita adicionada<br>
                <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
            </div>
        `;
        return;
    }
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        const div = document.createElement('div');
        div.className = 'receita-item-tabular';
        div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
        
        // Layout com campos editáveis
        div.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 120px 150px 150px 80px;
            gap: 10px;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            transition: all 0.2s ease;
        `;
        
        // Buscar dados da receita original
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        const rendimentoOriginal = receitaOriginal ? parseFloat(receitaOriginal.rendimento || 0) : 0;
        const unidadeRendimento = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        // Usar valores salvos ou padrão
        const comensaisAtual = receita.comensais || 0;
        const rendimentoAtual = receita.quantidadePorPessoa || rendimentoOriginal;
        const totalAtual = receita.totalPorComensais || 0;
        
        div.innerHTML = `
            <!-- ✅ COLUNA 1: Código + Nome da Receita -->
            <div class="receita-nome" style="font-weight: 500; color: #333; font-size: 14px; line-height: 1.3;">
                ${receita.codigo} - ${receita.descricao}
            </div>
            
            <!-- ✅ COLUNA 2: Comensais EDITÁVEL -->
            <div style="text-align: center;">
                <input type="number" 
                       class="campo-comensais-editavel" 
                       id="comensais-editavel-${tipoCodigo}-${receita.receita_id}"
                       value="${comensaisAtual}" 
                       min="1" 
                       max="9999" 
                       step="1"
                       onchange="atualizarComensaisReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                       onblur="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')"
                       style="width: 80px; padding: 6px 8px; border: 2px solid #007bff; border-radius: 4px; text-align: center; font-weight: 600; font-size: 13px; background: #e7f3ff; color: #004085;">
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">pessoas</small>
            </div>
            
            <!-- ✅ COLUNA 3: Rendimento EDITÁVEL -->
            <div style="text-align: center;">
                <input type="number" 
                       class="campo-rendimento-editavel" 
                       id="rendimento-editavel-${tipoCodigo}-${receita.receita_id}"
                       value="${rendimentoAtual.toFixed(3)}" 
                       min="0" 
                       max="999.999" 
                       step="0.001"
                       onchange="atualizarRendimentoReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                       onblur="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')"
                       style="width: 100px; padding: 6px 8px; border: 2px solid #28a745; border-radius: 4px; text-align: center; font-weight: 600; font-size: 13px; background: #d4edda; color: #155724;">
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">${unidadeRendimento}/pessoa</small>
            </div>
            
            <!-- ✅ COLUNA 4: Total CALCULADO -->
            <div style="text-align: center;">
                <span class="total-calculado-editavel" id="total-${tipoCodigo}-${receita.receita_id}" 
                      style="display: inline-block; padding: 8px 12px; background: #fff3cd; color: #856404; border-radius: 6px; font-weight: 600; border: 2px solid #ffc107; font-size: 13px; min-width: 80px;">
                    ${totalAtual.toFixed(3)} ${unidadeRendimento}
                </span>
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">total</small>
            </div>
            
            <!-- ✅ COLUNA 5: Ações -->
            <div style="text-align: center; display: flex; flex-direction: column; gap: 4px;">
                <button class="btn btn-success" onclick="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 10px; width: 60px; border-radius: 4px; margin-bottom: 2px;"
                        title="Recalcular esta receita">
                    Calc
                </button>
                <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 10px; width: 60px; border-radius: 4px;"
                        title="Remover esta receita">
                    Excluir
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ===== NOVA FUNÇÃO: Atualizar comensais de uma receita específica =====
function atualizarComensaisReceita(tipoCodigo, receitaId, novoValor) {
    console.log(`👥 Atualizando comensais da receita ${receitaId} para ${novoValor}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    const comensais = parseInt(novoValor) || 0;
    
    if (comensais < 0) {
        mostrarToast('Número de comensais não pode ser negativo', 'warning');
        return;
    }
    
    // Atualizar valor na receita
    receita.comensais = comensais;
    receita.alterada = true;
    
    // Feedback visual no campo
    const campo = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    if (campo) {
        campo.style.background = '#d1ecf1';
        campo.style.borderColor = '#17a2b8';
        setTimeout(() => {
            campo.style.background = '#e7f3ff';
            campo.style.borderColor = '#007bff';
        }, 1000);
    }
    
    console.log(`✅ Comensais da receita ${receita.codigo} atualizado para ${comensais}`);
}

// ===== NOVA FUNÇÃO: Atualizar rendimento de uma receita específica =====
function atualizarRendimentoReceita(tipoCodigo, receitaId, novoValor) {
    console.log(`⚖️ Atualizando rendimento da receita ${receitaId} para ${novoValor}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    const rendimento = parseFloat(novoValor) || 0;
    
    if (rendimento < 0) {
        mostrarToast('Rendimento não pode ser negativo', 'warning');
        return;
    }
    
    // Atualizar valor na receita
    receita.quantidadePorPessoa = rendimento;
    receita.alterada = true;
    
    // Feedback visual no campo
    const campo = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    if (campo) {
        campo.style.background = '#f8d7da';
        campo.style.borderColor = '#dc3545';
        setTimeout(() => {
            campo.style.background = '#d4edda';
            campo.style.borderColor = '#28a745';
        }, 1000);
    }
    
    console.log(`✅ Rendimento da receita ${receita.codigo} atualizado para ${rendimento}`);
}

// ===== NOVA FUNÇÃO: Calcular total de uma receita específica =====
function calcularTotalReceita(tipoCodigo, receitaId) {
    console.log(`🧮 Calculando total da receita ${receitaId}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    // Obter valores atuais dos campos
    const comensaisInput = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    const rendimentoInput = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    
    const comensais = parseInt(comensaisInput?.value || receita.comensais || 0);
    const rendimento = parseFloat(rendimentoInput?.value || receita.quantidadePorPessoa || 0);
    
    // Calcular total
    const total = comensais * rendimento;
    
    // Atualizar receita
    receita.comensais = comensais;
    receita.quantidadePorPessoa = rendimento;
    receita.totalPorComensais = total;
    receita.alterada = true;
    
    // Atualizar display do total
    const totalElement = document.getElementById(`total-${tipoCodigo}-${receitaId}`);
    if (totalElement) {
        const receitaOriginal = receitasCarregadas.find(r => r.id === receitaId);
        const unidade = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        totalElement.textContent = `${total.toFixed(3)} ${unidade}`;
        
        // Animação de atualização
        totalElement.style.transform = 'scale(1.1)';
        totalElement.style.background = '#d1ecf1';
        totalElement.style.borderColor = '#17a2b8';
        
        setTimeout(() => {
            totalElement.style.transform = 'scale(1)';
            totalElement.style.background = '#fff3cd';
            totalElement.style.borderColor = '#ffc107';
        }, 300);
    }
    
    console.log(`✅ Total calculado: ${comensais} × ${rendimento} = ${total}`);
    
    // Mostrar feedback
    mostrarToast(`✅ Total recalculado: ${total.toFixed(3)}`, 'success', 2000);
    
    // ✅ Atualizar calendário se disponível
    if (typeof forcarAtualizacaoCalendario === 'function') {
        setTimeout(() => {
            forcarAtualizacaoCalendario();
        }, 100);
    }
}

// ===== FUNÇÃO CORRIGIDA: Calcular receitas do tipo (com campos editáveis) =====
function calcularReceitasDoTipoEditavel(tipoCodigo) {
    console.log(`🧮 Calculando TODAS as receitas do tipo: ${tipoCodigo}`);
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        mostrarToast('Nenhuma receita encontrada para calcular', 'warning');
        return;
    }
    
    let receitasCalculadas = 0;
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        // Calcular cada receita individualmente (vai usar os valores editados)
        calcularTotalReceita(tipoCodigo, receita.receita_id);
        receitasCalculadas++;
    });
    
    if (receitasCalculadas > 0) {
        mostrarToast(`✅ ${receitasCalculadas} receita(s) recalculadas com valores personalizados!`, 'success');
    }
}

// ===== FUNÇÃO CORRIGIDA: Botão atualizar global (preserva edições individuais) =====
function atualizarComensaisTipoEditavelSemSobrescrever(tipoCodigo) {
    console.log(`📝 Atualizando comensais do tipo ${tipoCodigo} (preservando edições individuais)`);
    
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (!comensaisInput) {
        mostrarToast('Campo de comensais não encontrado', 'error');
        return;
    }
    
    const comensaisGlobal = parseInt(comensaisInput.value || 0);
    
    if (comensaisGlobal <= 0) {
        mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
        comensaisInput.focus();
        return;
    }
    
    // ✅ CORREÇÃO: Perguntar antes de sobrescrever valores editados manualmente
    const receitasComEdicao = receitasTemporarias[tipoCodigo]?.filter(r => r.alterada) || [];
    
    if (receitasComEdicao.length > 0) {
        const confirmar = confirm(
            `⚠️ Atenção!\n\n` +
            `Existem ${receitasComEdicao.length} receita(s) com valores editados manualmente.\n\n` +
            `Deseja aplicar ${comensaisGlobal} comensais para TODAS as receitas?\n\n` +
            `• SIM = Aplica ${comensaisGlobal} para todas (sobrescreve edições)\n` +
            `• NÃO = Mantém valores editados individualmente`
        );
        
        if (!confirmar) {
            mostrarToast('ℹ️ Valores individuais mantidos. Use os campos editáveis para ajustes específicos.', 'info');
            return;
        }
    }
    
    // Aplicar comensais global para todas as receitas
    if (receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo].forEach(receita => {
            receita.comensais = comensaisGlobal;
            
            // Atualizar campo visual se existir
            const campoComensais = document.getElementById(`comensais-editavel-${tipoCodigo}-${receita.receita_id}`);
            if (campoComensais) {
                campoComensais.value = comensaisGlobal;
            }
        });
        
        mostrarToast(`✅ ${receitasTemporarias[tipoCodigo].length} receita(s) atualizadas com ${comensaisGlobal} comensais`, 'success');
        
        // Re-renderizar para mostrar valores atualizados
        setTimeout(() => {
            renderizarReceitasDoTipoEditavel(tipoCodigo);
        }, 100);
    }
}

// ===== SOBRESCREVER FUNÇÕES ORIGINAIS PARA USAR VERSÕES EDITÁVEIS =====

// Substituir função de renderização
window.renderizarReceitasDoTipo = renderizarReceitasDoTipoEditavel;

// Substituir função de cálculo
window.calcularReceitasDoTipo = calcularReceitasDoTipoEditavel;

// ===== EXPORTAR NOVAS FUNÇÕES =====
window.atualizarComensaisReceita = atualizarComensaisReceita;
window.atualizarRendimentoReceita = atualizarRendimentoReceita;
window.calcularTotalReceita = calcularTotalReceita;
window.calcularReceitasDoTipoEditavel = calcularReceitasDoTipoEditavel;
window.atualizarComensaisTipoEditavelSemSobrescrever = atualizarComensaisTipoEditavelSemSobrescrever;
window.renderizarReceitasDoTipoEditavel = renderizarReceitasDoTipoEditavel;

console.log('✅ Campos editáveis implementados com sucesso!');
console.log('📋 Funcionalidades adicionadas:');
console.log('  - Campos de comensais editáveis por receita');
console.log('  - Campos de rendimento editáveis por receita');
console.log('  - Cálculo individual por receita');
console.log('  - Botão "Calc" para recalcular receita específica');
console.log('  - Preservação de edições individuais');

// ===== CORREÇÃO: CAMPOS EDITÁVEIS PARA COMENSAIS E RENDIMENTO =====
// Adicione este código ao arquivo js/cardapio.js (após as correções anteriores)

// ===== FUNÇÃO CORRIGIDA: Renderizar receitas com campos editáveis =====
function renderizarReceitasDoTipoEditavel(tipoCodigo) {
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                📝 Nenhuma receita adicionada<br>
                <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
            </div>
        `;
        return;
    }
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        const div = document.createElement('div');
        div.className = 'receita-item-tabular';
        div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
        
        // Layout com campos editáveis
        div.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 120px 150px 150px 90px;
            gap: 10px;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            transition: all 0.2s ease;
        `;
        
        // Buscar dados da receita original
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        const rendimentoOriginal = receitaOriginal ? parseFloat(receitaOriginal.rendimento || 0) : 0;
        const unidadeRendimento = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        // Usar valores salvos ou padrão
        const comensaisAtual = receita.comensais || 0;
        const rendimentoAtual = receita.quantidadePorPessoa || rendimentoOriginal;
        const totalAtual = receita.totalPorComensais || 0;
        
        div.innerHTML = `
            <!-- ✅ COLUNA 1: Código + Nome da Receita -->
            <div class="receita-nome" style="font-weight: 500; color: #333; font-size: 14px; line-height: 1.3;">
                ${receita.codigo} - ${receita.descricao}
            </div>
            
            <!-- ✅ COLUNA 2: Comensais EDITÁVEL -->
            <div style="text-align: center;">
                <input type="number" 
                       class="campo-comensais-editavel" 
                       id="comensais-editavel-${tipoCodigo}-${receita.receita_id}"
                       value="${comensaisAtual}" 
                       min="1" 
                       max="9999" 
                       step="1"
                       onchange="atualizarComensaisReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                       onblur="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')"
                       style="width: 80px; padding: 6px 8px; border: 2px solid #007bff; border-radius: 4px; text-align: center; font-weight: 600; font-size: 13px; background: #e7f3ff; color: #004085;">
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">pessoas</small>
            </div>
            
            <!-- ✅ COLUNA 3: Rendimento EDITÁVEL -->
            <div style="text-align: center;">
                <input type="number" 
                       class="campo-rendimento-editavel" 
                       id="rendimento-editavel-${tipoCodigo}-${receita.receita_id}"
                       value="${rendimentoAtual.toFixed(3)}" 
                       min="0" 
                       max="999.999" 
                       step="0.001"
                       onchange="atualizarRendimentoReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                       onblur="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')"
                       style="width: 100px; padding: 6px 8px; border: 2px solid #28a745; border-radius: 4px; text-align: center; font-weight: 600; font-size: 13px; background: #d4edda; color: #155724;">
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">${unidadeRendimento}/pessoa</small>
            </div>
            
            <!-- ✅ COLUNA 4: Total CALCULADO -->
            <div style="text-align: center;">
                <span class="total-calculado-editavel" id="total-${tipoCodigo}-${receita.receita_id}" 
                      style="display: inline-block; padding: 8px 12px; background: #fff3cd; color: #856404; border-radius: 6px; font-weight: 600; border: 2px solid #ffc107; font-size: 13px; min-width: 80px;">
                    ${totalAtual.toFixed(3)} ${unidadeRendimento}
                </span>
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">total</small>
            </div>
            
            <!-- ✅ COLUNA 5: Ações -->
            <div style="text-align: center; display: flex; flex-direction: column; gap: 4px;">
                <button class="btn btn-success" onclick="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 10px; width: 70px; border-radius: 4px; margin-bottom: 2px;"
                        title="Recalcular apenas esta receita">
                    Calc. esta
                </button>
                <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 10px; width: 70px; border-radius: 4px;"
                        title="Remover esta receita">
                    Excluir
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ===== NOVA FUNÇÃO: Atualizar comensais de uma receita específica =====
function atualizarComensaisReceita(tipoCodigo, receitaId, novoValor) {
    console.log(`👥 Atualizando comensais da receita ${receitaId} para ${novoValor}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    const comensais = parseInt(novoValor) || 0;
    
    if (comensais < 0) {
        mostrarToast('Número de comensais não pode ser negativo', 'warning');
        return;
    }
    
    // Atualizar valor na receita
    receita.comensais = comensais;
    receita.alterada = true;
    
    // Feedback visual no campo
    const campo = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    if (campo) {
        campo.style.background = '#d1ecf1';
        campo.style.borderColor = '#17a2b8';
        setTimeout(() => {
            campo.style.background = '#e7f3ff';
            campo.style.borderColor = '#007bff';
        }, 1000);
    }
    
    console.log(`✅ Comensais da receita ${receita.codigo} atualizado para ${comensais}`);
}

// ===== NOVA FUNÇÃO: Atualizar rendimento de uma receita específica =====
function atualizarRendimentoReceita(tipoCodigo, receitaId, novoValor) {
    console.log(`⚖️ Atualizando rendimento da receita ${receitaId} para ${novoValor}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    const rendimento = parseFloat(novoValor) || 0;
    
    if (rendimento < 0) {
        mostrarToast('Rendimento não pode ser negativo', 'warning');
        return;
    }
    
    // Atualizar valor na receita
    receita.quantidadePorPessoa = rendimento;
    receita.alterada = true;
    
    // Feedback visual no campo
    const campo = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    if (campo) {
        campo.style.background = '#f8d7da';
        campo.style.borderColor = '#dc3545';
        setTimeout(() => {
            campo.style.background = '#d4edda';
            campo.style.borderColor = '#28a745';
        }, 1000);
    }
    
    console.log(`✅ Rendimento da receita ${receita.codigo} atualizado para ${rendimento}`);
}

// ===== NOVA FUNÇÃO: Calcular total de uma receita específica =====
function calcularTotalReceita(tipoCodigo, receitaId) {
    console.log(`🧮 Calculando total da receita ${receitaId}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    // Obter valores atuais dos campos
    const comensaisInput = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    const rendimentoInput = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    
    const comensais = parseInt(comensaisInput?.value || receita.comensais || 0);
    const rendimento = parseFloat(rendimentoInput?.value || receita.quantidadePorPessoa || 0);
    
    // Calcular total
    const total = comensais * rendimento;
    
    // Atualizar receita
    receita.comensais = comensais;
    receita.quantidadePorPessoa = rendimento;
    receita.totalPorComensais = total;
    receita.alterada = true;
    
    // Atualizar display do total
    const totalElement = document.getElementById(`total-${tipoCodigo}-${receitaId}`);
    if (totalElement) {
        const receitaOriginal = receitasCarregadas.find(r => r.id === receitaId);
        const unidade = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        totalElement.textContent = `${total.toFixed(3)} ${unidade}`;
        
        // Animação de atualização
        totalElement.style.transform = 'scale(1.1)';
        totalElement.style.background = '#d1ecf1';
        totalElement.style.borderColor = '#17a2b8';
        
        setTimeout(() => {
            totalElement.style.transform = 'scale(1)';
            totalElement.style.background = '#fff3cd';
            totalElement.style.borderColor = '#ffc107';
        }, 300);
    }
    
    console.log(`✅ Total calculado: ${comensais} × ${rendimento} = ${total}`);
    
    // Mostrar feedback
    mostrarToast(`✅ Total recalculado: ${total.toFixed(3)}`, 'success', 2000);
    
    // ✅ Atualizar calendário se disponível
    if (typeof forcarAtualizacaoCalendario === 'function') {
        setTimeout(() => {
            forcarAtualizacaoCalendario();
        }, 100);
    }
}

// ===== FUNÇÃO CORRIGIDA: Calcular receitas do tipo (com campos editáveis) =====
function calcularReceitasDoTipoEditavel(tipoCodigo) {
    console.log(`🧮 Calculando TODAS as receitas do tipo: ${tipoCodigo}`);
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        mostrarToast('Nenhuma receita encontrada para calcular', 'warning');
        return;
    }
    
    let receitasCalculadas = 0;
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        // Calcular cada receita individualmente (vai usar os valores editados)
        calcularTotalReceita(tipoCodigo, receita.receita_id);
        receitasCalculadas++;
    });
    
    if (receitasCalculadas > 0) {
        mostrarToast(`✅ ${receitasCalculadas} receita(s) recalculadas com valores personalizados!`, 'success');
    }
}

// ===== NOVA FUNÇÃO: Atualizar E Calcular em uma ação =====
function atualizarECalcularTipo(tipoCodigo) {
    console.log(`🔄 Atualizando E calculando tipo: ${tipoCodigo}`);
    
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (!comensaisInput) {
        mostrarToast('Campo de comensais não encontrado', 'error');
        return;
    }
    
    const comensaisGlobal = parseInt(comensaisInput.value || 0);
    
    if (comensaisGlobal <= 0) {
        mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
        comensaisInput.focus();
        return;
    }
    
    // ✅ CORREÇÃO: Perguntar antes de sobrescrever valores editados manualmente
    const receitasComEdicao = receitasTemporarias[tipoCodigo]?.filter(r => r.alterada) || [];
    
    if (receitasComEdicao.length > 0) {
        const confirmar = confirm(
            `⚠️ Atenção!\n\n` +
            `Existem ${receitasComEdicao.length} receita(s) com valores editados manualmente.\n\n` +
            `Deseja aplicar ${comensaisGlobal} comensais para TODAS as receitas E calcular?\n\n` +
            `• SIM = Aplica ${comensaisGlobal} para todas e calcula (sobrescreve edições)\n` +
            `• NÃO = Mantém valores editados individualmente`
        );
        
        if (!confirmar) {
            mostrarToast('ℹ️ Valores individuais mantidos. Use os campos editáveis para ajustes específicos.', 'info');
            return;
        }
    }
    
    // ✅ PASSO 1: Aplicar comensais global para todas as receitas
    if (receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo].forEach(receita => {
            receita.comensais = comensaisGlobal;
            
            // Atualizar campo visual se existir
            const campoComensais = document.getElementById(`comensais-editavel-${tipoCodigo}-${receita.receita_id}`);
            if (campoComensais) {
                campoComensais.value = comensaisGlobal;
            }
        });
        
        // ✅ PASSO 2: Calcular automaticamente todas as receitas
        setTimeout(() => {
            calcularReceitasDoTipoEditavel(tipoCodigo);
            
            mostrarToast(`✅ ${receitasTemporarias[tipoCodigo].length} receita(s) atualizadas e calculadas com ${comensaisGlobal} comensais!`, 'success');
            
            // Re-renderizar para mostrar valores atualizados
            setTimeout(() => {
                renderizarReceitasDoTipoEditavel(tipoCodigo);
            }, 200);
            
        }, 100);
        
    } else {
        mostrarToast(`ℹ️ Comensais definido para ${comensaisGlobal}. Adicione receitas para aplicar o cálculo.`, 'info');
    }
}

// ===== FUNÇÃO CORRIGIDA: Atualizar comensais CORRIGIDA (mantida para compatibilidade) =====
function atualizarComensaisTipoEditavelSemSobrescrever(tipoCodigo) {
    console.log(`📝 Atualizando comensais do tipo ${tipoCodigo} (preservando edições individuais)`);
    
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (!comensaisInput) {
        mostrarToast('Campo de comensais não encontrado', 'error');
        return;
    }
    
    const comensaisGlobal = parseInt(comensaisInput.value || 0);
    
    if (comensaisGlobal <= 0) {
        mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
        comensaisInput.focus();
        return;
    }
    
    // ✅ CORREÇÃO: Perguntar antes de sobrescrever valores editados manualmente
    const receitasComEdicao = receitasTemporarias[tipoCodigo]?.filter(r => r.alterada) || [];
    
    if (receitasComEdicao.length > 0) {
        const confirmar = confirm(
            `⚠️ Atenção!\n\n` +
            `Existem ${receitasComEdicao.length} receita(s) com valores editados manualmente.\n\n` +
            `Deseja aplicar ${comensaisGlobal} comensais para TODAS as receitas?\n\n` +
            `• SIM = Aplica ${comensaisGlobal} para todas (sobrescreve edições)\n` +
            `• NÃO = Mantém valores editados individualmente`
        );
        
        if (!confirmar) {
            mostrarToast('ℹ️ Valores individuais mantidos. Use os campos editáveis para ajustes específicos.', 'info');
            return;
        }
    }
    
    // Aplicar comensais global para todas as receitas
    if (receitasTemporarias[tipoCodigo]) {
        receitasTemporarias[tipoCodigo].forEach(receita => {
            receita.comensais = comensaisGlobal;
            
            // Atualizar campo visual se existir
            const campoComensais = document.getElementById(`comensais-editavel-${tipoCodigo}-${receita.receita_id}`);
            if (campoComensais) {
                campoComensais.value = comensaisGlobal;
            }
        });
        
        mostrarToast(`✅ ${receitasTemporarias[tipoCodigo].length} receita(s) atualizadas com ${comensaisGlobal} comensais`, 'success');
        
        // Re-renderizar para mostrar valores atualizados
        setTimeout(() => {
            renderizarReceitasDoTipoEditavel(tipoCodigo);
        }, 100);
    }
}

// ===== SOBRESCREVER FUNÇÕES ORIGINAIS PARA USAR VERSÕES EDITÁVEIS =====

// Substituir função de renderização
window.renderizarReceitasDoTipo = renderizarReceitasDoTipoEditavel;

// Substituir função de cálculo
window.calcularReceitasDoTipo = calcularReceitasDoTipoEditavel;

// ===== EXPORTAR NOVAS FUNÇÕES =====
window.atualizarComensaisReceita = atualizarComensaisReceita;
window.atualizarRendimentoReceita = atualizarRendimentoReceita;
window.calcularTotalReceita = calcularTotalReceita;
window.calcularReceitasDoTipoEditavel = calcularReceitasDoTipoEditavel;
window.atualizarComensaisTipoEditavelSemSobrescrever = atualizarComensaisTipoEditavelSemSobrescrever;
window.renderizarReceitasDoTipoEditavel = renderizarReceitasDoTipoEditavel;
window.atualizarECalcularTipo = atualizarECalcularTipo;

console.log('✅ Campos editáveis implementados com sucesso!');
console.log('📋 Funcionalidades adicionadas:');
console.log('  - Campos de comensais editáveis por receita');
console.log('  - Campos de rendimento editáveis por receita');
console.log('  - Cálculo individual por receita');
console.log('  - Botão "Calc. esta" para recalcular receita específica');
console.log('  - Botão "Atualizar e Calcular" que faz tudo de uma vez');
console.log('  - Preservação de edições individuais');

function atualizarECalcularTipoFinal(tipoCodigo) {
    console.log(`🔄 [FINAL] Atualizando E calculando tipo: ${tipoCodigo}`);
    
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (!comensaisInput) {
        mostrarToast('Campo de comensais não encontrado', 'error');
        return;
    }
    
    const comensaisGlobal = parseInt(comensaisInput.value || 0);
    
    if (comensaisGlobal <= 0) {
        mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
        comensaisInput.focus();
        return;
    }
    
    // ✅ PASSO 1: Verificar se tem receitas
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        mostrarToast(`ℹ️ Comensais definido para ${comensaisGlobal}. Adicione receitas para aplicar o cálculo.`, 'info');
        return;
    }
    
    // ✅ PASSO 2: Perguntar se pode sobrescrever edições manuais
    const receitasComEdicao = receitasTemporarias[tipoCodigo].filter(r => r.alterada) || [];
    
    if (receitasComEdicao.length > 0) {
        const confirmar = confirm(
            `⚠️ Atenção!\n\n` +
            `Existem ${receitasComEdicao.length} receita(s) com valores editados manualmente.\n\n` +
            `Deseja aplicar ${comensaisGlobal} comensais para TODAS as receitas E calcular?\n\n` +
            `• SIM = Aplica ${comensaisGlobal} para todas e calcula (sobrescreve edições)\n` +
            `• NÃO = Mantém valores editados individualmente`
        );
        
        if (!confirmar) {
            mostrarToast('ℹ️ Valores individuais mantidos. Use os campos editáveis para ajustes específicos.', 'info');
            return;
        }
    }
    
    // ✅ PASSO 3: Aplicar comensais global para todas as receitas
    let receitasAtualizadas = 0;
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        // Buscar dados da receita original para pegar rendimento
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        
        if (receitaOriginal && receitaOriginal.rendimento > 0) {
            // ✅ CÁLCULO AUTOMÁTICO: comensais * rendimento da receita
            const rendimento = parseFloat(receitaOriginal.rendimento) || 0;
            const total = comensaisGlobal * rendimento;
            
            // Atualizar todos os valores da receita
            receita.comensais = comensaisGlobal;
            receita.quantidadePorPessoa = rendimento;
            receita.totalPorComensais = total;
            receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
            receita.alterada = true;
            
            console.log(`✅ Receita ${receita.codigo}: ${comensaisGlobal} × ${rendimento} = ${total} ${receita.unidadeBasica}`);
            receitasAtualizadas++;
            
            // Atualizar campo visual se existir
            const campoComensais = document.getElementById(`comensais-editavel-${tipoCodigo}-${receita.receita_id}`);
            if (campoComensais) {
                campoComensais.value = comensaisGlobal;
            }
            
            const campoRendimento = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receita.receita_id}`);
            if (campoRendimento) {
                campoRendimento.value = rendimento.toFixed(3);
            }
        } else {
            console.warn(`⚠️ Receita ${receita.codigo} sem rendimento definido`);
        }
    });
    
    if (receitasAtualizadas > 0) {
        mostrarToast(`✅ ${receitasAtualizadas} receita(s) atualizadas e calculadas com ${comensaisGlobal} comensais!`, 'success');
        
        // ✅ PASSO 4: Re-renderizar as receitas para mostrar os valores atualizados
        setTimeout(() => {
            renderizarReceitasDoTipoEditavel(tipoCodigo);
            
            // ✅ PASSO 5: Atualizar calendário se disponível
            if (typeof forcarAtualizacaoCalendario === 'function') {
                setTimeout(() => {
                    forcarAtualizacaoCalendario();
                }, 300);
            }
        }, 100);
        
    } else {
        mostrarToast('Nenhuma receita pôde ser calculada. Verifique se as receitas têm rendimento definido.', 'warning');
    }
}