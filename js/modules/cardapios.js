// modules/cardapios.js - Módulo Final Unificado de Cardápios
import { showToast } from './utils.js';

console.log('📁 Carregando módulo cardapios.js...');

class CardapiosModule {
    constructor() {
        this.supabase = null;
        this.estado = {
            clientes: [],
            receitas: [],
            tiposRefeicao: [],
            cardapios: {},
            clienteAtual: null,
            dataAtual: null,
            receitasTemporarias: {},
            inicializado: false
        };
        
        // Configurações de formatação brasileira
        this.formatacao = {
            casasDecimais: 3,
            separadorDecimal: ',',
            separadorMilhar: '.'
        };
    }

    // ===== INICIALIZAÇÃO =====
    async init(supabaseInstance) {
        console.log('🚀 Inicializando módulo de cardápios...');
        
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
            console.log('✅ Módulo de cardápios inicializado');
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar módulo de cardápios:', error);
            showToast('Erro ao inicializar cardápios: ' + error.message, 'error');
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
        console.log('⚙️ Configurando eventos de cardápios...');
        
        // Seleção de cliente
        const selectCliente = document.getElementById('clienteCardapio');
        if (selectCliente) {
            selectCliente.removeEventListener('change', this.handleClienteChange);
            this.handleClienteChange = () => this.selecionarCliente();
            selectCliente.addEventListener('change', this.handleClienteChange);
        }
        
        // Mudança de data
        const inputData = document.getElementById('dataCardapio');
        if (inputData) {
            inputData.removeEventListener('change', this.handleDataChange);
            this.handleDataChange = () => this.alterarData();
            inputData.addEventListener('change', this.handleDataChange);
        }
    }

    // ===== CONFIGURAR INTERFACE =====
    configurarInterface() {
        // Configurar data atual
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        
        const inputData = document.getElementById('dataCardapio');
        if (inputData) {
            inputData.value = hojeStr;
            this.estado.dataAtual = hojeStr;
        }
        
        this.atualizarIndicadorData();
        this.mostrarMensagemInicial();
    }

    // ===== CARREGAR DADOS =====
    async carregarDados() {
        console.log('📥 Carregando dados de cardápios...');
        
        try {
            await Promise.all([
                this.carregarClientes(),
                this.carregarReceitas(),
                this.carregarTiposRefeicao(),
                this.carregarCardapios()
            ]);
            
            this.carregarClientesSelect();
            console.log('✅ Todos os dados carregados');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    }

    // ===== CARREGAR CLIENTES =====
    async carregarClientes() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data: clientesData, error } = await this.supabase
                .from('clientes')
                .select('*')
                .eq('user_id', user.id)
                .order('codigo');

            if (error) throw error;

            if (!clientesData || clientesData.length === 0) {
                this.estado.clientes = [];
                return;
            }

            // Carregar tipos vinculados para cada cliente
            const clientesComTipos = [];
            
            for (const cliente of clientesData) {
                try {
                    const { data: tiposData } = await this.supabase
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
                    
                } catch (error) {
                    console.warn(`⚠️ Erro ao carregar tipos do cliente ${cliente.descricao}:`, error);
                    clientesComTipos.push({
                        ...cliente,
                        tiposRefeicao: []
                    });
                }
            }

            this.estado.clientes = clientesComTipos;
            console.log(`✅ ${clientesComTipos.length} clientes carregados`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar clientes:', error);
            this.estado.clientes = [];
        }
    }

    // ===== CARREGAR RECEITAS =====
    async carregarReceitas() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await this.supabase
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
    }

    // ===== CARREGAR TIPOS REFEIÇÃO =====
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
            console.error('❌ Erro ao carregar tipos de refeição:', error);
            this.estado.tiposRefeicao = [];
        }
    }

    // ===== CARREGAR CARDÁPIOS =====
    async carregarCardapios() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await this.supabase
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

            // Organizar por data > cliente > tipo
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
            
            // Disponibilizar globalmente para compatibilidade
            window.cardapiosCarregados = this.estado.cardapios;
            
            console.log('✅ Cardápios carregados');
            
        } catch (error) {
            console.error('❌ Erro ao carregar cardápios:', error);
            this.estado.cardapios = {};
            window.cardapiosCarregados = {};
        }
    }

    // ===== MOSTRAR MENSAGEM INICIAL =====
    mostrarMensagemInicial() {
        const container = document.getElementById('tiposRefeicaoCardapio');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 10px; margin: 20px 0;">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h5>Bem-vindo ao Sistema de Cardápios</h5>
                    <p>Selecione um cliente para começar a montar o cardápio</p>
                    <small class="text-muted">Data selecionada: ${this.formatarDataBrasil(this.estado.dataAtual)}</small>
                </div>
            `;
        }
    }

    // ===== CARREGAR CLIENTES NO SELECT =====
    carregarClientesSelect() {
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
                option.title = 'Cliente sem tipos de refeição cadastrados';
            }
            
            select.appendChild(option);
        });
        
        console.log(`✅ ${this.estado.clientes.length} clientes carregados no select`);
    }

    // ===== SELECIONAR CLIENTE =====
    selecionarCliente() {
        const select = document.getElementById('clienteCardapio');
        const container = document.getElementById('tiposRefeicaoCardapio');
        
        if (!select || !container) return;
        
        const clienteIndex = select.value;
        container.innerHTML = '';
        
        if (clienteIndex === '') {
            this.estado.clienteAtual = null;
            this.estado.receitasTemporarias = {};
            this.mostrarMensagemInicial();
            return;
        }
        
        const cliente = this.estado.clientes[parseInt(clienteIndex)];
        if (!cliente) return;
        
        this.estado.clienteAtual = cliente;
        this.estado.receitasTemporarias = {};
        
        console.log('👤 Cliente selecionado:', cliente.descricao);
        
        if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #dc3545; padding: 30px; background: #f8d7da; border-radius: 10px; margin: 20px 0;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                    <h5>Cliente sem tipos de refeição</h5>
                    <p>Este cliente não possui tipos de refeição cadastrados.</p>
                    <small>Acesse o módulo de Clientes para vincular tipos de refeição.</small>
                </div>
            `;
            return;
        }
        
        // Criar seções para cada tipo de refeição
        cliente.tiposRefeicao.forEach(tipo => {
            const section = this.criarSecaoTipo(tipo);
            container.appendChild(section);
        });
        
        // Carregar cardápio para data atual
        setTimeout(() => {
            this.carregarCardapioData();
        }, 100);
        
        // Disponibilizar globalmente para compatibilidade
        window.clienteAtualCardapio = cliente;
    }

    // ===== CRIAR SEÇÃO DO TIPO =====
    criarSecaoTipo(tipo) {
        const section = document.createElement('div');
        section.className = 'expandable';
        section.innerHTML = `
            <div class="expandable-header" onclick="window.cardapiosModule.toggleExpandable(this)">
                <span><i class="fas fa-utensils"></i> ${tipo.descricao}</span>
                <span class="arrow">▼</span>
            </div>
            <div class="expandable-content">
                <div class="comensais-section" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <label for="comensais-${tipo.codigo}" style="font-weight: 600; margin-bottom: 5px;">
                                👥 Comensais para ${tipo.descricao}:
                            </label>
                            <input type="number" 
                                   id="comensais-${tipo.codigo}" 
                                   class="form-control" 
                                   min="1" 
                                   max="99999" 
                                   placeholder="Ex: 50"
                                   style="text-align: center; font-weight: 600;">
                        </div>
                        <div class="col-md-8">
                            <button class="btn btn-primary" onclick="window.cardapiosModule.atualizarCalcular('${tipo.codigo}')">
                                <i class="fas fa-calculator"></i> Atualizar e Calcular
                            </button>
                            <button class="btn btn-success" onclick="window.cardapiosModule.abrirModalReceitas('${tipo.codigo}')">
                                <i class="fas fa-plus"></i> Adicionar Receitas
                            </button>
                        </div>
                    </div>
                </div>

                <div class="receitas-header">
                    <div class="receitas-grid-header">
                        <div class="grid-col-receita">Receita</div>
                        <div class="grid-col-comensais">Comensais</div>
                        <div class="grid-col-rendimento">Rendimento</div>
                        <div class="grid-col-total">Total</div>
                        <div class="grid-col-acoes">Ações</div>
                    </div>
                </div>

                <div id="receitas-list-${tipo.codigo}" class="receitas-container">
                    <!-- Receitas serão renderizadas aqui -->
                </div>
            </div>
        `;
        
        return section;
    }

    // ===== ALTERAR DATA =====
    alterarData() {
        const input = document.getElementById('dataCardapio');
        if (!input) return;
        
        const novaData = input.value;
        const dataAnterior = this.estado.dataAtual;
        
        console.log(`📅 Data alterada de ${dataAnterior} para ${novaData}`);
        
        this.estado.dataAtual = novaData;
        this.atualizarIndicadorData();
        
        // Disponibilizar globalmente
        window.dataAtualCardapio = novaData;
        
        // Limpar receitas temporárias
        this.estado.receitasTemporarias = {};
        
        // Carregar cardápio para nova data
        setTimeout(() => {
            this.carregarCardapioData();
        }, 100);
    }

    // ===== CARREGAR CARDÁPIO PARA DATA =====
    carregarCardapioData() {
        if (!this.estado.dataAtual || !this.estado.clienteAtual) {
            console.log('⚠️ Data ou cliente não definidos');
            this.limparInterface();
            return;
        }
        
        console.log(`📅 Carregando cardápio para ${this.estado.dataAtual}, cliente: ${this.estado.clienteAtual.codigo}`);
        
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
    }

    // ===== ATUALIZAR E CALCULAR =====
    atualizarCalcular(tipoCodigo) {
        console.log(`🔄 Atualizando e calculando para tipo: ${tipoCodigo}`);
        
        const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
        if (!comensaisInput) {
            showToast('Campo de comensais não encontrado', 'error');
            return;
        }
        
        const comensais = parseInt(comensaisInput.value || 0);
        
        if (comensais <= 0) {
            showToast('Informe um número válido de comensais (maior que 0)', 'warning');
            comensaisInput.focus();
            return;
        }
        
        // Verificar se tem receitas
        if (!this.estado.receitasTemporarias[tipoCodigo] || this.estado.receitasTemporarias[tipoCodigo].length === 0) {
            showToast(`ℹ️ Comensais definido para ${comensais}. Adicione receitas para aplicar o cálculo.`, 'info');
            return;
        }
        
        // Aplicar comensais e calcular
        let receitasProcessadas = 0;
        
        this.estado.receitasTemporarias[tipoCodigo].forEach(receita => {
            const receitaOriginal = this.estado.receitas.find(r => r.id === receita.receita_id);
            
            if (receitaOriginal && receitaOriginal.rendimento > 0) {
                const rendimento = parseFloat(receitaOriginal.rendimento) || 0;
                const total = comensais * rendimento;
                
                receita.comensais = comensais;
                receita.quantidadePorPessoa = rendimento;
                receita.totalPorComensais = total;
                receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
                receita.alterada = true;
                
                console.log(`✅ Receita ${receita.codigo}: ${comensais} × ${rendimento} = ${total}`);
                receitasProcessadas++;
            }
        });
        
        if (receitasProcessadas > 0) {
            showToast(`✅ ${receitasProcessadas} receita(s) calculadas com ${comensais} comensais!`, 'success');
            this.renderizarReceitas(tipoCodigo);
        } else {
            showToast('Nenhuma receita pôde ser calculada. Verifique se as receitas têm rendimento definido.', 'warning');
        }
    }

    // ===== RENDERIZAR RECEITAS =====
    renderizarReceitas(tipoCodigo) {
        const container = document.getElementById(`receitas-list-${tipoCodigo}`);
        if (!container) return;
        
        container.innerHTML = '';
        
        const receitas = this.estado.receitasTemporarias[tipoCodigo] || [];
        
        if (receitas.length === 0) {
            container.innerHTML = `
                <div class="receita-empty">
                    <i class="fas fa-utensils" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;"></i>
                    <p>Nenhuma receita adicionada</p>
                    <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
                </div>
            `;
            return;
        }
        
        receitas.forEach(receita => {
            const div = document.createElement('div');
            div.className = 'receita-item';
            div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
            
            const receitaOriginal = this.estado.receitas.find(r => r.id === receita.receita_id);
            const unidade = receitaOriginal?.unidade_rendimento || 'UN';
            
            div.innerHTML = `
                <div class="grid-col-receita">
                    <div class="receita-info">
                        <strong>${receita.codigo}</strong>
                        <span class="receita-nome">${receita.descricao}</span>
                    </div>
                </div>
                <div class="grid-col-comensais">
                    <input type="number" 
                           class="form-control form-control-sm" 
                           value="${receita.comensais || 0}" 
                           min="1" 
                           max="9999"
                           onchange="window.cardapiosModule.atualizarComensaisReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                           style="text-align: center; font-weight: 600;">
                </div>
                <div class="grid-col-rendimento">
                    <input type="text" 
                           class="form-control form-control-sm" 
                           value="${this.formatarDecimal(receita.quantidadePorPessoa || 0)}" 
                           onchange="window.cardapiosModule.atualizarRendimentoReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                           style="text-align: center; font-weight: 600;">
                    <small class="text-muted">${unidade}/pessoa</small>
                </div>
                <div class="grid-col-total">
                    <span class="total-display" id="total-${tipoCodigo}-${receita.receita_id}">
                        ${this.formatarDecimal(receita.totalPorComensais || 0)} ${unidade}
                    </span>
                </div>
                <div class="grid-col-acoes">
                    <button class="btn btn-sm btn-success" onclick="window.cardapiosModule.calcularReceita('${tipoCodigo}', '${receita.receita_id}')" title="Recalcular">
                        <i class="fas fa-calculator"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.cardapiosModule.removerReceita('${tipoCodigo}', '${receita.receita_id}')" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });
    }

    // ===== ABRIR MODAL RECEITAS =====
    abrirModalReceitas(tipoCodigo) {
        console.log('🍽️ Abrindo modal de receitas para tipo:', tipoCodigo);
        
        const tipo = this.estado.tiposRefeicao.find(t => t.codigo === tipoCodigo);
        if (!tipo) {
            showToast('Tipo de refeição não encontrado', 'error');
            return;
        }
        
        this.tipoAtual = tipo;
        
        // Criar modal se não existir
        if (!document.getElementById('modalReceitas')) {
            this.criarModalReceitas();
        }
        
        // Carregar receitas no modal
        this.carregarReceitasModal();
        
        // Mostrar modal
        document.getElementById('modalReceitas').style.display = 'block';
    }

    // ===== CRIAR MODAL RECEITAS =====
    criarModalReceitas() {
        const modal = document.createElement('div');
        modal.id = 'modalReceitas';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-utensils"></i> Selecionar Receitas
                    </h5>
                    <button type="button" class="close" onclick="window.cardapiosModule.fecharModal('modalReceitas')">
                        <span>&times;</span>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="search-box mb-3">
                        <div class="input-group">
                            <div class="input-group-prepend">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                            </div>
                            <input type="text" id="searchReceitas" class="form-control" 
                                   placeholder="Pesquisar por código ou nome da receita..." 
                                   onkeyup="window.cardapiosModule.filtrarReceitas()">
                        </div>
                    </div>
                    
                    <div id="listaReceitasModal" style="max-height: 400px; overflow-y: auto;">
                        <!-- Receitas serão carregadas aqui -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.cardapiosModule.fecharModal('modalReceitas')">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" onclick="window.cardapiosModule.adicionarReceitasSelecionadas()">
                        <i class="fas fa-plus"></i> Adicionar Selecionadas
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ===== CARREGAR RECEITAS NO MODAL =====
    carregarReceitasModal() {
        const container = document.getElementById('listaReceitasModal');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.estado.receitas.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Nenhuma receita cadastrada</p>
                    <small>Cadastre receitas no módulo de Receitas primeiro</small>
                </div>
            `;
            return;
        }
        
        const tipoCodigo = this.tipoAtual?.codigo;
        const receitasJaAdicionadas = this.estado.receitasTemporarias[tipoCodigo] || [];
        const idsJaAdicionados = receitasJaAdicionadas.map(r => r.receita_id);
        
        this.estado.receitas.forEach((receita, index) => {
            const jaAdicionado = idsJaAdicionados.includes(receita.id);
            
            const div = document.createElement('div');
            div.className = 'receita-item-modal';
            div.innerHTML = `
                <div class="custom-control custom-checkbox">
                    <input type="checkbox" 
                           class="custom-control-input" 
                           id="receita-${index}" 
                           value="${receita.id}" 
                           ${jaAdicionado ? 'disabled checked' : ''}>
                    <label class="custom-control-label" for="receita-${index}">
                        <strong>${receita.codigo}</strong> - ${receita.descricao}
                        ${jaAdicionado ? ' <span class="badge badge-success">✓ Adicionada</span>' : ''}
                    </label>
                </div>
                <div class="receita-info">
                    <small class="text-muted">
                        Rendimento: ${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}
                    </small>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // ===== FILTRAR RECEITAS =====
    filtrarReceitas() {
        const search = document.getElementById('searchReceitas').value.toLowerCase();
        const items = document.querySelectorAll('#listaReceitasModal .receita-item-modal');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(search) ? 'block' : 'none';
        });
    }

    // ===== ADICIONAR RECEITAS SELECIONADAS =====
    adicionarReceitasSelecionadas() {
        const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked:not(:disabled)');
        
        if (checkboxes.length === 0) {
            showToast('Selecione pelo menos uma receita para adicionar', 'warning');
            return;
        }
        
        const tipoCodigo = this.tipoAtual?.codigo;
        if (!tipoCodigo) {
            showToast('Tipo de refeição não selecionado', 'error');
            return;
        }
        
        // Inicializar array se não existe
        if (!this.estado.receitasTemporarias[tipoCodigo]) {
            this.estado.receitasTemporarias[tipoCodigo] = [];
        }
        
        // Obter comensais do campo
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
            showToast(`✅ ${adicionadas} receita(s) adicionada(s) com sucesso!`, 'success');
            this.fecharModal('modalReceitas');
            this.renderizarReceitas(tipoCodigo);
        }
    }

    // ===== REMOVER RECEITA =====
    async removerReceita(tipoCodigo, receitaId) {
        const receita = this.estado.receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receitaId);
        if (!receita) {
            showToast('Receita não encontrada', 'error');
            return;
        }
        
        const confirmar = confirm(`Confirmar remoção da receita "${receita.codigo} - ${receita.descricao}"?\n\nEsta ação será salva no banco de dados.`);
        if (!confirmar) return;
        
        try {
            // Remover do banco se existir
            if (this.estado.clienteAtual && this.estado.dataAtual) {
                const { data: { user } } = await this.supabase.auth.getUser();
                const tipoRefeicao = this.estado.clienteAtual.tiposRefeicao.find(t => t.codigo === tipoCodigo);
                
                if (user && tipoRefeicao) {
                    await this.supabase
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
            
            // Atualizar estado global
            if (this.estado.cardapios[this.estado.dataAtual]?.[this.estado.clienteAtual?.codigo]?.[tipoCodigo]) {
                this.estado.cardapios[this.estado.dataAtual][this.estado.clienteAtual.codigo][tipoCodigo] = 
                    this.estado.cardapios[this.estado.dataAtual][this.estado.clienteAtual.codigo][tipoCodigo].filter(r => r.receita_id !== receitaId);
            }
            
            showToast(`✅ Receita "${receita.codigo}" removida com sucesso!`, 'success');
            
            // Re-renderizar
            this.renderizarReceitas(tipoCodigo);
            
        } catch (error) {
            console.error('❌ Erro ao remover receita:', error);
            showToast('Erro ao remover receita: ' + error.message, 'error');
        }
    }

    // ===== CALCULAR RECEITA INDIVIDUAL =====
    calcularReceita(tipoCodigo, receitaId) {
        const receita = this.estado.receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receitaId);
        if (!receita) return;
        
        const receitaOriginal = this.estado.receitas.find(r => r.id === receitaId);
        if (!receitaOriginal) return;
        
        const comensais = receita.comensais || 0;
        const rendimento = receita.quantidadePorPessoa || 0;
        const total = comensais * rendimento;
        
        receita.totalPorComensais = total;
        receita.alterada = true;
        
        // Atualizar display
        const totalElement = document.getElementById(`total-${tipoCodigo}-${receitaId}`);
        if (totalElement) {
            const unidade = receitaOriginal.unidade_rendimento || 'UN';
            totalElement.textContent = `${this.formatarDecimal(total)} ${unidade}`;
            
            // Animação de atualização
            totalElement.style.backgroundColor = '#d1ecf1';
            setTimeout(() => {
                totalElement.style.backgroundColor = '';
            }, 1000);
        }
        
        showToast(`✅ Total recalculado: ${this.formatarDecimal(total)}`, 'success', 2000);
    }

    // ===== ATUALIZAR COMENSAIS DE RECEITA =====
    atualizarComensaisReceita(tipoCodigo, receitaId, novoValor) {
        const receita = this.estado.receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receitaId);
        if (!receita) return;
        
        const comensais = parseInt(novoValor) || 0;
        receita.comensais = comensais;
        receita.alterada = true;
        
        // Recalcular automaticamente
        this.calcularReceita(tipoCodigo, receitaId);
    }

    // ===== ATUALIZAR RENDIMENTO DE RECEITA =====
    atualizarRendimentoReceita(tipoCodigo, receitaId, novoValor) {
        const receita = this.estado.receitasTemporarias[tipoCodigo]?.find(r => r.receita_id === receitaId);
        if (!receita) return;
        
        const rendimento = this.converterVirgulaParaNumero(novoValor);
        receita.quantidadePorPessoa = rendimento;
        receita.alterada = true;
        
        // Recalcular automaticamente
        this.calcularReceita(tipoCodigo, receitaId);
    }

    // ===== GRAVAR CARDÁPIO =====
    async gravarCardapio() {
        try {
            if (!this.estado.clienteAtual || !this.estado.dataAtual) {
                showToast('Selecione cliente e data', 'warning');
                return;
            }
            
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            let totalGravado = 0;
            
            // Gravar cada tipo de refeição
            for (const tipo of this.estado.clienteAtual.tiposRefeicao) {
                const receitas = this.estado.receitasTemporarias[tipo.codigo];
                if (!receitas || receitas.length === 0) continue;
                
                // Deletar cardápios existentes para este tipo/data
                await this.supabase
                    .from('cardapios')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('cliente_id', this.estado.clienteAtual.id)
                    .eq('tipo_refeicao_id', tipo.id)
                    .eq('data', this.estado.dataAtual);
                
                // Inserir novas receitas
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
                        
                        const { error } = await this.supabase
                            .from('cardapios')
                            .insert([cardapioData]);
                        
                        if (error) throw error;
                        totalGravado++;
                    }
                }
            }
            
            if (totalGravado > 0) {
                showToast(`✅ ${totalGravado} receita(s) gravadas com sucesso!`, 'success');
                await this.carregarCardapios();
            } else {
                showToast('Nenhuma receita para gravar', 'info');
            }
            
        } catch (error) {
            console.error('❌ Erro ao gravar cardápio:', error);
            showToast('Erro ao gravar: ' + error.message, 'error');
        }
    }

    // ===== CALCULAR TODOS =====
    calcularTodos() {
        if (!this.estado.clienteAtual?.tiposRefeicao) {
            showToast('Selecione um cliente primeiro', 'warning');
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
            showToast(`✅ ${totalCalculado} receitas calculadas!`, 'success');
        } else {
            showToast('Nenhuma receita para calcular', 'info');
        }
    }

    // ===== ATUALIZAR TODOS COMENSAIS =====
    atualizarTodos() {
        const totalInput = document.getElementById('totalComensais');
        if (!totalInput?.value) {
            showToast('Informe o total de comensais', 'warning');
            totalInput?.focus();
            return;
        }
        
        const totalComensais = parseInt(totalInput.value);
        if (totalComensais <= 0) {
            showToast('Número inválido de comensais', 'warning');
            return;
        }
        
        if (this.estado.clienteAtual?.tiposRefeicao) {
            this.estado.clienteAtual.tiposRefeicao.forEach(tipo => {
                const comensaisInput = document.getElementById(`comensais-${tipo.codigo}`);
                if (comensaisInput) {
                    comensaisInput.value = totalComensais;
                }
            });
            
            showToast(`✅ Todos os tipos atualizados para ${totalComensais} comensais`, 'success');
        }
    }

    // ===== UTILITÁRIOS =====
    formatarDecimal(numero, casas = 3) {
        if (numero === null || numero === undefined || isNaN(numero)) {
            return '0' + ',000'.substring(0, casas + 1);
        }
        const numeroFormatado = parseFloat(numero).toFixed(casas);
        return numeroFormatado.replace('.', ',');
    }

    converterVirgulaParaNumero(texto) {
        if (!texto || texto === '') return 0;
        const numeroStr = String(texto).replace(',', '.');
        const numero = parseFloat(numeroStr);
        return isNaN(numero) ? 0 : numero;
    }

    formatarDataBrasil(dataISO) {
        if (!dataISO) return '';
        try {
            const data = new Date(dataISO + 'T00:00:00');
            return data.toLocaleDateString('pt-BR');
        } catch (error) {
            return dataISO;
        }
    }

    toggleExpandable(header) {
        const content = header.nextElementSibling;
        const arrow = header.querySelector('.arrow');
        
        if (content.classList.contains('active')) {
            content.classList.remove('active');
            arrow.textContent = '▼';
        } else {
            content.classList.add('active');
            arrow.textContent = '▲';
        }
    }

    limparInterface() {
        if (!this.estado.clienteAtual?.tiposRefeicao) return;
        
        this.estado.clienteAtual.tiposRefeicao.forEach(tipo => {
            const container = document.getElementById(`receitas-list-${tipo.codigo}`);
            if (container) {
                container.innerHTML = `
                    <div class="receita-empty">
                        <i class="fas fa-utensils" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;"></i>
                        <p>Nenhuma receita cadastrada para esta data</p>
                        <small>Use o botão "Adicionar Receitas" para incluir receitas</small>
                    </div>
                `;
            }
            
            const comensaisInput = document.getElementById(`comensais-${tipo.codigo}`);
            if (comensaisInput) {
                comensaisInput.value = '';
            }
        });
    }

    atualizarIndicadorData() {
        const dataInput = document.getElementById('dataCardapio');
        if (!dataInput) return;
        
        const data = new Date(dataInput.value + 'T00:00:00');
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        dataInput.classList.remove('data-hoje', 'data-passada', 'data-futura');
        
        if (data.getTime() === hoje.getTime()) {
            dataInput.classList.add('data-hoje');
            dataInput.title = 'Cardápio de hoje';
        } else if (data < hoje) {
            dataInput.classList.add('data-passada');
            dataInput.title = 'Cardápio de data passada';
        } else {
            dataInput.classList.add('data-futura');
            dataInput.title = 'Cardápio de data futura';
        }
    }

    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Instância do módulo
const cardapiosModule = new CardapiosModule();

// Exportar para compatibilidade global
window.cardapiosModule = cardapiosModule;

// Funções públicas para inicialização
export async function initCardapios(supabase) {
    return await cardapiosModule.init(supabase);
}

// Aliases para compatibilidade com código existente
window.inicializarCardapio = () => initCardapios(window.supabase);
window.carregarTiposRefeicaoCliente = () => cardapiosModule.selecionarCliente();
window.carregarCardapioData = () => cardapiosModule.alterarData();
window.executarAtualizacaoECalculoFinal = (tipoCodigo) => cardapiosModule.atualizarCalcular(tipoCodigo);
window.abrirModalReceitasTipo = (tipoCodigo) => cardapiosModule.abrirModalReceitas(tipoCodigo);
window.adicionarReceitasSelecionadas = () => cardapiosModule.adicionarReceitasSelecionadas();
window.removerReceita = (tipoCodigo, receitaId) => cardapiosModule.removerReceita(tipoCodigo, receitaId);
window.gravarParaTodos = () => cardapiosModule.gravarCardapio();
window.calcularParaTodos = () => cardapiosModule.calcularTodos();
window.atualizarParaTodos = () => cardapiosModule.atualizarTodos();
window.filtrarReceitas = () => cardapiosModule.filtrarReceitas();
window.toggleExpandable = (header) => cardapiosModule.toggleExpandable(header);
window.fecharModal = (modalId) => cardapiosModule.fecharModal(modalId);

// Aliases específicos
window.calcularReceita = (tipoCodigo, receitaId) => cardapiosModule.calcularReceita(tipoCodigo, receitaId);
window.atualizarComensaisReceita = (tipoCodigo, receitaId, valor) => cardapiosModule.atualizarComensaisReceita(tipoCodigo, receitaId, valor);
window.atualizarRendimentoReceita = (tipoCodigo, receitaId, valor) => cardapiosModule.atualizarRendimentoReceita(tipoCodigo, receitaId, valor);

// Para compatibilidade com outros sistemas
window.cardapiosCarregados = () => cardapiosModule.estado.cardapios;
window.clienteAtualCardapio = () => cardapiosModule.estado.clienteAtual;
window.dataAtualCardapio = () => cardapiosModule.estado.dataAtual;

export default cardapiosModule;

console.log('✅ Módulo de cardápios carregado com sucesso!');