// cardapio.js - Sistema de Cardápios POR DATA (CORRIGIDO)

console.log('📁 Carregando cardapio.js - Sistema por Data...');

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
let cardapiosCarregados = {}; // Organizado por data -> cliente -> tipo -> receitas
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

    console.log('🚀 Inicializando cardápio por data...');
    
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
                dataAtualCardapio = hoje;
            }
            
            // Mostrar data atual na interface
            atualizarIndicadorData();
            
            cardapioInicializado = true;
            console.log('✅ Cardápio inicializado com sucesso para sistema por data');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar cardápio:', error);
            alert('Erro ao carregar cardápio: ' + error.message);
        }
    });
}

// Atualizar indicador visual da data atual
function atualizarIndicadorData() {
    const dataInput = document.getElementById('dataCardapio');
    if (!dataInput) return;
    
    const data = new Date(dataInput.value + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Remover classes existentes
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

// Carregar todos os dados necessários
async function carregarDadosIniciais() {
    try {
        console.log('📥 Carregando dados iniciais do cardápio...');
        
        console.log('1️⃣ Carregando clientes...');
        await carregarClientes();
        
        console.log('2️⃣ Carregando receitas...');
        await carregarReceitas();
        
        console.log('3️⃣ Carregando tipos de refeição...');
        await carregarTiposRefeicao();
        
        console.log('4️⃣ Carregando cardápios...');
        await carregarCardapios();
        
        console.log('5️⃣ Populando dropdown de clientes...');
        carregarClientesCardapio();
        
        console.log('✅ Dados iniciais carregados com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        throw error;
    }
}

// Carregar clientes do Supabase
async function carregarClientes() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) throw clientesError;

        if (!clientesData || clientesData.length === 0) {
            clientesCarregados = [];
            return;
        }

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
                }
            } catch (error) {
                clientesComTipos.push({
                    ...cliente,
                    tiposRefeicao: []
                });
            }
        }

        clientesCarregados = clientesComTipos;
        console.log(`✅ ${clientesCarregados.length} clientes carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        clientesCarregados = [];
        throw error;
    }
}

// Carregar receitas do Supabase
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
        
        console.log(`✅ ${receitasCarregadas.length} receitas carregadas`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error);
        receitasCarregadas = [];
    }
}

// Carregar tipos de refeição do Supabase
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

// ===== CARREGAR CARDÁPIOS ORGANIZADOS POR DATA =====
async function carregarCardapios() {
    try {
        console.log('📥 Carregando cardápios organizados por data...');
        
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

        // ✅ ORGANIZAR POR DATA -> CLIENTE -> TIPO -> RECEITAS
        cardapiosCarregados = {};
        
        (data || []).forEach(item => {
            const data = item.data;
            const clienteCodigo = item.clientes?.codigo;
            const tipoCodigo = item.tipos_refeicoes?.codigo;
            
            if (!data || !clienteCodigo || !tipoCodigo) return;
            
            // Criar estrutura hierárquica: DATA -> CLIENTE -> TIPO -> RECEITAS[]
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
        
        console.log('✅ Cardápios carregados e organizados por data');
        console.log('📊 Dados carregados:', Object.keys(cardapiosCarregados).length, 'datas diferentes');
        
    } catch (error) {
        console.error('❌ Erro ao carregar cardápios:', error);
        cardapiosCarregados = {};
    }
}

// Configurar eventos
function configurarEventos() {
    console.log('⚙️ Configurando eventos do cardápio...');
    
    const selectCliente = document.getElementById('clienteCardapio');
    if (selectCliente) {
        selectCliente.removeEventListener('change', carregarTiposRefeicaoCliente);
        selectCliente.addEventListener('change', carregarTiposRefeicaoCliente);
    }
    
    const inputData = document.getElementById('dataCardapio');
    if (inputData) {
        inputData.removeEventListener('change', mudouDataCardapio);
        inputData.addEventListener('change', mudouDataCardapio);
    }
}

// ===== EVENTO QUANDO MUDA A DATA =====
function mudouDataCardapio() {
    const dataInput = document.getElementById('dataCardapio');
    if (!dataInput) return;
    
    const novaData = dataInput.value;
    dataAtualCardapio = novaData;
    
    console.log(`📅 Data alterada para: ${novaData}`);
    
    // Atualizar indicador visual
    atualizarIndicadorData();
    
    // Recarregar cardápio para a nova data
    carregarCardapioParaDataAtual();
    
    // Mostrar feedback visual
    mostrarToast(`📅 Cardápio carregado para ${formatarDataBrasil(novaData)}`, 'info');
}

// Carregar clientes no select
function carregarClientesCardapio() {
    const select = document.getElementById('clienteCardapio');
    if (!select) return;
    
    select.innerHTML = '';
    
    const optionPadrao = document.createElement('option');
    optionPadrao.value = '';
    optionPadrao.textContent = 'Selecione um cliente';
    select.appendChild(optionPadrao);
    
    if (clientesCarregados.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '❌ Nenhum cliente cadastrado';
        option.disabled = true;
        option.style.color = '#dc3545';
        select.appendChild(option);
        return;
    }

    clientesCarregados.forEach((cliente, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = `${cliente.codigo} - ${cliente.descricao}`;
        
        if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
            option.textContent += ' ⚠️';
            option.style.color = '#856404';
            option.title = 'Cliente sem tipos de refeição cadastrados';
        }
        
        select.appendChild(option);
    });
}

// ===== CARREGAR TIPOS DE REFEIÇÃO DO CLIENTE (COM DATA) =====
function carregarTiposRefeicaoCliente() {
    console.log('🔄 Carregando tipos de refeição do cliente para a data atual...');
    
    const clienteIndex = document.getElementById('clienteCardapio').value;
    const container = document.getElementById('tiposRefeicaoCardapio');
    
    if (!container) {
        console.error('❌ Container tiposRefeicaoCardapio não encontrado');
        return;
    }
    
    container.innerHTML = '';

    if (clienteIndex === '') {
        clienteAtualCardapio = null;
        return;
    }

    const cliente = clientesCarregados[parseInt(clienteIndex)];
    if (!cliente) {
        console.error('❌ Cliente não encontrado no índice:', clienteIndex);
        return;
    }
    
    clienteAtualCardapio = cliente;

    if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Cliente não possui tipos de refeição cadastrados</p>';
        return;
    }

    // ✅ CRIAR INTERFACE COM INDICADOR DE DATA
    const headerInfo = document.createElement('div');
    headerInfo.style.cssText = 'background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;';
    headerInfo.innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #1976d2;">📅 Cardápio do dia ${formatarDataBrasil(dataAtualCardapio)}</h4>
        <p style="margin: 0; color: #333; font-size: 14px;">Cliente: <strong>${cliente.descricao}</strong></p>
    `;
    container.appendChild(headerInfo);

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
                    <input type="number" class="comensais-input" min="1" max="99999" placeholder="0" style="width: 80px;">
                    <button class="btn btn-secondary" onclick="atualizarComensais(this)">Atualizar</button>
                </div>
                <button class="btn btn-primary" onclick="abrirModalReceitasTipo('${tipo.codigo}')">Adicionar Receitas</button>
                <div class="actions" style="margin-top: 10px;">
                    <button class="btn btn-success compact-btn" onclick="calcularTipoRefeicao('${tipo.codigo}')">Calcular</button>
                    <button class="btn btn-primary compact-btn" onclick="gravarTipoRefeicao('${tipo.codigo}')">Gravar</button>
                </div>
                
                <!-- Layout Tabular para Receitas -->
                <div class="receitas-container" data-tipo="${tipo.codigo}" style="margin-top: 15px;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px; display: none;" id="header-${tipo.codigo}">
                        <div style="display: grid; grid-template-columns: 2fr 120px 120px 120px 80px; gap: 10px; font-weight: 600; color: #495057; font-size: 13px;">
                            <div>Receita</div>
                            <div style="text-align: center;">Qtde. Receita</div>
                            <div style="text-align: center;">Nº Comensais</div>
                            <div style="text-align: center;">Total Calculado</div>
                            <div style="text-align: center;">Ações</div>
                        </div>
                    </div>
                    <div id="receitas-list-${tipo.codigo}"></div>
                </div>
            </div>
        `;
        container.appendChild(expandable);
    });
    
    // ✅ CARREGAR DADOS SALVOS PARA ESTA DATA
    carregarCardapioParaDataAtual();
}

// ===== CARREGAR CARDÁPIO PARA DATA ATUAL =====
function carregarCardapioParaDataAtual() {
    if (!dataAtualCardapio || !clienteAtualCardapio) {
        console.log('⚠️ Data ou cliente não definidos');
        return;
    }
    
    console.log(`📅 Carregando cardápio para data: ${dataAtualCardapio}, cliente: ${clienteAtualCardapio.descricao}`);
    
    // Verificar se existe cardápio salvo para esta data e cliente
    const cardapioData = cardapiosCarregados[dataAtualCardapio]?.[clienteAtualCardapio.codigo];
    
    if (cardapioData) {
        console.log('✅ Cardápio encontrado no banco para esta data, carregando...');
        carregarCardapioSalvo(cardapioData);
    } else {
        console.log('⚠️ Nenhum cardápio encontrado para esta data específica');
        limparTodasReceitas();
    }
}

// ===== CARREGAR CARDÁPIO SALVO DO BANCO PARA DATA ESPECÍFICA =====
function carregarCardapioSalvo(cardapioData) {
    console.log('🔄 Carregando cardápio salvo do banco para data específica:', cardapioData);
    
    // Iterar pelos tipos de refeição salvos
    Object.keys(cardapioData).forEach(tipoCodigo => {
        const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
        const header = document.getElementById(`header-${tipoCodigo}`);
        
        if (!receitasList) return;
        
        // Limpar lista atual
        receitasList.innerHTML = '';
        
        const receitas = cardapioData[tipoCodigo];
        if (!receitas || receitas.length === 0) return;
        
        // Mostrar cabeçalho
        if (header) {
            header.style.display = 'block';
        }
        
        // Carregar comensais no acordeão
        const expandableContent = receitasList.closest('.expandable-content');
        const comensaisInput = expandableContent?.querySelector('.comensais-input');
        if (comensaisInput && receitas[0]) {
            comensaisInput.value = receitas[0].comensais || 0;
        }
        
        // Adicionar cada receita salva
        receitas.forEach(receitaSalva => {
            const receita = receitasCarregadas.find(r => r.id === receitaSalva.receita_id);
            if (!receita) return;
            
            adicionarReceitaNaLista(receitasList, receita, tipoCodigo, receitaSalva);
        });
        
        console.log(`✅ Carregadas ${receitas.length} receitas para tipo ${tipoCodigo} na data ${dataAtualCardapio}`);
    });
}

// Limpar todas as receitas da interface
function limparTodasReceitas() {
    if (!clienteAtualCardapio) return;
    
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        const receitasList = document.getElementById(`receitas-list-${tipo.codigo}`);
        const header = document.getElementById(`header-${tipo.codigo}`);
        const expandableContent = receitasList?.closest('.expandable-content');
        const comensaisInput = expandableContent?.querySelector('.comensais-input');
        
        if (receitasList) {
            receitasList.innerHTML = '';
        }
        if (header) {
            header.style.display = 'none';
        }
        if (comensaisInput) {
            comensaisInput.value = '';
        }
    });
}

// Função auxiliar para adicionar receita na lista com dados salvos
function adicionarReceitaNaLista(receitasList, receita, tipoCodigo, dadosSalvos = null) {
    const receitaElement = document.createElement('div');
    receitaElement.className = 'receita-item-tabular';
    receitaElement.setAttribute('data-receita-codigo', receita.codigo);
    receitaElement.style.cssText = `
        display: grid;
        grid-template-columns: 2fr 120px 120px 120px 80px;
        gap: 10px;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        transition: all 0.2s ease;
    `;
    
    // Usar dados salvos se disponíveis, senão usar padrões
    const qtdeReceita = dadosSalvos ? dadosSalvos.quantidadePorPessoa : (receita.rendimento || 1);
    const numComensais = dadosSalvos ? dadosSalvos.comensais : 1;
    const totalCalculado = dadosSalvos ? dadosSalvos.totalPorComensais : 0;
    
    receitaElement.innerHTML = `
        <div style="font-weight: 500; color: #333; font-size: 14px;">
            ${receita.codigo} - ${receita.descricao}
        </div>
        <div style="text-align: center;">
            <input type="number" class="qtde-receita" value="${qtdeReceita}" min="0" step="0.001" 
                   onchange="atualizarQtdeReceita('${receita.codigo}', '${tipoCodigo}', this.value)"
                   style="width: 100%; padding: 6px 8px; border: 1px solid #ced4da; border-radius: 4px; text-align: center; font-size: 13px;">
            <small style="display: block; color: #666; font-size: 11px; margin-top: 2px;">${receita.unidade_rendimento || 'UN'}</small>
        </div>
        <div style="text-align: center;">
            <input type="number" class="num-comensais" value="${numComensais}" min="0" max="99999" step="1" 
                   onchange="atualizarNumComensais('${receita.codigo}', '${tipoCodigo}', this.value)"
                   style="width: 100%; padding: 6px 8px; border: 1px solid #ced4da; border-radius: 4px; text-align: center; font-size: 13px;">
        </div>
        <div style="text-align: center;">
            <div class="total-calculado" style="background: #e8f5e8; color: #2e7d32; padding: 8px 12px; border-radius: 6px; font-weight: 600; border: 2px solid #4caf50; font-size: 13px;">
                <span class="total-peso">${totalCalculado.toLocaleString('pt-BR', {minimumFractionDigits: 3, maximumFractionDigits: 3})}</span> KG
            </div>
        </div>
        <div style="text-align: center;">
            <button class="btn btn-danger btn-sm" onclick="removerReceitaCardapio('${receita.codigo}', '${tipoCodigo}')" 
                    style="padding: 4px 8px; font-size: 11px; width: 60px;">
                Excluir
            </button>
        </div>
    `;
    
    // Hover effect
    receitaElement.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    receitaElement.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    receitasList.appendChild(receitaElement);
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

// ===== ADICIONAR RECEITAS SELECIONADAS =====
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
    
    if (!dataAtualCardapio) {
        mostrarToast('Erro: Data não selecionada', 'error');
        return;
    }
    
    const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        mostrarToast('Selecione pelo menos uma receita', 'warning');
        return;
    }
    
    const receitasList = document.getElementById(`receitas-list-${tipoRefeicaoAtualCardapio}`);
    const header = document.getElementById(`header-${tipoRefeicaoAtualCardapio}`);
    
    if (!receitasList) {
        mostrarToast('Erro: Container de receitas não encontrado', 'error');
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
        
        const receitaExistente = receitasList.querySelector(`[data-receita-codigo="${receita.codigo}"]`);
        if (receitaExistente) {
            console.log('Receita já existe:', receita.codigo);
            return;
        }
        
        // Adicionar receita na lista usando a função auxiliar
        adicionarReceitaNaLista(receitasList, receita, tipoRefeicaoAtualCardapio);
        receitasAdicionadas++;
        
        console.log('Receita adicionada:', receita.descricao);
    });
    
    // Mostrar cabeçalho quando tem receitas
    if (receitasAdicionadas > 0 && header) {
        header.style.display = 'block';
        
        mostrarToast(`${receitasAdicionadas} receita(s) adicionada(s) para ${formatarDataBrasil(dataAtualCardapio)}!`, 'success');
        
        fecharModal('modalReceitas');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        const expandableContent = receitasList.closest('.expandable-content');
        const comensaisInput = expandableContent?.querySelector('.comensais-input');
        if (comensaisInput && comensaisInput.value > 0) {
            atualizarCalculosReceitasTipo(tipoRefeicaoAtualCardapio);
        }
    } else {
        mostrarToast('Nenhuma receita nova foi adicionada', 'info');
    }
}

// ===== FUNÇÕES DE ATUALIZAÇÃO =====

// Atualizar quantidade da receita
function atualizarQtdeReceita(receitaCodigo, tipoCodigo, quantidade) {
    console.log(`Atualizando qtde receita - Receita: ${receitaCodigo}, Tipo: ${tipoCodigo}, Qtd: ${quantidade}, Data: ${dataAtualCardapio}`);
    
    const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
    const receitaElement = receitasList?.querySelector(`[data-receita-codigo="${receitaCodigo}"]`);
    
    if (receitaElement) {
        const input = receitaElement.querySelector('.qtde-receita');
        if (input && input.value !== quantidade) {
            input.value = quantidade;
        }
        
        atualizarCalculosReceitasTipo(tipoCodigo);
        mostrarToast('Quantidade da receita atualizada!', 'success');
    }
}

// Atualizar número de comensais da receita
function atualizarNumComensais(receitaCodigo, tipoCodigo, numComensais) {
    console.log(`Atualizando nº comensais - Receita: ${receitaCodigo}, Tipo: ${tipoCodigo}, Comensais: ${numComensais}, Data: ${dataAtualCardapio}`);
    
    const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
    const receitaElement = receitasList?.querySelector(`[data-receita-codigo="${receitaCodigo}"]`);
    
    if (receitaElement) {
        const input = receitaElement.querySelector('.num-comensais');
        if (input && input.value !== numComensais) {
            input.value = numComensais;
        }
        
        atualizarCalculosReceitasTipo(tipoCodigo);
        mostrarToast('Número de comensais atualizado!', 'success');
    }
}

// Atualizar comensais no acordeão
function atualizarComensais(button) {
    const expandableContent = button.closest('.expandable-content');
    const comensaisInput = expandableContent.querySelector('.comensais-input');
    const receitasList = expandableContent.querySelector('[id^="receitas-list-"]');
    
    if (!comensaisInput || !receitasList) {
        mostrarToast('Erro: Não foi possível identificar o tipo de refeição', 'error');
        return;
    }
    
    const tipoCodigo = receitasList.id.replace('receitas-list-', '');
    const comensais = parseInt(comensaisInput.value) || 0;
    
    if (comensais <= 0) {
        mostrarToast('Informe um número válido de comensais', 'warning');
        comensaisInput.focus();
        return;
    }
    
    // Atualizar TODOS os campos "Nº comensais" das receitas deste tipo
    const receitasElements = receitasList.querySelectorAll('[data-receita-codigo]');
    
    if (receitasElements) {
        receitasElements.forEach(receitaElement => {
            const numComensaisInput = receitaElement.querySelector('.num-comensais');
            if (numComensaisInput) {
                numComensaisInput.value = comensais;
            }
        });
    }
    
    atualizarCalculosReceitasTipo(tipoCodigo);
    mostrarToast(`Comensais atualizados para ${comensais} em todas as receitas para ${formatarDataBrasil(dataAtualCardapio)}`, 'success');
}

// Cálculos com peso da receita
function atualizarCalculosReceitasTipo(tipoCodigo) {
    const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!receitasList) return;
    
    console.log(`🧮 Calculando receitas para tipo: ${tipoCodigo} na data: ${dataAtualCardapio}`);
    
    // Atualizar cada receita
    const receitasElements = receitasList.querySelectorAll('[data-receita-codigo]');
    receitasElements.forEach(receitaElement => {
        const qtdeReceita = parseFloat(receitaElement.querySelector('.qtde-receita').value) || 0;
        const numComensais = parseInt(receitaElement.querySelector('.num-comensais').value) || 0;
        
        // Cálculo: Qtde. receita x Nº comensais
        const totalCalculado = qtdeReceita * numComensais;
        
        const totalSpan = receitaElement.querySelector('.total-peso');
        if (totalSpan) {
            const totalFormatado = totalCalculado.toLocaleString('pt-BR', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3
            });
            totalSpan.textContent = totalFormatado;
        }
        
        console.log(`Receita calculada: ${qtdeReceita} x ${numComensais} = ${totalCalculado.toFixed(3)} KG`);
    });
    
    console.log(`✅ Cálculos atualizados para ${tipoCodigo} em ${dataAtualCardapio}`);
}

// ===== FUNÇÕES DE ATUALIZAÇÃO EM LOTE =====

// Atualizar todos os tipos com total de comensais
function atualizarParaTodos() {
    console.log(`🔄 Atualizando comensais para todos os tipos na data: ${dataAtualCardapio}...`);
    
    if (!dataAtualCardapio) {
        mostrarToast('Selecione uma data primeiro', 'error');
        return;
    }
    
    const totalComensaisInput = document.getElementById('totalComensais');
    if (!totalComensaisInput) {
        mostrarToast('Campo "Total Comensais" não encontrado', 'error');
        return;
    }
    
    const totalComensais = parseInt(totalComensaisInput.value) || 0;
    
    if (totalComensais <= 0) {
        mostrarToast('Informe um número válido de comensais', 'warning');
        totalComensaisInput.focus();
        return;
    }
    
    if (!clienteAtualCardapio || !clienteAtualCardapio.tiposRefeicao) {
        mostrarToast('Selecione um cliente primeiro', 'warning');
        return;
    }
    
    let tiposAtualizados = 0;
    
    // Atualizar todos os tipos de refeição
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        const receitasList = document.getElementById(`receitas-list-${tipo.codigo}`);
        if (!receitasList) return;
        
        // Atualizar campo comensais do acordeão
        const expandableContent = receitasList.closest('.expandable-content');
        const comensaisInput = expandableContent?.querySelector('.comensais-input');
        if (comensaisInput) {
            comensaisInput.value = totalComensais;
        }
        
        // Atualizar todos os campos "Nº comensais" das receitas deste tipo
        const receitasElements = receitasList.querySelectorAll('[data-receita-codigo]');
        receitasElements.forEach(receitaElement => {
            const numComensaisInput = receitaElement.querySelector('.num-comensais');
            if (numComensaisInput) {
                numComensaisInput.value = totalComensais;
            }
        });
        
        tiposAtualizados++;
    });
    
    mostrarToast(`✅ ${totalComensais} comensais aplicados a ${tiposAtualizados} tipos para ${formatarDataBrasil(dataAtualCardapio)}`, 'success');
}

// Calcular para todos os tipos
function calcularParaTodos() {
    console.log(`🧮 Calculando para todos os tipos na data: ${dataAtualCardapio}...`);
    
    if (!dataAtualCardapio) {
        mostrarToast('Selecione uma data primeiro', 'error');
        return;
    }
    
    if (!clienteAtualCardapio || !clienteAtualCardapio.tiposRefeicao) {
        mostrarToast('Selecione um cliente primeiro', 'warning');
        return;
    }
    
    let tiposCalculados = 0;
    let totalReceitas = 0;
    
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        const receitasList = document.getElementById(`receitas-list-${tipo.codigo}`);
        if (!receitasList) return;
        
        const receitasElements = receitasList.querySelectorAll('[data-receita-codigo]');
        if (receitasElements.length === 0) return;
        
        // Verificar se tem comensais definidos
        const expandableContent = receitasList.closest('.expandable-content');
        const comensaisInput = expandableContent?.querySelector('.comensais-input');
        const comensais = parseInt(comensaisInput?.value) || 0;
        
        if (comensais <= 0) {
            mostrarToast(`Defina comensais para ${tipo.descricao} antes de calcular`, 'warning');
            return;
        }
        
        atualizarCalculosReceitasTipo(tipo.codigo);
        tiposCalculados++;
        totalReceitas += receitasElements.length;
    });
    
    if (tiposCalculados > 0) {
        mostrarToast(`✅ Calculados ${tiposCalculados} tipos (${totalReceitas} receitas) para ${formatarDataBrasil(dataAtualCardapio)}`, 'success');
    } else {
        mostrarToast('Nenhum tipo de refeição foi calculado. Verifique se há receitas e comensais definidos.', 'warning');
    }
}

// ===== GRAVAÇÃO NO BANCO DE DADOS POR DATA =====

// Gravar para todos os tipos no banco de dados
async function gravarParaTodos() {
    console.log(`💾 Gravando cardápio para todos os tipos na data: ${dataAtualCardapio}...`);
    
    if (!dataAtualCardapio) {
        mostrarToast('Selecione uma data primeiro', 'error');
        return;
    }
    
    if (!clienteAtualCardapio) {
        mostrarToast('Selecione um cliente primeiro', 'error');
        return;
    }
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        let totalGravados = 0;
        let totalReceitas = 0;
        
        // Processar cada tipo de refeição
        for (const tipo of clienteAtualCardapio.tiposRefeicao) {
            const receitasList = document.getElementById(`receitas-list-${tipo.codigo}`);
            if (!receitasList) continue;
            
            const receitasElements = receitasList.querySelectorAll('[data-receita-codigo]');
            if (receitasElements.length === 0) continue;
            
            // Verificar comensais
            const expandableContent = receitasList.closest('.expandable-content');
            const comensaisInput = expandableContent?.querySelector('.comensais-input');
            const comensais = parseInt(comensaisInput?.value) || 0;
            
            if (comensais <= 0) {
                console.warn(`Tipo ${tipo.descricao} sem comensais definidos, pulando...`);
                continue;
            }
            
            // ✅ PRIMEIRO: REMOVER RECEITAS EXISTENTES PARA ESTA DATA/CLIENTE/TIPO
            await window.supabase
                .from('cardapios')
                .delete()
                .eq('data', dataAtualCardapio)
                .eq('cliente_id', clienteAtualCardapio.id)
                .eq('tipo_refeicao_id', tipo.id)
                .eq('user_id', user.id);
            
            // Gravar cada receita deste tipo
            for (const receitaElement of receitasElements) {
                const receitaCodigo = receitaElement.getAttribute('data-receita-codigo');
                const receita = receitasCarregadas.find(r => r.codigo === receitaCodigo);
                
                if (!receita) continue;
                
                const qtdeReceita = parseFloat(receitaElement.querySelector('.qtde-receita').value) || 0;
                const numComensais = parseInt(receitaElement.querySelector('.num-comensais').value) || 0;
                const totalCalculado = qtdeReceita * numComensais;
                
                // Preparar dados para gravar
                const cardapioData = {
                    data: dataAtualCardapio, // ✅ DATA ESPECÍFICA
                    cliente_id: clienteAtualCardapio.id,
                    tipo_refeicao_id: tipo.id,
                    receita_id: receita.id,
                    comensais: comensais,
                    quantidade_por_pessoa: qtdeReceita,
                    total_por_comensais: totalCalculado,
                    unidade_basica: receita.unidade_rendimento || 'UN',
                    alterada: false,
                    user_id: user.id
                };
                
                console.log(`💾 Gravando no banco para data ${dataAtualCardapio}:`, cardapioData);
                
                // Inserir novo registro
                const result = await window.supabase
                    .from('cardapios')
                    .insert([cardapioData]);
                
                if (result.error) {
                    console.error('❌ Erro ao gravar receita:', result.error);
                    throw result.error;
                } else {
                    console.log('✅ Receita gravada no banco com sucesso');
                    totalReceitas++;
                }
            }
            
            totalGravados++;
        }
        
        if (totalGravados > 0) {
            mostrarToast(`✅ Cardápio gravado para ${formatarDataBrasil(dataAtualCardapio)}! ${totalGravados} tipos, ${totalReceitas} receitas`, 'success');
            await carregarCardapios(); // Recarregar para atualizar dados
        } else {
            mostrarToast('Nenhum item foi gravado. Verifique se há receitas e comensais definidos.', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Erro ao gravar cardápio no banco:', error);
        mostrarToast('Erro ao gravar cardápio: ' + error.message, 'error');
    }
}

// Calcular tipo de refeição individual
function calcularTipoRefeicao(tipoCodigo) {
    console.log(`🧮 Calculando tipo de refeição: ${tipoCodigo} para data: ${dataAtualCardapio}`);
    
    const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!receitasList) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }
    
    const expandableContent = receitasList.closest('.expandable-content');
    const comensaisInput = expandableContent?.querySelector('.comensais-input');
    const comensais = parseInt(comensaisInput?.value) || 0;
    
    if (comensais <= 0) {
        mostrarToast('Defina o número de comensais antes de calcular', 'warning');
        comensaisInput?.focus();
        return;
    }
    
    const receitasElements = receitasList.querySelectorAll('[data-receita-codigo]');
    if (receitasElements.length === 0) {
        mostrarToast('Adicione receitas antes de calcular', 'warning');
        return;
    }
    
    atualizarCalculosReceitasTipo(tipoCodigo);
    mostrarToast(`Cálculos realizados para ${formatarDataBrasil(dataAtualCardapio)}!`, 'success');
}

// Gravar tipo de refeição individual no banco
async function gravarTipoRefeicao(tipoCodigo) {
    console.log(`💾 Gravando tipo de refeição: ${tipoCodigo} para data: ${dataAtualCardapio}...`);
    
    if (!dataAtualCardapio) {
        mostrarToast('Selecione uma data primeiro', 'error');
        return;
    }
    
    if (!clienteAtualCardapio) {
        mostrarToast('Selecione um cliente primeiro', 'error');
        return;
    }
    
    const tipo = clienteAtualCardapio.tiposRefeicao.find(t => t.codigo === tipoCodigo);
    if (!tipo) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }
    
    const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
    const receitasElements = receitasList?.querySelectorAll('[data-receita-codigo]');
    
    if (!receitasElements || receitasElements.length === 0) {
        mostrarToast('Adicione receitas antes de gravar', 'warning');
        return;
    }
    
    const expandableContent = receitasList.closest('.expandable-content');
    const comensaisInput = expandableContent?.querySelector('.comensais-input');
    const comensais = parseInt(comensaisInput?.value) || 0;
    
    if (comensais <= 0) {
        mostrarToast('Defina o número de comensais antes de gravar', 'warning');
        return;
    }
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        // ✅ PRIMEIRO: REMOVER RECEITAS EXISTENTES PARA ESTA DATA/CLIENTE/TIPO
        await window.supabase
            .from('cardapios')
            .delete()
            .eq('data', dataAtualCardapio)
            .eq('cliente_id', clienteAtualCardapio.id)
            .eq('tipo_refeicao_id', tipo.id)
            .eq('user_id', user.id);
        
        let receitasGravadas = 0;
        
        for (const receitaElement of receitasElements) {
            const receitaCodigo = receitaElement.getAttribute('data-receita-codigo');
            const receita = receitasCarregadas.find(r => r.codigo === receitaCodigo);
            
            if (!receita) continue;
            
            const qtdeReceita = parseFloat(receitaElement.querySelector('.qtde-receita').value) || 0;
            const numComensais = parseInt(receitaElement.querySelector('.num-comensais').value) || 0;
            const totalCalculado = qtdeReceita * numComensais;
            
            const cardapioData = {
                data: dataAtualCardapio, // ✅ DATA ESPECÍFICA
                cliente_id: clienteAtualCardapio.id,
                tipo_refeicao_id: tipo.id,
                receita_id: receita.id,
                comensais: comensais,
                quantidade_por_pessoa: qtdeReceita,
                total_por_comensais: totalCalculado,
                unidade_basica: receita.unidade_rendimento || 'UN',
                alterada: false,
                user_id: user.id
            };
            
            console.log(`💾 Gravando receita individual para data ${dataAtualCardapio}:`, cardapioData);
            
            const result = await window.supabase
                .from('cardapios')
                .insert([cardapioData]);
            
            if (result.error) {
                console.error('Erro ao gravar receita:', result.error);
                throw result.error;
            } else {
                receitasGravadas++;
            }
        }
        
        if (receitasGravadas > 0) {
            mostrarToast(`✅ ${receitasGravadas} receita(s) gravada(s) para ${tipo.descricao} em ${formatarDataBrasil(dataAtualCardapio)}`, 'success');
            await carregarCardapios(); // Recarregar dados
        } else {
            mostrarToast('Nenhuma receita foi gravada', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Erro ao gravar tipo de refeição no banco:', error);
        mostrarToast('Erro ao gravar: ' + error.message, 'error');
    }
}

// Remover receita do cardápio
function removerReceitaCardapio(receitaCodigo, tipoCodigo) {
    if (!confirm('Tem certeza que deseja remover esta receita?')) {
        return;
    }
    
    const receitasList = document.getElementById(`receitas-list-${tipoCodigo}`);
    const receitaElement = receitasList?.querySelector(`[data-receita-codigo="${receitaCodigo}"]`);
    const header = document.getElementById(`header-${tipoCodigo}`);
    
    if (receitaElement) {
        receitaElement.remove();
        mostrarToast(`Receita removida para ${formatarDataBrasil(dataAtualCardapio)}!`, 'success');
        atualizarCalculosReceitasTipo(tipoCodigo);
        
        // Esconder cabeçalho se não tem mais receitas
        const receitasRestantes = receitasList.querySelectorAll('[data-receita-codigo]');
        if (receitasRestantes.length === 0 && header) {
            header.style.display = 'none';
        }
    }
}

// ===== FUNÇÕES AUXILIARES =====

// Formatar data para padrão brasileiro
function formatarDataBrasil(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
}

// Carregar dados do cardápio para data específica (compatibilidade)
function carregarCardapioData() {
    carregarCardapioParaDataAtual();
}

// Fechar modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Toast notification system
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${tipo}`;
    
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
    
    document.body.appendChild(toast);
    
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
window.atualizarQtdeReceita = atualizarQtdeReceita;
window.atualizarNumComensais = atualizarNumComensais;
window.atualizarCalculosReceitasTipo = atualizarCalculosReceitasTipo;
window.mostrarToast = mostrarToast;

console.log('✅ cardapio.js CORRIGIDO - Sistema funciona corretamente por data específica!');