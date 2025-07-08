// init.js - Inicialização do Sistema Modular
console.log('🚀 Inicializando Sistema Modular...');

// ===== CONFIGURAÇÃO DE INICIALIZAÇÃO =====
const ConfiguracaoSistema = {
    // Ordem de carregamento dos módulos
    ordemCarregamento: ['core', 'clientes', 'cardapios'],
    
    // Dependências externas necessárias
    dependenciasExternas: {
        supabase: () => window.supabase && window.supabase.auth,
        dom: () => document.readyState === 'complete' || document.readyState === 'interactive'
    },
    
    // Configurações de timeout
    timeouts: {
        dependencias: 10000,
        inicializacao: 15000,
        verificacao: 200
    },
    
    // Estado da inicialização
    estado: {
        etapa: 'inicio',
        modulosCarregados: new Set(),
        erros: [],
        inicializado: false
    }
};

// ===== SISTEMA DE INICIALIZAÇÃO =====
class InicializadorSistema {
    constructor() {
        this.config = ConfiguracaoSistema;
        this.callbacks = new Map();
        this.tentativas = 0;
        this.maxTentativas = 50;
    }
    
    // ===== INICIALIZAR SISTEMA COMPLETO =====
    async inicializar() {
        console.log('🔄 Iniciando sistema modular...');
        
        try {
            this.config.estado.etapa = 'verificando_dependencias';
            
            // Aguardar dependências externas
            await this.aguardarDependenciasExternas();
            
            this.config.estado.etapa = 'carregando_core';
            
            // Aguardar sistema central
            await this.aguardarSistemaCentral();
            
            this.config.estado.etapa = 'inicializando_modulos';
            
            // Inicializar módulos na ordem correta
            await this.inicializarModulos();
            
            this.config.estado.etapa = 'configurando_interface';
            
            // Configurar interface final
            this.configurarInterface();
            
            this.config.estado.etapa = 'finalizado';
            this.config.estado.inicializado = true;
            
            console.log('✅ Sistema totalmente inicializado!');
            this.notificarSucesso();
            
        } catch (error) {
            console.error('❌ Erro durante inicialização:', error);
            this.config.estado.erros.push(error);
            this.notificarErro(error);
        }
    }
    
    // ===== AGUARDAR DEPENDÊNCIAS EXTERNAS =====
    aguardarDependenciasExternas() {
        return new Promise((resolve, reject) => {
            const inicio = Date.now();
            
            const verificar = () => {
                const dependenciasOK = Object.entries(this.config.dependenciasExternas)
                    .every(([nome, teste]) => {
                        const ok = teste();
                        if (!ok) {
                            console.log(`⏳ Aguardando dependência: ${nome}`);
                        }
                        return ok;
                    });
                
                if (dependenciasOK) {
                    console.log('✅ Dependências externas carregadas');
                    resolve();
                } else if (Date.now() - inicio > this.config.timeouts.dependencias) {
                    reject(new Error('Timeout aguardando dependências externas'));
                } else {
                    setTimeout(verificar, this.config.timeouts.verificacao);
                }
            };
            
            verificar();
        });
    }
    
    // ===== AGUARDAR SISTEMA CENTRAL =====
    aguardarSistemaCentral() {
        return new Promise((resolve, reject) => {
            const inicio = Date.now();
            
            const verificar = () => {
                if (window.SistemaRestaurante && window.SistemaRestaurante.registrarModulo) {
                    console.log('✅ Sistema central disponível');
                    resolve();
                } else if (Date.now() - inicio > this.config.timeouts.dependencias) {
                    reject(new Error('Timeout aguardando sistema central'));
                } else {
                    setTimeout(verificar, this.config.timeouts.verificacao);
                }
            };
            
            verificar();
        });
    }
    
    // ===== INICIALIZAR MÓDULOS =====
    async inicializarModulos() {
        console.log('🔧 Inicializando módulos...');
        
        for (const nomeModulo of this.config.ordemCarregamento) {
            await this.inicializarModulo(nomeModulo);
        }
    }
    
    // ===== INICIALIZAR MÓDULO ESPECÍFICO =====
    async inicializarModulo(nomeModulo) {
        try {
            console.log(`🔄 Inicializando módulo: ${nomeModulo}`);
            
            // Aguardar módulo estar disponível
            await this.aguardarModuloDisponivel(nomeModulo);
            
            // Obter módulo do sistema
            const modulo = window.SistemaRestaurante.obterModulo(nomeModulo);
            
            if (!modulo) {
                throw new Error(`Módulo ${nomeModulo} não encontrado`);
            }
            
            // Inicializar módulo
            if (typeof modulo.inicializar === 'function') {
                const sucesso = await modulo.inicializar();
                
                if (sucesso) {
                    this.config.estado.modulosCarregados.add(nomeModulo);
                    console.log(`✅ Módulo ${nomeModulo} inicializado`);
                } else {
                    throw new Error(`Falha na inicialização do módulo ${nomeModulo}`);
                }
            } else {
                console.warn(`⚠️ Módulo ${nomeModulo} não tem função inicializar`);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar módulo ${nomeModulo}:`, error);
            this.config.estado.erros.push(error);
            // Não parar a inicialização por causa de um módulo
        }
    }
    
    // ===== AGUARDAR MÓDULO DISPONÍVEL =====
    aguardarModuloDisponivel(nomeModulo) {
        return new Promise((resolve, reject) => {
            const inicio = Date.now();
            
            const verificar = () => {
                let moduloDisponivel = false;
                
                // Verificar se módulo está registrado
                if (window.SistemaRestaurante && window.SistemaRestaurante.modulos) {
                    moduloDisponivel = window.SistemaRestaurante.modulos.has(nomeModulo);
                }
                
                if (moduloDisponivel) {
                    resolve();
                } else if (Date.now() - inicio > this.config.timeouts.dependencias) {
                    reject(new Error(`Timeout aguardando módulo ${nomeModulo}`));
                } else {
                    setTimeout(verificar, this.config.timeouts.verificacao);
                }
            };
            
            verificar();
        });
    }
    
    // ===== CONFIGURAR INTERFACE =====
    configurarInterface() {
        console.log('🎨 Configurando interface final...');
        
        // Configurar eventos globais
        this.configurarEventosGlobais();
        
        // Verificar elementos da interface
        this.verificarElementosInterface();
        
        // Configurar observadores de mudança de aba
        this.configurarObservadorAbas();
    }
    
    // ===== CONFIGURAR EVENTOS GLOBAIS =====
    configurarEventosGlobais() {
        // Evento de mudança de aba
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                const tabId = e.target.getAttribute('data-tab');
                if (tabId) {
                    this.ativarAba(tabId);
                }
            }
        });
        
        // Evento de fechamento de modal
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Evento ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modais = document.querySelectorAll('.modal');
                modais.forEach(modal => {
                    if (modal.style.display === 'block') {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }
    
    // ===== VERIFICAR ELEMENTOS DA INTERFACE =====
    verificarElementosInterface() {
        const elementosEssenciais = [
            'clienteCardapio',
            'dataCardapio',
            'tiposRefeicaoCardapio',
            'clientes-tbody',
            'busca-clientes'
        ];
        
        const elementosFaltando = elementosEssenciais.filter(id => !document.getElementById(id));
        
        if (elementosFaltando.length > 0) {
            console.warn('⚠️ Elementos da interface faltando:', elementosFaltando);
        } else {
            console.log('✅ Todos os elementos da interface encontrados');
        }
    }
    
    // ===== CONFIGURAR OBSERVADOR DE ABAS =====
    configurarObservadorAbas() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    
                    // Verificar se aba de cardápio foi ativada
                    if (target.id === 'cardapio' && !target.classList.contains('hidden')) {
                        this.ativarModuloCardapio();
                    }
                    
                    // Verificar se aba de clientes foi ativada
                    if (target.id === 'clientes' && !target.classList.contains('hidden')) {
                        this.ativarModuloClientes();
                    }
                }
            });
        });
        
        // Observar mudanças nas abas
        const abas = document.querySelectorAll('.tab-content');
        abas.forEach(aba => {
            observer.observe(aba, { attributes: true });
        });
    }
    
    // ===== ATIVAR ABA =====
    ativarAba(tabId) {
        console.log(`🔄 Ativando aba: ${tabId}`);
        
        // Esconder todas as abas
        const todasAbas = document.querySelectorAll('.tab-content');
        todasAbas.forEach(aba => {
            aba.classList.add('hidden');
        });
        
        // Mostrar aba selecionada
        const abaSelecionada = document.getElementById(tabId);
        if (abaSelecionada) {
            abaSelecionada.classList.remove('hidden');
        }
        
        // Ativar módulo correspondente
        setTimeout(() => {
            if (tabId === 'cardapio') {
                this.ativarModuloCardapio();
            } else if (tabId === 'clientes') {
                this.ativarModuloClientes();
            }
        }, 100);
    }
    
    // ===== ATIVAR MÓDULO CARDÁPIO =====
    ativarModuloCardapio() {
        const modulo = window.SistemaRestaurante?.obterModulo('cardapios');
        if (modulo && !modulo.estado.inicializado) {
            console.log('🔄 Ativando módulo cardápio...');
            modulo.inicializar();
        }
    }
    
    // ===== ATIVAR MÓDULO CLIENTES =====
    ativarModuloClientes() {
        const modulo = window.SistemaRestaurante?.obterModulo('clientes');
        if (modulo && !modulo.estado.inicializado) {
            console.log('🔄 Ativando módulo clientes...');
            modulo.inicializar();
        }
    }
    
    // ===== NOTIFICAÇÕES =====
    notificarSucesso() {
        const mensagem = '✅ Sistema carregado com sucesso!';
        
        if (window.SistemaRestaurante) {
            window.SistemaRestaurante.toast(mensagem, 'success', 3000);
        }
        
        // Disparar evento customizado
        document.dispatchEvent(new CustomEvent('sistema:inicializado', {
            detail: {
                modulosCarregados: Array.from(this.config.estado.modulosCarregados),
                tempo: Date.now()
            }
        }));
    }
    
    notificarErro(error) {
        const mensagem = `❌ Erro na inicialização: ${error.message}`;
        
        if (window.SistemaRestaurante) {
            window.SistemaRestaurante.toast(mensagem, 'error', 5000);
        }
        
        // Disparar evento de erro
        document.dispatchEvent(new CustomEvent('sistema:erro', {
            detail: {
                erro: error,
                etapa: this.config.estado.etapa
            }
        }));
    }
    
    // ===== DEBUG =====
    debug() {
        console.log('🔍 === DEBUG INICIALIZADOR ===');
        console.log('Estado:', this.config.estado);
        console.log('Módulos carregados:', Array.from(this.config.estado.modulosCarregados));
        console.log('Erros:', this.config.estado.erros);
        
        if (window.SistemaRestaurante) {
            console.log('Sistema central:', window.SistemaRestaurante.estado);
            console.log('Módulos registrados:', Array.from(window.SistemaRestaurante.modulos.keys()));
        }
        
        console.log('============================');
    }
}

// ===== INSTÂNCIA GLOBAL =====
const inicializador = new InicializadorSistema();
window.InicializadorSistema = inicializador;

// ===== FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL =====
async function inicializarSistemaCompleto() {
    console.log('🚀 Iniciando sistema completo...');
    
    try {
        await inicializador.inicializar();
        
        // Configurar debug global
        window.debugSistema = () => {
            inicializador.debug();
            if (window.SistemaRestaurante) {
                window.SistemaRestaurante.debug();
            }
        };
        
        console.log('✅ Sistema completo inicializado!');
        
    } catch (error) {
        console.error('❌ Falha crítica na inicialização:', error);
        
        // Tentar inicialização de emergência
        console.log('🚨 Tentando inicialização de emergência...');
        setTimeout(() => {
            try {
                // Inicializar módulos diretamente se disponíveis
                if (window.ModuloClientes) {
                    window.ModuloClientes.inicializar();
                }
                if (window.ModuloCardapios) {
                    window.ModuloCardapios.inicializar();
                }
                
                console.log('⚠️ Inicialização de emergência concluída');
                
            } catch (emergencyError) {
                console.error('❌ Falha na inicialização de emergência:', emergencyError);
            }
        }, 2000);
    }
}

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(inicializarSistemaCompleto, 500);
    });
} else {
    setTimeout(inicializarSistemaCompleto, 500);
}

// ===== EXPORTAR PARA COMPATIBILIDADE =====
window.inicializarSistemaCompleto = inicializarSistemaCompleto;

console.log('✅ Inicializador carregado - aguardando DOM...');