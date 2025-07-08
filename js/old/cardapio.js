// cardapio.js - Sistema de Cardápios TOTALMENTE CORRIGIDO

console.log('📁 Carregando cardapio.js CORRIGIDO...');

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

// ===== SISTEMA DE INICIALIZAÇÃO ORDENADA =====
window.sistemaCardapioInicializado = false;
window.dependenciasCarregadas = {
    supabase: false,
    calendario: false,
    cardapio: false,
    configuracao: false
};

// ===== FUNÇÃO: Aguardar dependências =====
function aguardarDependencias(callback, tentativas = 0, maxTentativas = 50) {
    console.log(`⏳ Aguardando dependências... Tentativa ${tentativas + 1}`);
    
    // Verificar Supabase
    const supabaseOK = window.supabase && window.supabase.auth;
    
    // Verificar Calendário
    const calendarioOK = typeof window.inicializarCalendarioSistema === 'function';
    
    // Log do status
    console.log('📊 Status das dependências:', {
        supabase: supabaseOK,
        calendario: calendarioOK,
        tentativa: tentativas + 1
    });
    
    // Verificar se todas estão prontas
    if (supabaseOK) {
        console.log('✅ Dependências principais carregadas!');
        
        // Atualizar flags
        window.dependenciasCarregadas.supabase = true;
        window.dependenciasCarregadas.calendario = calendarioOK;
        window.dependenciasCarregadas.cardapio = true;
        
        // Executar callback
        callback();
        return true;
    }
    
    // Tentar novamente se não atingiu o limite
    if (tentativas < maxTentativas) {
        setTimeout(() => {
            aguardarDependencias(callback, tentativas + 1, maxTentativas);
        }, 200);
    } else {
        console.error('❌ Timeout: Dependências não carregaram no tempo esperado');
        console.log('📋 Status final:', {
            supabase: supabaseOK,
            calendario: calendarioOK
        });
        
        // Tentar inicializar mesmo assim
        console.log('⚠️ Tentando inicializar com dependências parciais...');
        callback();
    }
    
    return false;
}

// ===== FUNÇÃO: Inicialização segura do sistema =====
async function inicializarSistemaSeguro() {
    if (window.sistemaCardapioInicializado) {
        console.log('⚠️ Sistema já inicializado');
        return;
    }
    
    console.log('🚀 Iniciando sistema de cardápio seguro...');
    
    try {
        // ✅ PASSO 1: Verificar e aguardar autenticação
        if (window.supabase && window.supabase.auth) {
            console.log('🔐 Verificando autenticação...');
            
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                console.warn('⚠️ Usuário não autenticado');
                if (typeof mostrarToast === 'function') {
                    mostrarToast('Você precisa estar logado para acessar esta página.', 'error');
                }
                window.location.href = 'login.html';
                return;
            }
            console.log('✅ Usuário autenticado');
        }
        
        // ✅ PASSO 2: Carregar dados básicos
        console.log('📥 Carregando dados iniciais...');
        await carregarDadosIniciais();
        
        // ✅ PASSO 3: Configurar interface
        console.log('🎨 Configurando interface...');
        await carregarClientesCardapio();
        configurarEventos();
        
        // ✅ PASSO 4: Inicializar calendário
        console.log('📅 Inicializando calendário...');
        if (typeof inicializarCalendarioSistema === 'function') {
            const sucessoCalendario = inicializarCalendarioSistema();
            if (sucessoCalendario) {
                console.log('✅ Calendário inicializado');
            } else {
                console.warn('⚠️ Problema na inicialização do calendário');
            }
        }
        
        // ✅ PASSO 5: Configurar data atual
        console.log('📅 Configurando data atual...');
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        
        const inputData = document.getElementById('dataCardapio');
        if (inputData) {
            inputData.value = hojeStr;
            dataAtualCardapio = hojeStr;
            console.log(`📅 Data configurada: ${hojeStr}`);
        }
        
        if (typeof atualizarIndicadorData === 'function') {
            atualizarIndicadorData();
        }
        
        // ✅ PASSO 6: Forçar atualização do calendário
        console.log('🔄 Atualizando calendário...');
        if (typeof forcarAtualizacaoCalendario === 'function') {
            setTimeout(() => {
                forcarAtualizacaoCalendario();
            }, 500);
        }
        
        // ✅ MARCAR COMO INICIALIZADO
        window.sistemaCardapioInicializado = true;
        window.dependenciasCarregadas.configuracao = true;
        
        console.log('✅ Sistema de cardápio inicializado com sucesso!');
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('✅ Sistema carregado com sucesso!', 'success', 3000);
        }
        
    } catch (error) {
        console.error('❌ Erro durante inicialização:', error);
        if (typeof mostrarToast === 'function') {
            mostrarToast('❌ Erro ao carregar sistema: ' + error.message, 'error');
        }
    }
}

// ===== FUNÇÃO: Verificar se sistema pode inicializar =====
function podeInicializarSistema() {
    const tabCardapio = document.getElementById('cardapio');
    const estaAtivo = tabCardapio && !tabCardapio.classList.contains('hidden');
    
    console.log('🔍 Verificando se pode inicializar:', {
        tabExists: !!tabCardapio,
        isActive: estaAtivo,
        jaInicializado: window.sistemaCardapioInicializado
    });
    
    return estaAtivo && !window.sistemaCardapioInicializado;
}

// ===== FUNÇÃO: Inicialização condicional =====
function inicializarSeNecessario() {
    if (podeInicializarSistema()) {
        console.log('🎯 Inicializando sistema de cardápio...');
        
        aguardarDependencias(() => {
            inicializarSistemaSeguro();
        });
    } else {
        console.log('⏭️ Inicialização não necessária no momento');
    }
}

// ===== FUNÇÃO PRINCIPAL: INICIALIZAR CARDÁPIO =====
async function inicializarCardapio() {
    if (cardapioInicializado) {
        console.log('⚠️ Cardápio já inicializado');
        return;
    }

    console.log('🚀 Inicializando cardápio...');
    
    try {
        if (!await verificarAutenticacao()) {
            return;
        }
        
        console.log('📥 Carregando dados do cardápio...');
        await carregarDadosIniciais();
        await carregarClientesCardapio();
        
        configurarEventos();
        
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

// ===== CARREGAR CLIENTES =====
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

// ===== CARREGAR CARDÁPIOS =====
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

// ===== FUNÇÃO CORRIGIDA: CARREGAR CARDÁPIO POR DATA =====
function carregarCardapioData() {
    const dataInput = document.getElementById('dataCardapio');
    if (!dataInput) return;
    
    const novaData = dataInput.value;
    const dataAnterior = dataAtualCardapio;
    
    console.log(`📅 Data alterada de ${dataAnterior} para ${novaData}`);
    
    // ✅ ATUALIZAR VARIÁVEL GLOBAL
    dataAtualCardapio = novaData;
    
    // ✅ ATUALIZAR INDICADOR VISUAL
    atualizarIndicadorData();
    
    // ✅ RECARREGAR CARDÁPIO
    setTimeout(() => {
        carregarCardapioParaDataAtual();
        
        // ✅ ATUALIZAR CALENDÁRIO
        if (typeof forcarAtualizacaoCalendario === 'function') {
            setTimeout(() => {
                forcarAtualizacaoCalendario();
            }, 200);
        }
    }, 100);
}

// ===== FUNÇÃO CORRIGIDA: CARREGAR CARDÁPIO PARA DATA ATUAL =====
function carregarCardapioParaDataAtual() {
    console.log('📅 carregarCardapioParaDataAtual() chamada');
    
    if (!dataAtualCardapio || !clienteAtualCardapio) {
        console.log('⚠️ Data ou cliente não definidos:', {
            data: dataAtualCardapio,
            cliente: clienteAtualCardapio?.codigo || 'null'
        });
        
        // ✅ LIMPAR INTERFACE
        limparInterfaceCardapio();
        return;
    }
    
    console.log(`📅 Carregando cardápio para data: ${dataAtualCardapio}, cliente: ${clienteAtualCardapio.codigo}`);
    
    // ✅ LIMPAR RECEITAS TEMPORÁRIAS
    receitasTemporarias = {};
    console.log('🧹 Receitas temporárias limpas');
    
    // ✅ VERIFICAR SE EXISTE CARDÁPIO
    const cardapioData = cardapiosCarregados[dataAtualCardapio]?.[clienteAtualCardapio.codigo];
    
    if (cardapioData && Object.keys(cardapioData).length > 0) {
        console.log('✅ Cardápio encontrado para a data, carregando...', cardapioData);
        
        // Carregar cardápios existentes
        Object.keys(cardapioData).forEach(tipoCodigo => {
            const receitasTipo = cardapioData[tipoCodigo];
            
            if (receitasTipo && receitasTipo.length > 0) {
                // ✅ ARMAZENAR EM RECEITAS TEMPORÁRIAS
                receitasTemporarias[tipoCodigo] = [...receitasTipo];
                console.log(`📋 Carregado tipo ${tipoCodigo}: ${receitasTipo.length} receitas`);
                
                // ✅ ATUALIZAR INTERFACE
                atualizarInterfaceTipo(tipoCodigo, receitasTipo);
            }
        });
        
        console.log('✅ Cardápio carregado com sucesso para data:', dataAtualCardapio);
        
    } else {
        console.log('ℹ️ Nenhum cardápio encontrado para esta data - interface limpa');
        limparInterfaceCardapio();
    }
    
    // ✅ FORÇAR ATUALIZAÇÃO VISUAL
    setTimeout(() => {
        atualizarInterfaceCompleta();
    }, 100);
}

// ===== FUNÇÃO: LIMPAR INTERFACE =====
function limparInterfaceCardapio() {
    console.log('🧹 Limpando interface do cardápio...');
    
    if (!clienteAtualCardapio?.tiposRefeicao) {
        console.log('⚠️ Cliente não possui tipos de refeição');
        return;
    }
    
    // Limpar cada tipo de refeição
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        const container = document.getElementById(`receitas-list-${tipo.codigo}`);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                    📝 Nenhuma receita cadastrada para esta data<br>
                    <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
                </div>
            `;
        }
        
        const comensaisInput = document.getElementById(`comensais-${tipo.codigo}`);
        if (comensaisInput) {
            comensaisInput.value = '';
        }
    });
    
    const totalComensaisInput = document.getElementById('totalComensais');
    if (totalComensaisInput) {
        totalComensaisInput.value = '';
    }
}

// ===== FUNÇÃO: ATUALIZAR INTERFACE DE UM TIPO =====
function atualizarInterfaceTipo(tipoCodigo, receitasTipo) {
    console.log(`🔄 Atualizando interface do tipo: ${tipoCodigo}`);
    
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (container) {
        // ✅ USAR FUNÇÃO DE RENDERIZAÇÃO
        setTimeout(() => {
            if (typeof renderizarReceitasDoTipoEditavel === 'function') {
                renderizarReceitasDoTipoEditavel(tipoCodigo);
            } else {
                renderizarReceitasBasico(tipoCodigo, receitasTipo);
            }
        }, 50);
    }
    
    // ✅ ATUALIZAR COMENSAIS
    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
    if (comensaisInput && receitasTipo && receitasTipo.length > 0) {
        const primeiraReceita = receitasTipo[0];
        if (primeiraReceita.comensais) {
            comensaisInput.value = primeiraReceita.comensais;
        }
    }
}

// ===== FUNÇÃO: RENDERIZAÇÃO BÁSICA =====
function renderizarReceitasBasico(tipoCodigo, receitasTipo) {
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!receitasTipo || receitasTipo.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                📝 Nenhuma receita adicionada<br>
                <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
            </div>
        `;
        return;
    }
    
    receitasTipo.forEach(receita => {
        const div = document.createElement('div');
        div.className = 'receita-item-tabular';
        div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
        
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
        `;
        
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        const unidadeRendimento = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        div.innerHTML = `
            <div style="font-weight: 500; color: #333; font-size: 14px;">
                ${receita.codigo} - ${receita.descricao}
            </div>
            <div style="text-align: center;">
                <span style="padding: 4px 8px; background: #e7f3ff; color: #0066cc; border-radius: 4px; font-weight: 600;">
                    ${receita.comensais || 0}
                </span>
            </div>
            <div style="text-align: center;">
                <span style="font-weight: 500;">
                    ${(receita.quantidadePorPessoa || 0).toFixed(3)} ${unidadeRendimento}
                </span>
            </div>
            <div style="text-align: center;">
                <span style="padding: 6px 10px; background: #e8f5e8; color: #2e7d32; border-radius: 6px; font-weight: 600;">
                    ${(receita.totalPorComensais || 0).toFixed(3)} ${unidadeRendimento}
                </span>
            </div>
            <div style="text-align: center;">
                <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 11px; width: 60px;">
                    Excluir
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ===== FUNÇÃO: ATUALIZAR INTERFACE COMPLETA =====
function atualizarInterfaceCompleta() {
    console.log('🔄 Atualizando interface completa...');
    
    if (!clienteAtualCardapio?.tiposRefeicao) {
        console.log('⚠️ Cliente não definido para atualização completa');
        return;
    }
    
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        if (receitasTemporarias[tipo.codigo]) {
            if (typeof renderizarReceitasDoTipoEditavel === 'function') {
                renderizarReceitasDoTipoEditavel(tipo.codigo);
            } else {
                renderizarReceitasBasico(tipo.codigo, receitasTemporarias[tipo.codigo]);
            }
        } else {
            const container = document.getElementById(`receitas-list-${tipo.codigo}`);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                        📝 Nenhuma receita cadastrada para esta data<br>
                        <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
                    </div>
                `;
            }
        }
    });
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

// ===== FUNÇÃO: CARREGAR TIPOS DE REFEIÇÃO DO CLIENTE =====
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
                    <label>Comensais para ${tipo.descricao}:</label>
                    <input type="number" 
                           id="comensais-${tipo.codigo}" 
                           class="comensais-input" 
                           min="1" 
                           max="99999" 
                           placeholder="0"
                           value="">
                    <button class="btn btn-primary compact-btn" onclick="executarAtualizacaoECalculoFinal('${tipo.codigo}')">
                        📝 Atualizar e Calcular
                    </button>
                </div>

                <div class="actions" style="margin: 15px 0; padding: 15px 0; border-top: 1px solid #e9ecef;">
                    <button class="btn btn-primary compact-btn" onclick="abrirModalReceitasTipo('${tipo.codigo}')">
                        ➕ Adicionar Receitas
                    </button>
                </div>

                <div class="receitas-header visible">
                    <div class="receitas-header-grid" style="display: grid; grid-template-columns: 2fr 120px 150px 150px 80px; gap: 10px; font-weight: 600; color: #495057; font-size: 13px; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                        <div style="text-align: left;">Receita</div>
                        <div style="text-align: center;">Comensais</div>
                        <div style="text-align: center;">Rend. Receita</div>
                        <div style="text-align: center;">Total</div>
                        <div style="text-align: center;">Ações</div>
                    </div>
                </div>

                <div id="receitas-list-${tipo.codigo}" class="receitas-container"></div>
            </div>
        `;
        container.appendChild(expandable);
    });
    
    carregarCardapioParaDataAtual();
}

// ===== FUNÇÃO PRINCIPAL: ATUALIZAR E CALCULAR =====
function executarAtualizacaoECalculoFinal(tipoCodigo) {
    console.log(`🔄 [FINAL] Executando atualização e cálculo para tipo: ${tipoCodigo}`);
    
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
    
    // ✅ VERIFICAR SE TEM RECEITAS
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        mostrarToast(`ℹ️ Comensais definido para ${comensaisGlobal}. Adicione receitas para aplicar o cálculo.`, 'info');
        return;
    }
    
    // ✅ APLICAR COMENSAIS E CALCULAR
    let receitasProcessadas = 0;
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        // Buscar dados da receita original
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        
        if (receitaOriginal && receitaOriginal.rendimento > 0) {
            // ✅ CÁLCULO: comensais × rendimento da receita
            const rendimento = parseFloat(receitaOriginal.rendimento) || 0;
            const total = comensaisGlobal * rendimento;
            
            // Atualizar receita
            receita.comensais = comensaisGlobal;
            receita.quantidadePorPessoa = rendimento;
            receita.totalPorComensais = total;
            receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
            receita.alterada = true;
            
            console.log(`✅ Receita ${receita.codigo}: ${comensaisGlobal} × ${rendimento} = ${total}`);
            receitasProcessadas++;
        }
    });
    
    if (receitasProcessadas > 0) {
        mostrarToast(`✅ ${receitasProcessadas} receita(s) calculadas com ${comensaisGlobal} comensais!`, 'success');
        
        // ✅ RE-RENDERIZAR
        setTimeout(() => {
            if (typeof renderizarReceitasDoTipoEditavel === 'function') {
                renderizarReceitasDoTipoEditavel(tipoCodigo);
            } else {
                renderizarReceitasBasico(tipoCodigo, receitasTemporarias[tipoCodigo]);
            }
            
            // ✅ ATUALIZAR CALENDÁRIO
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

// ===== FUNÇÕES DE MODAL DE RECEITAS =====

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
        adicionadas++;
    });
    
    if (adicionadas > 0) {
        mostrarToast(`✅ ${adicionadas} receita(s) adicionada(s) com sucesso!`, 'success');
        fecharModal('modalReceitas');
        
        // ✅ RE-RENDERIZAR
        setTimeout(() => {
            if (typeof renderizarReceitasDoTipoEditavel === 'function') {
                renderizarReceitasDoTipoEditavel(tipoCodigo);
            } else {
                renderizarReceitasBasico(tipoCodigo, receitasTemporarias[tipoCodigo]);
            }
            
            // ✅ ATUALIZAR CALENDÁRIO
            if (typeof forcarAtualizacaoCalendario === 'function') {
                setTimeout(() => {
                    forcarAtualizacaoCalendario();
                }, 300);
            }
        }, 100);
    }
}

// ===== FUNÇÃO: REMOVER RECEITA =====
async function removerReceita(tipoCodigo, receitaId) {
    console.log(`🗑️ Removendo receita ${receitaId} do tipo ${tipoCodigo}`);
    
    const receita = receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receitaId);
    if (!receita) {
        mostrarToast('Receita não encontrada', 'error');
        return;
    }
    
    const confirmar = confirm(`❓ Confirmar remoção?\n\nReceita: ${receita.codigo} - ${receita.descricao}\n\nEsta ação será salva no banco de dados.`);
    if (!confirmar) {
        return;
    }
    
    try {
        if (!clienteAtualCardapio || !dataAtualCardapio) {
            mostrarToast('❌ Cliente ou data não selecionados', 'error');
            return;
        }
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            mostrarToast('❌ Usuário não autenticado', 'error');
            return;
        }
        
        const tipoRefeicao = clienteAtualCardapio.tiposRefeicao.find(t => t.codigo === tipoCodigo);
        if (!tipoRefeicao) {
            mostrarToast('❌ Tipo de refeição não encontrado', 'error');
            return;
        }
        
        // ✅ REMOVER DO BANCO
        const { error } = await window.supabase
            .from('cardapios')
            .delete()
            .eq('user_id', user.id)
            .eq('cliente_id', clienteAtualCardapio.id)
            .eq('tipo_refeicao_id', tipoRefeicao.id)
            .eq('receita_id', receitaId)
            .eq('data', dataAtualCardapio);
        
        if (error) {
            console.error('❌ Erro ao remover do banco:', error);
            mostrarToast(`❌ Erro ao remover do banco: ${error.message}`, 'error');
            return;
        }
        
        // ✅ REMOVER DA MEMÓRIA
        if (receitasTemporarias[tipoCodigo]) {
            receitasTemporarias[tipoCodigo] = receitasTemporarias[tipoCodigo].filter(r => r.receita_id !== receitaId);
        }
        
        // ✅ REMOVER ELEMENTO VISUAL
        const elemento = document.getElementById(`receita-${tipoCodigo}-${receitaId}`);
        if (elemento) {
            elemento.style.transition = 'all 0.3s ease';
            elemento.style.transform = 'translateX(-100%)';
            elemento.style.opacity = '0';
            
            setTimeout(() => {
                elemento.remove();
            }, 300);
        }
        
        // ✅ ATUALIZAR DADOS GLOBAIS
        if (window.cardapiosCarregados && window.cardapiosCarregados[dataAtualCardapio]) {
            const clienteCodigo = clienteAtualCardapio.codigo;
            if (window.cardapiosCarregados[dataAtualCardapio][clienteCodigo] && 
                window.cardapiosCarregados[dataAtualCardapio][clienteCodigo][tipoCodigo]) {
                
                window.cardapiosCarregados[dataAtualCardapio][clienteCodigo][tipoCodigo] = 
                    window.cardapiosCarregados[dataAtualCardapio][clienteCodigo][tipoCodigo]
                        .filter(r => r.receita_id !== receitaId);
            }
        }
        
        mostrarToast(`✅ Receita "${receita.codigo}" removida com sucesso!`, 'success');
        
        // ✅ ATUALIZAR CALENDÁRIO
        if (typeof forcarAtualizacaoCalendario === 'function') {
            setTimeout(() => {
                forcarAtualizacaoCalendario();
            }, 500);
        }
        
        // ✅ RE-RENDERIZAR SE VAZIO
        setTimeout(() => {
            if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
                const container = document.getElementById(`receitas-list-${tipoCodigo}`);
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                            📝 Nenhuma receita adicionada<br>
                            <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
                        </div>
                    `;
                }
            }
        }, 400);
        
    } catch (error) {
        console.error('❌ Erro durante remoção:', error);
        mostrarToast(`❌ Erro ao remover receita: ${error.message}`, 'error');
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
                executarAtualizacaoECalculoFinal(tipo.codigo);
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
                const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
                if (receitaOriginal && receitaOriginal.rendimento > 0 && receita.comensais > 0) {
                    const rendimento = parseFloat(receitaOriginal.rendimento);
                    receita.quantidadePorPessoa = rendimento;
                    receita.totalPorComensais = receita.comensais * rendimento;
                    totalCalculado++;
                }
            });
        }
    });
    
    if (totalCalculado > 0) {
        mostrarToast(`✅ ${totalCalculado} receitas calculadas com sucesso!`, 'success');
        
        // Re-renderizar todos os tipos
        clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
            if (typeof renderizarReceitasDoTipoEditavel === 'function') {
                renderizarReceitasDoTipoEditavel(tipo.codigo);
            } else {
                renderizarReceitasBasico(tipo.codigo, receitasTemporarias[tipo.codigo]);
            }
        });
    } else {
        mostrarToast('Nenhuma receita para calcular', 'info');
    }
}

// ===== GRAVAR PARA TODOS =====
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
            
            // ✅ RECARREGAR DADOS E ATUALIZAR CALENDÁRIO
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

function abrirVisualizacaoSemanal() {
    mostrarToast('Visualização semanal em desenvolvimento', 'info');
}

// ===== FUNÇÃO DE DEBUG =====
function debugEstadoCardapio() {
    console.log('🔍 DEBUG - Estado atual do cardápio:');
    console.log('📅 Data atual:', dataAtualCardapio);
    console.log('👤 Cliente atual:', clienteAtualCardapio?.codigo || 'null');
    console.log('📋 Receitas temporárias:', receitasTemporarias);
    console.log('🗓️ Cardápios carregados:', cardapiosCarregados);
    
    if (dataAtualCardapio && clienteAtualCardapio) {
        const cardapioData = cardapiosCarregados[dataAtualCardapio]?.[clienteAtualCardapio.codigo];
        console.log('📊 Cardápio para data/cliente atual:', cardapioData || 'VAZIO');
    }
    
    return {
        dependenciasOK: Object.values(window.dependenciasCarregadas).every(x => x),
        elementosOK: !!(document.getElementById('dataCardapio') && document.getElementById('clienteCardapio')),
        funcoesOK: typeof window.executarAtualizacaoECalculoFinal === 'function'
    };
}

// ===== OBSERVADOR DE MUDANÇAS NA INTERFACE =====
function observarMudancasInterface() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const tabCardapio = document.getElementById('cardapio');
                if (tabCardapio && !tabCardapio.classList.contains('hidden')) {
                    console.log('👁️ Aba de cardápio ativada');
                    setTimeout(() => {
                        inicializarSeNecessario();
                    }, 200);
                }
            }
        });
    });
    
    const tabCardapio = document.getElementById('cardapio');
    if (tabCardapio) {
        observer.observe(tabCardapio, { attributes: true });
        console.log('👁️ Observer de interface configurado');
    }
}

// ===== EXPORTAR FUNÇÕES PRINCIPAIS =====
window.inicializarCardapio = inicializarCardapio;
window.inicializarSistemaSeguro = inicializarSistemaSeguro;
window.aguardarDependencias = aguardarDependencias;
window.debugEstadoCardapio = debugEstadoCardapio;
window.inicializarSeNecessario = inicializarSeNecessario;

// ===== EXPORTAR FUNÇÕES DE INTERFACE =====
window.carregarTiposRefeicaoCliente = carregarTiposRefeicaoCliente;
window.carregarCardapioData = carregarCardapioData;
window.carregarCardapioParaDataAtual = carregarCardapioParaDataAtual;
window.limparInterfaceCardapio = limparInterfaceCardapio;
window.atualizarInterfaceTipo = atualizarInterfaceTipo;
window.atualizarInterfaceCompleta = atualizarInterfaceCompleta;

// ===== EXPORTAR FUNÇÕES DE MODAL =====
window.abrirModalReceitasTipo = abrirModalReceitasTipo;
window.adicionarReceitasSelecionadas = adicionarReceitasSelecionadas;
window.filtrarReceitas = filtrarReceitas;

// ===== EXPORTAR FUNÇÕES DE AÇÃO =====
window.executarAtualizacaoECalculoFinal = executarAtualizacaoECalculoFinal;
window.removerReceita = removerReceita;
window.atualizarParaTodos = atualizarParaTodos;
window.calcularParaTodos = calcularParaTodos;
window.gravarParaTodos = gravarParaTodos;

// ===== EXPORTAR FUNÇÕES AUXILIARES =====
window.toggleExpandable = toggleExpandable;
window.fecharModal = fecharModal;
window.abrirModalImpressao = abrirModalImpressao;
window.abrirVisualizacaoSemanal = abrirVisualizacaoSemanal;
window.formatarDataBrasil = formatarDataBrasil;

// ===== ALIASES PARA COMPATIBILIDADE =====
window.toggleCalendar = window.toggleCalendarioSistema;
window.mudarMes = window.mudarMesCalendario;
window.selecionarDia = window.selecionarDiaCalendarioSeguro;
window.atualizarCalendario = window.atualizarCalendarioSistema;

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - configurando sistema seguro...');
    
    // Aguardar um pouco para outros scripts carregarem
    setTimeout(() => {
        // Configurar observer
        observarMudancasInterface();
        
        // Tentar inicializar
        inicializarSeNecessario();
        
        // Debug inicial
        setTimeout(() => {
            const status = debugEstadoCardapio();
            console.log('🧪 Status inicial:', status);
        }, 2000);
        
    }, 1000);
});

// ===== DISPONIBILIZAR VARIÁVEIS GLOBALMENTE =====
window.clientesCarregados = clientesCarregados;
window.receitasCarregadas = receitasCarregadas;
window.tiposRefeicaoCarregados = tiposRefeicaoCarregados;
window.cardapiosCarregados = cardapiosCarregados;
window.clienteAtualCardapio = clienteAtualCardapio;
window.tipoRefeicaoAtualCardapio = tipoRefeicaoAtualCardapio;
window.dataAtualCardapio = dataAtualCardapio;
window.receitasTemporarias = receitasTemporarias;

console.log('✅ cardapio.js TOTALMENTE CORRIGIDO carregado com sucesso!');