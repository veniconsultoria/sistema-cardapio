// clientes.js - Sistema de Clientes MODERNIZADO (Layout igual ao de Produtos)

console.log('📁 Carregando clientes.js MODERNIZADO...');

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
    
    // Barra de pesquisa
    const buscaInput = document.getElementById('busca-clientes');
    if (buscaInput) {
        buscaInput.removeEventListener('input', filtrarClientes);
        buscaInput.addEventListener('input', filtrarClientes);
    }
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
        atualizarContadores();
        
        console.log(`✅ ${window.clientesModulo.clientesCarregados.length} clientes carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        mostrarToast('Erro ao carregar clientes: ' + error.message, 'error');
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

        const input = document.getElementById('cliente-codigo');
        if (input) {
            input.value = data || 'CLI001';
            console.log('✅ Próximo código gerado:', data);
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('cliente-codigo');
        if (input) {
            input.value = 'CLI001';
        }
    }
}

// Abrir modal para novo cliente
async function abrirModalNovoCliente() {
    await gerarProximoCodigoCliente();
    
    // Limpar formulário
    document.getElementById('cliente-id').value = '';
    document.getElementById('cliente-descricao').value = '';
    document.getElementById('cliente-endereco').value = '';
    document.getElementById('cliente-numero').value = '';
    document.getElementById('cliente-telefone').value = '';
    document.getElementById('cliente-email').value = '';
    
    // Limpar tipos vinculados
    window.clientesModulo.tiposRefeicaoTemp = [];
    atualizarTiposRefeicaoVinculados();
    window.clientesModulo.editandoCliente = null;
    
    // Mostrar modal
    document.getElementById('modal-cliente').style.display = 'block';
    
    setTimeout(() => {
        const descInput = document.getElementById('cliente-descricao');
        if (descInput) descInput.focus();
    }, 100);
}

// Salvar cliente (CORRIGIDO PARA RLS)
async function salvarCliente() {
    try {
        console.log('💾 Salvando cliente...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Coletar dados do formulário
        const id = document.getElementById('cliente-id').value;
        const codigo = document.getElementById('cliente-codigo').value.trim();
        const descricao = document.getElementById('cliente-descricao').value.trim();
        const endereco = document.getElementById('cliente-endereco').value.trim();
        const numero = document.getElementById('cliente-numero').value.trim();
        const telefone = document.getElementById('cliente-telefone').value.trim();
        const email = document.getElementById('cliente-email').value.trim();

        // Validações
        if (!descricao) {
            mostrarToast('Por favor, informe a descrição do cliente', 'warning');
            document.getElementById('cliente-descricao').focus();
            return;
        }

        if (!codigo) {
            mostrarToast('Por favor, informe o código do cliente', 'warning');
            document.getElementById('cliente-codigo').focus();
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
        
        if (id) {
            // Atualizar cliente existente
            console.log('🔄 Atualizando cliente existente...');
            const { error } = await window.supabase
                .from('clientes')
                .update(clienteData)
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            clienteId = id;
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
        mostrarToast(id ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!', 'success');
        
        // Fechar modal e recarregar lista
        fecharModalCliente();
        await carregarClientes();

    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        mostrarToast('Erro ao salvar cliente: ' + error.message, 'error');
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

// Renderizar tabela de clientes (MODERNIZADA)
function atualizarTabelaClientes() {
    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (window.clientesModulo.clientesCarregados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 40px;">
                    Nenhum cliente encontrado
                </td>
            </tr>
        `;
        return;
    }

    window.clientesModulo.clientesCarregados.forEach((cliente, index) => {
        const row = document.createElement('tr');
        
        // Formatação de endereço
        const enderecoCompleto = [cliente.endereco, cliente.numero].filter(x => x).join(', ') || '-';
        
        // Contagem de tipos vinculados
        const tiposCount = cliente.tiposRefeicao ? cliente.tiposRefeicao.length : 0;
        
        row.innerHTML = `
            <td>${cliente.codigo}</td>
            <td>${cliente.descricao}</td>
            <td>${enderecoCompleto}</td>
            <td>${cliente.telefone || '-'}</td>
            <td>${cliente.email || '-'}</td>
            <td>
                <span class="badge ${tiposCount > 0 ? 'badge-success' : 'badge-warning'}">
                    ${tiposCount} tipo(s)
                </span>
            </td>
            <td>
                <button onclick="editarCliente(${index})" class="btn btn-primary btn-sm">
                    Editar
                </button>
                <button onclick="excluirCliente(${index})" class="btn btn-danger btn-sm">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filtrar clientes
function filtrarClientes() {
    const busca = document.getElementById('busca-clientes')?.value.toLowerCase() || '';
    
    let filtrados = window.clientesModulo.clientesCarregados.filter(cliente => {
        return !busca || 
               cliente.descricao.toLowerCase().includes(busca) || 
               cliente.codigo.toLowerCase().includes(busca) ||
               (cliente.email && cliente.email.toLowerCase().includes(busca));
    });
    
    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filtrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #666; padding: 40px;">
                    Nenhum cliente encontrado para "${busca}"
                </td>
            </tr>
        `;
        return;
    }
    
    filtrados.forEach((cliente, originalIndex) => {
        // Encontrar o índice original
        const index = window.clientesModulo.clientesCarregados.indexOf(cliente);
        
        const row = document.createElement('tr');
        const enderecoCompleto = [cliente.endereco, cliente.numero].filter(x => x).join(', ') || '-';
        const tiposCount = cliente.tiposRefeicao ? cliente.tiposRefeicao.length : 0;
        
        row.innerHTML = `
            <td>${cliente.codigo}</td>
            <td>${cliente.descricao}</td>
            <td>${enderecoCompleto}</td>
            <td>${cliente.telefone || '-'}</td>
            <td>${cliente.email || '-'}</td>
            <td>
                <span class="badge ${tiposCount > 0 ? 'badge-success' : 'badge-warning'}">
                    ${tiposCount} tipo(s)
                </span>
            </td>
            <td>
                <button onclick="editarCliente(${index})" class="btn btn-primary btn-sm">
                    Editar
                </button>
                <button onclick="excluirCliente(${index})" class="btn btn-danger btn-sm">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Atualizar contador
    document.getElementById('total-clientes').textContent = filtrados.length;
}

// Atualizar contadores
function atualizarContadores() {
    const totalElement = document.getElementById('total-clientes');
    if (totalElement) {
        totalElement.textContent = window.clientesModulo.clientesCarregados.length;
    }
}

// Editar cliente
async function editarCliente(index) {
    const cliente = window.clientesModulo.clientesCarregados[index];
    if (!cliente) {
        mostrarToast('Cliente não encontrado', 'error');
        return;
    }

    // Preencher formulário
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('cliente-codigo').value = cliente.codigo;
    document.getElementById('cliente-descricao').value = cliente.descricao;
    document.getElementById('cliente-endereco').value = cliente.endereco || '';
    document.getElementById('cliente-numero').value = cliente.numero || '';
    document.getElementById('cliente-telefone').value = cliente.telefone || '';
    document.getElementById('cliente-email').value = cliente.email || '';
    
    // Carregar tipos vinculados
    window.clientesModulo.tiposRefeicaoTemp = [...(cliente.tiposRefeicao || [])];
    atualizarTiposRefeicaoVinculados();
    window.clientesModulo.editandoCliente = index;
    
    // Mostrar modal
    document.getElementById('modal-cliente').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('cliente-descricao').focus();
    }, 100);
}

// Excluir cliente
async function excluirCliente(index) {
    try {
        const cliente = window.clientesModulo.clientesCarregados[index];
        if (!cliente) {
            mostrarToast('Cliente não encontrado', 'error');
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
        mostrarToast('Cliente excluído com sucesso!', 'success');
        await carregarClientes();

    } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        mostrarToast('Erro ao excluir cliente: ' + error.message, 'error');
    }
}

// ===== GESTÃO DE TIPOS DE REFEIÇÃO =====

// Abrir modal de tipos de refeição
function abrirModalTiposRefeicao() {
    document.getElementById('modal-tipos-refeicao').style.display = 'block';
    carregarListaTiposRefeicao();
}

// Carregar lista de tipos de refeição no modal
function carregarListaTiposRefeicao() {
    const container = document.getElementById('lista-tipos-modal');
    if (!container) return;
    
    container.innerHTML = '';

    const tiposDisponiveis = window.tiposRefeicoesPadrao || [];
    
    if (tiposDisponiveis.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum tipo de refeição cadastrado</p>';
        return;
    }

    // Header com ações globais
    const headerActions = document.createElement('div');
    headerActions.className = 'modal-header-actions';
    headerActions.style.cssText = 'padding: 10px 0; border-bottom: 1px solid #e9ecef; margin-bottom: 15px;';
    headerActions.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="selecionarTodosTipos()">
            Selecionar Todos
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="desmarcarTodosTipos()">
            Desmarcar Todos
        </button>
        <button type="button" class="btn btn-primary" onclick="adicionarTiposSelecionados()">
            Adicionar Selecionados
        </button>
    `;
    container.appendChild(headerActions);

    tiposDisponiveis.forEach((tipo, index) => {
        const jaAdicionado = window.clientesModulo.tiposRefeicaoTemp.find(t => t.id === tipo.id);
        
        const div = document.createElement('div');
        div.className = 'tipo-item';
        div.style.cssText = `
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 10px; 
            border: 1px solid #e9ecef; 
            border-radius: 5px; 
            margin-bottom: 8px; 
            background: ${jaAdicionado ? '#f8f9fa' : 'white'};
        `;
        
        div.innerHTML = `
            <input type="checkbox" id="tipo-${index}" value="${index}" ${jaAdicionado ? 'disabled checked' : ''}>
            <label for="tipo-${index}" style="flex: 1; margin: 0; cursor: pointer; color: ${jaAdicionado ? '#6c757d' : '#333'}">
                ${tipo.codigo} - ${tipo.descricao}${jaAdicionado ? ' ✅' : ''}
            </label>
        `;
        container.appendChild(div);
    });
}

// Selecionar todos os tipos
function selecionarTodosTipos() {
    const checkboxes = document.querySelectorAll('#lista-tipos-modal input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

// Desmarcar todos os tipos
function desmarcarTodosTipos() {
    const checkboxes = document.querySelectorAll('#lista-tipos-modal input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Adicionar tipos selecionados
function adicionarTiposSelecionados() {
    const checkboxes = document.querySelectorAll('#lista-tipos-modal input[type="checkbox"]:checked:not(:disabled)');
    
    if (checkboxes.length === 0) {
        mostrarToast('Selecione pelo menos um tipo de refeição', 'warning');
        return;
    }
    
    let adicionados = 0;
    
    checkboxes.forEach(checkbox => {
        const tipoIndex = parseInt(checkbox.value);
        const tipo = window.tiposRefeicoesPadrao[tipoIndex];
        
        if (!tipo) return;
        
        // Verificar se já existe
        if (window.clientesModulo.tiposRefeicaoTemp.find(t => t.id === tipo.id)) {
            return; // Já adicionado
        }

        window.clientesModulo.tiposRefeicaoTemp.push(tipo);
        adicionados++;
    });
    
    if (adicionados > 0) {
        atualizarTiposRefeicaoVinculados();
        mostrarToast(`${adicionados} tipo(s) de refeição adicionado(s)!`, 'success');
        fecharModalTipos();
    } else {
        mostrarToast('Todos os tipos selecionados já foram adicionados', 'info');
    }
}

// Adicionar tipo de refeição individual (mantido para compatibilidade)
function adicionarTipoRefeicao(index) {
    const tiposDisponiveis = window.tiposRefeicoesPadrao || [];
    const tipo = tiposDisponiveis[index];
    
    if (!tipo) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }
    
    if (window.clientesModulo.tiposRefeicaoTemp.find(t => t.id === tipo.id)) {
        mostrarToast('Tipo de refeição já adicionado!', 'warning');
        return;
    }

    window.clientesModulo.tiposRefeicaoTemp.push(tipo);
    atualizarTiposRefeicaoVinculados();
    mostrarToast('Tipo de refeição adicionado!', 'success');
}

// Atualizar lista de tipos vinculados
function atualizarTiposRefeicaoVinculados() {
    const container = document.getElementById('tipos-vinculados-lista');
    if (!container) return;
    
    container.innerHTML = '';

    if (window.clientesModulo.tiposRefeicaoTemp.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 15px; background: #f8f9fa; border-radius: 5px;">Nenhum tipo de refeição vinculado</p>';
        return;
    }

    window.clientesModulo.tiposRefeicaoTemp.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'tipo-vinculado-item';
        div.style.cssText = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 10px 15px; 
            background: #e8f5e8; 
            border: 1px solid #28a745; 
            border-radius: 5px; 
            margin-bottom: 8px;
        `;
        
        div.innerHTML = `
            <span style="font-weight: 500; color: #155724;">
                ${tipo.codigo} - ${tipo.descricao}
            </span>
            <button class="btn btn-danger btn-sm" onclick="removerTipoRefeicao(${index})" style="padding: 4px 8px; font-size: 12px;">
                Remover
            </button>
        `;
        container.appendChild(div);
    });
}

// Remover tipo de refeição do cliente
function removerTipoRefeicao(index) {
    if (confirm('Tem certeza que deseja remover este tipo de refeição?')) {
        const tipo = window.clientesModulo.tiposRefeicaoTemp[index];
        window.clientesModulo.tiposRefeicaoTemp.splice(index, 1);
        atualizarTiposRefeicaoVinculados();
        mostrarToast(`Tipo "${tipo.descricao}" removido!`, 'success');
    }
}

// Recarregar clientes
async function recarregarClientes() {
    await carregarClientes();
    mostrarToast('Clientes recarregados!', 'success');
}

// Fechar modais
function fecharModalCliente() {
    document.getElementById('modal-cliente').style.display = 'none';
}

function fecharModalTipos() {
    document.getElementById('modal-tipos-refeicao').style.display = 'none';
}

// Fechar modal genérico
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Toast notification system
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    // Usar função global se existir
    if (window.mostrarToast && typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
    // Implementação básica
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

// ===== EXPORTAR TODAS AS FUNÇÕES PARA USO GLOBAL =====
window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;
window.abrirModalTiposRefeicao = abrirModalTiposRefeicao;
window.abrirModalNovoCliente = abrirModalNovoCliente;
window.adicionarTipoRefeicao = adicionarTipoRefeicao;
window.removerTipoRefeicao = removerTipoRefeicao;
window.fecharModal = fecharModal;
window.fecharModalCliente = fecharModalCliente;
window.fecharModalTipos = fecharModalTipos;
window.salvarCliente = salvarCliente;
window.recarregarClientes = recarregarClientes;
window.inicializarClientes = inicializarClientes;
window.selecionarTodosTipos = selecionarTodosTipos;
window.desmarcarTodosTipos = desmarcarTodosTipos;
window.adicionarTiposSelecionados = adicionarTiposSelecionados;

// ===== GARANTIR QUE AS FUNÇÕES ESTÃO DISPONÍVEIS IMEDIATAMENTE =====
// Definir funções no escopo global imediatamente
if (typeof window.abrirModalNovoCliente === 'undefined') {
    window.abrirModalNovoCliente = async function() {
        if (typeof abrirModalNovoCliente === 'function') {
            return await abrirModalNovoCliente();
        } else {
            console.warn('Função abrirModalNovoCliente ainda não carregada, tentando inicializar...');
            if (typeof inicializarClientes === 'function') {
                await inicializarClientes();
                if (typeof abrirModalNovoCliente === 'function') {
                    return await abrirModalNovoCliente();
                }
            }
        }
    };
}

if (typeof window.recarregarClientes === 'undefined') {
    window.recarregarClientes = async function() {
        if (typeof recarregarClientes === 'function') {
            return await recarregarClientes();
        } else {
            console.warn('Função recarregarClientes ainda não carregada, tentando inicializar...');
            if (typeof inicializarClientes === 'function') {
                await inicializarClientes();
                if (typeof recarregarClientes === 'function') {
                    return await recarregarClientes();
                }
            }
        }
    };
}

console.log('✅ clientes.js MODERNIZADO carregado com layout igual ao de produtos!');
console.log('📋 Funções exportadas:', Object.keys(window).filter(key => key.includes('Cliente')));