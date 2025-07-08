// js/clientes-simplificado.js - Sistema de Clientes Funcional

console.log('🚀 Carregando sistema de clientes simplificado...');

// ===== ESTADO GLOBAL =====
window.ClientesSistema = {
    clientes: [],
    tiposRefeicao: [],
    tiposTemporarios: [],
    editando: null,
    inicializado: false
};

// ===== AGUARDAR SUPABASE =====
function aguardarSupabaseClientes() {
    return new Promise((resolve, reject) => {
        let tentativas = 0;
        const maxTentativas = 50;
        
        const verificar = () => {
            if (window.supabase && window.supabase.auth) {
                console.log('✅ Supabase disponível para clientes');
                resolve();
            } else if (tentativas < maxTentativas) {
                tentativas++;
                setTimeout(verificar, 200);
            } else {
                reject(new Error('Timeout: Supabase não carregou'));
            }
        };
        
        verificar();
    });
}

// ===== VERIFICAR AUTENTICAÇÃO =====
async function verificarAutenticacaoClientes() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            mostrarToast('Você precisa estar logado para acessar esta página.', 'error');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        return false;
    }
}

// ===== INICIALIZAR CLIENTES =====
async function inicializarClientes() {
    console.log('🚀 Inicializando sistema de clientes...');
    
    try {
        // Aguardar Supabase
        await aguardarSupabaseClientes();
        
        // Verificar autenticação
        if (!await verificarAutenticacaoClientes()) {
            return false;
        }
        
        // Carregar dados
        await carregarTiposRefeicao();
        await gerarProximoCodigoCliente();
        
        // Configurar eventos
        configurarEventosClientes();
        
        // Mostrar mensagem inicial
        mostrarMensagemInicialClientes();
        
        window.ClientesSistema.inicializado = true;
        console.log('✅ Sistema de clientes inicializado');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inicializar clientes:', error);
        mostrarToast('Erro ao inicializar clientes: ' + error.message, 'error');
        return false;
    }
}

// ===== CONFIGURAR EVENTOS =====
function configurarEventosClientes() {
    const buscaInput = document.getElementById('busca-clientes');
    if (buscaInput) {
        buscaInput.removeEventListener('input', filtrarClientes);
        buscaInput.addEventListener('input', filtrarClientes);
    }
}

// ===== MOSTRAR MENSAGEM INICIAL =====
function mostrarMensagemInicialClientes() {
    const tbody = document.getElementById('clientes-tbody');
    const total = document.getElementById('total-clientes');
    
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    📋 Clique em "Listar Clientes" para carregar os dados
                </td>
            </tr>
        `;
    }
    
    if (total) {
        total.textContent = '0';
    }
}

// ===== CARREGAR TIPOS DE REFEIÇÃO =====
async function carregarTiposRefeicao() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await window.supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;
        
        window.ClientesSistema.tiposRefeicao = data || [];
        console.log(`✅ ${window.ClientesSistema.tiposRefeicao.length} tipos de refeição carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar tipos:', error);
        window.ClientesSistema.tiposRefeicao = [];
    }
}

// ===== GERAR PRÓXIMO CÓDIGO =====
async function gerarProximoCodigoCliente() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_cliente_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;
        
        const input = document.getElementById('cliente-codigo');
        if (input) {
            input.value = data || 'CLI001';
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('cliente-codigo');
        if (input) {
            input.value = 'CLI001';
        }
    }
}

// ===== CARREGAR CLIENTES =====
async function recarregarClientes() {
    try {
        console.log('📥 Carregando clientes...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Mostrar loading
        const tbody = document.getElementById('clientes-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #2196f3;">
                        ⏳ Carregando clientes...
                    </td>
                </tr>
            `;
        }

        // Carregar clientes básicos
        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) throw clientesError;

        if (!clientesData || clientesData.length === 0) {
            window.ClientesSistema.clientes = [];
            renderizarTabelaClientes([]);
            return;
        }

        // Carregar tipos vinculados
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

                const tiposRefeicao = !tiposError && tiposData ? 
                    tiposData.map(rel => rel.tipos_refeicoes).filter(tipo => tipo !== null) : [];
                
                clientesComTipos.push({
                    ...cliente,
                    tiposRefeicao: tiposRefeicao
                });
                
            } catch (error) {
                console.warn(`⚠️ Erro com cliente ${cliente.descricao}:`, error);
                clientesComTipos.push({
                    ...cliente,
                    tiposRefeicao: []
                });
            }
        }

        // Salvar e renderizar
        window.ClientesSistema.clientes = clientesComTipos;
        renderizarTabelaClientes(clientesComTipos);
        
        mostrarToast(`✅ ${clientesComTipos.length} cliente(s) carregado(s)!`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        mostrarToast('Erro ao carregar clientes: ' + error.message, 'error');
        
        const tbody = document.getElementById('clientes-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">
                        ❌ Erro: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// ===== RENDERIZAR TABELA =====
function renderizarTabelaClientes(clientes) {
    const tbody = document.getElementById('clientes-tbody');
    const total = document.getElementById('total-clientes');
    
    if (!tbody) {
        console.error('❌ tbody não encontrado!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #666; padding: 40px;">
                    📋 Nenhum cliente encontrado
                </td>
            </tr>
        `;
        if (total) total.textContent = '0';
        return;
    }

    // Renderizar cada cliente
    clientes.forEach((cliente, index) => {
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
    
    if (total) {
        total.textContent = clientes.length;
    }
}

// ===== ABRIR MODAL NOVO CLIENTE =====
async function abrirModalNovoCliente() {
    try {
        await gerarProximoCodigoCliente();
        
        // Limpar formulário
        document.getElementById('cliente-id').value = '';
        document.getElementById('cliente-descricao').value = '';
        document.getElementById('cliente-endereco').value = '';
        document.getElementById('cliente-numero').value = '';
        document.getElementById('cliente-telefone').value = '';
        document.getElementById('cliente-email').value = '';
        
        // Limpar tipos temporários
        window.ClientesSistema.tiposTemporarios = [];
        atualizarTiposVinculados();
        window.ClientesSistema.editando = null;
        
        // Mostrar modal
        const modal = document.getElementById('modal-cliente');
        if (modal) {
            modal.style.display = 'block';
            setTimeout(() => {
                const descInput = document.getElementById('cliente-descricao');
                if (descInput) descInput.focus();
            }, 100);
        }
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal:', error);
        mostrarToast('Erro ao abrir formulário: ' + error.message, 'error');
    }
}

// ===== EDITAR CLIENTE =====
function editarCliente(index) {
    const cliente = window.ClientesSistema.clientes[index];
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
    window.ClientesSistema.tiposTemporarios = [...(cliente.tiposRefeicao || [])];
    atualizarTiposVinculados();
    window.ClientesSistema.editando = index;
    
    // Mostrar modal
    const modal = document.getElementById('modal-cliente');
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            document.getElementById('cliente-descricao').focus();
        }, 100);
    }
}

// ===== EXCLUIR CLIENTE =====
async function excluirCliente(index) {
    try {
        const cliente = window.ClientesSistema.clientes[index];
        if (!cliente) {
            mostrarToast('Cliente não encontrado', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.descricao}"?`)) {
            return;
        }

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

        mostrarToast('Cliente excluído com sucesso!', 'success');
        await recarregarClientes();

    } catch (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        mostrarToast('Erro ao excluir cliente: ' + error.message, 'error');
    }
}

// ===== SALVAR CLIENTE =====
async function salvarCliente() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Coletar dados
        const id = document.getElementById('cliente-id').value;
        const codigo = document.getElementById('cliente-codigo').value.trim();
        const descricao = document.getElementById('cliente-descricao').value.trim();
        const endereco = document.getElementById('cliente-endereco').value.trim();
        const numero = document.getElementById('cliente-numero').value.trim();
        const telefone = document.getElementById('cliente-telefone').value.trim();
        const email = document.getElementById('cliente-email').value.trim();

        // Validações
        if (!descricao) {
            mostrarToast('Por favor, informe o nome/descrição do cliente', 'error');
            document.getElementById('cliente-descricao').focus();
            return;
        }

        if (!codigo) {
            mostrarToast('Código não foi gerado. Tente novamente.', 'error');
            await gerarProximoCodigoCliente();
            return;
        }

        // Dados do cliente
        const dadosCliente = {
            codigo: codigo,
            descricao: descricao,
            endereco: endereco || null,
            numero: numero || null,
            telefone: telefone || null,
            email: email || null,
            user_id: user.id
        };

        let clienteSalvo;

        if (id) {
            // Atualizar
            const { error } = await window.supabase
                .from('clientes')
                .update(dadosCliente)
                .eq('id', id)
                .eq('user_id', user.id);
            
            if (error) throw error;
            
            const { data: clienteAtualizado, error: selectError } = await window.supabase
                .from('clientes')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();
            
            if (selectError) throw selectError;
            clienteSalvo = clienteAtualizado;
            
        } else {
            // Criar
            const { data, error } = await window.supabase
                .from('clientes')
                .insert([dadosCliente])
                .select()
                .single();
            
            if (error) throw error;
            clienteSalvo = data;
        }

        // Salvar tipos vinculados
        if (clienteSalvo?.id) {
            await salvarTiposVinculados(clienteSalvo.id);
        }

        const mensagem = id ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!';
        mostrarToast(mensagem, 'success');
        
        fecharModalCliente();
        await recarregarClientes();

    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        
        let mensagemErro = 'Erro ao salvar cliente';
        if (error.message.includes('duplicate key')) {
            mensagemErro = 'Já existe um cliente com este código';
        }
        
        mostrarToast(mensagemErro + ': ' + error.message, 'error');
    }
}

// ===== SALVAR TIPOS VINCULADOS =====
async function salvarTiposVinculados(clienteId) {
    try {
        // Remover tipos antigos
        await window.supabase
            .from('cliente_tipos_refeicao')
            .delete()
            .eq('cliente_id', clienteId);

        // Adicionar tipos novos
        if (window.ClientesSistema.tiposTemporarios.length > 0) {
            const { data: { user } } = await window.supabase.auth.getUser();
            
            const tiposParaVincular = [];
            for (const tipo of window.ClientesSistema.tiposTemporarios) {
                if (tipo?.id) {
                    // Verificar se existe
                    const { data: tipoExiste } = await window.supabase
                        .from('tipos_refeicoes')
                        .select('id')
                        .eq('id', tipo.id)
                        .eq('user_id', user.id)
                        .single();
                    
                    if (tipoExiste) {
                        tiposParaVincular.push({
                            cliente_id: clienteId,
                            tipo_refeicao_id: tipo.id
                        });
                    }
                }
            }

            if (tiposParaVincular.length > 0) {
                const { error } = await window.supabase
                    .from('cliente_tipos_refeicao')
                    .insert(tiposParaVincular);

                if (error) throw error;
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar tipos vinculados:', error);
        throw error;
    }
}

// ===== MODAL TIPOS DE REFEIÇÃO =====
async function abrirModalTiposRefeicao() {
    try {
        // Garantir que tipos estão carregados
        if (window.ClientesSistema.tiposRefeicao.length === 0) {
            await carregarTiposRefeicao();
        }
        
        const modal = document.getElementById('modal-tipos-refeicao');
        const lista = document.getElementById('lista-tipos-modal');
        
        if (!modal || !lista) {
            mostrarToast('Erro: Modal de tipos não encontrado', 'error');
            return;
        }
        
        // Limpar lista
        lista.innerHTML = '';
        
        if (window.ClientesSistema.tiposRefeicao.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum tipo de refeição encontrado.</p>';
        } else {
            // Tipos já vinculados
            const idsVinculados = window.ClientesSistema.tiposTemporarios.map(t => t.id);
            
            // Renderizar cada tipo
            window.ClientesSistema.tiposRefeicao.forEach(tipo => {
                const isVinculado = idsVinculados.includes(tipo.id);
                
                const div = document.createElement('div');
                div.className = 'tipo-item';
                div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #e9ecef; border-radius: 5px; margin-bottom: 5px; background: white;';
                
                div.innerHTML = `
                    <input type="checkbox" 
                           id="tipo-${tipo.id}" 
                           ${isVinculado ? 'checked' : ''} 
                           onchange="toggleTipoRefeicao('${tipo.id}', '${tipo.codigo}', '${tipo.descricao}', this.checked)">
                    <label for="tipo-${tipo.id}" style="flex: 1; margin: 0; cursor: pointer; ${isVinculado ? 'color: #6c757d;' : ''}">
                        ${tipo.codigo} - ${tipo.descricao}${isVinculado ? ' ✅' : ''}
                    </label>
                `;
                lista.appendChild(div);
            });
        }
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de tipos:', error);
        mostrarToast('Erro ao carregar tipos: ' + error.message, 'error');
    }
}

// ===== TOGGLE TIPO DE REFEIÇÃO =====
function toggleTipoRefeicao(id, codigo, descricao, checked) {
    const tipoObj = { id, codigo, descricao };
    
    if (checked) {
        // Adicionar se não existe
        if (!window.ClientesSistema.tiposTemporarios.find(t => t.id === id)) {
            window.ClientesSistema.tiposTemporarios.push(tipoObj);
        }
    } else {
        // Remover
        window.ClientesSistema.tiposTemporarios = window.ClientesSistema.tiposTemporarios.filter(t => t.id !== id);
    }
    
    atualizarTiposVinculados();
}

// ===== REMOVER TIPO =====
function removerTipoRefeicao(index) {
    if (index >= 0 && index < window.ClientesSistema.tiposTemporarios.length) {
        const tipoRemovido = window.ClientesSistema.tiposTemporarios.splice(index, 1)[0];
        console.log(`✅ Tipo ${tipoRemovido.codigo} removido`);
        atualizarTiposVinculados();
    }
}

// ===== ATUALIZAR TIPOS VINCULADOS =====
function atualizarTiposVinculados() {
    const container = document.getElementById('tipos-vinculados-lista');
    if (!container) return;
    
    container.innerHTML = '';

    if (!window.ClientesSistema.tiposTemporarios || window.ClientesSistema.tiposTemporarios.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 15px;">Nenhum tipo vinculado</p>';
        return;
    }

    window.ClientesSistema.tiposTemporarios.forEach((tipo, index) => {
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

// ===== FILTRAR CLIENTES =====
function filtrarClientes() {
    const busca = document.getElementById('busca-clientes')?.value.toLowerCase() || '';
    
    if (!window.ClientesSistema.clientes) return;
    
    const filtrados = window.ClientesSistema.clientes.filter(cliente => {
        return !busca || 
               cliente.descricao.toLowerCase().includes(busca) || 
               cliente.codigo.toLowerCase().includes(busca) ||
               (cliente.email && cliente.email.toLowerCase().includes(busca));
    });
    
    renderizarTabelaClientes(filtrados);
    
    const total = document.getElementById('total-clientes');
    if (total) {
        total.textContent = filtrados.length;
    }
}

// ===== FECHAR MODAIS =====
function fecharModalCliente() {
    const modal = document.getElementById('modal-cliente');
    if (modal) {
        modal.style.display = 'none';
    }
}

function fecharModalTipos() {
    const modal = document.getElementById('modal-tipos-refeicao');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== EXPORTAR FUNÇÕES GLOBAIS =====
window.inicializarClientes = inicializarClientes;
window.recarregarClientes = recarregarClientes;
window.abrirModalNovoCliente = abrirModalNovoCliente;
window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;
window.salvarCliente = salvarCliente;
window.abrirModalTiposRefeicao = abrirModalTiposRefeicao;
window.toggleTipoRefeicao = toggleTipoRefeicao;
window.removerTipoRefeicao = removerTipoRefeicao;
window.fecharModalCliente = fecharModalCliente;
window.fecharModalTipos = fecharModalTipos;
window.filtrarClientes = filtrarClientes;

console.log('✅ Sistema de clientes simplificado carregado!');