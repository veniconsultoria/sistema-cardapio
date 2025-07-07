// clientes.js - CORREÇÃO FINAL DEFINITIVA

console.log('📁 Carregando clientes.js CORREÇÃO FINAL...');

// ✅ CONFIGURAÇÃO ISOLADA: Evitar conflitos com outros módulos
if (typeof window.clientesModuloFinal === 'undefined') {
    window.clientesModuloFinal = {
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

// ✅ INICIALIZAR SEM carregar dados automaticamente
async function inicializarClientes() {
    console.log('🚀 Inicializando clientes FINAL...');
    
    aguardarSupabaseClientes(async () => {
        if (await verificarAutenticacaoClientes()) {
            await carregarTiposRefeicoesPadrao();
            await gerarProximoCodigoCliente();
            configurarEventosClientes();
            mostrarMensagemInicial();
            
            window.clientesModuloFinal.inicializado = true;
            console.log('✅ Clientes inicializados - clique em "Listar Clientes" para carregar');
        }
    });
}

// Mostrar mensagem inicial
function mostrarMensagemInicial() {
    const tbody = document.getElementById('clientes-tbody');
    const totalElement = document.getElementById('total-clientes');
    
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    📋 Clique em "Listar Clientes" para carregar os dados
                </td>
            </tr>
        `;
    }
    
    if (totalElement) {
        totalElement.textContent = '0';
    }
}

// Configurar eventos
function configurarEventosClientes() {
    console.log('⚙️ Configurando eventos de clientes...');
    
    const buscaInput = document.getElementById('busca-clientes');
    if (buscaInput) {
        buscaInput.removeEventListener('input', filtrarClientes);
        buscaInput.addEventListener('input', filtrarClientes);
    }
}

// ✅ FUNÇÃO PRINCIPAL DE CARREGAMENTO ISOLADA
async function carregarClientesFinal() {
    try {
        console.log('📥 [FINAL] Carregando clientes do Supabase...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log('👤 [FINAL] User ID:', user.id);

        // Carregar clientes básicos
        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) {
            console.error('❌ [FINAL] Erro ao carregar clientes:', clientesError);
            throw clientesError;
        }

        console.log('📊 [FINAL] Clientes encontrados:', clientesData?.length || 0);

        if (!clientesData || clientesData.length === 0) {
            console.log('⚠️ [FINAL] Nenhum cliente encontrado');
            window.clientesModuloFinal.clientesCarregados = [];
            renderizarTabelaClientesFinal([]);
            return;
        }

        // Carregar tipos vinculados
        const clientesComTipos = [];
        
        for (const cliente of clientesData) {
            console.log(`🔍 [FINAL] Carregando tipos para: ${cliente.descricao}`);
            
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
                
                console.log(`✅ [FINAL] Cliente ${cliente.descricao}: ${tiposRefeicao.length} tipos`);
                
            } catch (error) {
                console.warn(`⚠️ [FINAL] Erro com cliente ${cliente.descricao}:`, error);
                clientesComTipos.push({
                    ...cliente,
                    tiposRefeicao: []
                });
            }
        }

        // ✅ SALVAR E RENDERIZAR IMEDIATAMENTE
        console.log(`💾 [FINAL] Salvando ${clientesComTipos.length} clientes...`);
        window.clientesModuloFinal.clientesCarregados = clientesComTipos;
        
        // ✅ RENDERIZAR IMEDIATAMENTE COM OS DADOS CARREGADOS
        console.log('🎨 [FINAL] Renderizando na tela...');
        renderizarTabelaClientesFinal(clientesComTipos);
        
        mostrarToast(`✅ ${clientesComTipos.length} cliente(s) carregado(s)!`, 'success');
        
    } catch (error) {
        console.error('❌ [FINAL] Erro ao carregar clientes:', error);
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

// ✅ FUNÇÃO DE RENDERIZAÇÃO ISOLADA E DIRETA
function renderizarTabelaClientesFinal(clientes) {
    console.log(`🎨 [FINAL] Renderizando ${clientes.length} clientes na tabela...`);
    
    const tbody = document.getElementById('clientes-tbody');
    const total = document.getElementById('total-clientes');
    
    if (!tbody) {
        console.error('❌ [FINAL] tbody não encontrado!');
        return;
    }
    
    // Limpar tabela
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
        console.log('⚠️ [FINAL] Nenhum cliente para renderizar');
        return;
    }

    // Renderizar cada cliente
    clientes.forEach((cliente, index) => {
        console.log(`📋 [FINAL] Renderizando: ${cliente.codigo} - ${cliente.descricao}`);
        
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
                <button onclick="editarClienteFinal(${index})" class="btn btn-primary btn-sm">
                    Editar
                </button>
                <button onclick="excluirClienteFinal(${index})" class="btn btn-danger btn-sm">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Atualizar contador
    if (total) {
        total.textContent = clientes.length;
    }
    
    console.log(`✅ [FINAL] Tabela renderizada: ${clientes.length} clientes`);
}

// ✅ FUNÇÃO PRINCIPAL DO BOTÃO "LISTAR CLIENTES"
async function recarregarClientes() {
    console.log('🔄 [FINAL] Botão Listar Clientes pressionado...');
    
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
    
    mostrarToast('Carregando clientes...', 'info');
    
    try {
        // Garantir inicialização
        if (!window.clientesModuloFinal.inicializado) {
            console.log('⚠️ [FINAL] Inicializando primeiro...');
            await inicializarClientes();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Carregar e renderizar
        await carregarClientesFinal();
        
    } catch (error) {
        console.error('❌ [FINAL] Erro no recarregamento:', error);
        mostrarToast('Erro: ' + error.message, 'error');
    }
}

// ✅ FUNÇÕES AUXILIARES
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
        console.log(`✅ ${window.tiposRefeicoesPadrao.length} tipos padrão carregados`);
        
    } catch (error) {
        console.error('Erro ao carregar tipos:', error);
        window.tiposRefeicoesPadrao = [];
    }
}

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

// ✅ FUNÇÕES DE EDIÇÃO E EXCLUSÃO (ADAPTADAS)
function editarClienteFinal(index) {
    const cliente = window.clientesModuloFinal.clientesCarregados[index];
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
    window.clientesModuloFinal.tiposRefeicaoTemp = [...(cliente.tiposRefeicao || [])];
    atualizarTiposRefeicaoVinculados();
    window.clientesModuloFinal.editandoCliente = index;
    
    // Mostrar modal
    document.getElementById('modal-cliente').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('cliente-descricao').focus();
    }, 100);
}

async function excluirClienteFinal(index) {
    try {
        const cliente = window.clientesModuloFinal.clientesCarregados[index];
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

// ✅ FUNÇÃO DE NOVO CLIENTE (SIMPLIFICADA)
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
    window.clientesModuloFinal.tiposRefeicaoTemp = [];
    atualizarTiposRefeicaoVinculados();
    window.clientesModuloFinal.editandoCliente = null;
    
    // Mostrar modal
    document.getElementById('modal-cliente').style.display = 'block';
    
    setTimeout(() => {
        const descInput = document.getElementById('cliente-descricao');
        if (descInput) descInput.focus();
    }, 100);
}

// ✅ FUNÇÕES AUXILIARES MANTIDAS
function filtrarClientes() {
    const busca = document.getElementById('busca-clientes')?.value.toLowerCase() || '';
    
    if (!window.clientesModuloFinal.clientesCarregados) return;
    
    let filtrados = window.clientesModuloFinal.clientesCarregados.filter(cliente => {
        return !busca || 
               cliente.descricao.toLowerCase().includes(busca) || 
               cliente.codigo.toLowerCase().includes(busca) ||
               (cliente.email && cliente.email.toLowerCase().includes(busca));
    });
    
    renderizarTabelaClientesFinal(filtrados);
    
    // Atualizar contador
    const total = document.getElementById('total-clientes');
    if (total) {
        total.textContent = filtrados.length;
    }
}

function atualizarTiposRefeicaoVinculados() {
    const container = document.getElementById('tipos-vinculados-lista');
    if (!container) return;
    
    container.innerHTML = '';

    if (window.clientesModuloFinal.tiposRefeicaoTemp.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 15px; background: #f8f9fa; border-radius: 5px;">Nenhum tipo de refeição vinculado</p>';
        return;
    }

    window.clientesModuloFinal.tiposRefeicaoTemp.forEach((tipo, index) => {
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

// ✅ FUNÇÕES DE TOAST E MODAL
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    if (window.mostrarToast && typeof window.mostrarToast === 'function' && window.mostrarToast !== mostrarToast) {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
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

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function fecharModalCliente() {
    document.getElementById('modal-cliente').style.display = 'none';
}

// ✅ EXPORTAR FUNÇÕES GLOBAIS (VERSÕES FINAIS)
window.editarCliente = editarClienteFinal;
window.excluirCliente = excluirClienteFinal;
window.abrirModalNovoCliente = abrirModalNovoCliente;
window.recarregarClientes = recarregarClientes;
window.inicializarClientes = inicializarClientes;
window.carregarClientes = carregarClientesFinal;
window.fecharModal = fecharModal;
window.fecharModalCliente = fecharModalCliente;

// ✅ FUNÇÃO DE TESTE ESPECÍFICA
window.testarSistemaClientesFinal = function() {
    console.log('🧪 === TESTE SISTEMA CLIENTES FINAL ===');
    console.log('📋 Estado:');
    console.log('  - Inicializado:', window.clientesModuloFinal?.inicializado);
    console.log('  - Clientes carregados:', window.clientesModuloFinal?.clientesCarregados?.length || 0);
    
    const tbody = document.getElementById('clientes-tbody');
    if (tbody) {
        console.log('📊 Tabela:');
        console.log('  - Linhas na tabela:', tbody.children.length);
        console.log('  - Primeira linha:', tbody.children[0]?.textContent?.substring(0, 50));
    }
    
    console.log('🎯 Testando carregamento direto...');
    recarregarClientes();
};

console.log('✅ clientes.js FINAL carregado - use testarSistemaClientesFinal()');