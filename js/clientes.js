// clientes.js - VERSÃO DEFINITIVA (TODOS OS ERROS CORRIGIDOS)

console.log('📁 Carregando clientes.js DEFINITIVO...');

// ✅ CONFIGURAÇÃO ISOLADA
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
        mostrarToast('Erro: Não foi possível conectar com o Supabase.', 'error');
    }
}

// Verificar autenticação
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

// ✅ INICIALIZAR CLIENTES
async function inicializarClientes() {
    console.log('🚀 Inicializando clientes...');
    
    return new Promise((resolve, reject) => {
        aguardarSupabaseClientes(async () => {
            try {
                if (await verificarAutenticacaoClientes()) {
                    await carregarTiposRefeicoesPadrao();
                    await gerarProximoCodigoCliente();
                    configurarEventosClientes();
                    mostrarMensagemInicial();
                    
                    window.clientesModuloFinal.inicializado = true;
                    console.log('✅ Clientes inicializados com sucesso');
                    resolve();
                } else {
                    reject(new Error('Falha na autenticação'));
                }
            } catch (error) {
                console.error('❌ Erro ao inicializar clientes:', error);
                reject(error);
            }
        });
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

// ✅ CARREGAR TIPOS DE REFEIÇÃO PADRÃO
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
        console.error('❌ Erro ao carregar tipos:', error);
        window.tiposRefeicoesPadrao = [];
    }
}

// ✅ GERAR PRÓXIMO CÓDIGO
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

// ✅ CARREGAR CLIENTES
async function carregarClientesFinal() {
    try {
        console.log('📥 Carregando clientes do Supabase...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Carregar clientes básicos
        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (clientesError) throw clientesError;

        if (!clientesData || clientesData.length === 0) {
            window.clientesModuloFinal.clientesCarregados = [];
            renderizarTabelaClientesFinal([]);
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
        window.clientesModuloFinal.clientesCarregados = clientesComTipos;
        renderizarTabelaClientesFinal(clientesComTipos);
        
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

// ✅ RENDERIZAR TABELA
function renderizarTabelaClientesFinal(clientes) {
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
    
    if (total) {
        total.textContent = clientes.length;
    }
}

// ✅ RECARREGAR CLIENTES
async function recarregarClientes() {
    console.log('🔄 Recarregando clientes...');
    
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
        if (!window.clientesModuloFinal.inicializado) {
            await inicializarClientes();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await carregarClientesFinal();
        
    } catch (error) {
        console.error('❌ Erro no recarregamento:', error);
        mostrarToast('Erro: ' + error.message, 'error');
    }
}

// ✅ ABRIR MODAL NOVO CLIENTE
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
        
        // Limpar tipos vinculados
        window.clientesModuloFinal.tiposRefeicaoTemp = [];
        atualizarTiposRefeicaoVinculados();
        window.clientesModuloFinal.editandoCliente = null;
        
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

// ✅ EDITAR CLIENTE
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
    const modal = document.getElementById('modal-cliente');
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            document.getElementById('cliente-descricao').focus();
        }, 100);
    }
}

// ✅ EXCLUIR CLIENTE
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

        // Excluir relações primeiro (CASCADE já cuida, mas vamos ser explícitos)
        const { error: deleteRelError } = await window.supabase
            .from('cliente_tipos_refeicao')
            .delete()
            .eq('cliente_id', cliente.id);

        if (deleteRelError) {
            console.warn('⚠️ Erro ao excluir relações:', deleteRelError);
        }

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

// ✅ SALVAR CLIENTE - VERSÃO DEFINITIVA (TOTALMENTE CORRIGIDA)
async function salvarCliente() {
    console.log('💾 Salvando cliente...');
    
    try {
        // Verificar autenticação
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

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

        console.log('📝 Dados do cliente:', dadosCliente);

        let clienteSalvo;

        if (id) {
            // Atualizar cliente existente
            console.log('🔄 Atualizando cliente existente:', id);
            
            const { error } = await window.supabase
                .from('clientes')
                .update(dadosCliente)
                .eq('id', id)
                .eq('user_id', user.id);
            
            if (error) {
                console.error('❌ Erro ao atualizar cliente:', error);
                throw error;
            }
            
            // Buscar cliente atualizado
            const { data: clienteAtualizado, error: selectError } = await window.supabase
                .from('clientes')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();
            
            if (selectError) {
                console.error('❌ Erro ao buscar cliente atualizado:', selectError);
                throw selectError;
            }
            
            clienteSalvo = clienteAtualizado;
            console.log('✅ Cliente atualizado:', clienteSalvo);
            
        } else {
            // Criar novo cliente
            console.log('➕ Criando novo cliente');
            
            const { data, error } = await window.supabase
                .from('clientes')
                .insert([dadosCliente])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Erro ao criar cliente:', error);
                throw error;
            }
            
            clienteSalvo = data;
            console.log('✅ Cliente criado:', clienteSalvo);
        }

        // ✅ CORREÇÃO PRINCIPAL: Salvar tipos vinculados SEM user_id
        if (clienteSalvo && clienteSalvo.id) {
            console.log('🔗 Salvando tipos vinculados...');
            
            // Remover tipos antigos
            const { error: deleteError } = await window.supabase
                .from('cliente_tipos_refeicao')
                .delete()
                .eq('cliente_id', clienteSalvo.id);
            
            if (deleteError) {
                console.error('❌ Erro ao limpar tipos antigos:', deleteError);
                // Não vamos falhar por isso, apenas avisar
            }

            // Adicionar tipos novos
            const tiposParaVincular = window.clientesModuloFinal.tiposRefeicaoTemp || [];
            
            if (tiposParaVincular.length > 0) {
                console.log(`➕ Vinculando ${tiposParaVincular.length} tipos...`);
                
                // Validar se os tipos existem antes de vincular
                const tiposValidos = [];
                for (const tipo of tiposParaVincular) {
                    if (tipo && tipo.id) {
                        // Verificar se o tipo ainda existe
                        const { data: tipoExiste, error: tipoError } = await window.supabase
                            .from('tipos_refeicoes')
                            .select('id')
                            .eq('id', tipo.id)
                            .eq('user_id', user.id)
                            .single();
                        
                        if (!tipoError && tipoExiste) {
                            // ✅ CORREÇÃO: Estrutura correta SEM user_id
                            tiposValidos.push({
                                cliente_id: clienteSalvo.id,
                                tipo_refeicao_id: tipo.id
                                // NÃO incluir user_id aqui!
                            });
                        } else {
                            console.warn(`⚠️ Tipo ${tipo.codigo} não encontrado, ignorando...`);
                        }
                    }
                }

                if (tiposValidos.length > 0) {
                    console.log(`✅ Inserindo ${tiposValidos.length} tipos válidos:`, tiposValidos);
                    
                    // ✅ CORREÇÃO: Insert sem colunas específicas
                    const { error: insertError } = await window.supabase
                        .from('cliente_tipos_refeicao')
                        .insert(tiposValidos);

                    if (insertError) {
                        console.error('❌ Erro ao vincular tipos:', insertError);
                        console.error('Dados que causaram erro:', tiposValidos);
                        throw insertError;
                    }
                    
                    console.log('✅ Tipos vinculados com sucesso');
                } else {
                    console.log('ℹ️ Nenhum tipo válido para vincular');
                }
            } else {
                console.log('ℹ️ Nenhum tipo para vincular');
            }
        }

        // Sucesso!
        const mensagem = id ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!';
        mostrarToast(mensagem, 'success');
        
        // Fechar modal
        fecharModalCliente();
        
        // Recarregar lista
        await recarregarClientes();

    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        
        let mensagemErro = 'Erro ao salvar cliente';
        
        if (error.message.includes('duplicate key')) {
            mensagemErro = 'Já existe um cliente com este código';
        } else if (error.message.includes('not null')) {
            mensagemErro = 'Erro de validação: campos obrigatórios não preenchidos';
        } else if (error.message.includes('foreign key')) {
            mensagemErro = 'Erro de referência: dados inconsistentes';
        } else if (error.message.includes('user_id')) {
            mensagemErro = 'Erro de estrutura do banco - execute o script de correção';
        } else {
            mensagemErro += ': ' + error.message;
        }
        
        mostrarToast(mensagemErro, 'error');
    }
}

// ✅ MODAL DE TIPOS DE REFEIÇÃO
async function abrirModalTiposRefeicao() {
    console.log('🍽️ Abrindo modal de tipos de refeição...');
    
    try {
        // Garantir que os tipos padrão estão carregados
        if (!window.tiposRefeicoesPadrao || window.tiposRefeicoesPadrao.length === 0) {
            await carregarTiposRefeicoesPadrao();
        }
        
        const modal = document.getElementById('modal-tipos-refeicao');
        const lista = document.getElementById('lista-tipos-modal');
        
        if (!modal || !lista) {
            mostrarToast('Erro: Modal de tipos não encontrado', 'error');
            return;
        }
        
        // Limpar lista
        lista.innerHTML = '';
        
        if (!window.tiposRefeicoesPadrao || window.tiposRefeicoesPadrao.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum tipo de refeição encontrado.<br>Cadastre alguns tipos primeiro na aba "Tipos de Refeições".</p>';
        } else {
            // Carregar tipos já vinculados
            const tiposJaVinculados = window.clientesModuloFinal?.tiposRefeicaoTemp || [];
            const idsVinculados = tiposJaVinculados.map(t => t.id);
            
            // Renderizar cada tipo
            window.tiposRefeicoesPadrao.forEach(tipo => {
                const isVinculado = idsVinculados.includes(tipo.id);
                
                const div = document.createElement('div');
                div.className = 'tipo-item';
                div.innerHTML = `
                    <input type="checkbox" 
                           id="tipo-${tipo.id}" 
                           ${isVinculado ? 'checked' : ''} 
                           onchange="toggleTipoRefeicao('${tipo.id}', '${tipo.codigo}', '${tipo.descricao}', this.checked)">
                    <label for="tipo-${tipo.id}">${tipo.codigo} - ${tipo.descricao}</label>
                `;
                lista.appendChild(div);
            });
        }
        
        // Mostrar modal
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Erro ao abrir modal de tipos:', error);
        mostrarToast('Erro ao carregar tipos de refeição: ' + error.message, 'error');
    }
}

// ✅ TOGGLE TIPO DE REFEIÇÃO
function toggleTipoRefeicao(id, codigo, descricao, checked) {
    console.log(`🔄 Toggle tipo: ${codigo} - ${descricao} (${checked ? 'adicionar' : 'remover'})`);
    
    if (!window.clientesModuloFinal.tiposRefeicaoTemp) {
        window.clientesModuloFinal.tiposRefeicaoTemp = [];
    }
    
    const tipoObj = { id, codigo, descricao };
    
    if (checked) {
        // Adicionar se não existe
        const existe = window.clientesModuloFinal.tiposRefeicaoTemp.find(t => t.id === id);
        if (!existe) {
            window.clientesModuloFinal.tiposRefeicaoTemp.push(tipoObj);
        }
    } else {
        // Remover se existe
        window.clientesModuloFinal.tiposRefeicaoTemp = window.clientesModuloFinal.tiposRefeicaoTemp.filter(t => t.id !== id);
    }
    
    // Atualizar lista na tela
    atualizarTiposRefeicaoVinculados();
}

// ✅ ATUALIZAR TIPOS VINCULADOS
function atualizarTiposRefeicaoVinculados() {
    const container = document.getElementById('tipos-vinculados-lista');
    if (!container) return;
    
    container.innerHTML = '';

    if (!window.clientesModuloFinal.tiposRefeicaoTemp || window.clientesModuloFinal.tiposRefeicaoTemp.length === 0) {
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

// ✅ REMOVER TIPO DE REFEIÇÃO
function removerTipoRefeicao(index) {
    if (!window.clientesModuloFinal?.tiposRefeicaoTemp) return;
    
    if (index >= 0 && index < window.clientesModuloFinal.tiposRefeicaoTemp.length) {
        const tipoRemovido = window.clientesModuloFinal.tiposRefeicaoTemp.splice(index, 1)[0];
        console.log(`✅ Tipo ${tipoRemovido.codigo} removido`);
        atualizarTiposRefeicaoVinculados();
    }
}

// ✅ FILTRAR CLIENTES
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
    
    const total = document.getElementById('total-clientes');
    if (total) {
        total.textContent = filtrados.length;
    }
}

// ✅ FECHAR MODAIS
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

function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ✅ TOAST NOTIFICATIONS
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    // Usar toast global se disponível
    if (window.mostrarToast && typeof window.mostrarToast === 'function' && window.mostrarToast !== mostrarToast) {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
    // Remover toast existente
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar novo toast
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

// ✅ EXPORTAR FUNÇÕES GLOBAIS
window.inicializarClientes = inicializarClientes;
window.recarregarClientes = recarregarClientes;
window.abrirModalNovoCliente = abrirModalNovoCliente;
window.editarClienteFinal = editarClienteFinal;
window.excluirClienteFinal = excluirClienteFinal;
window.salvarCliente = salvarCliente;
window.abrirModalTiposRefeicao = abrirModalTiposRefeicao;
window.toggleTipoRefeicao = toggleTipoRefeicao;
window.removerTipoRefeicao = removerTipoRefeicao;
window.fecharModalCliente = fecharModalCliente;
window.fecharModalTipos = fecharModalTipos;
window.fecharModal = fecharModal;

// Para compatibilidade
window.editarCliente = editarClienteFinal;
window.excluirCliente = excluirClienteFinal;
window.carregarClientes = carregarClientesFinal;

// ✅ TESTE DO SISTEMA
window.testarSistemaClientes = function() {
    console.log('🧪 === TESTE SISTEMA CLIENTES DEFINITIVO ===');
    console.log('📋 Estado atual:');
    console.log('  - Inicializado:', window.clientesModuloFinal?.inicializado);
    console.log('  - Clientes carregados:', window.clientesModuloFinal?.clientesCarregados?.length || 0);
    console.log('  - Tipos temporários:', window.clientesModuloFinal?.tiposRefeicaoTemp?.length || 0);
    console.log('  - Tipos padrão:', window.tiposRefeicoesPadrao?.length || 0);
    
    console.log('🔧 Funções disponíveis:');
    console.log('  - salvarCliente:', typeof window.salvarCliente);
    console.log('  - abrirModalTiposRefeicao:', typeof window.abrirModalTiposRefeicao);
    console.log('  - toggleTipoRefeicao:', typeof window.toggleTipoRefeicao);
    
    console.log('🎯 Elementos DOM:');
    console.log('  - Modal cliente:', !!document.getElementById('modal-cliente'));
    console.log('  - Modal tipos:', !!document.getElementById('modal-tipos-refeicao'));
    console.log('  - Lista tipos:', !!document.getElementById('lista-tipos-modal'));
    console.log('  - Tipos vinculados:', !!document.getElementById('tipos-vinculados-lista'));
    
    console.log('✅ Teste completo - versão definitiva!');
};

console.log('✅ clientes.js DEFINITIVO carregado - use testarSistemaClientes() para testar');