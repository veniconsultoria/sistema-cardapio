// modules/tiposRefeicoes.js - Sistema de Tipos de Refeições Modularizado

import { showToast } from './utils.js';

/**
 * Módulo para gerenciamento de tipos de refeições
 * Responsável por: CRUD de tipos, geração de códigos, filtros, modal
 */
class TiposRefeicoesModule {
    constructor() {
        this.tipos = [];
        this.editandoIndex = null;
        this.carregado = false;
        this.supabase = null;
        this.user = null;
        
        console.log('🍽️ TiposRefeicoesModule: Inicializando...');
    }

    /**
     * Inicializa o módulo
     */
    async init(supabaseInstance) {
        try {
            this.supabase = supabaseInstance;
            
            // Verificar autenticação
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error || !user) {
                throw new Error('Usuário não autenticado');
            }
            this.user = user;

            // Configurar eventos
            this.configurarEventos();
            
            // Gerar próximo código
            await this.gerarProximoCodigo();
            
            // Mostrar mensagem inicial (não carregar automaticamente)
            this.mostrarMensagemInicial();
            
            console.log('✅ TiposRefeicoesModule: Inicializado com sucesso');
            showToast('Sistema de tipos de refeições pronto', 'success');
            
        } catch (error) {
            console.error('❌ TiposRefeicoesModule: Erro na inicialização:', error);
            showToast('Erro ao carregar sistema de tipos: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Configura os eventos do módulo
     */
    configurarEventos() {
        // Evento de pesquisa
        const searchInput = document.getElementById('busca-tipos');
        if (searchInput) {
            searchInput.removeEventListener('input', this.handleSearch);
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // Eventos do modal
        this.configurarEventosModal();

        // Evento de teclas (ESC para fechar modal)
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Configura eventos específicos do modal
     */
    configurarEventosModal() {
        const modal = document.getElementById('modal-tipo');
        if (modal) {
            // Fechar modal clicando fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.fecharModal();
                }
            });
        }

        // Formulário do modal
        const form = document.getElementById('form-tipo');
        if (form) {
            form.removeEventListener('submit', this.handleFormSubmit);
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
    }

    /**
     * Handler para teclas
     */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.fecharModal();
        }
    }

    /**
     * Handler para pesquisa
     */
    handleSearch() {
        this.filtrarTipos();
    }

    /**
     * Handler para submit do formulário
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        await this.salvarTipo();
    }

    /**
     * Mostra mensagem inicial (antes de carregar dados)
     */
    mostrarMensagemInicial() {
        const tbody = document.getElementById('tipos-tbody');
        const totalElement = document.getElementById('total-tipos');
        
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-5 text-muted">
                        <i class="fas fa-utensils fa-3x mb-3 d-block"></i>
                        <h5>Tipos de Refeições</h5>
                        <p class="mb-0">Clique em "Listar Tipos" para carregar os dados</p>
                    </td>
                </tr>
            `;
        }
        
        if (totalElement) {
            totalElement.textContent = '0';
        }
    }

    /**
     * Gera o próximo código sequencial
     */
    async gerarProximoCodigo() {
        try {
            const { data, error } = await this.supabase.rpc('get_next_tipo_refeicao_codigo', {
                user_uuid: this.user.id
            });

            if (error) throw error;

            const input = document.getElementById('tipo-codigo');
            if (input && this.editandoIndex === null) {
                input.value = data || 'TIPO001';
            }
            
        } catch (error) {
            console.error('❌ Erro ao gerar código:', error);
            const input = document.getElementById('tipo-codigo');
            if (input && this.editandoIndex === null) {
                input.value = 'TIPO001';
            }
        }
    }

    /**
     * Carrega tipos do banco de dados
     */
    async carregarTipos() {
        try {
            showToast('Carregando tipos de refeições...', 'info');
            
            const { data, error } = await this.supabase
                .from('tipos_refeicoes')
                .select('*')
                .eq('user_id', this.user.id)
                .order('codigo');

            if (error) throw error;

            this.tipos = data || [];
            this.carregado = true;
            
            this.renderizarTabela();
            this.atualizarContador();
            
            // Disponibilizar globalmente para outros módulos
            window.tiposRefeicoesPadrao = this.tipos;
            
            if (this.tipos.length > 0) {
                showToast(`${this.tipos.length} tipo(s) carregado(s) com sucesso!`, 'success');
            } else {
                showToast('Nenhum tipo de refeição encontrado', 'info');
            }
            
            console.log(`✅ ${this.tipos.length} tipos de refeições carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar tipos:', error);
            showToast('Erro ao carregar tipos: ' + error.message, 'error');
            this.mostrarErroTabela(error.message);
        }
    }

    /**
     * Renderiza a tabela de tipos
     */
    renderizarTabela() {
        const tbody = document.getElementById('tipos-tbody');
        if (!tbody) return;

        if (this.tipos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-5 text-muted">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        <h6>Nenhum tipo cadastrado</h6>
                        <p class="mb-0">Clique em "Novo Tipo" para começar</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.tipos.map((tipo, index) => `
            <tr>
                <td>
                    <span class="badge badge-primary">${tipo.codigo}</span>
                </td>
                <td>
                    <strong>${tipo.descricao}</strong>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button onclick="tiposRefeicoes.editarTipo(${index})" 
                                class="btn btn-outline-primary" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="tiposRefeicoes.excluirTipo(${index})" 
                                class="btn btn-outline-danger" 
                                title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Filtra tipos na tabela
     */
    filtrarTipos() {
        const busca = document.getElementById('busca-tipos')?.value.toLowerCase() || '';
        
        if (!this.carregado) {
            showToast('Carregue os tipos primeiro', 'warning');
            return;
        }

        const tiposFiltrados = this.tipos.filter(tipo => {
            return !busca || 
                   tipo.descricao.toLowerCase().includes(busca) || 
                   tipo.codigo.toLowerCase().includes(busca);
        });

        this.renderizarTabelaFiltrada(tiposFiltrados);
    }

    /**
     * Renderiza tabela com tipos filtrados
     */
    renderizarTabelaFiltrada(tiposFiltrados) {
        const tbody = document.getElementById('tipos-tbody');
        if (!tbody) return;

        if (tiposFiltrados.length === 0) {
            const busca = document.getElementById('busca-tipos')?.value || '';
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-4 text-muted">
                        <i class="fas fa-search fa-2x mb-2 d-block"></i>
                        <h6>Nenhum resultado encontrado</h6>
                        <p class="mb-0">Não há tipos que correspondam a "${busca}"</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = tiposFiltrados.map((tipo) => {
            const index = this.tipos.findIndex(t => t.id === tipo.id);
            return `
                <tr>
                    <td>
                        <span class="badge badge-primary">${tipo.codigo}</span>
                    </td>
                    <td>
                        <strong>${tipo.descricao}</strong>
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button onclick="tiposRefeicoes.editarTipo(${index})" 
                                    class="btn btn-outline-primary" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="tiposRefeicoes.excluirTipo(${index})" 
                                    class="btn btn-outline-danger" 
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Atualizar contador com resultados filtrados
        const totalElement = document.getElementById('total-tipos');
        if (totalElement) {
            totalElement.textContent = tiposFiltrados.length;
        }
    }

    /**
     * Mostra erro na tabela
     */
    mostrarErroTabela(mensagem) {
        const tbody = document.getElementById('tipos-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-4 text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
                        <h6>Erro ao carregar dados</h6>
                        <p class="mb-0">${mensagem}</p>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Abre modal para novo tipo
     */
    async abrirModalNovoTipo() {
        await this.gerarProximoCodigo();
        
        // Limpar formulário
        document.getElementById('tipo-id').value = '';
        document.getElementById('tipo-descricao').value = '';
        
        this.editandoIndex = null;
        
        // Atualizar título do modal
        this.atualizarTituloModal('Novo Tipo de Refeição');
        
        // Mostrar modal
        this.mostrarModal();
        
        // Focar no campo descrição
        setTimeout(() => {
            const descInput = document.getElementById('tipo-descricao');
            if (descInput) {
                descInput.focus();
                descInput.select();
            }
        }, 100);
    }

    /**
     * Edita um tipo existente
     */
    editarTipo(index) {
        const tipo = this.tipos[index];
        if (!tipo) {
            showToast('Tipo não encontrado', 'error');
            return;
        }

        // Preencher formulário
        document.getElementById('tipo-id').value = tipo.id;
        document.getElementById('tipo-codigo').value = tipo.codigo;
        document.getElementById('tipo-descricao').value = tipo.descricao;
        
        this.editandoIndex = index;
        
        // Atualizar título do modal
        this.atualizarTituloModal('Editar Tipo de Refeição');
        
        // Mostrar modal
        this.mostrarModal();
        
        // Focar no campo descrição
        setTimeout(() => {
            const descInput = document.getElementById('tipo-descricao');
            if (descInput) {
                descInput.focus();
                descInput.select();
            }
        }, 100);
    }

    /**
     * Coleta dados do formulário
     */
    coletarDadosFormulario() {
        return {
            id: document.getElementById('tipo-id')?.value,
            codigo: document.getElementById('tipo-codigo')?.value.trim(),
            descricao: document.getElementById('tipo-descricao')?.value.trim()
        };
    }

    /**
     * Valida dados do tipo
     */
    validarDados(dados) {
        const erros = [];

        if (!dados.codigo) {
            erros.push('Código é obrigatório');
        }

        if (!dados.descricao) {
            erros.push('Descrição é obrigatória');
        }

        // Verificar código duplicado (apenas para novos tipos)
        if (!dados.id) {
            const codigoExiste = this.tipos.some(t => t.codigo === dados.codigo);
            if (codigoExiste) {
                erros.push('Código já existe');
            }
        }

        return erros;
    }

    /**
     * Salva tipo no banco de dados
     */
    async salvarTipo() {
        try {
            const dados = this.coletarDadosFormulario();
            const erros = this.validarDados(dados);

            if (erros.length > 0) {
                showToast('Erro de validação:\n• ' + erros.join('\n• '), 'error');
                return;
            }

            // Preparar dados para salvar
            const tipoData = {
                codigo: dados.codigo,
                descricao: dados.descricao,
                user_id: this.user.id
            };

            let result;
            if (dados.id) {
                // Atualizar tipo existente
                result = await this.supabase
                    .from('tipos_refeicoes')
                    .update(tipoData)
                    .eq('id', dados.id)
                    .eq('user_id', this.user.id);
            } else {
                // Criar novo tipo
                result = await this.supabase
                    .from('tipos_refeicoes')
                    .insert([tipoData]);
            }

            if (result.error) throw result.error;

            const acao = dados.id ? 'atualizado' : 'criado';
            showToast(`Tipo ${acao} com sucesso!`, 'success');
            
            this.fecharModal();
            await this.carregarTipos();

        } catch (error) {
            console.error('❌ Erro ao salvar tipo:', error);
            showToast('Erro ao salvar tipo: ' + error.message, 'error');
        }
    }

    /**
     * Exclui um tipo
     */
    async excluirTipo(index) {
        try {
            const tipo = this.tipos[index];
            if (!tipo) {
                showToast('Tipo não encontrado', 'error');
                return;
            }

            // Confirmação
            const confirmacao = await this.confirmarExclusao(tipo);
            if (!confirmacao) return;

            const { error } = await this.supabase
                .from('tipos_refeicoes')
                .delete()
                .eq('id', tipo.id)
                .eq('user_id', this.user.id);

            if (error) throw error;

            showToast('Tipo excluído com sucesso!', 'success');
            await this.carregarTipos();

        } catch (error) {
            console.error('❌ Erro ao excluir tipo:', error);
            showToast('Erro ao excluir tipo: ' + error.message, 'error');
        }
    }

    /**
     * Confirma exclusão do tipo
     */
    async confirmarExclusao(tipo) {
        return new Promise((resolve) => {
            const confirmacao = confirm(
                `Tem certeza que deseja excluir o tipo de refeição "${tipo.descricao}"?\n\n` +
                `Esta ação não pode ser desfeita.`
            );
            resolve(confirmacao);
        });
    }

    /**
     * Gerenciamento do modal
     */
    mostrarModal() {
        const modal = document.getElementById('modal-tipo');
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }

    fecharModal() {
        const modal = document.getElementById('modal-tipo');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        
        // Limpar índice de edição
        this.editandoIndex = null;
    }

    atualizarTituloModal(titulo) {
        const tituloElement = document.getElementById('modal-tipo-titulo');
        if (tituloElement) {
            tituloElement.textContent = titulo;
        }
    }

    /**
     * Atualiza contador de tipos
     */
    atualizarContador() {
        const contador = document.getElementById('total-tipos');
        if (contador) {
            contador.textContent = this.tipos.length;
        }
    }

    /**
     * Recarrega tipos (função pública para botão)
     */
    async recarregarTipos() {
        console.log('🔄 Recarregando tipos de refeições...');
        await this.carregarTipos();
    }

    /**
     * Obtém tipos (para uso por outros módulos)
     */
    getTipos() {
        return [...this.tipos];
    }

    /**
     * Busca tipo por ID
     */
    getTipoById(id) {
        return this.tipos.find(t => t.id === id);
    }

    /**
     * Busca tipo por código
     */
    getTipoByCodigo(codigo) {
        return this.tipos.find(t => t.codigo === codigo);
    }

    /**
     * Verifica se os dados foram carregados
     */
    isCarregado() {
        return this.carregado;
    }
}

// Instância global
const tiposRefeicoes = new TiposRefeicoesModule();

// Exportar para uso global (compatibilidade)
window.tiposRefeicoes = tiposRefeicoes;

// Exportar funções específicas para compatibilidade com HTML
window.editarTipoRefeicao = (index) => tiposRefeicoes.editarTipo(index);
window.excluirTipoRefeicao = (index) => tiposRefeicoes.excluirTipo(index);
window.abrirModalNovoTipo = () => tiposRefeicoes.abrirModalNovoTipo();
window.salvarTipoRefeicao = () => tiposRefeicoes.salvarTipo();
window.recarregarTipos = () => tiposRefeicoes.recarregarTipos();
window.fecharModalTipo = () => tiposRefeicoes.fecharModal();

export default tiposRefeicoes;

/**
 * Inicialização do módulo tipos de refeições
 * Chame esta função quando a página for carregada
 */
export async function initTiposRefeicoes(supabaseInstance) {
    try {
        await tiposRefeicoes.init(supabaseInstance);
        return tiposRefeicoes;
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo tipos de refeições:', error);
        throw error;
    }
}