// tipos-refeicoes.js - Sistema de Tipos de Refeições CORRIGIDO

console.log('📁 Carregando tipos-refeicoes.js CORRIGIDO...');

// Verificar se as variáveis já existem para evitar redeclaração
if (typeof window.tiposRefeicoesModulo === 'undefined') {
    window.tiposRefeicoesModulo = {
        tiposRefeicoesCarregados: [],
        editandoTipoRefeicao: null,
        inicializado: false
    };
}

// Aguardar Supabase estar disponível
function aguardarSupabaseTipos(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para tipos-refeicoes.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseTipos(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        mostrarToast('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar autenticação
async function verificarAutenticacaoTipos() {
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

// ✅ CORREÇÃO: Inicializar SEM carregar dados automaticamente
async function inicializarTiposRefeicoes() {
    console.log('🚀 Inicializando tipos de refeições...');
    
    aguardarSupabaseTipos(async () => {
        if (await verificarAutenticacaoTipos()) {
            // ✅ MUDANÇA: Não carregar automaticamente, só preparar
            await gerarProximoCodigoTipoRefeicao();
            configurarEventosTipos();
            
            // ✅ CORREÇÃO: Mostrar mensagem inicial em vez de carregar
            mostrarMensagemInicial();
            
            window.tiposRefeicoesModulo.inicializado = true;
            console.log('✅ Tipos de refeições inicializados - clique em "Listar Tipos" para carregar');
        }
    });
}

// ✅ NOVA FUNÇÃO: Mostrar mensagem inicial
function mostrarMensagemInicial() {
    const tbody = document.getElementById('tipos-tbody');
    const totalElement = document.getElementById('total-tipos');
    
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                    📋 Clique em "Listar Tipos" para carregar os dados
                </td>
            </tr>
        `;
    }
    
    if (totalElement) {
        totalElement.textContent = '0';
    }
}

// Configurar eventos
function configurarEventosTipos() {
    console.log('⚙️ Configurando eventos de tipos de refeições...');
    
    // Barra de pesquisa
    const buscaInput = document.getElementById('busca-tipos');
    if (buscaInput) {
        buscaInput.removeEventListener('input', filtrarTiposRefeicoes);
        buscaInput.addEventListener('input', filtrarTiposRefeicoes);
    }
}

// ✅ CORREÇÃO: Carregar tipos de refeições com logs detalhados
async function carregarTiposRefeicoes() {
    try {
        console.log('📥 Carregando tipos de refeições do Supabase...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log('👤 User ID:', user.id);

        const { data, error } = await window.supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            console.error('❌ Erro ao carregar tipos de refeições:', error);
            throw error;
        }

        console.log('📊 Tipos de refeições encontrados:', data?.length || 0);
        console.log('📋 Dados dos tipos:', data);

        window.tiposRefeicoesModulo.tiposRefeicoesCarregados = data || [];
        atualizarTabelaTiposRefeicoes();
        atualizarContadores();
        
        // Disponibilizar globalmente para outros módulos
        window.tiposRefeicoesPadrao = window.tiposRefeicoesModulo.tiposRefeicoesCarregados;
        
        if (data && data.length > 0) {
            console.log(`✅ ${data.length} tipos de refeições carregados com sucesso`);
            mostrarToast(`${data.length} tipo(s) de refeição carregado(s) com sucesso!`, 'success');
        } else {
            console.log('⚠️ Nenhum tipo de refeição encontrado no banco');
            mostrarToast('Nenhum tipo de refeição encontrado', 'info');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar tipos de refeições:', error);
        mostrarToast('Erro ao carregar tipos de refeições: ' + error.message, 'error');
        
        // Mostrar erro na tabela
        const tbody = document.getElementById('tipos-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: #dc3545;">
                        ❌ Erro ao carregar tipos: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Gerar próximo código de tipo de refeição
async function gerarProximoCodigoTipoRefeicao() {
    try {
        console.log('🔢 Gerando próximo código de tipo de refeição...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_tipo_refeicao_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;

        const input = document.getElementById('tipo-codigo');
        if (input) {
            input.value = data || 'TIPO001';
            console.log('✅ Próximo código gerado:', data);
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('tipo-codigo');
        if (input) {
            input.value = 'TIPO001';
        }
    }
}

// Abrir modal para novo tipo de refeição
async function abrirModalNovoTipo() {
    await gerarProximoCodigoTipoRefeicao();
    
    // Limpar formulário
    document.getElementById('tipo-id').value = '';
    document.getElementById('tipo-descricao').value = '';
    
    window.tiposRefeicoesModulo.editandoTipoRefeicao = null;
    
    // Mostrar modal
    document.getElementById('modal-tipo').style.display = 'block';
    
    setTimeout(() => {
        const descInput = document.getElementById('tipo-descricao');
        if (descInput) descInput.focus();
    }, 100);
}

// Salvar tipo de refeição (CORRIGIDO PARA SUPABASE)
async function salvarTipoRefeicao() {
    try {
        console.log('💾 Salvando tipo de refeição...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Coletar dados do formulário
        const id = document.getElementById('tipo-id').value;
        const codigo = document.getElementById('tipo-codigo').value.trim();
        const descricao = document.getElementById('tipo-descricao').value.trim();

        // Validações
        if (!descricao) {
            mostrarToast('Por favor, informe a descrição do tipo de refeição', 'warning');
            document.getElementById('tipo-descricao').focus();
            return;
        }

        if (!codigo) {
            mostrarToast('Por favor, informe o código do tipo de refeição', 'warning');
            document.getElementById('tipo-codigo').focus();
            return;
        }

        // Preparar dados para salvar
        const tipoRefeicaoData = {
            codigo,
            descricao,
            user_id: user.id
        };

        console.log('📤 Dados do tipo de refeição:', tipoRefeicaoData);

        let result;
        if (id) {
            // Atualizar tipo existente
            console.log('🔄 Atualizando tipo de refeição existente...');
            result = await window.supabase
                .from('tipos_refeicoes')
                .update(tipoRefeicaoData)
                .eq('id', id)
                .eq('user_id', user.id);
        } else {
            // Criar novo tipo
            console.log('➕ Criando novo tipo de refeição...');
            result = await window.supabase
                .from('tipos_refeicoes')
                .insert([tipoRefeicaoData]);
        }

        if (result.error) throw result.error;

        console.log('✅ Tipo de refeição salvo com sucesso!');
        mostrarToast(id ? 'Tipo de refeição atualizado com sucesso!' : 'Tipo de refeição criado com sucesso!', 'success');
        
        // Fechar modal e recarregar lista
        fecharModalTipo();
        // ✅ Recarregar automaticamente após salvar
        await carregarTiposRefeicoes();

    } catch (error) {
        console.error('❌ Erro ao salvar tipo de refeição:', error);
        mostrarToast('Erro ao salvar tipo de refeição: ' + error.message, 'error');
    }
}

// ✅ CORREÇÃO: Renderizar tabela com logs detalhados
function atualizarTabelaTiposRefeicoes() {
    console.log('🎨 Atualizando tabela de tipos de refeições...');
    console.log('📊 Tipos para renderizar:', window.tiposRefeicoesModulo.tiposRefeicoesCarregados.length);
    
    const tbody = document.getElementById('tipos-tbody');
    if (!tbody) {
        console.error('❌ Elemento tbody não encontrado');
        return;
    }
    
    tbody.innerHTML = '';

    if (window.tiposRefeicoesModulo.tiposRefeicoesCarregados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: #666; padding: 40px;">
                    📋 Nenhum tipo de refeição encontrado
                </td>
            </tr>
        `;
        console.log('⚠️ Nenhum tipo para renderizar');
        return;
    }

    console.log('🔄 Renderizando tipos na tabela...');

    window.tiposRefeicoesModulo.tiposRefeicoesCarregados.forEach((tipo, index) => {
        console.log(`📋 Renderizando tipo ${index + 1}:`, tipo.descricao);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tipo.codigo}</td>
            <td>${tipo.descricao}</td>
            <td>
                <button onclick="editarTipoRefeicao(${index})" class="btn btn-primary btn-sm">
                    Editar
                </button>
                <button onclick="excluirTipoRefeicao(${index})" class="btn btn-danger btn-sm">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('✅ Tabela de tipos de refeições renderizada com sucesso');
}

// Filtrar tipos de refeições
function filtrarTiposRefeicoes() {
    const busca = document.getElementById('busca-tipos')?.value.toLowerCase() || '';
    
    let filtrados = window.tiposRefeicoesModulo.tiposRefeicoesCarregados.filter(tipo => {
        return !busca || 
               tipo.descricao.toLowerCase().includes(busca) || 
               tipo.codigo.toLowerCase().includes(busca);
    });
    
    const tbody = document.getElementById('tipos-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filtrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: #666; padding: 40px;">
                    Nenhum tipo de refeição encontrado para "${busca}"
                </td>
            </tr>
        `;
        return;
    }
    
    filtrados.forEach((tipo, originalIndex) => {
        // Encontrar o índice original
        const index = window.tiposRefeicoesModulo.tiposRefeicoesCarregados.indexOf(tipo);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tipo.codigo}</td>
            <td>${tipo.descricao}</td>
            <td>
                <button onclick="editarTipoRefeicao(${index})" class="btn btn-primary btn-sm">
                    Editar
                </button>
                <button onclick="excluirTipoRefeicao(${index})" class="btn btn-danger btn-sm">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Atualizar contador
    document.getElementById('total-tipos').textContent = filtrados.length;
}

// Atualizar contadores
function atualizarContadores() {
    const totalElement = document.getElementById('total-tipos');
    if (totalElement) {
        totalElement.textContent = window.tiposRefeicoesModulo.tiposRefeicoesCarregados.length;
    }
}

// Editar tipo de refeição
function editarTipoRefeicao(index) {
    const tipo = window.tiposRefeicoesModulo.tiposRefeicoesCarregados[index];
    if (!tipo) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }

    // Preencher formulário
    document.getElementById('tipo-id').value = tipo.id;
    document.getElementById('tipo-codigo').value = tipo.codigo;
    document.getElementById('tipo-descricao').value = tipo.descricao;
    
    window.tiposRefeicoesModulo.editandoTipoRefeicao = index;
    
    // Mostrar modal
    document.getElementById('modal-tipo').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('tipo-descricao').focus();
    }, 100);
}

// Excluir tipo de refeição
async function excluirTipoRefeicao(index) {
    try {
        const tipo = window.tiposRefeicoesModulo.tiposRefeicoesCarregados[index];
        if (!tipo) {
            mostrarToast('Tipo de refeição não encontrado', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o tipo de refeição "${tipo.descricao}"?`)) {
            return;
        }

        console.log('🗑️ Excluindo tipo de refeição:', tipo.id);

        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await window.supabase
            .from('tipos_refeicoes')
            .delete()
            .eq('id', tipo.id)
            .eq('user_id', user.id);

        if (error) throw error;

        console.log('✅ Tipo de refeição excluído com sucesso!');
        mostrarToast('Tipo de refeição excluído com sucesso!', 'success');
        await carregarTiposRefeicoes();

    } catch (error) {
        console.error('❌ Erro ao excluir tipo de refeição:', error);
        mostrarToast('Erro ao excluir tipo de refeição: ' + error.message, 'error');
    }
}

// ✅ NOVA FUNÇÃO: Recarregar tipos (para o botão "Listar Tipos")
async function recarregarTipos() {
    console.log('🔄 Recarregando tipos de refeições...');
    mostrarToast('Carregando tipos de refeições...', 'info');
    await carregarTiposRefeicoes();
}

// Fechar modal
function fecharModalTipo() {
    document.getElementById('modal-tipo').style.display = 'none';
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
window.editarTipoRefeicao = editarTipoRefeicao;
window.excluirTipoRefeicao = excluirTipoRefeicao;
window.abrirModalNovoTipo = abrirModalNovoTipo;
window.salvarTipoRefeicao = salvarTipoRefeicao;
window.recarregarTipos = recarregarTipos;
window.fecharModalTipo = fecharModalTipo;
window.inicializarTiposRefeicoes = inicializarTiposRefeicoes;

// ===== GARANTIR QUE AS FUNÇÕES ESTÃO DISPONÍVEIS IMEDIATAMENTE =====
if (typeof window.abrirModalNovoTipo === 'undefined') {
    window.abrirModalNovoTipo = async function() {
        if (typeof abrirModalNovoTipo === 'function') {
            return await abrirModalNovoTipo();
        } else {
            console.warn('Função abrirModalNovoTipo ainda não carregada, tentando inicializar...');
            if (typeof inicializarTiposRefeicoes === 'function') {
                await inicializarTiposRefeicoes();
                if (typeof abrirModalNovoTipo === 'function') {
                    return await abrirModalNovoTipo();
                }
            }
        }
    };
}

if (typeof window.recarregarTipos === 'undefined') {
    window.recarregarTipos = async function() {
        if (typeof recarregarTipos === 'function') {
            return await recarregarTipos();
        } else {
            console.warn('Função recarregarTipos ainda não carregada, tentando inicializar...');
            if (typeof inicializarTiposRefeicoes === 'function') {
                await inicializarTiposRefeicoes();
                if (typeof recarregarTipos === 'function') {
                    return await recarregarTipos();
                }
            }
        }
    };
}

console.log('✅ tipos-refeicoes.js CORRIGIDO - Não carrega automaticamente, aguarda clique em "Listar Tipos"!');
console.log('📋 Funções exportadas:', Object.keys(window).filter(key => key.includes('Tipo') || key.includes('recarregarTipos')));