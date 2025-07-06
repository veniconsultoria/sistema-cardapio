// cardapio.js - Sistema de Cardápios com Supabase (CORRIGIDO DROPDOWN CLIENTES)

console.log('📁 Carregando cardapio.js...');

// Aguardar Supabase estar disponível
function aguardarSupabaseCardapio(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para cardapio.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseCardapio(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        alert('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar se o usuário está logado
async function verificarAutenticacao() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return false;
    }
}

// Variáveis globais
let clientesCarregados = [];
let receitasCarregadas = [];
let tiposRefeicaoCarregados = [];
let cardapiosCarregados = {};
let clienteAtualCardapio = null;
let tipoRefeicaoAtualCardapio = null;
let dataAtualCardapio = null;
let cardapioInicializado = false;

// Inicializar página de cardápios quando necessário
async function inicializarCardapio() {
    if (cardapioInicializado) {
        console.log('⚠️ Cardápio já inicializado');
        return;
    }

    console.log('🚀 Inicializando cardápio...');
    
    aguardarSupabaseCardapio(async () => {
        try {
            // Verificar autenticação
            if (!await verificarAutenticacao()) {
                return;
            }
            
            console.log('📥 Carregando dados do cardápio...');
            
            // Carregar dados do Supabase em ordem específica
            await carregarDadosIniciais();
            
            // Configurar eventos
            configurarEventos();
            
            // Configurar data atual
            const hoje = new Date().toISOString().split('T')[0];
            const inputData = document.getElementById('dataCardapio');
            if (inputData) {
                inputData.value = hoje;
            }
            
            cardapioInicializado = true;
            console.log('✅ Cardápio inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar cardápio:', error);
            alert('Erro ao carregar cardápio: ' + error.message);
        }
    });
}

// Carregar todos os dados necessários
async function carregarDadosIniciais() {
    try {
        console.log('📥 Carregando dados iniciais do cardápio...');
        
        // Carregar dados em sequência (não paralelo) para evitar problemas de dependência
        console.log('1️⃣ Carregando clientes...');
        await carregarClientes();
        
        console.log('2️⃣ Carregando receitas...');
        await carregarReceitas();
        
        console.log('3️⃣ Carregando tipos de refeição...');
        await carregarTiposRefeicao();
        
        console.log('4️⃣ Carregando cardápios...');
        await carregarCardapios();
        
        // IMPORTANTE: Carregar clientes no select APÓS todos os dados estarem prontos
        console.log('5️⃣ Populando dropdown de clientes...');
        carregarClientesCardapio();
        
        console.log('✅ Dados iniciais carregados com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        throw error;
    }
}

// Carregar clientes do Supabase - CORRIGIDO COM LOGS DETALHADOS
async function carregarClientes() {
    try {
        console.log('📥 Carregando clientes do Supabase...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log('👤 Usuário autenticado:', user.email);

        // ESTRATÉGIA MELHORADA: Carregar clientes e depois tipos de refeição
        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) {
            console.error('❌ Erro ao carregar clientes:', clientesError);
            throw clientesError;
        }

        console.log(`📊 ${(clientesData || []).length} clientes encontrados no banco`);

        // Se não há clientes, inicializar array vazio
        if (!clientesData || clientesData.length === 0) {
            clientesCarregados = [];
            console.log('⚠️ Nenhum cliente encontrado no banco de dados');
            return;
        }

        // Agora carregar tipos de refeição para cada cliente
        const clientesComTipos = [];
        
        for (const cliente of clientesData) {
            console.log(`🔍 Processando cliente: ${cliente.codigo} - ${cliente.descricao}`);
            
            try {
                // Buscar tipos de refeição vinculados ao cliente
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
                        .filter(tipo => tipo !== null); // Filtrar tipos nulos
                    
                    console.log(`✅ Cliente ${cliente.descricao}: ${tiposRefeicao.length} tipos de refeição encontrados`);
                    
                    clientesComTipos.push({
                        ...cliente,
                        tiposRefeicao: tiposRefeicao
                    });
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
        console.log(`✅ ${clientesCarregados.length} clientes carregados com tipos de refeição`);
        
        // Log detalhado dos clientes para debug
        clientesCarregados.forEach((cliente, index) => {
            console.log(`📋 Cliente ${index}: ${cliente.codigo} - ${cliente.descricao} (${cliente.tiposRefeicao.length} tipos)`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        clientesCarregados = [];
        throw error;
    }
}

// Carregar receitas do Supabase
async function carregarReceitas() {
    try {
        console.log('📥 Carregando receitas...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('receitas')
            .select(`
                *,
                ingredientes (
                    *,
                    produtos (codigo, descricao)
                )
            `)
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            console.warn('⚠️ Erro ao carregar receitas com ingredientes, tentando sem ingredientes...');
            
            // Fallback: carregar apenas receitas
            const { data: receitasSimples, error: errorSimples } = await window.supabase
                .from('receitas')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (errorSimples) throw errorSimples;

            receitasCarregadas = (receitasSimples || []).map(receita => ({
                ...receita,
                ingredientes: []
            }));
        } else {
            receitasCarregadas = (data || []).map(receita => ({
                ...receita,
                ingredientes: receita.ingredientes.map(ing => ({
                    codigoProduto: ing.produtos?.codigo || 'N/A',
                    nome: ing.produtos?.descricao || 'Produto não encontrado',
                    quantidade: ing.quantidade,
                    unidadeMedida: ing.unidade_medida,
                    perdaPercent: ing.perda_percent,
                    ganhoPercent: ing.ganho_percent,
                    precoUnitario: ing.preco_unitario
                }))
            }));
        }
        
        console.log(`✅ ${receitasCarregadas.length} receitas carregadas`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error);
        receitasCarregadas = [];
    }
}

// Carregar tipos de refeição do Supabase
async function carregarTiposRefeicao() {
    try {
        console.log('📥 Carregando tipos de refeição...');
        
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

// Carregar cardápios existentes
async function carregarCardapios() {
    try {
        console.log('📥 Carregando cardápios existentes...');
        
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
            .eq('user_id', user.id);

        if (error) {
            console.warn('⚠️ Erro ao carregar cardápios:', error);
            cardapiosCarregados = {};
            return;
        }

        // Organizar cardápios por data -> cliente -> tipo
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
                codigo: item.receitas?.codigo || 'N/A',
                descricao: item.receitas?.descricao || 'Receita não encontrada',
                comensais: item.comensais,
                quantidadePorPessoa: item.quantidade_por_pessoa,
                totalPorComensais: item.total_por_comensais,
                unidadeBasica: item.unidade_basica,
                alterada: item.alterada || false,
                ingredientes: []
            });
        });
        
        console.log('✅ Cardápios carregados');
        
    } catch (error) {
        console.error('❌ Erro ao carregar cardápios:', error);
        cardapiosCarregados = {};
    }
}

// Configurar eventos
function configurarEventos() {
    console.log('⚙️ Configurando eventos do cardápio...');
    
    // Select de cliente
    const selectCliente = document.getElementById('clienteCardapio');
    if (selectCliente) {
        // Remover event listeners existentes
        selectCliente.removeEventListener('change', carregarTiposRefeicaoCliente);
        selectCliente.addEventListener('change', carregarTiposRefeicaoCliente);
        console.log('✅ Event listener adicionado ao select de cliente');
    } else {
        console.warn('⚠️ Elemento clienteCardapio não encontrado');
    }
    
    // Input de data
    const inputData = document.getElementById('dataCardapio');
    if (inputData) {
        inputData.removeEventListener('change', carregarCardapioData);
        inputData.addEventListener('change', carregarCardapioData);
        console.log('✅ Event listener adicionado ao input de data');
    } else {
        console.warn('⚠️ Elemento dataCardapio não encontrado');
    }
}

// Carregar clientes no select - FUNÇÃO CORRIGIDA PRINCIPAL
function carregarClientesCardapio() {
    console.log('🔄 INICIANDO carregarClientesCardapio...');
    
    const select = document.getElementById('clienteCardapio');
    if (!select) {
        console.error('❌ Elemento select clienteCardapio não encontrado no DOM!');
        return;
    }
    
    console.log('✅ Select encontrado:', select);
    
    // Limpar opções existentes
    select.innerHTML = '';
    
    // Adicionar opção padrão
    const optionPadrao = document.createElement('option');
    optionPadrao.value = '';
    optionPadrao.textContent = 'Selecione um cliente';
    select.appendChild(optionPadrao);
    
    console.log(`📊 Total de clientes carregados na memória: ${clientesCarregados.length}`);
    
    if (clientesCarregados.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '❌ Nenhum cliente cadastrado';
        option.disabled = true;
        option.style.color = '#dc3545';
        select.appendChild(option);
        console.log('⚠️ Nenhum cliente encontrado - opção de aviso adicionada');
        return;
    }

    // Adicionar todos os clientes
    let clientesAdicionados = 0;
    
    clientesCarregados.forEach((cliente, index) => {
        console.log(`➕ Adicionando cliente ${index}: ${cliente.codigo} - ${cliente.descricao}`);
        
        const option = document.createElement('option');
        option.value = index.toString(); // Usar índice como value
        option.textContent = `${cliente.codigo} - ${cliente.descricao}`;
        
        // Indicar visualmente se o cliente tem tipos de refeição
        if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
            option.textContent += ' ⚠️';
            option.style.color = '#856404';
            option.title = 'Cliente sem tipos de refeição cadastrados';
        }
        
        select.appendChild(option);
        clientesAdicionados++;
        
        console.log(`✅ Cliente adicionado: ${option.textContent}`);
    });
    
    console.log(`✅ CONCLUÍDO: ${clientesAdicionados} clientes adicionados ao dropdown`);
    
    // Verificar se as opções foram realmente adicionadas
    const totalOptions = select.options.length;
    console.log(`📊 Total de opções no select após carregamento: ${totalOptions}`);
    
    // Log de todas as opções para debug
    for (let i = 0; i < select.options.length; i++) {
        console.log(`Opção ${i}: ${select.options[i].value} - ${select.options[i].textContent}`);
    }
}

// Carregar tipos de refeição do cliente selecionado
function carregarTiposRefeicaoCliente() {
    console.log('🔄 Carregando tipos de refeição do cliente...');
    
    const clienteIndex = document.getElementById('clienteCardapio').value;
    const container = document.getElementById('tiposRefeicaoCardapio');
    
    if (!container) {
        console.error('❌ Container tiposRefeicaoCardapio não encontrado');
        return;
    }
    
    container.innerHTML = '';

    if (clienteIndex === '') {
        clienteAtualCardapio = null;
        console.log('⚠️ Nenhum cliente selecionado');
        return;
    }

    const cliente = clientesCarregados[parseInt(clienteIndex)];
    if (!cliente) {
        console.error('❌ Cliente não encontrado no índice:', clienteIndex);
        return;
    }
    
    console.log(`👤 Cliente selecionado: ${cliente.descricao}`);
    clienteAtualCardapio = cliente;

    if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Cliente não possui tipos de refeição cadastrados</p>';
        console.log('⚠️ Cliente não possui tipos de refeição');
        return;
    }

    console.log(`📋 Criando interface para ${cliente.tiposRefeicao.length} tipos de refeição`);

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
                    <input type="number" class="comensais-input" min="1" placeholder="0">
                    <button class="btn btn-secondary" onclick="atualizarComensais(this)">Atualizar</button>
                </div>
                <button class="btn btn-primary" onclick="abrirModalReceitasTipo('${tipo.codigo}')">Adicionar Receitas</button>
                <div class="actions" style="margin-top: 10px;">
                    <button class="btn btn-success compact-btn" onclick="calcularTipoRefeicao('${tipo.codigo}')">Calcular</button>
                    <button class="btn btn-primary compact-btn" onclick="gravarTipoRefeicao('${tipo.codigo}')">Gravar</button>
                </div>
                <div class="receitas-container" data-tipo="${tipo.codigo}">
                </div>
            </div>
        `;
        container.appendChild(expandable);
        console.log(`✅ Interface criada para tipo: ${tipo.descricao}`);
    });
    
    // Carregar dados da data atual se houver
    carregarCardapioData();
}

// Toggle expandable
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

// Abrir modal de receitas para tipo específico
function abrirModalReceitasTipo(tipoRefeicaoCodigo) {
    tipoRefeicaoAtualCardapio = tipoRefeicaoCodigo;
    document.getElementById('modalReceitas').style.display = 'block';
    carregarListaReceitasModal();
}

// Carregar lista de receitas no modal
function carregarListaReceitasModal() {
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
        div.innerHTML = `
            <input type="checkbox" id="receita-${index}" value="${index}">
            <label for="receita-${index}">${receita.codigo} - ${receita.descricao}</label>
        `;
        container.appendChild(div);
    });
}

// Filtrar receitas no modal
function filtrarReceitas() {
    const search = document.getElementById('searchReceitas').value.toLowerCase();
    const items = document.querySelectorAll('#listaReceitasModal .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// Fechar modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Carregar dados do cardápio para data específica
function carregarCardapioData() {
    console.log('📅 Carregando dados do cardápio para a data selecionada...');
    // Esta função será implementada conforme necessário
}

// Adicionar receitas selecionadas
function adicionarReceitasSelecionadas() {
    console.log('➕ Adicionando receitas selecionadas...');
    
    if (!tipoRefeicaoAtualCardapio) {
        mostrarToast('Erro: Tipo de refeição não selecionado', 'error');
        return;
    }
    
    if (!clienteAtualCardapio) {
        mostrarToast('Erro: Cliente não selecionado', 'error');
        return;
    }
    
    // Buscar receitas selecionadas
    const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        mostrarToast('Selecione pelo menos uma receita', 'warning');
        return;
    }
    
    // Container do tipo de refeição atual
    const tipoContainer = document.querySelector(`[data-tipo="${tipoRefeicaoAtualCardapio}"]`);
    if (!tipoContainer) {
        mostrarToast('Erro: Container do tipo de refeição não encontrado', 'error');
        return;
    }
    
    let receitasAdicionadas = 0;
    
    checkboxes.forEach(checkbox => {
        const receitaIndex = parseInt(checkbox.value);
        const receita = receitasCarregadas[receitaIndex];
        
        if (!receita) {
            console.warn('Receita não encontrada no índice:', receitaIndex);
            return;
        }
        
        // Verificar se receita já foi adicionada
        const receitaExistente = tipoContainer.querySelector(`[data-receita-codigo="${receita.codigo}"]`);
        if (receitaExistente) {
            console.log('Receita já existe:', receita.codigo);
            return;
        }
        
        // Criar elemento da receita
        const receitaElement = document.createElement('div');
        receitaElement.className = 'receita-item';
        receitaElement.setAttribute('data-receita-codigo', receita.codigo);
        receitaElement.innerHTML = `
            <div class="receita-header">
                <span class="receita-nome">${receita.codigo} - ${receita.descricao}</span>
                <button class="btn btn-danger btn-sm" onclick="removerReceitaCardapio('${receita.codigo}', '${tipoRefeicaoAtualCardapio}')">
                    Remover
                </button>
            </div>
            <div class="receita-detalhes">
                <div class="receita-info">
                    <label>Rendimento:</label>
                    <span>${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}</span>
                </div>
                <div class="receita-info">
                    <label>Quantidade por pessoa:</label>
                    <input type="number" class="quantidade-pessoa" value="1" min="0" step="0.001" 
                           onchange="atualizarQuantidadeReceita('${receita.codigo}', '${tipoRefeicaoAtualCardapio}', this.value)">
                </div>
                <div class="receita-info">
                    <label>Total calculado:</label>
                    <span class="total-calculado">0</span>
                </div>
            </div>
        `;
        
        tipoContainer.appendChild(receitaElement);
        receitasAdicionadas++;
        
        console.log('Receita adicionada:', receita.descricao);
    });
    
    if (receitasAdicionadas > 0) {
        mostrarToast(`${receitasAdicionadas} receita(s) adicionada(s) com sucesso!`, 'success');
        
        // Fechar modal
        fecharModal('modalReceitas');
        
        // Limpar seleções
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Atualizar cálculos se houver comensais definidos
        const comensaisInput = tipoContainer.closest('.expandable-content').querySelector('.comensais-input');
        if (comensaisInput && comensaisInput.value > 0) {
            atualizarCalculosReceitasTipo(tipoRefeicaoAtualCardapio);
        }
    } else {
        mostrarToast('Nenhuma receita nova foi adicionada', 'info');
    }
}

// Remover receita do cardápio
function removerReceitaCardapio(receitaCodigo, tipoCodigo) {
    if (!confirm('Tem certeza que deseja remover esta receita?')) {
        return;
    }
    
    const tipoContainer = document.querySelector(`[data-tipo="${tipoCodigo}"]`);
    const receitaElement = tipoContainer?.querySelector(`[data-receita-codigo="${receitaCodigo}"]`);
    
    if (receitaElement) {
        receitaElement.remove();
        mostrarToast('Receita removida com sucesso!', 'success');
        
        // Recalcular totais
        atualizarCalculosReceitasTipo(tipoCodigo);
    }
}

// Atualizar quantidade de receita
function atualizarQuantidadeReceita(receitaCodigo, tipoCodigo, quantidade) {
    console.log(`Atualizando quantidade - Receita: ${receitaCodigo}, Tipo: ${tipoCodigo}, Qtd: ${quantidade}`);
    
    const tipoContainer = document.querySelector(`[data-tipo="${tipoCodigo}"]`);
    const receitaElement = tipoContainer?.querySelector(`[data-receita-codigo="${receitaCodigo}"]`);
    
    if (receitaElement) {
        // Atualizar o valor no input (se necessário)
        const input = receitaElement.querySelector('.quantidade-pessoa');
        if (input && input.value !== quantidade) {
            input.value = quantidade;
        }
        
        // Recalcular totais
        atualizarCalculosReceitasTipo(tipoCodigo);
        
        mostrarToast('Quantidade atualizada!', 'success');
    }
}

// Atualizar cálculos de um tipo de refeição
function atualizarCalculosReceitasTipo(tipoCodigo) {
    const tipoContainer = document.querySelector(`[data-tipo="${tipoCodigo}"]`);
    if (!tipoContainer) return;
    
    // Buscar número de comensais
    const comensaisInput = tipoContainer.closest('.expandable-content').querySelector('.comensais-input');
    const comensais = parseInt(comensaisInput?.value) || 0;
    
    if (comensais === 0) {
        console.log('Número de comensais não definido para cálculo');
        return;
    }
    
    // Atualizar cada receita
    const receitasElements = tipoContainer.querySelectorAll('.receita-item');
    receitasElements.forEach(receitaElement => {
        const quantidadePorPessoa = parseFloat(receitaElement.querySelector('.quantidade-pessoa').value) || 0;
        const totalCalculado = quantidadePorPessoa * comensais;
        
        const totalSpan = receitaElement.querySelector('.total-calculado');
        if (totalSpan) {
            totalSpan.textContent = totalCalculado.toFixed(3);
        }
    });
    
    console.log(`Cálculos atualizados para ${tipoCodigo} com ${comensais} comensais`);
}

// Atualizar comensais
function atualizarComensais(button) {
    const expandableContent = button.closest('.expandable-content');
    const comensaisInput = expandableContent.querySelector('.comensais-input');
    const tipoCodigo = expandableContent.querySelector('[data-tipo]')?.getAttribute('data-tipo');
    
    if (!comensaisInput || !tipoCodigo) {
        mostrarToast('Erro: Não foi possível identificar o tipo de refeição', 'error');
        return;
    }
    
    const comensais = parseInt(comensaisInput.value) || 0;
    
    if (comensais <= 0) {
        mostrarToast('Informe um número válido de comensais', 'warning');
        comensaisInput.focus();
        return;
    }
    
    // Atualizar campo global se necessário
    const totalComensaisGlobal = document.getElementById('totalComensais');
    if (totalComensaisGlobal && !totalComensaisGlobal.value) {
        totalComensaisGlobal.value = comensais;
    }
    
    // Atualizar cálculos
    atualizarCalculosReceitasTipo(tipoCodigo);
    
    mostrarToast(`Comensais atualizados para ${comensais}`, 'success');
}

// Calcular tipo de refeição
function calcularTipoRefeicao(tipoCodigo) {
    console.log('🧮 Calculando tipo de refeição:', tipoCodigo);
    
    const tipoContainer = document.querySelector(`[data-tipo="${tipoCodigo}"]`);
    if (!tipoContainer) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }
    
    const expandableContent = tipoContainer.closest('.expandable-content');
    const comensaisInput = expandableContent.querySelector('.comensais-input');
    const comensais = parseInt(comensaisInput?.value) || 0;
    
    if (comensais <= 0) {
        mostrarToast('Defina o número de comensais antes de calcular', 'warning');
        comensaisInput?.focus();
        return;
    }
    
    const receitasElements = tipoContainer.querySelectorAll('.receita-item');
    if (receitasElements.length === 0) {
        mostrarToast('Adicione receitas antes de calcular', 'warning');
        return;
    }
    
    // Atualizar cálculos
    atualizarCalculosReceitasTipo(tipoCodigo);
    
    mostrarToast('Cálculos realizados com sucesso!', 'success');
}

// Gravar tipo de refeição
function gravarTipoRefeicao(tipoCodigo) {
    console.log('💾 Gravando tipo de refeição...', tipoCodigo);
    mostrarToast('Funcionalidade de gravação será implementada em breve', 'info');
}

// Funções globais para todos os tipos
function atualizarParaTodos() {
    console.log('🔄 Atualizando para todos...');
    mostrarToast('Funcionalidade será implementada em breve', 'info');
}

function calcularParaTodos() {
    console.log('🧮 Calculando para todos...');
    mostrarToast('Funcionalidade será implementada em breve', 'info');
}

function gravarParaTodos() {
    console.log('💾 Gravando para todos...');
    mostrarToast('Funcionalidade será implementada em breve', 'info');
}

// Toast notification system
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
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
}

// Exportar funções para uso global
window.inicializarCardapio = inicializarCardapio;
window.toggleExpandable = toggleExpandable;
window.abrirModalReceitasTipo = abrirModalReceitasTipo;
window.filtrarReceitas = filtrarReceitas;
window.adicionarReceitasSelecionadas = adicionarReceitasSelecionadas;
window.atualizarComensais = atualizarComensais;
window.atualizarParaTodos = atualizarParaTodos;
window.calcularParaTodos = calcularParaTodos;
window.gravarParaTodos = gravarParaTodos;
window.calcularTipoRefeicao = calcularTipoRefeicao;
window.gravarTipoRefeicao = gravarTipoRefeicao;
window.fecharModal = fecharModal;
window.carregarClientesCardapio = carregarClientesCardapio;
window.carregarCardapioData = carregarCardapioData;
window.carregarTiposRefeicaoCliente = carregarTiposRefeicaoCliente;
window.removerReceitaCardapio = removerReceitaCardapio;
window.atualizarQuantidadeReceita = atualizarQuantidadeReceita;
window.atualizarCalculosReceitasTipo = atualizarCalculosReceitasTipo;
window.mostrarToast = mostrarToast;

console.log('✅ cardapio.js CORRIGIDO - Dropdown de clientes funcionando!');