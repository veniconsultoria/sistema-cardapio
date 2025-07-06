// clientes.js - Sistema de Clientes com Supabase (CORRIGIDO PARA RLS)

console.log('📁 Carregando clientes.js...');

// Verificar se as variáveis já existem para evitar redeclaração
if (typeof window.clientesModulo === 'undefined') {
    // Variáveis globais do módulo clientes (usando namespace)
    window.clientesModulo = {
        clientesCarregados: [],
        tiposRefeicaoTemp: [],
        editandoCliente: null,
        inicializado: false
    };
}

// Aguardar Supabase estar disponível
function aguardarSupabaseClientes(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para clientes.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseClientes(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        mostrarToast('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar autenticação
async function verificarAutenticacaoClientes() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            mostrarToast('Você precisa estar logado para acessar esta página.');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return false;
    }
}

// Inicializar quando aba clientes for aberta
async function inicializarClientes() {
    if (window.clientesModulo.inicializado) {
        console.log('⚠️ Clientes já inicializados');
        return;
    }

    aguardarSupabaseClientes(async () => {
        if (await verificarAutenticacaoClientes()) {
            await carregarClientes();
            await carregarTiposRefeicoesPadrao();
            await gerarProximoCodigoCliente();
            configurarEventosClientes();
            
            window.clientesModulo.inicializado = true;
            console.log('✅ Clientes inicializados com sucesso');
        }
    });
}

// Configurar eventos
function configurarEventosClientes() {
    console.log('⚙️ Configurando eventos de clientes...');
    
    const form = document.getElementById('formCliente');
    if (form) {
        // Remover listeners existentes para evitar duplicação
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', salvarClienteHandler);
    }
}

// Handler para salvar cliente
async function salvarClienteHandler(e) {
    e.preventDefault();
    await salvarCliente();
}

// Carregar clientes do Supabase
async function carregarClientes() {
    try {
        console.log('📥 Carregando clientes...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('clientes')
            .select(`
                *,
                cliente_tipos_refeicao (
                    tipos_refeicoes (*)
                )
            `)
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        // Transformar dados para formato compatível
        window.clientesModulo.clientesCarregados = (data || []).map(cliente => ({
            ...cliente,
            tiposRefeicao: cliente.cliente_tipos_refeicao.map(rel => rel.tipos_refeicoes)
        }));
        
        atualizarTabelaClientes();
        
        console.log(`✅ ${window.clientesModulo.clientesCarregados.length} clientes carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        mostrarToast('Erro ao carregar clientes: ' + error.message);
    }
}

// Carregar tipos de refeições disponíveis
async function carregarTiposRefeicoesPadrao() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await window.supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        window.tiposRefeicoesPadrao = data || [];
        
    } catch (error) {
        console.error('Erro ao carregar tipos de refeições:', error);
        window.tiposRefeicoesPadrao = [];
    }
}

// Gerar próximo código de cliente
async function gerarProximoCodigoCliente() {
    try {
        console.log('🔢 Gerando próximo código de cliente...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_cliente_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;

        const input = document.getElementById('codigoCliente');
        if (input) {
            input.value = data || 'CLI001';
            console.log('✅ Próximo código gerado:', data);
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('codigoCliente');
        if (input) {
            input.value = 'CLI001';
        }
    }
}

// Salvar cliente (CORRIGIDO PARA RLS)
async function salvarCliente() {
    try {
        console.log('💾 Salvando cliente...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Coletar dados do formulário
        const codigo = document.getElementById('codigoCliente').value.trim();
        const descricao = document.getElementById('descricaoCliente').value.trim();
        const endereco = document.getElementById('enderecoCliente').value.trim();
        const numero = document.getElementById('numeroCliente').value.trim();
        const telefone = document.getElementById('telefoneCliente').value.trim();
        const email = document.getElementById('emailCliente').value.trim();

        // Validações
        if (!descricao) {
            mostrarToast('Por favor, informe a descrição do cliente');
            document.getElementById('descricaoCliente').focus();
            return;
        }

        if (!codigo) {
            mostrarToast('Por favor, informe o código do cliente');
            document.getElementById('codigoCliente').focus();
            return;
        }

        // Preparar dados do cliente
        const clienteData = {
            codigo,
            descricao,
            endereco,
            numero,
            telefone,
            email,
            user_id: user.id
        };

        console.log('📤 Dados do cliente:', clienteData);

        let clienteId;
        
        if (window.clientesModulo.editandoCliente !== null) {
            // Atualizar cliente existente
            console.log('🔄 Atualizando cliente existente...');
            const clienteAtual = window.clientesModulo.clientesCarregados[window.clientesModulo.editandoCliente];
            const { error } = await window.supabase
                .from('clientes')
                .update(clienteData)
                .eq('id', clienteAtual.id)
                .eq('user_id', user.id);

            if (error) throw error;
            clienteId = clienteAtual.id;
        } else {
            // Criar novo cliente
            console.log('➕ Criando novo cliente...');
            const { data, error } = await window.supabase
                .from('clientes')
                .insert([clienteData])
                .select()
                .single();

            if (error) throw error;
            clienteId = data.id;
        }

        // Salvar tipos de refeição vinculados (CORRIGIDO PARA RLS)
        await salvarTiposRefeicaoCliente(clienteId, user.id);

        console.log('✅ Cliente salvo com sucesso!');
        mostrarToast(window.clientesModulo.editandoCliente !== null ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
        
        // Limpar formulário e recarregar lista
        limparFormularioCliente();
        await carregarClientes();

    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        mostrarToast('Erro ao salvar cliente: ' + error.message);
    }
}

// Salvar tipos de refeição do cliente (CORRIGIDO PARA RLS)
async function salvarTiposRefeicaoCliente(clienteId, userId) {
    try {
        console.log('💾 Salvando tipos de refeição do cliente...');
        
        // Remover tipos existentes
        await window.supabase
            .from('cliente_tipos_refeicao')
            .delete()
            .eq('cliente_id', clienteId);

        // Adicionar novos tipos
        if (window.clientesModulo.tiposRefeicaoTemp.length > 0) {
            const relacoes = window.clientesModulo.tiposRefeicaoTemp.map(tipo => ({
                cliente_id: clienteId,
                tipo_refeicao_id: tipo.id,
                user_id: userId // CORRIGIDO: Incluir user_id para RLS
            }));

            console.log('📤 Inserindo relações:', relacoes);

            const { error } = await window.supabase
                .from('cliente_tipos_refeicao')
                .insert(relacoes);

            if (error) {
                console.error('❌ Erro ao inserir relações:', error);
                throw error;
            }
        }

        console.log('✅ Tipos de refeição do cliente salvos!');

    } catch (error) {
        console.error('❌ Erro ao salvar tipos de refeição do cliente:', error);
        throw error;
    }
}

// Limpar formulário
function limparFormularioCliente() {
    const form = document.getElementById('formCliente');
    if (form) {
        form.reset();
    }
    window.clientesModulo.tiposRefeicaoTemp = [];
    atualizarTiposRefeicaoVinculados();
    window.clientesModulo.editandoCliente = null;
    gerarProximoCodigoCliente();
}

// Renderizar tabela de clientes
function atualizarTabelaClientes() {
    const tbody = document.querySelector('#tabelaClientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (window.clientesModulo.clientesCarregados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum cliente encontrado
                </td>
            </tr>
        `;
        return;
    }

    window.clientesModulo.clientesCarregados.forEach((cliente, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente.codigo}</td>
            <td>${cliente.descricao}</td>
            <td>${cliente.endereco} ${cliente.numero}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.email}</td>
            <td>
                <button onclick="editarCliente(${index})" class="btn btn-sm btn-primary">
                    Editar
                </button>
                <button onclick="excluirCliente(${index})" class="btn btn-sm btn-danger">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Editar cliente
async function editarCliente(index) {
    const cliente = window.clientesModulo.clientesCarregados[index];
    if (!cliente) {
        mostrarToast('Cliente não encontrado');
        return;
    }

    document.getElementById('codigoCliente').value = cliente.codigo;
    document.getElementById('descricaoCliente').value = cliente.descricao;
    document.getElementById('enderecoCliente').value = cliente.endereco || '';
    document.getElementById('numeroCliente').value = cliente.numero || '';
    document.getElementById('telefoneCliente').value = cliente.telefone || '';
    document.getElementById('emailCliente').value = cliente.email || '';
    
    window.clientesModulo.tiposRefeicaoTemp = [...(cliente.tiposRefeicao || [])];
    atualizarTiposRefeicaoVinculados();
    window.clientesModulo.editandoCliente = index;
    
    document.getElementById('descricaoCliente').focus();
}

// Excluir cliente
async function excluirCliente(index) {
    try {
        const cliente = window.clientesModulo.clientesCarregados[index];
        if (!cliente) {
            mostrarToast('Cliente não encontrado');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.descricao}"?`)) {
            return;
        }

        console.log('🗑️ Excluindo cliente:', cliente.id);

        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Excluir relações primeiro
        await window.supabase
            .from('cliente_tipos_refeicao')
            .delete()
            .eq('cliente_id', cliente.id);

        // Excluir cliente
        const { error } = await window.supabase
            .from('clientes')
            .delete()
            .eq('id', cliente.id)
            .eq('user_id', user.id);

        if (error) throw error;

        console.log('✅ Cliente excluído com sucesso!');
        mostrarToast('Cliente excluído com sucesso!');
        await carregarClientes();

    } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        mostrarToast('Erro ao excluir cliente: ' + error.message);
    }
}

// Abrir modal de tipos de refeição
function abrirModalTiposRefeicao() {
    document.getElementById('modalTiposRefeicao').style.display = 'block';
    carregarListaTiposRefeicao();
}

// Carregar lista de tipos de refeição no modal
function carregarListaTiposRefeicao() {
    const container = document.getElementById('listaTiposRefeicao');
    if (!container) return;
    
    container.innerHTML = '';

    const tiposDisponiveis = window.tiposRefeicoesPadrao || [];
    
    if (tiposDisponiveis.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum tipo de refeição cadastrado</p>';
        return;
    }

    tiposDisponiveis.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${tipo.codigo} - ${tipo.descricao}</span>
            <button class="btn btn-primary" onclick="adicionarTipoRefeicao(${index})">Adicionar</button>
        `;
        container.appendChild(div);
    });
}

// Adicionar tipo de refeição ao cliente
function adicionarTipoRefeicao(index) {
    const tiposDisponiveis = window.tiposRefeicoesPadrao || [];
    const tipo = tiposDisponiveis[index];
    
    if (!tipo) {
        mostrarToast('Tipo de refeição não encontrado');
        return;
    }
    
    if (window.clientesModulo.tiposRefeicaoTemp.find(t => t.id === tipo.id)) {
        mostrarToast('Tipo de refeição já adicionado!');
        return;
    }

    window.clientesModulo.tiposRefeicaoTemp.push(tipo);
    atualizarTiposRefeicaoVinculados();
    mostrarToast('Tipo de refeição adicionado!');
}

// Atualizar lista de tipos vinculados
function atualizarTiposRefeicaoVinculados() {
    const container = document.getElementById('tiposRefeicaoVinculados');
    if (!container) return;
    
    container.innerHTML = '';

    if (window.clientesModulo.tiposRefeicaoTemp.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Nenhum tipo de refeição vinculado</p>';
        return;
    }

    window.clientesModulo.tiposRefeicaoTemp.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${tipo.codigo} - ${tipo.descricao}</span>
            <button class="btn btn-danger" onclick="removerTipoRefeicao(${index})">Excluir</button>
        `;
        container.appendChild(div);
    });
}

// Remover tipo de refeição do cliente
function removerTipoRefeicao(index) {
    if (confirm('Tem certeza que deseja remover este tipo de refeição?')) {
        window.clientesModulo.tiposRefeicaoTemp.splice(index, 1);
        atualizarTiposRefeicaoVinculados();
        mostrarToast('Tipo de refeição removido!');
    }
}

// Fechar modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Exportar funções para uso global
window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;
window.abrirModalTiposRefeicao = abrirModalTiposRefeicao;
window.adicionarTipoRefeicao = adicionarTipoRefeicao;
window.removerTipoRefeicao = removerTipoRefeicao;
window.fecharModal = fecharModal;
window.salvarCliente = salvarCliente;
window.limparFormularioCliente = limparFormularioCliente;
window.inicializarClientes = inicializarClientes;

console.log('✅ clientes.js carregado e corrigido para RLS!');