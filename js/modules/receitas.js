// modules/receitas.js - Módulo Unificado de Receitas
import { showToast } from './js/core/utils.js';

console.log('📁 Carregando módulo receitas.js...');

class ReceitasModule {
    constructor() {
        this.supabase = null;
        this.estado = {
            receitas: [],
            produtos: [],
            ingredientesTemporarios: [],
            editando: null,
            inicializado: false,
            calculoTimeout: null
        };
        
        // Configurações do editor
        this.editorConfig = {
            maxChars: 2000,
            warningChars: 1500
        };
    }

    // ===== INICIALIZAÇÃO =====
    async init(supabaseInstance) {
        console.log('🚀 Inicializando módulo de receitas...');
        
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
            console.log('✅ Módulo de receitas inicializado');
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar módulo de receitas:', error);
            showToast('Erro ao inicializar receitas: ' + error.message, 'error');
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
        console.log('⚙️ Configurando eventos de receitas...');
        
        // Formulário principal
        const form = document.getElementById('formReceita');
        if (form) {
            form.removeEventListener('submit', this.handleFormSubmit);
            this.handleFormSubmit = (e) => {
                e.preventDefault();
                this.salvar();
            };
            form.addEventListener('submit', this.handleFormSubmit);
        }
        
        // Editor de texto
        const editor = document.getElementById('textoReceita');
        if (editor) {
            editor.removeEventListener('input', this.updateCharCount);
            editor.removeEventListener('keydown', this.handleEditorKeydown);
            editor.addEventListener('input', () => this.updateCharCount());
            editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
            editor.addEventListener('mouseup', () => this.updateToolbarButtons());
            editor.addEventListener('keyup', () => this.updateToolbarButtons());
        }
        
        // Busca de receitas
        const buscaReceitas = document.getElementById('busca-receitas');
        if (buscaReceitas) {
            buscaReceitas.removeEventListener('input', this.filtrarReceitas);
            buscaReceitas.addEventListener('input', () => this.filtrarReceitas());
        }
        
        // Busca de ingredientes
        const buscaIngredientes = document.getElementById('searchIngredientes');
        if (buscaIngredientes) {
            buscaIngredientes.removeEventListener('input', this.filtrarIngredientes);
            buscaIngredientes.addEventListener('input', () => this.filtrarIngredientes());
        }
    }

    // ===== CONFIGURAR INTERFACE =====
    configurarInterface() {
        this.mostrarMensagemInicial();
        setTimeout(() => {
            this.initializeResizeHandle();
            this.updateCharCount();
        }, 500);
    }

    // ===== CARREGAR DADOS =====
    async carregarDados() {
        console.log('📥 Carregando dados de receitas...');
        
        try {
            await Promise.all([
                this.carregarProdutos(),
                this.gerarProximoCodigo()
            ]);
            
            console.log('✅ Dados carregados');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    }

    // ===== CARREGAR PRODUTOS =====
    async carregarProdutos() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await this.supabase
                .from('produtos')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (error) throw error;

            this.estado.produtos = data || [];
            console.log(`✅ ${this.estado.produtos.length} produtos carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar produtos:', error);
            this.estado.produtos = [];
        }
    }

    // ===== GERAR PRÓXIMO CÓDIGO =====
    async gerarProximoCodigo() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            const { data, error } = await this.supabase.rpc('get_next_receita_codigo', {
                user_uuid: user.id
            });

            if (error) throw error;
            
            const input = document.getElementById('codigoReceita');
            if (input) {
                input.value = data || 'REC001';
            }
            
        } catch (error) {
            console.error('❌ Erro ao gerar código:', error);
            const input = document.getElementById('codigoReceita');
            if (input) {
                input.value = 'REC001';
            }
        }
    }

    // ===== CARREGAR RECEITAS =====
    async carregar() {
        try {
            console.log('📥 Carregando receitas...');
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            this.mostrarLoading();

            // Carregar receitas básicas
            const { data: receitasData, error: receitasError } = await this.supabase
                .from('receitas')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (receitasError) throw receitasError;

            if (!receitasData || receitasData.length === 0) {
                this.estado.receitas = [];
                this.renderizarTabela([]);
                return;
            }

            // Carregar ingredientes para cada receita
            const receitasComIngredientes = [];
            
            for (const receita of receitasData) {
                try {
                    const { data: ingredientesData } = await this.supabase
                        .from('ingredientes')
                        .select(`
                            *,
                            produtos (codigo, descricao, preco, unidade_medida)
                        `)
                        .eq('receita_id', receita.id);

                    const ingredientes = (ingredientesData || []).map(ing => ({
                        codigoProduto: ing.produtos?.codigo || 'N/A',
                        nome: ing.produtos?.descricao || 'Produto não encontrado',
                        quantidade: ing.quantidade,
                        unidadeMedida: ing.unidade_medida || ing.produtos?.unidade_medida || 'UN',
                        perdaPercent: ing.perda_percent || 0,
                        ganhoPercent: ing.ganho_percent || 0,
                        precoUnitario: ing.preco_unitario || ing.produtos?.preco || 0,
                        produtoId: ing.produto_id
                    }));

                    receitasComIngredientes.push({
                        ...receita,
                        ingredientes: ingredientes
                    });
                    
                } catch (error) {
                    console.warn(`⚠️ Erro ao carregar ingredientes da receita ${receita.codigo}:`, error);
                    receitasComIngredientes.push({
                        ...receita,
                        ingredientes: []
                    });
                }
            }

            this.estado.receitas = receitasComIngredientes;
            this.renderizarTabela(receitasComIngredientes);
            
            showToast(`✅ ${receitasComIngredientes.length} receita(s) carregada(s)!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao carregar receitas:', error);
            showToast('Erro ao carregar receitas: ' + error.message, 'error');
            this.renderizarTabela([]);
        }
    }

    // ===== MOSTRAR LOADING =====
    mostrarLoading() {
        const tbody = document.querySelector('#tabelaReceitas tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #2196f3;">
                        ⏳ Carregando receitas...
                    </td>
                </tr>
            `;
        }
    }

    // ===== MOSTRAR MENSAGEM INICIAL =====
    mostrarMensagemInicial() {
        const tbody = document.querySelector('#tabelaReceitas tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                        📋 Clique em "Listar Receitas" para carregar os dados
                    </td>
                </tr>
            `;
        }
    }

    // ===== RENDERIZAR TABELA =====
    renderizarTabela(receitas) {
        const tbody = document.querySelector('#tabelaReceitas tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (receitas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #666; padding: 40px;">
                        📋 Nenhuma receita encontrada
                    </td>
                </tr>
            `;
            return;
        }

        receitas.forEach((receita, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${receita.codigo}</td>
                <td>${receita.descricao}</td>
                <td>${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}</td>
                <td>${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG</td>
                <td>R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}</td>
                <td>
                    <button onclick="window.receitasModule.editar(${index})" class="btn btn-sm btn-primary">Editar</button>
                    <button onclick="window.receitasModule.excluir(${index})" class="btn btn-sm btn-danger">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Atualizar contador
        const total = document.getElementById('total-receitas');
        if (total) {
            total.textContent = receitas.length;
        }
    }

    // ===== FILTRAR RECEITAS =====
    filtrarReceitas() {
        const busca = document.getElementById('busca-receitas')?.value.toLowerCase() || '';
        
        const filtradas = this.estado.receitas.filter(receita => {
            return !busca || 
                   receita.codigo.toLowerCase().includes(busca) ||
                   receita.descricao.toLowerCase().includes(busca);
        });
        
        this.renderizarTabela(filtradas);
    }

    // ===== ABRIR MODAL NOVA RECEITA =====
    async abrirModalNova() {
        try {
            await this.gerarProximoCodigo();
            this.limparFormulario();
            this.estado.editando = null;
            
            setTimeout(() => {
                const descInput = document.getElementById('descricaoReceita');
                if (descInput) descInput.focus();
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro ao abrir modal:', error);
            showToast('Erro ao abrir formulário: ' + error.message, 'error');
        }
    }

    // ===== EDITAR RECEITA =====
    editar(index) {
        const receita = this.estado.receitas[index];
        if (!receita) {
            showToast('Receita não encontrada', 'error');
            return;
        }

        console.log('✏️ Editando receita:', receita.descricao);

        // Preencher formulário
        document.getElementById('codigoReceita').value = receita.codigo;
        document.getElementById('descricaoReceita').value = receita.descricao;
        document.getElementById('pesoFinal').value = receita.peso_final ? receita.peso_final.toFixed(3) : '0';
        document.getElementById('rendimento').value = receita.rendimento ? receita.rendimento.toFixed(3) : '0';
        document.getElementById('unidadeRendimento').value = receita.unidade_rendimento || 'UN';
        
        // Carregar ingredientes
        this.estado.ingredientesTemporarios = [...(receita.ingredientes || [])];
        this.renderizarIngredientes();
        this.setRecipeText(receita.texto || '');
        
        // Marcar como editando
        this.estado.editando = index;
        
        // Calcular valores
        setTimeout(() => {
            this.calcular();
        }, 100);
        
        document.getElementById('descricaoReceita').focus();
        console.log('✅ Receita carregada para edição');
    }

    // ===== EXCLUIR RECEITA =====
    async excluir(index) {
        try {
            const receita = this.estado.receitas[index];
            if (!receita || !confirm(`Tem certeza que deseja excluir a receita "${receita.descricao}"?`)) {
                return;
            }

            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Excluir ingredientes primeiro
            await this.supabase
                .from('ingredientes')
                .delete()
                .eq('receita_id', receita.id);
            
            // Excluir receita
            const { error } = await this.supabase
                .from('receitas')
                .delete()
                .eq('id', receita.id)
                .eq('user_id', user.id);

            if (error) throw error;

            showToast('Receita excluída com sucesso!', 'success');
            await this.carregar();

        } catch (error) {
            console.error('❌ Erro ao excluir receita:', error);
            showToast('Erro ao excluir receita: ' + error.message, 'error');
        }
    }

    // ===== SALVAR RECEITA =====
    async salvar() {
        try {
            console.log('💾 Tentando salvar receita...');
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Coletar dados do formulário
            const codigo = document.getElementById('codigoReceita').value.trim();
            const descricao = document.getElementById('descricaoReceita').value.trim();
            const pesoFinal = parseFloat(document.getElementById('pesoFinal').value) || 0;
            const rendimento = parseFloat(document.getElementById('rendimento').value) || 0;
            const unidadeRendimento = document.getElementById('unidadeRendimento').value;
            const textoReceita = this.getRecipeText();

            // Validações
            if (!descricao) {
                showToast('Por favor, informe a descrição da receita', 'warning');
                document.getElementById('descricaoReceita').focus();
                return;
            }

            if (!codigo) {
                showToast('Por favor, informe o código da receita', 'warning');
                document.getElementById('codigoReceita').focus();
                return;
            }

            if (!this.estado.ingredientesTemporarios || this.estado.ingredientesTemporarios.length === 0) {
                showToast('❌ Adicione pelo menos um ingrediente antes de salvar a receita!', 'error');
                return;
            }

            // Recalcular valores
            const { precoTotal, pesoFinalCalculado } = this.calcular();
            
            const receitaData = {
                codigo,
                descricao,
                peso_final: pesoFinalCalculado,
                rendimento,
                unidade_rendimento: unidadeRendimento,
                preco_total: precoTotal,
                texto: textoReceita,
                user_id: user.id
            };

            let receitaId;
            
            if (this.estado.editando !== null) {
                // Atualizar receita existente
                const receitaAtual = this.estado.receitas[this.estado.editando];
                const { error } = await this.supabase
                    .from('receitas')
                    .update(receitaData)
                    .eq('id', receitaAtual.id)
                    .eq('user_id', user.id);

                if (error) throw error;
                receitaId = receitaAtual.id;
            } else {
                // Criar nova receita
                const { data, error } = await this.supabase
                    .from('receitas')
                    .insert([receitaData])
                    .select()
                    .single();

                if (error) throw error;
                receitaId = data.id;
            }

            // Salvar ingredientes
            await this.salvarIngredientes(receitaId);

            showToast(
                this.estado.editando !== null ? 
                '✅ Receita atualizada com sucesso!' : 
                '✅ Receita criada com sucesso!', 
                'success'
            );
            
            this.limparFormulario();
            await this.carregar();

        } catch (error) {
            console.error('❌ Erro ao salvar receita:', error);
            showToast('Erro ao salvar receita: ' + error.message, 'error');
        }
    }

    // ===== SALVAR INGREDIENTES =====
    async salvarIngredientes(receitaId) {
        try {
            console.log('💾 Salvando ingredientes da receita...', receitaId);
            
            // Remover ingredientes existentes
            await this.supabase
                .from('ingredientes')
                .delete()
                .eq('receita_id', receitaId);

            if (this.estado.ingredientesTemporarios.length > 0) {
                const ingredientesData = [];
                
                for (const ingrediente of this.estado.ingredientesTemporarios) {
                    const produto = this.estado.produtos.find(p => p.codigo === ingrediente.codigoProduto);
                    if (produto) {
                        ingredientesData.push({
                            receita_id: receitaId,
                            produto_id: produto.id,
                            quantidade: parseFloat(ingrediente.quantidade) || 0,
                            unidade_medida: ingrediente.unidadeMedida || 'UN',
                            perda_percent: parseFloat(ingrediente.perdaPercent) || 0,
                            ganho_percent: parseFloat(ingrediente.ganhoPercent) || 0,
                            preco_unitario: parseFloat(ingrediente.precoUnitario) || 0
                        });
                    }
                }

                if (ingredientesData.length > 0) {
                    const { error } = await this.supabase
                        .from('ingredientes')
                        .insert(ingredientesData);

                    if (error) throw error;
                }
            }

        } catch (error) {
            console.error('❌ Erro ao salvar ingredientes:', error);
            throw error;
        }
    }

    // ===== LIMPAR FORMULÁRIO =====
    limparFormulario() {
        const form = document.getElementById('formReceita');
        if (form) {
            form.reset();
        }
        
        this.estado.ingredientesTemporarios = [];
        this.renderizarIngredientes();
        this.setRecipeText('');
        this.estado.editando = null;
        
        const precoTotal = document.getElementById('precoTotal');
        const pesoCalculado = document.getElementById('pesoFinalCalculado');
        if (precoTotal) precoTotal.textContent = 'R$ 0,00';
        if (pesoCalculado) pesoCalculado.textContent = '0,000 KG';
        
        this.gerarProximoCodigo();
    }

    // ===== MODAL DE INGREDIENTES =====
    abrirModalIngredientes() {
        const modal = document.getElementById('modalIngredientes');
        if (modal) {
            modal.style.display = 'block';
            this.carregarListaIngredientes();
        }
    }

    carregarListaIngredientes() {
        const container = document.getElementById('listaIngredientes');
        if (!container) return;
        
        container.innerHTML = '';

        if (this.estado.produtos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum produto cadastrado</p>';
            return;
        }

        // Controles de seleção
        const headerControls = document.createElement('div');
        headerControls.style.cssText = 'padding: 10px; border-bottom: 1px solid #e9ecef; margin-bottom: 10px; display: flex; gap: 10px; align-items: center;';
        headerControls.innerHTML = `
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.receitasModule.selecionarTodos()">Selecionar Todos</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.receitasModule.desmarcarTodos()">Desmarcar Todos</button>
            <button type="button" class="btn btn-primary" onclick="window.receitasModule.adicionarSelecionados()">Adicionar Selecionados</button>
        `;
        container.appendChild(headerControls);

        // Lista de produtos
        this.estado.produtos.forEach((produto, index) => {
            const div = document.createElement('div');
            div.className = 'ingredient-item';
            div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #e9ecef; border-radius: 5px; margin-bottom: 5px; background: white;';
            
            const jaAdicionado = this.estado.ingredientesTemporarios.find(ing => ing.codigoProduto === produto.codigo);
            
            div.innerHTML = `
                <input type="checkbox" id="produto-${index}" value="${index}" ${jaAdicionado ? 'disabled checked' : ''}>
                <label for="produto-${index}" style="flex: 1; margin: 0; cursor: pointer; ${jaAdicionado ? 'color: #6c757d;' : ''}">${produto.codigo} - ${produto.descricao}${jaAdicionado ? ' ✅' : ''}</label>
                <span style="font-size: 12px; color: #666;">R$ ${parseFloat(produto.preco || 0).toFixed(2)}</span>
            `;
            container.appendChild(div);
        });
    }

    selecionarTodos() {
        const checkboxes = document.querySelectorAll('#listaIngredientes input[type="checkbox"]:not(:disabled)');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    }

    desmarcarTodos() {
        const checkboxes = document.querySelectorAll('#listaIngredientes input[type="checkbox"]:not(:disabled)');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }

    adicionarSelecionados() {
        const checkboxes = document.querySelectorAll('#listaIngredientes input[type="checkbox"]:checked:not(:disabled)');
        
        if (checkboxes.length === 0) {
            showToast('Selecione pelo menos um ingrediente para adicionar', 'warning');
            return;
        }
        
        let adicionados = 0;
        
        checkboxes.forEach(checkbox => {
            const produtoIndex = parseInt(checkbox.value);
            const produto = this.estado.produtos[produtoIndex];
            
            if (!produto) return;
            
            // Verificar se já existe
            if (this.estado.ingredientesTemporarios.find(ing => ing.codigoProduto === produto.codigo)) {
                return;
            }

            const ingrediente = {
                codigoProduto: produto.codigo,
                nome: produto.descricao,
                quantidade: 0,
                unidadeMedida: produto.unidade_medida || 'UN',
                perdaPercent: 0,
                ganhoPercent: 0,
                precoUnitario: produto.preco || 0,
                produtoId: produto.id
            };

            this.estado.ingredientesTemporarios.push(ingrediente);
            adicionados++;
        });
        
        if (adicionados > 0) {
            this.renderizarIngredientes();
            showToast(`✅ ${adicionados} ingrediente(s) adicionado(s) com sucesso!`, 'success');
            this.fecharModal('modalIngredientes');
            setTimeout(() => this.calcular(), 100);
        } else {
            showToast('Todos os ingredientes selecionados já foram adicionados', 'info');
        }
    }

    filtrarIngredientes() {
        const search = document.getElementById('searchIngredientes').value.toLowerCase();
        const items = document.querySelectorAll('#listaIngredientes .ingredient-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(search) ? 'flex' : 'none';
        });
    }

    // ===== RENDERIZAR INGREDIENTES =====
    renderizarIngredientes() {
        const tbody = document.querySelector('#tabelaIngredientes tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.estado.ingredientesTemporarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                        Nenhum ingrediente adicionado<br>
                        <small>Use o botão "Selecionar Ingredientes" para adicionar produtos</small>
                    </td>
                </tr>
            `;
            return;
        }

        this.estado.ingredientesTemporarios.forEach((ingrediente, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ingrediente.codigoProduto}</td>
                <td>${ingrediente.nome}</td>
                <td><input type="number" class="inline-edit" value="${ingrediente.quantidade || 0}" onchange="window.receitasModule.atualizarIngrediente(${index}, 'quantidade', this.value)" step="0.001" min="0"></td>
                <td>${ingrediente.unidadeMedida}</td>
                <td><input type="number" class="inline-edit" value="${ingrediente.perdaPercent || 0}" onchange="window.receitasModule.atualizarIngrediente(${index}, 'perdaPercent', this.value)" step="0.01" min="0"></td>
                <td><input type="number" class="inline-edit" value="${ingrediente.ganhoPercent || 0}" onchange="window.receitasModule.atualizarIngrediente(${index}, 'ganhoPercent', this.value)" step="0.01" min="0"></td>
                <td>R$ ${parseFloat(ingrediente.precoUnitario || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="window.receitasModule.removerIngrediente(${index})">Remover</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    atualizarIngrediente(index, campo, valor) {
        if (this.estado.ingredientesTemporarios[index]) {
            const valorNumerico = parseFloat(valor) || 0;
            this.estado.ingredientesTemporarios[index][campo] = valorNumerico;
            
            console.log(`✅ Ingrediente ${index} atualizado - ${campo}: ${valorNumerico}`);
            
            // Auto-calcular após mudança
            clearTimeout(this.estado.calculoTimeout);
            this.estado.calculoTimeout = setTimeout(() => {
                this.calcular();
            }, 300);
        }
    }

    removerIngrediente(index) {
        if (confirm('Tem certeza que deseja remover este ingrediente?')) {
            const ingrediente = this.estado.ingredientesTemporarios[index];
            this.estado.ingredientesTemporarios.splice(index, 1);
            this.renderizarIngredientes();
            showToast(`Ingrediente "${ingrediente.nome}" removido!`, 'success');
            setTimeout(() => this.calcular(), 100);
        }
    }

    // ===== CALCULAR RECEITA =====
    calcular() {
        console.log('🧮 Iniciando cálculo da receita...');
        
        let precoTotal = 0;
        let pesoFinal = 0;

        if (!this.estado.ingredientesTemporarios || this.estado.ingredientesTemporarios.length === 0) {
            console.log('⚠️ Nenhum ingrediente para calcular');
            this.atualizarCamposCalculados(0, 0);
            return { precoTotal: 0, pesoFinalCalculado: 0 };
        }

        console.log(`📊 Calculando ${this.estado.ingredientesTemporarios.length} ingredientes...`);

        this.estado.ingredientesTemporarios.forEach((ingrediente, index) => {
            const quantidade = parseFloat(ingrediente.quantidade) || 0;
            const precoUnitario = parseFloat(ingrediente.precoUnitario) || 0;
            const perdaPercent = parseFloat(ingrediente.perdaPercent) || 0;
            const ganhoPercent = parseFloat(ingrediente.ganhoPercent) || 0;

            // Calcular preço
            const precoIngrediente = quantidade * precoUnitario;
            precoTotal += precoIngrediente;

            // Calcular peso (apenas para unidades de peso)
            if (['KG', 'gr', 'mg'].includes(ingrediente.unidadeMedida)) {
                let peso = quantidade;
                
                // Converter para KG
                if (ingrediente.unidadeMedida === 'gr') peso /= 1000;
                if (ingrediente.unidadeMedida === 'mg') peso /= 1000000;
                
                // Aplicar perda e ganho
                peso = peso - (peso * perdaPercent / 100);
                peso = peso + (peso * ganhoPercent / 100);
                
                pesoFinal += peso;
            }
        });

        console.log(`✅ Cálculo final - Preço: R$ ${precoTotal.toFixed(2)}, Peso: ${pesoFinal.toFixed(3)} KG`);

        this.atualizarCamposCalculados(precoTotal, pesoFinal);
        showToast('✅ Cálculos realizados com sucesso!', 'success');
        
        return { precoTotal, pesoFinalCalculado: pesoFinal };
    }

    atualizarCamposCalculados(precoTotal, pesoFinal) {
        const precoTotalEl = document.getElementById('precoTotal');
        const pesoCalculadoEl = document.getElementById('pesoFinalCalculado');
        const pesoFinalEl = document.getElementById('pesoFinal');
        
        if (precoTotalEl) precoTotalEl.textContent = `R$ ${precoTotal.toFixed(2)}`;
        if (pesoCalculadoEl) pesoCalculadoEl.textContent = `${pesoFinal.toFixed(3)} KG`;
        if (pesoFinalEl) pesoFinalEl.value = pesoFinal.toFixed(3);
    }

    // ===== EDITOR DE TEXTO =====
    formatText(command, value = null) {
        const editor = document.getElementById('textoReceita');
        if (!editor) return;
        
        editor.focus();
        document.execCommand(command, false, value);
        this.updateToolbarButtons();
        this.updateCharCount();
    }

    changeFontSize(size) {
        const editor = document.getElementById('textoReceita');
        if (!editor) return;
        
        editor.focus();
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            document.execCommand('fontSize', false, '7');
            
            const fontElements = editor.querySelectorAll('font[size="7"]');
            fontElements.forEach(element => {
                element.style.fontSize = size;
                element.removeAttribute('size');
            });
        } else {
            editor.style.fontSize = size;
        }
        
        this.updateCharCount();
    }

    clearFormatting() {
        const editor = document.getElementById('textoReceita');
        if (!editor) return;
        
        editor.focus();
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            document.execCommand('removeFormat', false, null);
        } else {
            if (confirm('Deseja limpar toda a formatação do texto?')) {
                const content = editor.innerText;
                editor.innerHTML = content.replace(/\n/g, '<br>');
            }
        }
        
        this.updateToolbarButtons();
        this.updateCharCount();
    }

    updateToolbarButtons() {
        const commands = ['bold', 'italic', 'underline'];
        
        commands.forEach(command => {
            const button = document.querySelector(`[onclick*="formatText('${command}')"]`);
            if (button) {
                if (document.queryCommandState(command)) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
    }

    updateCharCount() {
        const editor = document.getElementById('textoReceita');
        const counter = document.getElementById('charCount');
        
        if (editor && counter) {
            const text = editor.innerText || editor.textContent || '';
            counter.textContent = text.length;
            
            if (text.length > this.editorConfig.maxChars) {
                counter.style.color = '#dc3545';
            } else if (text.length > this.editorConfig.warningChars) {
                counter.style.color = '#ffc107';
            } else {
                counter.style.color = '#667eea';
            }
        }
    }

    handleEditorKeydown(event) {
        if (event.ctrlKey) {
            switch (event.key.toLowerCase()) {
                case 'b':
                    event.preventDefault();
                    this.formatText('bold');
                    break;
                case 'i':
                    event.preventDefault();
                    this.formatText('italic');
                    break;
                case 'u':
                    event.preventDefault();
                    this.formatText('underline');
                    break;
            }
        }
        
        setTimeout(() => this.updateCharCount(), 10);
    }

    getRecipeText() {
        const editor = document.getElementById('textoReceita');
        return editor ? editor.innerHTML : '';
    }

    setRecipeText(htmlContent) {
        const editor = document.getElementById('textoReceita');
        if (editor) {
            editor.innerHTML = htmlContent || '';
            this.updateCharCount();
        }
    }

    previewReceita() {
        const editor = document.getElementById('textoReceita');
        const content = editor ? editor.innerHTML : '';
        const titulo = document.getElementById('descricaoReceita')?.value || 'Receita sem título';
        
        if (!content.trim()) {
            showToast('Digite o modo de preparo antes de visualizar!', 'warning');
            return;
        }
        
        const previewWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview - ${titulo}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 40px 20px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #667eea;
                    }
                    .content {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    .print-btn {
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 20px 0;
                    }
                    @media print {
                        .print-btn { display: none; }
                        body { padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${titulo}</h1>
                    <button class="print-btn" onclick="window.print()">Imprimir Receita</button>
                </div>
                <div class="content">
                    ${content}
                </div>
            </body>
            </html>
        `);
        previewWindow.document.close();
    }

    setEditorSize(size) {
        const editor = document.getElementById('recipeEditor');
        if (!editor) return;
        
        editor.classList.remove('size-small', 'size-medium', 'size-large');
        
        if (size !== 'auto') {
            editor.classList.add(`size-${size}`);
        } else {
            editor.style.width = '';
            editor.style.height = '';
        }
    }

    initializeResizeHandle() {
        const editor = document.getElementById('recipeEditor');
        const handle = document.getElementById('resizeHandle');
        
        if (!editor || !handle) return;
        
        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startWidth = 0;
        let startHeight = 0;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(editor).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(editor).height, 10);
            
            document.body.style.cursor = 'nw-resize';
            editor.classList.add('resizing');
            editor.classList.remove('size-small', 'size-medium', 'size-large');
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const width = startWidth + e.clientX - startX;
            const height = startHeight + e.clientY - startY;
            
            if (width >= 300 && width <= 1200) {
                editor.style.width = width + 'px';
            }
            if (height >= 250 && height <= 800) {
                editor.style.height = height + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                editor.classList.remove('resizing');
            }
        });
    }

    // ===== UTILITÁRIOS =====
    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Instância do módulo
const receitasModule = new ReceitasModule();

// Exportar para compatibilidade global
window.receitasModule = receitasModule;

// Funções públicas para inicialização
export async function initReceitas(supabase) {
    return await receitasModule.init(supabase);
}

// Aliases para compatibilidade com código existente
window.inicializarReceitas = () => initReceitas(window.supabase);
window.abrirNovaReceita = () => receitasModule.abrirModalNova();
window.listarReceitas = () => receitasModule.carregar();
window.formatText = (command, value) => receitasModule.formatText(command, value);
window.changeFontSize = (size) => receitasModule.changeFontSize(size);
window.clearFormatting = () => receitasModule.clearFormatting();
window.previewReceita = () => receitasModule.previewReceita();
window.setEditorSize = (size) => receitasModule.setEditorSize(size);
window.calcularReceita = () => receitasModule.calcular();
window.fecharModal = (modalId) => receitasModule.fecharModal(modalId);

export default receitasModule;

console.log('✅ Módulo de receitas carregado com sucesso!');