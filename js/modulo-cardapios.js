// modulo-cardapios.js - Módulo Isolado de Cardápios
console.log('📁 Carregando modulo-cardapios.js...');

// ===== MÓDULO CARDÁPIOS ISOLADO =====
const ModuloCardapios = {
    nome: 'cardapios',
    versao: '2.0.0',
    dependencias: ['supabase', 'dom'],
    
    // Estado interno do módulo
    estado: {
        clientes: [],
        receitas: [],
        tiposRefeicao: [],
        cardapios: {},
        clienteAtual: null,
        tipoAtual: null,
        dataAtual: null,
        receitasTemporarias: {},
        inicializado: false
    },
    
    // ===== ATUALIZAR E CALCULAR =====
    atualizarCalcular: function(tipoCodigo) {
        const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
        if (!comensaisInput) {
            this.toast('Campo de comensais não encontrado', 'error');
            return;
        }
        
        const comensais = parseInt(comensaisInput.value || 0);
        
        if (comensais <= 0) {
            this.toast('Informe um número válido de comensais', 'warning');
            comensaisInput.focus();
            return;
        }
        
        // Verificar se tem receitas
        if (!this.estado.receitasTemporarias[tipoCodigo] || this.estado.receitasTemporarias[tipoCodigo].length === 0) {
            this.toast(`Comensais definido para ${comensais}. Adicione receitas para calcular.`, 'info');
            return;
        }
        
        // Calcular receitas
        let calculadas = 0;
        
        this.estado.receitasTemporarias[tipoCodigo].forEach(receita => {
            const receitaOriginal = this.estado.receitas.find(r => r.id === receita.receita_id);
            
            if (receitaOriginal && receitaOriginal.rendimento > 0) {
                const rendimento = parseFloat(receitaOriginal.rendimento);
                const total = comensais * rendimento;
                
                receita.comensais = comensais;
                receita.quantidadePorPessoa = rendimento;
                receita.totalPorComensais = total;
                receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
                receita.alterada = true;
                
                calculadas++;
            }
        });
        
        if (calculadas > 0) {
            this.toast(`✅ ${calculadas} receita(s) calculadas com ${comensais} comensais!`, 'success');
            this.renderizarReceitas(tipoCodigo);
        } else {
            this.toast('Nenhuma receita pôde ser calculada', 'warning');
        }
    },
    
    // ===== ABRIR MODAL RECEITAS =====
    abrirModalReceitas: function(tipoCodigo) {
        const tipo = this.estado.tiposRefeicao.find(t => t.codigo === tipoCodigo);
        if (!tipo) {
            this.toast('Tipo de refeição não encontrado', 'error');
            return;
        }
        
        this.estado.tipoAtual = tipo;
        
        // Criar modal se não existir
        if (!document.getElementById('modalReceitas')) {
            this.criarModalReceitas();
        }
        
        // Carregar receitas no modal
        this.carregarReceitasModal();
        
        // Mostrar modal
        document.getElementById('modalReceitas').style.display = 'block';
    },
    
    // ===== CRIAR MODAL RECEITAS =====
    criarModalReceitas: function() {
        const modal = document.createElement('div');
        modal.id = 'modalReceitas';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🍽️ Selecionar Receitas</h2>
                    <span class="close" onclick="window.ModuloCardapios.fecharModal('modalReceitas')">&times;</span>
                </div>
                
                <div class="search-box">
                    <input type="text" id="searchReceitas" placeholder="🔍 Pesquisar receitas..." onkeyup="window.ModuloCardapios.filtrarReceitas()">
                </div>
                
                <div id="listaReceitasModal" style="max-height: 400px; overflow-y: auto;">
                    <!-- Receitas aqui -->
                </div>
                
                <div class="actions">
                    <button type="button" class="btn btn-secondary" onclick="window.ModuloCardapios.fecharModal('modalReceitas')">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.ModuloCardapios.adicionarReceitasSelecionadas()">
                        ➕ Adicionar Selecionadas
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    // ===== CARREGAR RECEITAS NO MODAL =====
    carregarReceitasModal: function() {
        const container = document.getElementById('listaReceitasModal');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.estado.receitas.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhuma receita cadastrada</p>';
            return;
        }
        
        const tipoCodigo = this.estado.tipoAtual?.codigo;
        const receitasJaAdicionadas = this.estado.receitasTemporarias[tipoCodigo] || [];
        const idsJaAdicionados = receitasJaAdicionadas.map(r => r.receita_id);
        
        this.estado.receitas.forEach((receita, index) => {
            const jaAdicionado = idsJaAdicionados.includes(receita.id);
            
            const div = document.createElement('div');
            div.className = 'receita-item-modal';
            div.innerHTML = `
                <input type="checkbox" 
                       id="receita-${index}" 
                       value="${receita.id}" 
                       ${jaAdicionado ? 'disabled checked' : ''}>
                <label for="receita-${index}">
                    ${receita.codigo} - ${receita.descricao}${jaAdicionado ? ' ✅' : ''}
                </label>
                <span style="font-size: 12px; color: #666;">
                    ${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}
                </span>
            `;
            container.appendChild(div);
        });
    },
    
    // ===== FILTRAR RECEITAS =====
    filtrarReceitas: function() {
        const search = document.getElementById('searchReceitas').value.toLowerCase();
        const items = document.querySelectorAll('#listaReceitasModal .receita-item-modal');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(search) ? 'flex' : 'none';
        });
    },
    
    // ===== ADICIONAR RECEITAS SELECIONADAS =====
    adicionarReceitasSelecionadas: function() {
        const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked:not(:disabled)');
        
        if (checkboxes.length === 0) {
            this.toast('Selecione pelo menos uma receita', 'warning');
            return;
        }
        
        const tipoCodigo = this.estado.tipoAtual?.codigo;
        if (!tipoCodigo) {
            this.toast('Tipo de refeição não selecionado', 'error');
            return;
        }
        
        // Inicializar array se não existe
        if (!this.estado.receitasTemporarias[tipoCodigo]) {
            this.estado.receitasTemporarias[tipoCodigo] = [];
        }
        
        // Obter comensais
        const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
        const comensais = parseInt(comensaisInput?.value || 0);
        
        let adicionadas = 0;
        
        checkboxes.forEach(checkbox => {
            const receitaId = checkbox.value;
            const receita = this.estado.receitas.find(r => r.id === receitaId);
            
            if (!receita) return;
            
            // Verificar se já existe
            if (this.estado.receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId)) {
                return;
            }
            
            const receitaCardapio = {
                receita_id: receita.id,
                codigo: receita.codigo,
                descricao: receita.descricao,
                comensais: comensais,
                quantidadePorPessoa: 0,
                totalPorComensais: 0,
                unidadeBasica: receita.unidade_rendimento || 'UN',
                alterada: false
            };
            
            this.estado.receitasTemporarias[tipoCodigo].push(receitaCardapio);
            adicionadas++;
        });
        
        if (adicionadas > 0) {
            this.toast(`✅ ${adicionadas} receita(s) adicionada(s)!`, 'success');
            this.fecharModal('modalReceitas');
            this.renderizarReceitas(tipoCodigo);
        }
    },
    
    // ===== REMOVER RECEITA =====
    removerReceita: async function(tipoCodigo, receitaId) {
        const receita = this.estado.receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receitaId);
        if (!receita) {
            this.toast('Receita não encontrada', 'error');
            return;
        }
        
        const confirmar = confirm(`Confirmar remoção da receita "${receita.codigo} - ${receita.descricao}"?`);
        if (!confirmar) return;
        
        try {
            // Remover do banco se existir
            if (this.estado.clienteAtual && this.estado.dataAtual) {
                const { data: { user } } = await window.supabase.auth.getUser();
                const tipoRefeicao = this.estado.clienteAtual.tiposRefeicao.find(t => t.codigo === tipoCodigo);
                
                if (user && tipoRefeicao) {
                    await window.supabase
                        .from('cardapios')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('cliente_id', this.estado.clienteAtual.id)
                        .eq('tipo_refeicao_id', tipoRefeicao.id)
                        .eq('receita_id', receitaId)
                        .eq('data', this.estado.dataAtual);
                }
            }
            
            // Remover da memória
            this.estado.receitasTemporarias[tipoCodigo] = this.estado.receitasTemporarias[tipoCodigo].filter(r => r.receita_id !== receitaId);
            
            // Remover da interface
            const elemento = document.getElementById(`receita-${tipoCodigo}-${receitaId}`);
            if (elemento) {
                elemento.remove();
            }
            
            // Atualizar estado global
            if (this.estado.cardapios[this.estado.dataAtual]?.[this.estado.clienteAtual?.codigo]?.[tipoCodigo]) {
                this.estado.cardapios[this.estado.dataAtual][this.estado.clienteAtual.codigo][tipoCodigo] = 
                    this.estado.cardapios[this.estado.dataAtual][this.estado.clienteAtual.codigo][tipoCodigo].filter(r => r.receita_id !== receitaId);
            }
            
            this.toast(`Receita "${receita.codigo}" removida!`, 'success');
            
            // Re-renderizar se vazio
            if (!this.estado.receitasTemporarias[tipoCodigo] || this.estado.receitasTemporarias[tipoCodigo].length === 0) {
                this.renderizarReceitas(tipoCodigo);
            }
            
        } catch (error) {
            console.error('❌ Erro ao remover receita:', error);
            this.toast('Erro ao remover: ' + error.message, 'error');
        }
    },
    
    // ===== GRAVAR CARDÁPIO =====
    gravarCardapio: async function() {
        try {
            if (!this.estado.clienteAtual || !this.estado.dataAtual) {
                this.toast('Selecione cliente e data', 'warning');
                return;
            }
            
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            let totalGravado = 0;
            
            // Gravar cada tipo de refeição
            for (const tipo of this.estado.clienteAtual.tiposRefeicao) {
                const receitas = this.estado.receitasTemporarias[tipo.codigo];
                if (!receitas || receitas.length === 0) continue;
                
                // Deletar existentes
                await window.supabase
                    .from('cardapios')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('cliente_id', this.estado.clienteAtual.id)
                    .eq('tipo_refeicao_id', tipo.id)
                    .eq('data', this.estado.dataAtual);
                
                // Inserir novas
                for (const receita of receitas) {
                    if (receita.comensais > 0) {  // Só gravar se tem comensais
                        const cardapioData = {
                            user_id: user.id,
                            cliente_id: this.estado.clienteAtual.id,
                            tipo_refeicao_id: tipo.id,
                            receita_id: receita.receita_id,
                            data: this.estado.dataAtual,
                            comensais: receita.comensais || 0,
                            quantidade_por_pessoa: receita.quantidadePorPessoa || 0,
                            total_por_comensais: receita.totalPorComensais || 0,
                            unidade_basica: receita.unidadeBasica || 'UN',
                            alterada: receita.alterada || false
                        };
                        
                        const { error } = await window.supabase
                            .from('cardapios')
                            .insert([cardapioData]);
                        
                        if (error) {
                            console.error('❌ Erro ao inserir cardápio:', error);
                            throw error;
                        }
                        
                        totalGravado++;
                    }
                }
            }
            
            if (totalGravado > 0) {
                this.toast(`✅ ${totalGravado} receita(s) gravadas com sucesso!`, 'success');
                
                // Recarregar cardápios
                await this.carregarCardapios();
                
                // Notificar sistema
                if (window.SistemaRestaurante) {
                    window.SistemaRestaurante.emit('cardapios:gravado', {
                        cliente: this.estado.clienteAtual,
                        data: this.estado.dataAtual,
                        total: totalGravado
                    });
                }
            } else {
                this.toast('Nenhuma receita para gravar', 'info');
            }
            
        } catch (error) {
            console.error('❌ Erro ao gravar cardápio:', error);
            this.toast('Erro ao gravar: ' + error.message, 'error');
        }
    },
    
    // ===== CALCULAR TODOS =====
    calcularTodos: function() {
        if (!this.estado.clienteAtual?.tiposRefeicao) {
            this.toast('Selecione um cliente primeiro', 'warning');
            return;
        }
        
        let totalCalculado = 0;
        
        this.estado.clienteAtual.tiposRefeicao.forEach(tipo => {
            const receitas = this.estado.receitasTemporarias[tipo.codigo];
            if (!receitas) return;
            
            receitas.forEach(receita => {
                const receitaOriginal = this.estado.receitas.find(r => r.id === receita.receita_id);
                if (receitaOriginal && receitaOriginal.rendimento > 0 && receita.comensais > 0) {
                    const rendimento = parseFloat(receitaOriginal.rendimento);
                    receita.quantidadePorPessoa = rendimento;
                    receita.totalPorComensais = receita.comensais * rendimento;
                    receita.alterada = true;
                    totalCalculado++;
                }
            });
            
            if (receitas.length > 0) {
                this.renderizarReceitas(tipo.codigo);
            }
        });
        
        if (totalCalculado > 0) {
            this.toast(`✅ ${totalCalculado} receitas calculadas!`, 'success');
        } else {
            this.toast('Nenhuma receita para calcular', 'info');
        }
    },
    
    // ===== ATUALIZAR TODOS COMENSAIS =====
    atualizarTodos: function() {
        const totalInput = document.getElementById('totalComensais');
        if (!totalInput?.value) {
            this.toast('Informe o total de comensais', 'warning');
            totalInput?.focus();
            return;
        }
        
        const totalComensais = parseInt(totalInput.value);
        if (totalComensais <= 0) {
            this.toast('Número inválido de comensais', 'warning');
            return;
        }
        
        if (this.estado.clienteAtual?.tiposRefeicao) {
            this.estado.clienteAtual.tiposRefeicao.forEach(tipo => {
                const comensaisInput = document.getElementById(`comensais-${tipo.codigo}`);
                if (comensaisInput) {
                    comensaisInput.value = totalComensais;
                }
            });
            
            this.toast(`✅ Todos os tipos atualizados para ${totalComensais} comensais`, 'success');
        }
    },
    
    // ===== UTILITÁRIOS =====
    toggleExpandable: function(header) {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('span:last-child');
        
        if (content.classList.contains('active')) {
            content.classList.remove('active');
            arrow.textContent = '▼';
        } else {
            content.classList.add('active');
            arrow.textContent = '▲';
        }
    },
    
    fecharModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    limparInterface: function() {
        if (!this.estado.clienteAtual?.tiposRefeicao) return;
        
        this.estado.clienteAtual.tiposRefeicao.forEach(tipo => {
            const container = document.getElementById(`receitas-list-${tipo.codigo}`);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; color: #666; padding: 20px;">
                        📝 Nenhuma receita cadastrada para esta data
                    </div>
                `;
            }
            
            const comensaisInput = document.getElementById(`comensais-${tipo.codigo}`);
            if (comensaisInput) {
                comensaisInput.value = '';
            }
        });
    },
    
    atualizarIndicadorData: function() {
        const dataInput = document.getElementById('dataCardapio');
        if (!dataInput) return;
        
        const data = new Date(dataInput.value + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        dataInput.classList.remove('data-hoje', 'data-passada', 'data-futura');
        
        if (data.getTime() === hoje.getTime()) {
            dataInput.classList.add('data-hoje');
        } else if (data < hoje) {
            dataInput.classList.add('data-passada');
        } else {
            dataInput.classList.add('data-futura');
        }
    },
    
    toast: function(mensagem, tipo = 'info', duracao = 3000) {
        if (window.SistemaRestaurante) {
            window.SistemaRestaurante.toast(mensagem, tipo, duracao);
        } else {
            console.log(`Toast ${tipo}: ${mensagem}`);
        }
    }
};

// ===== REGISTRAR MÓDULO NO SISTEMA =====
if (window.SistemaRestaurante) {
    window.SistemaRestaurante.registrarModulo('cardapios', ModuloCardapios);
}

// ===== EXPORTAR PARA COMPATIBILIDADE =====
window.ModuloCardapios = ModuloCardapios;

// Funções globais para compatibilidade
window.inicializarCardapio = () => ModuloCardapios.inicializar();
window.carregarTiposRefeicaoCliente = () => ModuloCardapios.selecionarCliente();
window.carregarCardapioData = () => ModuloCardapios.alterarData();
window.executarAtualizacaoECalculoFinal = (tipoCodigo) => ModuloCardapios.atualizarCalcular(tipoCodigo);
window.abrirModalReceitasTipo = (tipoCodigo) => ModuloCardapios.abrirModalReceitas(tipoCodigo);
window.adicionarReceitasSelecionadas = () => ModuloCardapios.adicionarReceitasSelecionadas();
window.removerReceita = (tipoCodigo, receitaId) => ModuloCardapios.removerReceita(tipoCodigo, receitaId);
window.gravarParaTodos = () => ModuloCardapios.gravarCardapio();
window.calcularParaTodos = () => ModuloCardapios.calcularTodos();
window.atualizarParaTodos = () => ModuloCardapios.atualizarTodos();
window.filtrarReceitas = () => ModuloCardapios.filtrarReceitas();
window.toggleExpandable = (header) => ModuloCardapios.toggleExpandable(header);
window.fecharModal = (modalId) => ModuloCardapios.fecharModal(modalId);

// Para compatibilidade com calendário
window.cardapiosCarregados = ModuloCardapios.estado.cardapios;
window.clienteAtualCardapio = ModuloCardapios.estado.clienteAtual;
window.dataAtualCardapio = ModuloCardapios.estado.dataAtual;

console.log('✅ Módulo de cardápios carregado e registrado');

    // ===== INICIALIZAÇÃO =====
    inicializar: async function() {
        console.log('🚀 Inicializando módulo de cardápios...');
        
        try {
            // Verificar se já foi inicializado
            if (this.estado.inicializado) {
                console.log('⚠️ Módulo já inicializado');
                return true;
            }
            
            // Aguardar sistema central
            await this.aguardarSistema();
            
            // Configurar eventos
            this.configurarEventos();
            
            // Carregar dados iniciais
            await this.carregarDados();
            
            // Configurar interface
            this.configurarInterface();
            
            this.estado.inicializado = true;
            console.log('✅ Módulo de cardápios inicializado');
            
            // Notificar sistema
            if (window.SistemaRestaurante) {
                window.SistemaRestaurante.emit('cardapios:inicializado');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao inicializar módulo de cardápios:', error);
            return false;
        }
    },
    
    // ===== AGUARDAR SISTEMA =====
    aguardarSistema: function() {
        return new Promise((resolve) => {
            const verificar = () => {
                if (window.SistemaRestaurante && window.supabase && window.supabase.auth) {
                    resolve();
                } else {
                    setTimeout(verificar, 100);
                }
            };
            verificar();
        });
    },
    
    // ===== CONFIGURAR EVENTOS =====
    configurarEventos: function() {
        // Eventos do sistema
        if (window.SistemaRestaurante) {
            window.SistemaRestaurante.on('clientes:salvo', (dados) => {
                console.log('📡 Cliente salvo, recarregando dados...');
                this.carregarClientes();
            });
            
            window.SistemaRestaurante.on('cache:atualizado', (dados) => {
                if (dados.tipo === 'clientes') {
                    this.estado.clientes = dados.dados;
                    this.carregarClientesSelect();
                }
            });
        }
        
        // Eventos da interface
        const selectCliente = document.getElementById('clienteCardapio');
        if (selectCliente) {
            selectCliente.addEventListener('change', () => this.selecionarCliente());
        }
        
        const inputData = document.getElementById('dataCardapio');
        if (inputData) {
            inputData.addEventListener('change', () => this.alterarData());
        }
    },
    
    // ===== CONFIGURAR INTERFACE =====
    configurarInterface: function() {
        // Configurar data atual
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        
        const inputData = document.getElementById('dataCardapio');
        if (inputData) {
            inputData.value = hojeStr;
            this.estado.dataAtual = hojeStr;
        }
        
        this.atualizarIndicadorData();
    },
    
    // ===== CARREGAR DADOS =====
    carregarDados: async function() {
        console.log('📥 Carregando dados do módulo cardápios...');
        
        try {
            await Promise.all([
                this.carregarClientes(),
                this.carregarReceitas(),
                this.carregarTiposRefeicao(),
                this.carregarCardapios()
            ]);
            
            this.carregarClientesSelect();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.toast('Erro ao carregar dados: ' + error.message, 'error');
        }
    },
    
    // ===== CARREGAR CLIENTES =====
    carregarClientes: async function() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) return;

            const { data: clientesData, error } = await window.supabase
                .from('clientes')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (error) throw error;

            if (!clientesData || clientesData.length === 0) {
                this.estado.clientes = [];
                return;
            }

            // Carregar tipos vinculados
            const clientesComTipos = [];
            
            for (const cliente of clientesData) {
                const { data: tiposData } = await window.supabase
                    .from('cliente_tipos_refeicao')
                    .select(`
                        tipos_refeicoes (
                            id,
                            codigo,
                            descricao
                        )
                    `)
                    .eq('cliente_id', cliente.id);

                const tiposRefeicao = tiposData ? 
                    tiposData.map(rel => rel.tipos_refeicoes).filter(tipo => tipo !== null) : [];
                
                clientesComTipos.push({
                    ...cliente,
                    tiposRefeicao: tiposRefeicao
                });
            }

            this.estado.clientes = clientesComTipos;
            console.log(`✅ ${clientesComTipos.length} clientes carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            this.estado.clientes = [];
        }
    },
    
    // ===== CARREGAR RECEITAS =====
    carregarReceitas: async function() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await window.supabase
                .from('receitas')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (error) throw error;

            this.estado.receitas = data || [];
            console.log(`✅ ${this.estado.receitas.length} receitas carregadas`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar receitas:', error);
            this.estado.receitas = [];
        }
    },
    
    // ===== CARREGAR TIPOS REFEIÇÃO =====
    carregarTiposRefeicao: async function() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await window.supabase
                .from('tipos_refeicoes')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (error) throw error;

            this.estado.tiposRefeicao = data || [];
            console.log(`✅ ${this.estado.tiposRefeicao.length} tipos de refeição carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar tipos de refeição:', error);
            this.estado.tiposRefeicao = [];
        }
    },
    
    // ===== CARREGAR CARDÁPIOS =====
    carregarCardapios: async function() {
        try {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await window.supabase
                .from('cardapios')
                .select(`
                    *,
                    clientes (codigo, descricao),
                    tipos_refeicoes (codigo, descricao),
                    receitas (codigo, descricao, rendimento, unidade_rendimento)
                `)
                .eq('user_id', user.id)
                .order('data, cliente_id, tipo_refeicao_id');

            if (error) throw error;

            // Organizar por data
            this.estado.cardapios = {};
            
            (data || []).forEach(item => {
                const data = item.data;
                const clienteCodigo = item.clientes?.codigo;
                const tipoCodigo = item.tipos_refeicoes?.codigo;
                
                if (!data || !clienteCodigo || !tipoCodigo) return;
                
                if (!this.estado.cardapios[data]) {
                    this.estado.cardapios[data] = {};
                }
                
                if (!this.estado.cardapios[data][clienteCodigo]) {
                    this.estado.cardapios[data][clienteCodigo] = {};
                }
                
                if (!this.estado.cardapios[data][clienteCodigo][tipoCodigo]) {
                    this.estado.cardapios[data][clienteCodigo][tipoCodigo] = [];
                }
                
                this.estado.cardapios[data][clienteCodigo][tipoCodigo].push({
                    id: item.id,
                    receita_id: item.receita_id,
                    codigo: item.receitas?.codigo || 'N/A',
                    descricao: item.receitas?.descricao || 'Receita não encontrada',
                    comensais: item.comensais,
                    quantidadePorPessoa: item.quantidade_por_pessoa,
                    totalPorComensais: item.total_por_comensais,
                    unidadeBasica: item.unidade_basica,
                    alterada: item.alterada || false
                });
            });
            
            console.log('✅ Cardápios carregados');
            
        } catch (error) {
            console.error('❌ Erro ao carregar cardápios:', error);
            this.estado.cardapios = {};
        }
    },
    
    // ===== CARREGAR CLIENTES NO SELECT =====
    carregarClientesSelect: function() {
        const select = document.getElementById('clienteCardapio');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione um cliente</option>';
        
        if (this.estado.clientes.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '❌ Nenhum cliente cadastrado';
            option.disabled = true;
            select.appendChild(option);
            return;
        }

        this.estado.clientes.forEach((cliente, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = `${cliente.codigo} - ${cliente.descricao}`;
            
            if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
                option.textContent += ' ⚠️';
                option.title = 'Cliente sem tipos de refeição';
            }
            
            select.appendChild(option);
        });
    },
    
    // ===== SELECIONAR CLIENTE =====
    selecionarCliente: function() {
        const select = document.getElementById('clienteCardapio');
        const container = document.getElementById('tiposRefeicaoCardapio');
        
        if (!select || !container) return;
        
        const clienteIndex = select.value;
        container.innerHTML = '';
        
        if (clienteIndex === '') {
            this.estado.clienteAtual = null;
            this.estado.receitasTemporarias = {};
            return;
        }
        
        const cliente = this.estado.clientes[parseInt(clienteIndex)];
        if (!cliente) return;
        
        this.estado.clienteAtual = cliente;
        this.estado.receitasTemporarias = {};
        
        if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Cliente não possui tipos de refeição cadastrados</p>';
            return;
        }
        
        // Criar seções para cada tipo
        cliente.tiposRefeicao.forEach(tipo => {
            const section = this.criarSecaoTipo(tipo);
            container.appendChild(section);
        });
        
        // Carregar cardápio para data atual
        this.carregarCardapioData();
    },
    
    // ===== CRIAR SEÇÃO DO TIPO =====
    criarSecaoTipo: function(tipo) {
        const section = document.createElement('div');
        section.className = 'expandable';
        section.innerHTML = `
            <div class="expandable-header" onclick="window.ModuloCardapios.toggleExpandable(this)">
                <span>${tipo.descricao}</span>
                <span>▼</span>
            </div>
            <div class="expandable-content">
                <div class="comensais-section">
                    <label>Comensais para ${tipo.descricao}:</label>
                    <input type="number" 
                           id="comensais-${tipo.codigo}" 
                           class="comensais-input" 
                           min="1" 
                           max="99999" 
                           placeholder="0">
                    <button class="btn btn-primary compact-btn" onclick="window.ModuloCardapios.atualizarCalcular('${tipo.codigo}')">
                        📝 Atualizar e Calcular
                    </button>
                </div>

                <div class="actions" style="margin: 15px 0;">
                    <button class="btn btn-primary compact-btn" onclick="window.ModuloCardapios.abrirModalReceitas('${tipo.codigo}')">
                        ➕ Adicionar Receitas
                    </button>
                </div>

                <div class="receitas-header">
                    <div style="display: grid; grid-template-columns: 2fr 120px 150px 150px 80px; gap: 10px; font-weight: 600; color: #495057; font-size: 13px; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;">
                        <div>Receita</div>
                        <div style="text-align: center;">Comensais</div>
                        <div style="text-align: center;">Rend. Receita</div>
                        <div style="text-align: center;">Total</div>
                        <div style="text-align: center;">Ações</div>
                    </div>
                </div>

                <div id="receitas-list-${tipo.codigo}" class="receitas-container">
                    <div style="text-align: center; color: #666; padding: 20px;">
                        📝 Nenhuma receita cadastrada
                    </div>
                </div>
            </div>
        `;
        
        return section;
    },
    
    // ===== ALTERAR DATA =====
    alterarData: function() {
        const input = document.getElementById('dataCardapio');
        if (!input) return;
        
        const novaData = input.value;
        const dataAnterior = this.estado.dataAtual;
        
        console.log(`📅 Data alterada de ${dataAnterior} para ${novaData}`);
        
        this.estado.dataAtual = novaData;
        this.atualizarIndicadorData();
        
        // Limpar receitas temporárias
        this.estado.receitasTemporarias = {};
        
        // Carregar cardápio para nova data
        setTimeout(() => {
            this.carregarCardapioData();
        }, 100);
    },
    
    // ===== CARREGAR CARDÁPIO PARA DATA =====
    carregarCardapioData: function() {
        if (!this.estado.dataAtual || !this.estado.clienteAtual) {
            this.limparInterface();
            return;
        }
        
        console.log(`📅 Carregando cardápio para ${this.estado.dataAtual}`);
        
        // Limpar receitas temporárias
        this.estado.receitasTemporarias = {};
        
        // Verificar se existe cardápio
        const cardapioData = this.estado.cardapios[this.estado.dataAtual]?.[this.estado.clienteAtual.codigo];
        
        if (cardapioData && Object.keys(cardapioData).length > 0) {
            console.log('✅ Cardápio encontrado:', cardapioData);
            
            // Carregar receitas existentes
            Object.keys(cardapioData).forEach(tipoCodigo => {
                const receitasTipo = cardapioData[tipoCodigo];
                
                if (receitasTipo && receitasTipo.length > 0) {
                    this.estado.receitasTemporarias[tipoCodigo] = [...receitasTipo];
                    this.renderizarReceitas(tipoCodigo);
                    
                    // Atualizar comensais
                    const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
                    if (comensaisInput && receitasTipo[0]?.comensais) {
                        comensaisInput.value = receitasTipo[0].comensais;
                    }
                }
            });
            
        } else {
            console.log('ℹ️ Nenhum cardápio encontrado para esta data');
            this.limparInterface();
        }
    },
    
    // ===== RENDERIZAR RECEITAS =====
    renderizarReceitas: function(tipoCodigo) {
        const container = document.getElementById(`receitas-list-${tipoCodigo}`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const receitas = this.estado.receitasTemporarias[tipoCodigo] || [];
        
        if (receitas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px;">
                    📝 Nenhuma receita cadastrada
                </div>
            `;
            return;
        }
        
        receitas.forEach(receita => {
            const div = document.createElement('div');
            div.className = 'receita-item';
            div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
            
            div.style.cssText = `
                display: grid;
                grid-template-columns: 2fr 120px 150px 150px 80px;
                gap: 10px;
                align-items: center;
                padding: 12px;
                margin-bottom: 8px;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 6px;
            `;
            
            const receitaOriginal = this.estado.receitas.find(r => r.id === receita.receita_id);
            const unidade = receitaOriginal?.unidade_rendimento || 'UN';
            
            div.innerHTML = `
                <div style="font-weight: 500; color: #333;">
                    ${receita.codigo} - ${receita.descricao}
                </div>
                <div style="text-align: center;">
                    <span style="padding: 4px 8px; background: #e7f3ff; color: #0066cc; border-radius: 4px; font-weight: 600;">
                        ${receita.comensais || 0}
                    </span>
                </div>
                <div style="text-align: center;">
                    <span style="font-weight: 500;">
                        ${(receita.quantidadePorPessoa || 0).toFixed(3)} ${unidade}
                    </span>
                </div>
                <div style="text-align: center;">
                    <span style="padding: 6px 10px; background: #e8f5e8; color: #2e7d32; border-radius: 6px; font-weight: 600;">
                        ${(receita.totalPorComensais || 0).toFixed(3)} ${unidade}
                    </span>
                </div>
                <div style="text-align: center;">
                    <button class="btn btn-danger btn-sm" onclick="window.ModuloCardapios.removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                            style="padding: 4px 8px; font-size: 11px;">
                        Excluir
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });
    },