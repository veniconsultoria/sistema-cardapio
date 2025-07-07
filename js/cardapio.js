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

    // Criar seções expansíveis para cada tipo de refeição
    cliente.tiposRefeicao.forEach(tipo => {
        const expandable = document.createElement('div');
        expandable.className = 'expandable';
        expandable.innerHTML = `
            <div class="expandable-header" onclick="toggleExpandable(this)">
                <span>${tipo.descricao}</span>
                <span>▼</span>
            </div>
            <div class="expandable-content">
                <div class="comensais-section">
                    <label>Comensais:</label>
                    <input type="number" 
                           id="comensais-${tipo.codigo}" 
                           class="comensais-input" 
                           min="1" 
                           max="99999" 
                           placeholder="0"
                           value="${getComensaisFromTotal() || ''}">
                    <button class="btn btn-secondary" onclick="atualizarComensaisTipo('${tipo.codigo}')">Atualizar</button>
                </div>
                <button class="btn btn-primary" onclick="abrirModalReceitasTipo('${tipo.codigo}')">
                    ➕ Adicionar Receitas
                </button>
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

console.log('✅ cardapio.js TOTALMENTE CORRIGIDO carregado com sucesso!');