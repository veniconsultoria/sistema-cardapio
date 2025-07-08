// js/sistema-integracao.js - Ponte entre sistema antigo e novo sistema modular (CORRIGIDO)

console.log('🔗 Carregando sistema de integração CORRIGIDO...');

// ===== SISTEMA DE INTEGRAÇÃO CORRIGIDO =====
window.SistemaIntegracao = {
    aguardandoInicializacao: new Set(),
    tentativasMaximas: 30, // Reduzido para evitar loops longos
    intervaloTentativa: 300,
    
    // ===== AGUARDAR SISTEMA ESTAR PRONTO =====
    aguardarSistema: function(callback, modulo = null) {
        const chaveEspera = modulo || 'geral';
        
        if (this.aguardandoInicializacao.has(chaveEspera)) {
            console.log(`⏳ Já aguardando inicialização: ${chaveEspera}`);
            return;
        }
        
        this.aguardandoInicializacao.add(chaveEspera);
        
        let tentativas = 0;
        
        const verificar = () => {
            tentativas++;
            
            let sistemaOK = false;
            
            if (modulo === 'clientes') {
                // ✅ CORREÇÃO: Verificar se as funções de clientes existem
                sistemaOK = (typeof window.inicializarClientes === 'function') ||
                           (window.ClientesSistema && typeof window.ClientesSistema !== 'undefined');
            } else if (modulo === 'cardapios') {
                // ✅ CORREÇÃO: Verificar se ModuloCardapios existe
                sistemaOK = window.ModuloCardapios && 
                           typeof window.ModuloCardapios.inicializar === 'function';
            } else if (modulo === 'receitas') {
                // ✅ CORREÇÃO: Verificar se ModuloReceitas existe
                sistemaOK = window.ModuloReceitas && 
                           typeof window.ModuloReceitas.inicializar === 'function';
            } else {
                // ✅ CORREÇÃO: Verificação geral mais flexível
                sistemaOK = window.supabase && 
                           window.supabase.auth &&
                           (typeof window.inicializarClientes === 'function' || window.ClientesSistema);
            }
            
            if (sistemaOK) {
                console.log(`✅ Sistema pronto: ${chaveEspera}`);
                this.aguardandoInicializacao.delete(chaveEspera);
                
                try {
                    callback();
                } catch (error) {
                    console.error(`❌ Erro no callback ${chaveEspera}:`, error);
                }
            } else if (tentativas < this.tentativasMaximas) {
                setTimeout(verificar, this.intervaloTentativa);
            } else {
                console.warn(`⚠️ Timeout aguardando sistema: ${chaveEspera} (tentativas: ${tentativas})`);
                this.aguardandoInicializacao.delete(chaveEspera);
                
                // ✅ CORREÇÃO: Tentar callback mesmo assim, mas sem forçar erro
                try {
                    console.log(`🚨 Executando callback de emergência para: ${chaveEspera}`);
                    callback();
                } catch (error) {
                    console.warn(`⚠️ Callback de emergência falhou ${chaveEspera}:`, error);
                }
            }
        };
        
        verificar();
    },
    
    // ===== GARANTIR FUNÇÃO CLIENTES =====
    garantirFuncaoClientes: function() {
        console.log('🔧 Garantindo função inicializarClientes...');
        
        // ✅ CORREÇÃO: Verificar se já existe
        if (typeof window.inicializarClientes === 'function') {
            console.log('✅ inicializarClientes já existe');
            return;
        }
        
        this.aguardarSistema(() => {
            // ✅ CORREÇÃO: Usar ClientesSistema se ModuloClientes não existir
            if (window.ClientesSistema) {
                window.inicializarClientes = function() {
                    console.log('🔄 inicializarClientes() chamada - usando ClientesSistema...');
                    return window.inicializarClientes(); // Função já existe no clientes-simplificado.js
                };
                
                window.recarregarClientes = function() {
                    return window.recarregarClientes(); // Função já existe
                };
                
                console.log('✅ Funções de clientes disponibilizadas (ClientesSistema)');
                
            } else if (window.ModuloClientes) {
                window.inicializarClientes = function() {
                    console.log('🔄 inicializarClientes() chamada - redirecionando para ModuloClientes...');
                    return window.ModuloClientes.inicializar();
                };
                
                window.recarregarClientes = function() {
                    return window.ModuloClientes.carregar();
                };
                
                console.log('✅ Funções de clientes disponibilizadas (ModuloClientes)');
                
            } else {
                console.warn('⚠️ Nenhum sistema de clientes encontrado');
                
                // ✅ FALLBACK: Criar função vazia para evitar erros
                window.inicializarClientes = function() {
                    console.warn('⚠️ Sistema de clientes não disponível');
                };
            }
            
            // ✅ Se a aba de clientes está ativa, tentar inicializar
            const abaClientes = document.getElementById('clientes');
            if (abaClientes && !abaClientes.classList.contains('hidden')) {
                console.log('🎯 Aba clientes ativa - tentando inicializar...');
                setTimeout(() => {
                    if (typeof window.inicializarClientes === 'function') {
                        window.inicializarClientes();
                    }
                }, 500);
            }
        }, 'clientes');
    },
    
    // ===== GARANTIR FUNÇÃO CARDÁPIOS =====
    garantirFuncaoCardapios: function() {
        console.log('🔧 Garantindo função inicializarCardapio...');
        
        // ✅ CORREÇÃO: Verificar se já existe
        if (typeof window.inicializarCardapio === 'function') {
            console.log('✅ inicializarCardapio já existe');
            return;
        }
        
        this.aguardarSistema(() => {
            if (window.ModuloCardapios) {
                window.inicializarCardapio = function() {
                    console.log('🔄 inicializarCardapio() chamada - redirecionando para módulo...');
                    return window.ModuloCardapios.inicializar();
                };
                
                window.carregarCardapioData = function() {
                    return window.ModuloCardapios.alterarData();
                };
                
                window.carregarTiposRefeicaoCliente = function() {
                    return window.ModuloCardapios.selecionarCliente();
                };
                
                console.log('✅ Funções de cardápios disponibilizadas');
                
                // Se a aba de cardápio está ativa, inicializar
                const abaCardapio = document.getElementById('cardapio');
                if (abaCardapio && !abaCardapio.classList.contains('hidden')) {
                    console.log('🎯 Aba cardápio ativa - inicializando...');
                    setTimeout(() => {
                        window.ModuloCardapios.inicializar();
                    }, 500);
                }
            } else {
                console.warn('⚠️ ModuloCardapios não encontrado');
                
                // ✅ FALLBACK: Criar função vazia
                window.inicializarCardapio = function() {
                    console.warn('⚠️ Sistema de cardápios não disponível');
                };
            }
        }, 'cardapios');
    },
    
    // ===== GARANTIR FUNÇÃO RECEITAS =====
    garantirFuncaoReceitas: function() {
        console.log('🔧 Garantindo função inicializarReceitas...');
        
        // ✅ CORREÇÃO: Verificar se já existe
        if (typeof window.inicializarReceitas === 'function') {
            console.log('✅ inicializarReceitas já existe');
            return;
        }
        
        this.aguardarSistema(() => {
            if (window.ModuloReceitas) {
                window.inicializarReceitas = function() {
                    console.log('🔄 inicializarReceitas() chamada - redirecionando para módulo...');
                    return window.ModuloReceitas.inicializar();
                };
                
                console.log('✅ Funções de receitas disponibilizadas');
                
                // Se a aba de receitas está ativa, inicializar
                const abaReceitas = document.getElementById('receitas');
                if (abaReceitas && !abaReceitas.classList.contains('hidden')) {
                    console.log('🎯 Aba receitas ativa - inicializando...');
                    setTimeout(() => {
                        window.ModuloReceitas.inicializar();
                    }, 500);
                }
            } else {
                console.warn('⚠️ ModuloReceitas não encontrado');
                
                // ✅ FALLBACK: Criar função vazia
                window.inicializarReceitas = function() {
                    console.warn('⚠️ Sistema de receitas não disponível');
                };
            }
        }, 'receitas');
    },
    
    // ===== CONFIGURAR COMPATIBILIDADE COMPLETA =====
    configurarCompatibilidade: function() {
        console.log('🔧 Configurando compatibilidade com sistema antigo...');
        
        // ✅ CORREÇÃO: Aguardar sistema mais flexível
        this.aguardarSistema(() => {
            console.log('🔗 Configurando ponte de compatibilidade...');
            
            // ===== FUNÇÕES GLOBAIS DE CLIENTES =====
            if (!window.abrirModalNovoCliente) {
                window.abrirModalNovoCliente = function() {
                    if (typeof window.abrirModalNovoCliente !== 'undefined') {
                        return window.abrirModalNovoCliente(); // Já existe no clientes-simplificado
                    } else if (window.ModuloClientes) {
                        return window.ModuloClientes.abrirModalNovo();
                    }
                    console.warn('⚠️ Função abrirModalNovoCliente não disponível');
                };
            }
            
            if (!window.salvarCliente) {
                window.salvarCliente = function() {
                    if (typeof window.salvarCliente !== 'undefined') {
                        return window.salvarCliente(); // Já existe
                    } else if (window.ModuloClientes) {
                        return window.ModuloClientes.salvar();
                    }
                    console.warn('⚠️ Função salvarCliente não disponível');
                };
            }
            
            // ===== FUNÇÕES GLOBAIS DE CARDÁPIOS =====
            if (!window.executarAtualizacaoECalculoFinal) {
                window.executarAtualizacaoECalculoFinal = function(tipoCodigo) {
                    if (window.ModuloCardapios) {
                        return window.ModuloCardapios.atualizarCalcular(tipoCodigo);
                    }
                    console.warn('⚠️ ModuloCardapios não disponível');
                };
            }
            
            if (!window.abrirModalReceitasTipo) {
                window.abrirModalReceitasTipo = function(tipoCodigo) {
                    if (window.ModuloCardapios) {
                        return window.ModuloCardapios.abrirModalReceitas(tipoCodigo);
                    }
                    console.warn('⚠️ ModuloCardapios não disponível');
                };
            }
            
            if (!window.removerReceita) {
                window.removerReceita = function(tipoCodigo, receitaId) {
                    if (window.ModuloCardapios) {
                        return window.ModuloCardapios.removerReceita(tipoCodigo, receitaId);
                    }
                    console.warn('⚠️ ModuloCardapios não disponível');
                };
            }
            
            if (!window.gravarParaTodos) {
                window.gravarParaTodos = function() {
                    if (window.ModuloCardapios) {
                        return window.ModuloCardapios.gravarCardapio();
                    }
                    console.warn('⚠️ ModuloCardapios não disponível');
                };
            }
            
            // ===== FUNÇÕES GLOBAIS DE RECEITAS =====
            if (!window.editarReceitaModulo) {
                window.editarReceitaModulo = function(index) {
                    if (window.ModuloReceitas) {
                        return window.ModuloReceitas.editar(index);
                    }
                    console.warn('⚠️ ModuloReceitas não disponível');
                };
            }
            
            if (!window.excluirReceitaModulo) {
                window.excluirReceitaModulo = function(index) {
                    if (window.ModuloReceitas) {
                        return window.ModuloReceitas.excluir(index);
                    }
                    console.warn('⚠️ ModuloReceitas não disponível');
                };
            }
            
            if (!window.abrirModalIngredientes) {
                window.abrirModalIngredientes = function() {
                    if (window.ModuloReceitas) {
                        return window.ModuloReceitas.abrirModalIngredientes();
                    }
                    console.warn('⚠️ ModuloReceitas não disponível');
                };
            }
            
            if (!window.calcularReceita) {
                window.calcularReceita = function() {
                    if (window.ModuloReceitas) {
                        return window.ModuloReceitas.calcular();
                    }
                    console.warn('⚠️ ModuloReceitas não disponível');
                };
            }
            
            // ===== FUNÇÕES GLOBAIS GENÉRICAS =====
            if (!window.fecharModal) {
                window.fecharModal = function(modalId) {
                    const modal = document.getElementById(modalId);
                    if (modal) {
                        modal.style.display = 'none';
                    }
                };
            }
            
            if (!window.toggleExpandable) {
                window.toggleExpandable = function(header) {
                    if (window.ModuloCardapios) {
                        return window.ModuloCardapios.toggleExpandable(header);
                    } else {
                        // Fallback simples
                        const content = header.nextElementSibling;
                        const arrow = header.querySelector('span:last-child');
                        
                        if (content && content.classList.contains('active')) {
                            content.classList.remove('active');
                            if (arrow) arrow.textContent = '▼';
                        } else if (content) {
                            content.classList.add('active');
                            if (arrow) arrow.textContent = '▲';
                        }
                    }
                };
            }
            
            // ===== VARIÁVEIS DE COMPATIBILIDADE =====
            if (!window.cardapiosCarregados) {
                Object.defineProperty(window, 'cardapiosCarregados', {
                    get: function() {
                        return window.ModuloCardapios?.estado?.cardapios || {};
                    }
                });
            }
            
            if (!window.clienteAtualCardapio) {
                Object.defineProperty(window, 'clienteAtualCardapio', {
                    get: function() {
                        return window.ModuloCardapios?.estado?.clienteAtual || null;
                    }
                });
            }
            
            if (!window.dataAtualCardapio) {
                Object.defineProperty(window, 'dataAtualCardapio', {
                    get: function() {
                        return window.ModuloCardapios?.estado?.dataAtual || null;
                    }
                });
            }
            
            console.log('✅ Compatibilidade configurada com sucesso!');
            
        });
    },
    
    // ===== VERIFICAR E CORRIGIR SISTEMA =====
    verificarSistema: function() {
        console.log('🔍 Verificando sistema...');
        
        const status = {
            supabase: !!window.supabase,
            clientes: !!(window.ClientesSistema || window.ModuloClientes),
            cardapios: !!window.ModuloCardapios,
            receitas: !!window.ModuloReceitas,
            funcoes: !!window.inicializarClientes
        };
        
        console.log('📊 Status do sistema:', status);
        
        return status;
    },
    
    // ===== INICIALIZAÇÃO SEGURA =====
    inicializar: function() {
        console.log('🚀 Inicializando sistema de integração...');
        
        // ✅ CORREÇÃO: Evitar loop - verificar se já foi inicializado
        if (this.inicializado) {
            console.log('⚠️ Sistema de integração já foi inicializado');
            return;
        }
        
        this.inicializado = true;
        
        // Configurar imediatamente as funções básicas
        setTimeout(() => {
            this.garantirFuncaoClientes();
        }, 100);
        
        setTimeout(() => {
            this.garantirFuncaoCardapios();
        }, 200);
        
        setTimeout(() => {
            this.garantirFuncaoReceitas();
        }, 300);
        
        setTimeout(() => {
            this.configurarCompatibilidade();
        }, 500);
        
        // ✅ CORREÇÃO: Verificação única em vez de intervalo
        setTimeout(() => {
            const status = this.verificarSistema();
            console.log('📋 Status final do sistema:', status);
            
            if (Object.values(status).filter(s => s).length >= 3) {
                console.log('✅ Sistema suficientemente integrado!');
            } else {
                console.warn('⚠️ Alguns módulos podem não estar disponíveis:', status);
            }
        }, 2000);
        
        console.log('✅ Sistema de integração carregado');
    }
};

// ===== FUNÇÕES IMEDIATAS DE EMERGÊNCIA =====
// ✅ CORREÇÃO: Verificar se já existem antes de criar
if (typeof window.inicializarClientes === 'undefined') {
    window.inicializarClientes = function() {
        console.log('🚨 inicializarClientes chamada antes do sistema estar pronto');
        
        window.SistemaIntegracao.aguardarSistema(() => {
            if (window.ClientesSistema && typeof window.inicializarClientes === 'function') {
                window.inicializarClientes();
            } else if (window.ModuloClientes) {
                window.ModuloClientes.inicializar();
            } else {
                console.warn('⚠️ Sistema de clientes não disponível');
            }
        }, 'clientes');
    };
}

if (typeof window.inicializarCardapio === 'undefined') {
    window.inicializarCardapio = function() {
        console.log('🚨 inicializarCardapio chamada antes do sistema estar pronto');
        
        window.SistemaIntegracao.aguardarSistema(() => {
            if (window.ModuloCardapios) {
                window.ModuloCardapios.inicializar();
            } else {
                console.warn('⚠️ ModuloCardapios não disponível');
            }
        }, 'cardapios');
    };
}

if (typeof window.inicializarReceitas === 'undefined') {
    window.inicializarReceitas = function() {
        console.log('🚨 inicializarReceitas chamada antes do sistema estar pronto');
        
        window.SistemaIntegracao.aguardarSistema(() => {
            if (window.ModuloReceitas) {
                window.ModuloReceitas.inicializar();
            } else {
                console.warn('⚠️ ModuloReceitas não disponível');
            }
        }, 'receitas');
    };
}

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.SistemaIntegracao.inicializar();
        }, 100);
    });
} else {
    setTimeout(() => {
        window.SistemaIntegracao.inicializar();
    }, 100);
}

// ===== OBSERVADOR DE ABAS CORRIGIDO =====
const observadorAbas = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target;
            
            // ✅ CORREÇÃO: Verificação mais robusta
            if (!target.id || target.classList.contains('hidden')) {
                return; // Aba não ativa
            }
            
            // Aba clientes ativada
            if (target.id === 'clientes') {
                console.log('🎯 Aba clientes ativada');
                setTimeout(() => {
                    if (window.ClientesSistema && typeof window.inicializarClientes === 'function') {
                        window.inicializarClientes();
                    } else if (window.ModuloClientes && !window.ModuloClientes.estado.inicializado) {
                        window.ModuloClientes.inicializar();
                    }
                }, 300);
            }
            
            // Aba cardápio ativada
            if (target.id === 'cardapio') {
                console.log('🎯 Aba cardápio ativada');
                setTimeout(() => {
                    if (window.ModuloCardapios && !window.ModuloCardapios.estado.inicializado) {
                        window.ModuloCardapios.inicializar();
                    }
                }, 300);
            }
            
            // Aba receitas ativada
            if (target.id === 'receitas') {
                console.log('🎯 Aba receitas ativada');
                setTimeout(() => {
                    if (window.ModuloReceitas && !window.ModuloReceitas.estado.inicializado) {
                        window.ModuloReceitas.inicializar();
                    }
                }, 300);
            }
        }
    });
});

// Observar mudanças nas abas quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const abas = document.querySelectorAll('.tab-content');
        abas.forEach(aba => {
            observadorAbas.observe(aba, { attributes: true });
        });
        console.log(`👁️ Observer configurado para ${abas.length} abas`);
    }, 500);
});

console.log('✅ Sistema de integração CORRIGIDO carregado - aguardando DOM...');