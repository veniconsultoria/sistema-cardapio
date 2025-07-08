// modules/clientes.js - Módulo Unificado de Clientes
import { showToast } from './utils.js';

console.log('📁 Carregando módulo clientes.js...');

class ClientesModule {
    constructor() {
        this.supabase = null;
        this.estado = {
            clientes: [],
            tiposRefeicao: [],
            tiposTemporarios: [],
            editando: null,
            inicializado: false
        };
    }

    // ===== INICIALIZAÇÃO =====
    async init(supabaseInstance) {
        console.log('🚀 Inicializando módulo de clientes...');
        
        try {
            if (this.estado.inicializado) {
                console.log('⚠️ Módulo já inicializado');
                return true;
            }

            this.supabase = supabaseInstance;
            
            if (!await this.verificarAutenticacao()) {
                return false;
            }

            await this.carregarDados();
            this.configurarEventos();
            this.configurarInterface();
            
            this.estado.inicializado = true;
            console.log('✅ Módulo de clientes inicializado');
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar módulo de clientes:', error);
            showToast('Erro ao inicializar clientes: ' + error.message, 'error');
            return false;
        }
    }

    // ===== VERIFICAR AUTENTICAÇÃO =====
    async verificarAutenticacao() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                showToast('Você precisa estar logado para acessar esta página.', 'error');
                window.location.href = 'login.html';
                return false;
            }
            return true;
        } catch (error) {
            console.error('❌ Erro na autenticação:', error);
            return false;
        }
    }

    // ===== CONFIGURAR EVENTOS =====
    configurarEventos() {
        console.log('⚙️ Configurando eventos de clientes...');
        
        // Busca de clientes
        const buscaInput = document.getElementById('busca-clientes');
        if (buscaInput) {
            buscaInput.removeEventListener('input', this.filtrar);
            this.filtrar = () => this.filtrarClientes();
            buscaInput.addEventListener('input', this.filtrar);
        }

        // Formulário de cliente
        const form = document.getElementById('form-cliente');
        if (form) {
            form.removeEventListener('submit', this.handleFormSubmit);
            this.handleFormSubmit = (e) => {
                e.preventDefault();
                this.salvar();
            };
            form.addEventListener('submit', this.handleFormSubmit);
        }
    }

    // ===== CONFIGURAR INTERFACE =====
    configurarInterface() {
        this.mostrarMensagemInicial();
    }

    // ===== CARREGAR DADOS =====
    async carregarDados() {
        console.log('📥 Carregando dados de clientes...');
        
        try {
            await Promise.all([
                this.carregarTiposRefeicao(),
                this.gerarProximoCodigo()
            ]);
            
            console.log('✅ Dados carregados');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    }

    // ===== CARREGAR TIPOS DE REFEIÇÃO =====
    async carregarTiposRefeicao() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await this.supabase
                .from('tipos_refeicoes')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (error) throw error;
            
            this.estado.tiposRefeicao = data || [];
            console.log(`✅ ${this.estado.tiposRefeicao.length} tipos de refeição carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar tipos:', error);
            this.estado.tiposRefeicao = [];
        }
    }

    // ===== GERAR PRÓXIMO CÓDIGO =====
    async gerarProximoCodigo() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            const { data, error } = await this.supabase.rpc('get_next_cliente_codigo', {
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

    // ===== MOSTRAR MENSAGEM INICIAL =====
    mostrarMensagemInicial() {
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

    // ===== CARREGAR CLIENTES =====
    async carregar() {
        try {
            console.log('📥 Carregando clientes...');
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Mostrar loading
            this.mostrarLoading();

            // Carregar clientes básicos
            const { data: clientesData, error: clientesError } = await this.supabase
                .from('clientes')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (clientesError) throw clientesError;

            if (!clientesData || clientesData.length === 0) {
                this.estado.clientes = [];
                this.renderizarTabela([]);
                return;
            }

            // Carregar tipos vinculados para cada cliente
            const clientesComTipos = [];
            
            for (const cliente of clientesData) {
                try {
                    const { data: tiposData, error: tiposError } = await this.supabase
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
                    console.warn(`⚠️ Erro ao carregar tipos do cliente ${cliente.descricao}:`, error);
                    clientesComTipos.push({
                        ...cliente,
                        tiposRefeicao: []
                    });
                }
            }

            this.estado.clientes = clientesComTipos;
            this.renderizarTabela(clientesComTipos);
            
            showToast(`✅ ${clientesComTipos.length} cliente(s) carregado(s)!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            showToast('Erro ao carregar clientes: ' + error.message, 'error');
            this.renderizarTabela([]);
        }
    }

    // ===== MOSTRAR LOADING =====
    mostrarLoading() {
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
    }

    // ===== RENDERIZAR TABELA =====
    renderizarTabela(clientes) {
        const tbody = document.getElementById('clientes-tbody');
        const total = document.getElementById('total-clientes');
        
        if (!tbody) {
            console.error('❌ Elemento tbody não encontrado!');
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
                    <button onclick="window.clientesModule.editar(${index})" class="btn btn-primary btn-sm">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="window.clientesModule.excluir(${index})" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (total) {
            total.textContent = clientes.length;
        }
    }

    // ===== FILTRAR CLIENTES =====
    filtrarClientes() {
        const busca = document.getElementById('busca-clientes')?.value.toLowerCase() || '';
        
        if (!this.estado.clientes) return;
        
        const filtrados = this.estado.clientes.filter(cliente => {
            return !busca || 
                   cliente.descricao.toLowerCase().includes(busca) || 
                   cliente.codigo.toLowerCase().includes(busca) ||
                   (cliente.email && cliente.email.toLowerCase().includes(busca)) ||
                   (cliente.telefone && cliente.telefone.toLowerCase().includes(busca));
        });
        
        this.renderizarTabela(filtrados);
        
        const total = document.getElementById('total-clientes');
        if (total) {
            total.textContent = filtrados.length;
        }
    }

    // ===== ABRIR MODAL NOVO CLIENTE =====
    async abrirModalNovo() {
        try {
            await this.gerarProximoCodigo();
            this.limparFormulario();
            this.estado.editando = null;
            
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
            showToast('Erro ao abrir formulário: ' + error.message, 'error');
        }
    }

    // ===== EDITAR CLIENTE =====
    editar(index) {
        const cliente = this.estado.clientes[index];
        if (!cliente) {
            showToast('Cliente não encontrado', 'error');
            return;
        }

        console.log('✏️ Editando cliente:', cliente.descricao);

        // Preencher formulário
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('cliente-codigo').value = cliente.codigo;
        document.getElementById('cliente-descricao').value = cliente.descricao;
        document.getElementById('cliente-endereco').value = cliente.endereco || '';
        document.getElementById('cliente-numero').value = cliente.numero || '';
        document.getElementById('cliente-telefone').value = cliente.telefone || '';
        document.getElementById('cliente-email').value = cliente.email || '';
        
        // Carregar tipos vinculados
        this.estado.tiposTemporarios = [...(cliente.tiposRefeicao || [])];
        this.atualizarTiposVinculados();
        this.estado.editando = index;
        
        // Mostrar modal
        const modal = document.getElementById('modal-cliente');
        if (modal) {
            modal.style.display = 'block';
            setTimeout(() => {
                document.getElementById('cliente-descricao').focus();
            }, 100);
        }

        console.log('✅ Cliente carregado para edição');
    }

    // ===== EXCLUIR CLIENTE =====
    async excluir(index) {
        try {
            const cliente = this.estado.clientes[index];
            if (!cliente) {
                showToast('Cliente não encontrado', 'error');
                return;
            }

            if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.descricao}"?`)) {
                return;
            }

            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Excluir relações primeiro (CASCADE cuida, mas vamos ser explícitos)
            await this.supabase
                .from('cliente_tipos_refeicao')
                .delete()
                .eq('cliente_id', cliente.id);

            // Excluir cliente
            const { error } = await this.supabase
                .from('clientes')
                .delete()
                .eq('id', cliente.id)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast('Cliente excluído com sucesso!', 'success');
            await this.carregar();

        } catch (error) {
            console.error('❌ Erro ao excluir cliente:', error);
            showToast('Erro ao excluir cliente: ' + error.message, 'error');
        }
    }

    // ===== SALVAR CLIENTE =====
    async salvar() {
        try {
            console.log('💾 Salvando cliente...');
            
            const { data: { user } } = await this.supabase.auth.getUser();
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
                showToast('Por favor, informe o nome/descrição do cliente', 'warning');
                document.getElementById('cliente-descricao').focus();
                return;
            }

            if (!codigo) {
                showToast('Código não foi gerado. Tente novamente.', 'warning');
                await this.gerarProximoCodigo();
                return;
            }

            // Validação de email (se preenchido)
            if (email && !this.validarEmail(email)) {
                showToast('Por favor, informe um email válido', 'warning');
                document.getElementById('cliente-email').focus();
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
                // Atualizar cliente existente
                const { error } = await this.supabase
                    .from('clientes')
                    .update(dadosCliente)
                    .eq('id', id)
                    .eq('user_id', user.id);
                
                if (error) throw error;
                
                // Buscar cliente atualizado
                const { data: clienteAtualizado, error: selectError } = await this.supabase
                    .from('clientes')
                    .select('*')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single();
                
                if (selectError) throw selectError;
                clienteSalvo = clienteAtualizado;
                
            } else {
                // Criar novo cliente
                const { data, error } = await this.supabase
                    .from('clientes')
                    .insert([dadosCliente])
                    .select()
                    .single();
                
                if (error) throw error;
                clienteSalvo = data;
            }

            // Salvar tipos vinculados
            if (clienteSalvo?.id) {
                await this.salvarTiposVinculados(clienteSalvo.id);
            }

            const mensagem = id ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!';
            showToast(mensagem, 'success');
            
            this.fecharModal('modal-cliente');
            await this.carregar();

        } catch (error) {
            console.error('❌ Erro ao salvar cliente:', error);
            
            let mensagemErro = 'Erro ao salvar cliente';
            if (error.message.includes('duplicate key')) {
                mensagemErro = 'Já existe um cliente com este código';
            } else if (error.message.includes('not null')) {
                mensagemErro = 'Campos obrigatórios não preenchidos';
            }
            
            showToast(mensagemErro + ': ' + error.message, 'error');
        }
    }

    // ===== SALVAR TIPOS VINCULADOS =====
    async salvarTiposVinculados(clienteId) {
        try {
            console.log('🔗 Salvando tipos vinculados...');
            
            // Remover tipos antigos
            await this.supabase
                .from('cliente_tipos_refeicao')
                .delete()
                .eq('cliente_id', clienteId);

            // Adicionar tipos novos
            if (this.estado.tiposTemporarios.length > 0) {
                const { data: { user } } = await this.supabase.auth.getUser();
                
                const tiposParaVincular = [];
                for (const tipo of this.estado.tiposTemporarios) {
                    if (tipo?.id) {
                        // Verificar se o tipo ainda existe
                        const { data: tipoExiste } = await this.supabase
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
                    const { error } = await this.supabase
                        .from('cliente_tipos_refeicao')
                        .insert(tiposParaVincular);

                    if (error) throw error;
                    console.log(`✅ ${tiposParaVincular.length} tipo(s) vinculado(s)`);
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao salvar tipos vinculados:', error);
            throw error;
        }
    }

    // ===== LIMPAR FORMULÁRIO =====
    limparFormulario() {
        document.getElementById('cliente-id').value = '';
        document.getElementById('cliente-descricao').value = '';
        document.getElementById('cliente-endereco').value = '';
        document.getElementById('cliente-numero').value = '';
        document.getElementById('cliente-telefone').value = '';
        document.getElementById('cliente-email').value = '';
        
        this.estado.tiposTemporarios = [];
        this.atualizarTiposVinculados();
        this.estado.editando = null;
        
        this.gerarProximoCodigo();
    }

    // ===== MODAL TIPOS DE REFEIÇÃO =====
    async abrirModalTipos() {
        try {
            console.log('🍽️ Abrindo modal de tipos...');
            
            // Garantir que tipos estão carregados
            if (this.estado.tiposRefeicao.length === 0) {
                await this.carregarTiposRefeicao();
            }
            
            const modal = document.getElementById('modal-tipos-refeicao');
            const lista = document.getElementById('lista-tipos-modal');
            
            if (!modal || !lista) {
                showToast('Erro: Modal de tipos não encontrado', 'error');
                return;
            }
            
            // Limpar lista
            lista.innerHTML = '';
            
            if (this.estado.tiposRefeicao.length === 0) {
                lista.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 20px;">
                        <p>Nenhum tipo de refeição encontrado.</p>
                        <small>Cadastre alguns tipos primeiro na aba "Tipos de Refeições".</small>
                    </div>
                `;
            } else {
                // Tipos já vinculados
                const idsVinculados = this.estado.tiposTemporarios.map(t => t.id);
                
                // Renderizar cada tipo
                this.estado.tiposRefeicao.forEach(tipo => {
                    const isVinculado = idsVinculados.includes(tipo.id);
                    
                    const div = document.createElement('div');
                    div.className = 'tipo-item';
                    div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #e9ecef; border-radius: 5px; margin-bottom: 5px; background: white; transition: background-color 0.2s;';
                    
                    div.innerHTML = `
                        <input type="checkbox" 
                               id="tipo-${tipo.id}" 
                               ${isVinculado ? 'checked' : ''} 
                               onchange="window.clientesModule.toggleTipo('${tipo.id}', '${tipo.codigo}', '${tipo.descricao}', this.checked)">
                        <label for="tipo-${tipo.id}" style="flex: 1; margin: 0; cursor: pointer; font-weight: ${isVinculado ? '600' : '400'}; color: ${isVinculado ? '#155724' : '#333'};">
                            ${tipo.codigo} - ${tipo.descricao}${isVinculado ? ' ✅' : ''}
                        </label>
                    `;
                    
                    div.addEventListener('mouseenter', () => {
                        if (!isVinculado) div.style.backgroundColor = '#f8f9fa';
                    });
                    
                    div.addEventListener('mouseleave', () => {
                        div.style.backgroundColor = 'white';
                    });
                    
                    lista.appendChild(div);
                });
            }
            
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Erro ao abrir modal de tipos:', error);
            showToast('Erro ao carregar tipos: ' + error.message, 'error');
        }
    }

    // ===== TOGGLE TIPO DE REFEIÇÃO =====
    toggleTipo(id, codigo, descricao, checked) {
        console.log(`🔄 Toggle tipo: ${codigo} - ${checked ? 'vincular' : 'desvincular'}`);
        
        const tipoObj = { id, codigo, descricao };
        
        if (checked) {
            // Adicionar se não existe
            if (!this.estado.tiposTemporarios.find(t => t.id === id)) {
                this.estado.tiposTemporarios.push(tipoObj);
            }
        } else {
            // Remover
            this.estado.tiposTemporarios = this.estado.tiposTemporarios.filter(t => t.id !== id);
        }
        
        this.atualizarTiposVinculados();
    }

    // ===== REMOVER TIPO =====
    removerTipo(index) {
        if (index >= 0 && index < this.estado.tiposTemporarios.length) {
            const tipoRemovido = this.estado.tiposTemporarios.splice(index, 1)[0];
            console.log(`✅ Tipo ${tipoRemovido.codigo} removido`);
            this.atualizarTiposVinculados();
            
            // Atualizar checkbox no modal se estiver aberto
            const checkbox = document.getElementById(`tipo-${tipoRemovido.id}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }
    }

    // ===== ATUALIZAR TIPOS VINCULADOS =====
    atualizarTiposVinculados() {
        const container = document.getElementById('tipos-vinculados-lista');
        if (!container) return;
        
        container.innerHTML = '';

        if (!this.estado.tiposTemporarios || this.estado.tiposTemporarios.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #666; padding: 15px; background: #f8f9fa; border-radius: 5px; border: 1px dashed #dee2e6;">
                    <i class="fas fa-utensils" style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p style="margin: 0;">Nenhum tipo de refeição vinculado</p>
                    <small>Use o botão "Selecionar Tipos" para adicionar</small>
                </div>
            `;
            return;
        }

        this.estado.tiposTemporarios.forEach((tipo, index) => {
            const div = document.createElement('div');
            div.className = 'tipo-vinculado-item';
            div.style.cssText = `
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                padding: 12px 16px; 
                background: linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%); 
                border: 1px solid #28a745; 
                border-radius: 8px; 
                margin-bottom: 8px;
                transition: all 0.2s ease;
            `;
            
            div.innerHTML = `
                <span style="font-weight: 500; color: #155724; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-utensils" style="color: #28a745;"></i>
                    ${tipo.codigo} - ${tipo.descricao}
                </span>
                <button class="btn btn-danger btn-sm" onclick="window.clientesModule.removerTipo(${index})" 
                        style="padding: 6px 10px; font-size: 12px; border-radius: 6px;" 
                        title="Remover tipo">
                    <i class="fas fa-times"></i>
                </button>
            `;

            // Efeito hover
            div.addEventListener('mouseenter', () => {
                div.style.transform = 'translateY(-1px)';
                div.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.2)';
            });

            div.addEventListener('mouseleave', () => {
                div.style.transform = 'translateY(0)';
                div.style.boxShadow = 'none';
            });

            container.appendChild(div);
        });
    }

    // ===== UTILITÁRIOS =====
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Instância do módulo
const clientesModule = new ClientesModule();

// Exportar para compatibilidade global
window.clientesModule = clientesModule;

// Funções públicas para inicialização
export async function initClientes(supabase) {
    return await clientesModule.init(supabase);
}

// Aliases para compatibilidade com código existente
window.inicializarClientes = () => initClientes(window.supabase);
window.recarregarClientes = () => clientesModule.carregar();
window.abrirModalNovoCliente = () => clientesModule.abrirModalNovo();
window.salvarCliente = () => clientesModule.salvar();
window.abrirModalTiposRefeicao = () => clientesModule.abrirModalTipos();
window.fecharModalCliente = () => clientesModule.fecharModal('modal-cliente');
window.fecharModalTipos = () => clientesModule.fecharModal('modal-tipos-refeicao');
window.fecharModal = (modalId) => clientesModule.fecharModal(modalId);

// Aliases para compatibilidade direta
window.editarCliente = (index) => clientesModule.editar(index);
window.excluirCliente = (index) => clientesModule.excluir(index);
window.toggleTipoRefeicao = (id, codigo, descricao, checked) => clientesModule.toggleTipo(id, codigo, descricao, checked);
window.removerTipoRefeicao = (index) => clientesModule.removerTipo(index);
window.filtrarClientes = () => clientesModule.filtrarClientes();

export default clientesModule;

console.log('✅ Módulo de clientes carregado com sucesso!');