// modules/produtos.js - Sistema de Produtos Modularizado

import { showToast } from './utils.js';

/**
 * Módulo para gerenciamento de produtos
 * Responsável por: CRUD de produtos, geração de códigos, validações
 */
class ProdutosModule {
    constructor() {
        this.produtos = [];
        this.editandoIndex = null;
        this.supabase = null;
        this.user = null;
        
        console.log('📦 ProdutosModule: Inicializando...');
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

            // Carregar produtos
            await this.carregarProdutos();
            
            // Gerar próximo código
            await this.gerarProximoCodigo();
            
            // Configurar eventos
            this.configurarEventos();
            
            console.log('✅ ProdutosModule: Inicializado com sucesso');
            showToast('Sistema de produtos carregado', 'success');
            
        } catch (error) {
            console.error('❌ ProdutosModule: Erro na inicialização:', error);
            showToast('Erro ao carregar sistema de produtos: ' + error.message, 'error');
            throw error;
        }
    }

    /**
     * Configura os eventos do formulário
     */
    configurarEventos() {
        const form = document.getElementById('formProduto');
        if (form) {
            // Remover listeners existentes
            form.removeEventListener('submit', this.handleFormSubmit);
            // Adicionar novo listener
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }

        // Configurar outros eventos se necessário
        this.configurarEventosAdicionais();
    }

    /**
     * Configura eventos adicionais (filtros, pesquisa, etc.)
     */
    configurarEventosAdicionais() {
        // Exemplo: pesquisa em tempo real
        const searchInput = document.getElementById('pesquisaProduto');
        if (searchInput) {
            searchInput.addEventListener('input', this.filtrarProdutos.bind(this));
        }

        // Exemplo: filtro por grupo
        const filtroGrupo = document.getElementById('filtroGrupo');
        if (filtroGrupo) {
            filtroGrupo.addEventListener('change', this.filtrarProdutos.bind(this));
        }
    }

    /**
     * Handler para submit do formulário
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        await this.salvarProduto();
    }

    /**
     * Gera o próximo código sequencial
     */
    async gerarProximoCodigo() {
        try {
            const { data, error } = await this.supabase.rpc('get_next_produto_codigo', {
                user_uuid: this.user.id
            });

            if (error) throw error;

            const input = document.getElementById('codigoProduto');
            if (input && this.editandoIndex === null) {
                input.value = data || 'PR000001';
            }
            
        } catch (error) {
            console.error('❌ Erro ao gerar código:', error);
            const input = document.getElementById('codigoProduto');
            if (input && this.editandoIndex === null) {
                input.value = 'PR000001';
            }
        }
    }

    /**
     * Carrega produtos do banco de dados
     */
    async carregarProdutos() {
        try {
            const { data, error } = await this.supabase
                .from('produtos')
                .select('*')
                .eq('user_id', this.user.id)
                .order('codigo');

            if (error) throw error;

            this.produtos = data || [];
            this.renderizarTabela();
            
            // Atualizar contador
            this.atualizarContador();
            
            console.log(`✅ ${this.produtos.length} produtos carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
            showToast('Erro ao carregar produtos: ' + error.message, 'error');
        }
    }

    /**
     * Renderiza a tabela de produtos
     */
    renderizarTabela() {
        const tbody = document.querySelector('#tabelaProdutos tbody');
        if (!tbody) return;

        if (this.produtos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-box-open fa-2x mb-2 d-block"></i>
                        Nenhum produto cadastrado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.produtos.map((produto, index) => `
            <tr>
                <td><strong>${produto.codigo}</strong></td>
                <td>${produto.descricao}</td>
                <td>
                    <span class="badge badge-secondary">${produto.grupo}</span>
                </td>
                <td>${produto.unidade_medida}</td>
                <td class="text-right">
                    ${produto.preco ? `R$ ${this.formatarMoeda(produto.preco)}` : '-'}
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button onclick="produtos.editarProduto(${index})" 
                                class="btn btn-outline-primary" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="produtos.excluirProduto(${index})" 
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
     * Filtra produtos na tabela
     */
    filtrarProdutos() {
        const pesquisa = document.getElementById('pesquisaProduto')?.value.toLowerCase() || '';
        const grupo = document.getElementById('filtroGrupo')?.value || '';

        const produtosFiltrados = this.produtos.filter(produto => {
            const matchPesquisa = !pesquisa || 
                produto.descricao.toLowerCase().includes(pesquisa) ||
                produto.codigo.toLowerCase().includes(pesquisa);
            
            const matchGrupo = !grupo || produto.grupo === grupo;
            
            return matchPesquisa && matchGrupo;
        });

        this.renderizarTabelaFiltrada(produtosFiltrados);
    }

    /**
     * Renderiza tabela com produtos filtrados
     */
    renderizarTabelaFiltrada(produtosFiltrados) {
        const tbody = document.querySelector('#tabelaProdutos tbody');
        if (!tbody) return;

        if (produtosFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-search fa-2x mb-2 d-block"></i>
                        Nenhum produto encontrado com os filtros aplicados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = produtosFiltrados.map((produto) => {
            const index = this.produtos.findIndex(p => p.id === produto.id);
            return `
                <tr>
                    <td><strong>${produto.codigo}</strong></td>
                    <td>${produto.descricao}</td>
                    <td>
                        <span class="badge badge-secondary">${produto.grupo}</span>
                    </td>
                    <td>${produto.unidade_medida}</td>
                    <td class="text-right">
                        ${produto.preco ? `R$ ${this.formatarMoeda(produto.preco)}` : '-'}
                    </td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button onclick="produtos.editarProduto(${index})" 
                                    class="btn btn-outline-primary" 
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="produtos.excluirProduto(${index})" 
                                    class="btn btn-outline-danger" 
                                    title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Coleta dados do formulário
     */
    coletarDadosFormulario() {
        const dados = {
            codigo: document.getElementById('codigoProduto')?.value.trim(),
            descricao: document.getElementById('descricaoProduto')?.value.trim(),
            grupo: document.getElementById('grupoProduto')?.value,
            unidade_medida: document.getElementById('unidadeMedida')?.value,
            peso_bruto: document.getElementById('pesoBruto')?.value,
            peso_liquido: document.getElementById('pesoLiquido')?.value,
            preco: document.getElementById('precoItem')?.value,
            perda_percent: document.getElementById('perdaPercent')?.value,
            volume_m3: document.getElementById('volumeM3')?.value,
            unidade_peso: document.getElementById('unidadePeso')?.value,
        };

        // Converter valores numéricos
        ['peso_bruto', 'peso_liquido', 'preco', 'perda_percent', 'volume_m3'].forEach(campo => {
            if (dados[campo]) {
                dados[campo] = parseFloat(dados[campo]);
            } else {
                dados[campo] = null;
            }
        });

        return dados;
    }

    /**
     * Valida dados do produto
     */
    validarDados(dados) {
        const erros = [];

        if (!dados.codigo) {
            erros.push('Código é obrigatório');
        }

        if (!dados.descricao) {
            erros.push('Descrição é obrigatória');
        }

        if (!dados.grupo) {
            erros.push('Grupo é obrigatório');
        }

        if (!dados.unidade_medida) {
            erros.push('Unidade de medida é obrigatória');
        }

        // Verificar código duplicado (apenas para novos produtos)
        if (this.editandoIndex === null) {
            const codigoExiste = this.produtos.some(p => p.codigo === dados.codigo);
            if (codigoExiste) {
                erros.push('Código já existe');
            }
        }

        return erros;
    }

    /**
     * Salva produto no banco de dados
     */
    async salvarProduto() {
        try {
            const dados = this.coletarDadosFormulario();
            const erros = this.validarDados(dados);

            if (erros.length > 0) {
                showToast('Erro de validação:\n• ' + erros.join('\n• '), 'error');
                return;
            }

            // Adicionar user_id
            dados.user_id = this.user.id;

            let result;
            if (this.editandoIndex !== null) {
                // Atualizar produto existente
                const produto = this.produtos[this.editandoIndex];
                result = await this.supabase
                    .from('produtos')
                    .update(dados)
                    .eq('id', produto.id)
                    .eq('user_id', this.user.id);
            } else {
                // Criar novo produto
                result = await this.supabase
                    .from('produtos')
                    .insert([dados]);
            }

            if (result.error) throw result.error;

            const acao = this.editandoIndex !== null ? 'atualizado' : 'criado';
            showToast(`Produto ${acao} com sucesso!`, 'success');
            
            this.limparFormulario();
            await this.carregarProdutos();

        } catch (error) {
            console.error('❌ Erro ao salvar produto:', error);
            showToast('Erro ao salvar produto: ' + error.message, 'error');
        }
    }

    /**
     * Edita um produto existente
     */
    editarProduto(index) {
        try {
            const produto = this.produtos[index];
            if (!produto) {
                showToast('Produto não encontrado', 'error');
                return;
            }

            // Preencher formulário
            document.getElementById('codigoProduto').value = produto.codigo;
            document.getElementById('descricaoProduto').value = produto.descricao;
            document.getElementById('grupoProduto').value = produto.grupo;
            document.getElementById('unidadeMedida').value = produto.unidade_medida;
            document.getElementById('pesoBruto').value = produto.peso_bruto || '';
            document.getElementById('pesoLiquido').value = produto.peso_liquido || '';
            document.getElementById('precoItem').value = produto.preco || '';
            document.getElementById('perdaPercent').value = produto.perda_percent || '';
            document.getElementById('volumeM3').value = produto.volume_m3 || '';
            document.getElementById('unidadePeso').value = produto.unidade_peso || '';

            this.editandoIndex = index;
            
            // Focar no primeiro campo editável
            document.getElementById('descricaoProduto')?.focus();
            
            // Atualizar interface
            this.atualizarInterfaceEdicao(true);

        } catch (error) {
            console.error('❌ Erro ao editar produto:', error);
            showToast('Erro ao carregar produto para edição', 'error');
        }
    }

    /**
     * Exclui um produto
     */
    async excluirProduto(index) {
        try {
            const produto = this.produtos[index];
            if (!produto) {
                showToast('Produto não encontrado', 'error');
                return;
            }

            // Confirmação
            const confirmacao = await this.confirmarExclusao(produto);
            if (!confirmacao) return;

            const { error } = await this.supabase
                .from('produtos')
                .delete()
                .eq('id', produto.id)
                .eq('user_id', this.user.id);

            if (error) throw error;

            showToast('Produto excluído com sucesso!', 'success');
            await this.carregarProdutos();

        } catch (error) {
            console.error('❌ Erro ao excluir produto:', error);
            showToast('Erro ao excluir produto: ' + error.message, 'error');
        }
    }

    /**
     * Confirma exclusão do produto
     */
    async confirmarExclusao(produto) {
        return new Promise((resolve) => {
            const modal = this.criarModalConfirmacao(produto);
            document.body.appendChild(modal);
            
            modal.querySelector('.btn-danger').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
            
            modal.querySelector('.btn-secondary').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
            
            // Mostrar modal
            $(modal).modal('show');
        });
    }

    /**
     * Cria modal de confirmação
     */
    criarModalConfirmacao(produto) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirmar Exclusão</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Tem certeza que deseja excluir o produto:</p>
                        <p><strong>${produto.codigo} - ${produto.descricao}</strong></p>
                        <p class="text-danger">Esta ação não pode ser desfeita.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-danger">
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Limpa o formulário
     */
    limparFormulario() {
        const form = document.getElementById('formProduto');
        if (form) {
            form.reset();
        }
        
        this.editandoIndex = null;
        this.atualizarInterfaceEdicao(false);
        this.gerarProximoCodigo();
    }

    /**
     * Atualiza interface para modo edição
     */
    atualizarInterfaceEdicao(editando) {
        const btnSalvar = document.querySelector('#formProduto button[type="submit"]');
        const btnCancelar = document.getElementById('btnCancelar');
        
        if (btnSalvar) {
            btnSalvar.innerHTML = editando ? 
                '<i class="fas fa-save"></i> Atualizar' : 
                '<i class="fas fa-plus"></i> Adicionar';
        }
        
        if (btnCancelar) {
            btnCancelar.style.display = editando ? 'inline-block' : 'none';
        }
    }

    /**
     * Atualiza contador de produtos
     */
    atualizarContador() {
        const contador = document.getElementById('contadorProdutos');
        if (contador) {
            contador.textContent = `${this.produtos.length} produto(s)`;
        }
    }

    /**
     * Formata valor monetário
     */
    formatarMoeda(valor) {
        return parseFloat(valor).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Obtém produtos (para uso por outros módulos)
     */
    getProdutos() {
        return [...this.produtos];
    }

    /**
     * Busca produto por ID
     */
    getProdutoById(id) {
        return this.produtos.find(p => p.id === id);
    }

    /**
     * Busca produto por código
     */
    getProdutoByCodigo(codigo) {
        return this.produtos.find(p => p.codigo === codigo);
    }
}

// Instância global
const produtos = new ProdutosModule();

// Exportar para uso global (compatibilidade)
window.produtos = produtos;

// Exportar funções específicas para compatibilidade com HTML
window.editarProdutoOriginal = (index) => produtos.editarProduto(index);
window.excluirProdutoOriginal = (index) => produtos.excluirProduto(index);
window.limparFormularioProduto = () => produtos.limparFormulario();

export default produtos;

/**
 * Inicialização do módulo produtos
 * Chame esta função quando a página de produtos for carregada
 */
export async function initProdutos(supabaseInstance) {
    try {
        await produtos.init(supabaseInstance);
        return produtos;
    } catch (error) {
        console.error('❌ Erro ao inicializar módulo produtos:', error);
        throw error;
    }
}