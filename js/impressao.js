// impressao.js - Sistema de Impressão Modular e Reutilizável

console.log('📁 Carregando impressao.js - Sistema modular...');

// ===== CONFIGURAÇÕES GLOBAIS =====
const ImpressaoConfig = {
    debug: true,
    dateFormat: 'pt-BR',
    timezone: 'America/Sao_Paulo'
};

// ===== CLASSE PRINCIPAL DE IMPRESSÃO =====
class SistemaImpressao {
    constructor() {
        this.modalId = 'modalImpressao';
        this.clientesCarregados = [];
        this.tiposRefeicaoCarregados = [];
        this.dadosOriginais = [];
        
        // Configurações padrão
        this.configPadrao = {
            titulo: 'Relatório do Sistema',
            subtitulo: '',
            formato: 'resumido',
            incluirCabecalho: true,
            incluirRodape: true,
            agruparPorData: true
        };
    }

    // ===== MÉTODOS PÚBLICOS =====

    // Abrir modal de impressão para cardápios
    async abrirModalCardapios(clientesData = [], tiposData = []) {
        console.log('🖨️ Abrindo modal de impressão para cardápios...');
        
        this.clientesCarregados = clientesData;
        this.tiposRefeicaoCarregados = tiposData;
        
        this.configurarModal({
            titulo: 'Impressão de Cardápios',
            subtitulo: 'Configure os filtros e período para impressão',
            mostrarClientes: true,
            mostrarTiposRefeicao: true,
            mostrarPeriodo: true
        });
        
        this.mostrarModal();
    }

    // Abrir modal de impressão para receitas
    async abrirModalReceitas(receitasData = []) {
        console.log('🖨️ Abrindo modal de impressão para receitas...');
        
        this.dadosOriginais = receitasData;
        
        this.configurarModal({
            titulo: 'Impressão de Receitas',
            subtitulo: 'Configure as receitas para impressão',
            mostrarClientes: false,
            mostrarTiposRefeicao: false,
            mostrarPeriodo: false,
            mostrarReceitas: true
        });
        
        this.mostrarModal();
    }

    // Abrir modal de impressão para produtos
    async abrirModalProdutos(produtosData = []) {
        console.log('🖨️ Abrindo modal de impressão para produtos...');
        
        this.dadosOriginais = produtosData;
        
        this.configurarModal({
            titulo: 'Impressão de Produtos',
            subtitulo: 'Configure a lista de produtos',
            mostrarClientes: false,
            mostrarTiposRefeicao: false,
            mostrarPeriodo: false,
            mostrarGrupos: true
        });
        
        this.mostrarModal();
    }

    // ===== MÉTODOS PRIVADOS =====

    configurarModal(opcoes) {
        // Criar modal se não existir
        if (!document.getElementById(this.modalId)) {
            this.criarModalHTML();
        }
        
        // Configurar cabeçalho
        this.atualizarCabecalhoModal(opcoes.titulo, opcoes.subtitulo);
        
        // Mostrar/ocultar seções
        this.toggleSecao('secao-periodo', opcoes.mostrarPeriodo);
        this.toggleSecao('secao-clientes', opcoes.mostrarClientes);
        this.toggleSecao('secao-tipos-refeicao', opcoes.mostrarTiposRefeicao);
        this.toggleSecao('secao-receitas', opcoes.mostrarReceitas);
        this.toggleSecao('secao-grupos', opcoes.mostrarGrupos);
        
        // Carregar dados nas listas
        if (opcoes.mostrarClientes) this.carregarClientesLista();
        if (opcoes.mostrarTiposRefeicao) this.carregarTiposRefeicaoLista();
        
        // Configurar data padrão
        this.configurarDataPadrao();
    }

    criarModalHTML() {
        const modalHTML = `
            <div id="${this.modalId}" class="modal">
                <div class="modal-content" style="max-width: 700px;">
                    <!-- Cabeçalho -->
                    <div class="modal-header" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
                        <h2 id="modal-titulo" style="margin: 0; display: flex; align-items: center; gap: 10px;">
                            🖨️ Sistema de Impressão
                            <span class="close" onclick="SistemaImpressao.fecharModal()" style="margin-left: auto; cursor: pointer; font-size: 28px; font-weight: bold;">&times;</span>
                        </h2>
                        <p id="modal-subtitulo" style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Configure as opções de impressão</p>
                    </div>
                    
                    <!-- Seção de Período -->
                    <div id="secao-periodo" class="form-section">
                        <h4>📅 Período</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="form-group">
                                <label for="dataInicioImpressao">Data Início:</label>
                                <input type="date" id="dataInicioImpressao" required style="width: 100%; padding: 8px; border: 1px solid #e9ecef; border-radius: 4px;">
                            </div>
                            <div class="form-group">
                                <label for="dataFimImpressao">Data Fim:</label>
                                <input type="date" id="dataFimImpressao" required style="width: 100%; padding: 8px; border: 1px solid #e9ecef; border-radius: 4px;">
                            </div>
                        </div>
                        <div style="margin-top: 10px;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.definirPeriodo('hoje')">Hoje</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.definirPeriodo('semana')">Esta Semana</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.definirPeriodo('mes')">Este Mês</button>
                        </div>
                    </div>
                    
                    <!-- Seção de Clientes -->
                    <div id="secao-clientes" class="form-section">
                        <h4>👥 Clientes</h4>
                        <div style="margin-bottom: 10px;">
                            <label>
                                <input type="radio" name="filtroCliente" value="todos" checked onchange="SistemaImpressao.toggleLista('clientes')"> 
                                Todos os clientes
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label>
                                <input type="radio" name="filtroCliente" value="especificos" onchange="SistemaImpressao.toggleLista('clientes')"> 
                                Clientes específicos
                            </label>
                        </div>
                        <div id="lista-clientes-container" style="display: none;">
                            <div id="lista-clientes" class="checkbox-list"></div>
                            <div style="margin-top: 8px;">
                                <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.selecionarTodos('clientes')">Selecionar Todos</button>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.desmarcarTodos('clientes')">Desmarcar Todos</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Seção de Tipos de Refeições -->
                    <div id="secao-tipos-refeicao" class="form-section">
                        <h4>🍽️ Tipos de Refeições</h4>
                        <div style="margin-bottom: 10px;">
                            <label>
                                <input type="radio" name="filtroTipoRefeicao" value="todos" checked onchange="SistemaImpressao.toggleLista('tipos')"> 
                                Todos os tipos de refeições
                            </label>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label>
                                <input type="radio" name="filtroTipoRefeicao" value="especificos" onchange="SistemaImpressao.toggleLista('tipos')"> 
                                Tipos específicos
                            </label>
                        </div>
                        <div id="lista-tipos-container" style="display: none;">
                            <div id="lista-tipos" class="checkbox-list"></div>
                            <div style="margin-top: 8px;">
                                <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.selecionarTodos('tipos')">Selecionar Todos</button>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.desmarcarTodos('tipos')">Desmarcar Todos</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Seção de Receitas -->
                    <div id="secao-receitas" class="form-section" style="display: none;">
                        <h4>📝 Receitas</h4>
                        <div id="lista-receitas" class="checkbox-list" style="max-height: 200px; overflow-y: auto;"></div>
                        <div style="margin-top: 8px;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.selecionarTodos('receitas')">Selecionar Todos</button>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="SistemaImpressao.desmarcarTodos('receitas')">Desmarcar Todos</button>
                        </div>
                    </div>
                    
                    <!-- Seção de Grupos -->
                    <div id="secao-grupos" class="form-section" style="display: none;">
                        <h4>📦 Grupos de Produtos</h4>
                        <div id="lista-grupos" class="checkbox-list"></div>
                    </div>
                    
                    <!-- Seção de Formato -->
                    <div class="form-section">
                        <h4>📄 Formato de Impressão</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <label>
                                    <input type="radio" name="formatoImpressao" value="resumido" checked> 
                                    📋 Resumido
                                </label>
                                <small style="display: block; color: #666; margin-left: 20px;">Lista compacta</small>
                            </div>
                            <div>
                                <label>
                                    <input type="radio" name="formatoImpressao" value="detalhado"> 
                                    📖 Detalhado
                                </label>
                                <small style="display: block; color: #666; margin-left: 20px;">Com mais informações</small>
                            </div>
                        </div>
                        <div style="margin-top: 15px;">
                            <label>
                                <input type="checkbox" id="incluirIngredientes" checked> 
                                🥗 Incluir ingredientes (quando aplicável)
                            </label>
                        </div>
                        <div style="margin-top: 10px;">
                            <label>
                                <input type="checkbox" id="agruparPorData" checked> 
                                📅 Agrupar por data
                            </label>
                        </div>
                    </div>
                    
                    <!-- Rodapé -->
                    <div class="modal-footer" style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e9ecef; display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" onclick="SistemaImpressao.fecharModal()">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-info" onclick="SistemaImpressao.visualizarPreview()">
                            👁️ Visualizar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="SistemaImpressao.executarImpressao()">
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.adicionarEstilosCSS();
    }

    adicionarEstilosCSS() {
        const styles = `
            <style id="impressao-styles">
                #${this.modalId} .form-section {
                    margin-bottom: 25px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e9ecef;
                }
                #${this.modalId} .form-section:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                #${this.modalId} .form-section h4 {
                    color: #495057;
                    margin-bottom: 15px;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                #${this.modalId} .checkbox-list {
                    max-height: 150px;
                    overflow-y: auto;
                    border: 1px solid #e9ecef;
                    border-radius: 5px;
                    padding: 10px;
                    background: white;
                }
                #${this.modalId} .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 5px 0;
                }
                #${this.modalId} .checkbox-item input[type="checkbox"] {
                    margin: 0;
                }
                #${this.modalId} .checkbox-item label {
                    margin: 0;
                    cursor: pointer;
                    flex: 1;
                }
                #${this.modalId} .btn-sm {
                    padding: 6px 12px;
                    font-size: 12px;
                    margin-right: 8px;
                }
            </style>
        `;
        
        if (!document.getElementById('impressao-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }

    atualizarCabecalhoModal(titulo, subtitulo) {
        const tituloEl = document.getElementById('modal-titulo');
        const subtituloEl = document.getElementById('modal-subtitulo');
        
        if (tituloEl) tituloEl.innerHTML = `🖨️ ${titulo} <span class="close" onclick="SistemaImpressao.fecharModal()" style="margin-left: auto; cursor: pointer; font-size: 28px; font-weight: bold;">&times;</span>`;
        if (subtituloEl) subtituloEl.textContent = subtitulo;
    }

    toggleSecao(secaoId, mostrar) {
        const secao = document.getElementById(secaoId);
        if (secao) {
            secao.style.display = mostrar ? 'block' : 'none';
        }
    }

    carregarClientesLista() {
        const container = document.getElementById('lista-clientes');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.clientesCarregados.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Nenhum cliente encontrado</p>';
            return;
        }
        
        this.clientesCarregados.forEach((cliente, index) => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="cliente-imp-${index}" value="${cliente.id || cliente.codigo}" checked>
                <label for="cliente-imp-${index}">${cliente.codigo} - ${cliente.descricao}</label>
            `;
            container.appendChild(div);
        });
    }

    carregarTiposRefeicaoLista() {
        const container = document.getElementById('lista-tipos');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.tiposRefeicaoCarregados.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">Nenhum tipo encontrado</p>';
            return;
        }
        
        this.tiposRefeicaoCarregados.forEach((tipo, index) => {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="tipo-imp-${index}" value="${tipo.id || tipo.codigo}" checked>
                <label for="tipo-imp-${index}">${tipo.codigo} - ${tipo.descricao}</label>
            `;
            container.appendChild(div);
        });
    }

    configurarDataPadrao() {
        const hoje = new Date().toISOString().split('T')[0];
        const dataInicio = document.getElementById('dataInicioImpressao');
        const dataFim = document.getElementById('dataFimImpressao');
        
        if (dataInicio) dataInicio.value = hoje;
        if (dataFim) dataFim.value = hoje;
    }

    mostrarModal() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    // ===== MÉTODOS ESTÁTICOS (PARA USAR NO HTML) =====

    static fecharModal() {
        const modal = document.getElementById('modalImpressao');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    static toggleLista(tipo) {
        const containers = {
            'clientes': 'lista-clientes-container',
            'tipos': 'lista-tipos-container'
        };
        
        const radioName = tipo === 'clientes' ? 'filtroCliente' : 'filtroTipoRefeicao';
        const filtro = document.querySelector(`input[name="${radioName}"]:checked`)?.value;
        const container = document.getElementById(containers[tipo]);
        
        if (container) {
            container.style.display = filtro === 'especificos' ? 'block' : 'none';
        }
    }

    static definirPeriodo(tipo) {
        const hoje = new Date();
        let dataInicio, dataFim;
        
        switch (tipo) {
            case 'hoje':
                dataInicio = dataFim = hoje;
                break;
            case 'semana':
                dataInicio = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
                dataFim = new Date(hoje.setDate(hoje.getDate() - hoje.getDay() + 6));
                break;
            case 'mes':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                break;
        }
        
        document.getElementById('dataInicioImpressao').value = dataInicio.toISOString().split('T')[0];
        document.getElementById('dataFimImpressao').value = dataFim.toISOString().split('T')[0];
    }

    static selecionarTodos(tipo) {
        const containers = {
            'clientes': '#lista-clientes',
            'tipos': '#lista-tipos',
            'receitas': '#lista-receitas'
        };
        
        const checkboxes = document.querySelectorAll(`${containers[tipo]} input[type="checkbox"]`);
        checkboxes.forEach(checkbox => checkbox.checked = true);
    }

    static desmarcarTodos(tipo) {
        const containers = {
            'clientes': '#lista-clientes',
            'tipos': '#lista-tipos',
            'receitas': '#lista-receitas'
        };
        
        const checkboxes = document.querySelectorAll(`${containers[tipo]} input[type="checkbox"]`);
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }

    static async visualizarPreview() {
        // Esta função será implementada específica para cada tipo de dados
        console.log('👁️ Visualizando preview...');
        alert('Preview será implementado conforme o tipo de dados selecionado');
    }

    static async executarImpressao() {
        // Esta função será implementada específica para cada tipo de dados
        console.log('🖨️ Executando impressão...');
        alert('Impressão será implementada conforme o tipo de dados selecionado');
    }
}

// ===== INSTÂNCIA GLOBAL =====
window.SistemaImpressao = SistemaImpressao;
const impressao = new SistemaImpressao();

// ===== FUNÇÕES ESPECÍFICAS PARA CARDÁPIOS =====
async function abrirModalImpressaoCardapios() {
    // Buscar dados necessários (assumindo que estão disponíveis globalmente)
    const clientes = window.clientesCarregados || [];
    const tipos = window.tiposRefeicaoCarregados || [];
    
    await impressao.abrirModalCardapios(clientes, tipos);
}

// ===== FUNÇÕES ESPECÍFICAS PARA RECEITAS =====
async function abrirModalImpressaoReceitas() {
    const receitas = window.receitasCarregadas || [];
    await impressao.abrirModalReceitas(receitas);
}

// ===== FUNÇÕES ESPECÍFICAS PARA PRODUTOS =====
async function abrirModalImpressaoProdutos() {
    const produtos = window.produtosCarregados || [];
    await impressao.abrirModalProdutos(produtos);
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.abrirModalImpressao = abrirModalImpressaoCardapios; // Compatibilidade
window.abrirModalImpressaoCardapios = abrirModalImpressaoCardapios;
window.abrirModalImpressaoReceitas = abrirModalImpressaoReceitas;
window.abrirModalImpressaoProdutos = abrirModalImpressaoProdutos;

console.log('✅ Sistema de impressão modular carregado!');