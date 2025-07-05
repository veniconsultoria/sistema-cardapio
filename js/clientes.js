// clientes.js - Sistema de Clientes com Supabase
// Semana 2 - Adaptação para Supabase

// Verificar se o usuário está logado
async function verificarAutenticacao() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Variáveis globais
let clientesCarregados = [];
let tiposRefeicaoTemp = [];
let editandoCliente = null;

// Inicializar página de clientes
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!await verificarAutenticacao()) {
        return;
    }
    
    // Carregar dados do Supabase
    await carregarClientes();
    await carregarTiposRefeicoesPadrao();
    
    // Configurar eventos dos botões
    configurarEventos();
    
    // Gerar próximo código
    await gerarProximoCodigoCliente();
});

// Configurar eventos dos botões e formulários
function configurarEventos() {
    // Formulário de salvar
    const form = document.getElementById('formCliente');
    if (form) {
        form.addEventListener('submit', salvarCliente);
    }
    
    // Botão Limpar
    const btnLimpar = document.getElementById('btn-limpar-cliente');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormularioCliente);
    }
    
    // Botão Tipos de Refeição
    const btnTipos = document.getElementById('btn-tipos-refeicao');
    if (btnTipos) {
        btnTipos.addEventListener('click', abrirModalTiposRefeicao);
    }
}

// Carregar clientes do Supabase
async function carregarClientes() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
            .from('clientes')
            .select(`
                *,
                cliente_tipos_refeicao (
                    tipos_refeicoes (*)
                )
            `)
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            throw error;
        }

        // Transformar dados para formato compatível
        clientesCarregados = (data || []).map(cliente => ({
            ...cliente,
            tiposRefeicao: cliente.cliente_tipos_refeicao.map(rel => rel.tipos_refeicoes)
        }));
        
        atualizarTabelaClientes();
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        alert('Erro ao carregar clientes: ' + error.message);
    }
}

// Carregar tipos de refeições disponíveis
async function carregarTiposRefeicoesPadrao() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            throw error;
        }

        window.tiposRefeicoesPadrao = data || [];
        
    } catch (error) {
        console.error('Erro ao carregar tipos de refeições:', error);
        window.tiposRefeicoesPadrao = [];
    }
}

// Gerar próximo código de cliente
async function gerarProximoCodigoCliente() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.rpc('get_next_cliente_codigo', {
            user_uuid: user.id
        });

        if (error) {
            throw error;
        }

        const input = document.getElementById('codigoCliente');
        if (input) {
            input.value = data || 'CLI001';
        }
        
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        const input = document.getElementById('codigoCliente');
        if (input) {
            input.value = 'CLI001';
        }
    }
}

// Salvar cliente (novo ou editado)
async function salvarCliente(e) {
    e.preventDefault();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Coletar dados do formulário
        const codigo = document.getElementById('codigoCliente').value.trim();
        const descricao = document.getElementById('descricaoCliente').value.trim();
        const endereco = document.getElementById('enderecoCliente').value.trim();
        const numero = document.getElementById('numeroCliente').value.trim();
        const telefone = document.getElementById('telefoneCliente').value.trim();
        const email = document.getElementById('emailCliente').value.trim();

        // Validações
        if (!descricao) {
            alert('Por favor, informe a descrição do cliente');
            document.getElementById('descricaoCliente').focus();
            return;
        }

        if (!codigo) {
            alert('Por favor, informe o código do cliente');
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

        let clienteId;
        
        if (editandoCliente !== null) {
            // Atualizar cliente existente
            const clienteAtual = clientesCarregados[editandoCliente];
            const { error } = await supabase
                .from('clientes')
                .update(clienteData)
                .eq('id', clienteAtual.id)
                .eq('user_id', user.id);

            if (error) throw error;
            clienteId = clienteAtual.id;
        } else {
            // Criar novo cliente
            const { data, error } = await supabase
                .from('clientes')
                .insert([clienteData])
                .select()
                .single();

            if (error) throw error;
            clienteId = data.id;
        }

        // Salvar tipos de refeição vinculados
        await salvarTiposRefeicaoCliente(clienteId);

        alert(editandoCliente !== null ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
        
        // Limpar formulário e recarregar lista
        limparFormularioCliente();
        await carregarClientes();

    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    }
}

// Salvar tipos de refeição do cliente
async function salvarTiposRefeicaoCliente(clienteId) {
    try {
        // Remover tipos existentes
        await supabase
            .from('cliente_tipos_refeicao')
            .delete()
            .eq('cliente_id', clienteId);

        // Adicionar novos tipos
        if (tiposRefeicaoTemp.length > 0) {
            const relacoes = tiposRefeicaoTemp.map(tipo => ({
                cliente_id: clienteId,
                tipo_refeicao_id: tipo.id
            }));

            const { error } = await supabase
                .from('cliente_tipos_refeicao')
                .insert(relacoes);

            if (error) throw error;
        }

    } catch (error) {
        console.error('Erro ao salvar tipos de refeição do cliente:', error);
        throw error;
    }
}

// Limpar formulário
function limparFormularioCliente() {
    const form = document.getElementById('formCliente');
    if (form) {
        form.reset();
    }
    tiposRefeicaoTemp = [];
    atualizarTiposRefeicaoVinculados();
    editandoCliente = null;
    gerarProximoCodigoCliente();
}

// Renderizar tabela de clientes
function atualizarTabelaClientes() {
    const tbody = document.querySelector('#tabelaClientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (clientesCarregados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum cliente encontrado
                </td>
            </tr>
        `;
        return;
    }

    clientesCarregados.forEach((cliente, index) => {
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
    const cliente = clientesCarregados[index];
    if (!cliente) {
        alert('Cliente não encontrado');
        return;
    }

    document.getElementById('codigoCliente').value = cliente.codigo;
    document.getElementById('descricaoCliente').value = cliente.descricao;
    document.getElementById('enderecoCliente').value = cliente.endereco || '';
    document.getElementById('numeroCliente').value = cliente.numero || '';
    document.getElementById('telefoneCliente').value = cliente.telefone || '';
    document.getElementById('emailCliente').value = cliente.email || '';
    
    tiposRefeicaoTemp = [...(cliente.tiposRefeicao || [])];
    atualizarTiposRefeicaoVinculados();
    editandoCliente = index;
    
    document.getElementById('descricaoCliente').focus();
}

// Excluir cliente
async function excluirCliente(index) {
    try {
        const cliente = clientesCarregados[index];
        if (!cliente) {
            alert('Cliente não encontrado');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.descricao}"?`)) {
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Excluir relações primeiro
        await supabase
            .from('cliente_tipos_refeicao')
            .delete()
            .eq('cliente_id', cliente.id);

        // Excluir cliente
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', cliente.id)
            .eq('user_id', user.id);

        if (error) {
            throw error;
        }

        alert('Cliente excluído com sucesso!');
        await carregarClientes();

    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente: ' + error.message);
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
        alert('Tipo de refeição não encontrado');
        return;
    }
    
    if (tiposRefeicaoTemp.find(t => t.id === tipo.id)) {
        alert('Tipo de refeição já adicionado!');
        return;
    }

    tiposRefeicaoTemp.push(tipo);
    atualizarTiposRefeicaoVinculados();
    alert('Tipo de refeição adicionado!');
}

// Atualizar lista de tipos vinculados
function atualizarTiposRefeicaoVinculados() {
    const container = document.getElementById('tiposRefeicaoVinculados');
    if (!container) return;
    
    container.innerHTML = '';

    if (tiposRefeicaoTemp.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Nenhum tipo de refeição vinculado</p>';
        return;
    }

    tiposRefeicaoTemp.forEach((tipo, index) => {
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
        tiposRefeicaoTemp.splice(index, 1);
        atualizarTiposRefeicaoVinculados();
        alert('Tipo de refeição removido!');
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