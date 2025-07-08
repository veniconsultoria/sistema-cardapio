// core.js - Sistema Central de Gerenciamento de Módulos
console.log('🚀 Carregando core.js - Sistema Central...');

// ===== NAMESPACE GLOBAL PROTEGIDO =====
if (!window.SistemaRestaurante) {
    window.SistemaRestaurante = {
        // Estado global compartilhado
        estado: {
            usuarioAtual: null,
            supabaseConectado: false,
            modulosInicializados: new Set(),
            dependencias: new Map()
        },
        
        // Módulos registrados
        modulos: new Map(),
        
        // Dados compartilhados (cache)
        cache: {
            clientes: [],
            receitas: [],
            tiposRefeicao: [],
            cardapios: {},
            ultimaAtualizacao: null
        },
        
        // Eventos do sistema
        eventos: new Map(),
        
        // Configurações
        config: {
            debug: true,
            timeoutDependencias: 10000,
            intervaloVerificacao: 200
        }
    };
}

const Sistema = window.SistemaRestaurante;

// ===== SISTEMA DE EVENTOS =====
Sistema.on = function(evento, callback) {
    if (!this.eventos.has(evento)) {
        this.eventos.set(evento, new Set());
    }
    this.eventos.get(evento).add(callback);
    
    if (this.config.debug) {
        console.log(`📡 Evento registrado: ${evento}`);
    }
};

Sistema.off = function(evento, callback) {
    if (this.eventos.has(evento)) {
        this.eventos.get(evento).delete(callback);
    }
};

Sistema.emit = function(evento, dados) {
    if (this.config.debug) {
        console.log(`🚀 Emitindo evento: ${evento}`, dados);
    }
    
    if (this.eventos.has(evento)) {
        this.eventos.get(evento).forEach(callback => {
            try {
                callback(dados);
            } catch (error) {
                console.error(`❌ Erro no callback do evento ${evento}:`, error);
            }
        });
    }
};

// ===== SISTEMA DE MÓDULOS =====
Sistema.registrarModulo = function(nome, modulo) {
    if (this.modulos.has(nome)) {
        console.warn(`⚠️ Módulo ${nome} já registrado, sobrescrevendo...`);
    }
    
    this.modulos.set(nome, {
        nome,
        modulo,
        inicializado: false,
        dependencias: modulo.dependencias || [],
        versao: modulo.versao || '1.0.0'
    });
    
    console.log(`✅ Módulo ${nome} registrado (v${modulo.versao || '1.0.0'})`);
    
    // Tentar inicializar automaticamente
    setTimeout(() => {
        this.inicializarModulo(nome);
    }, 100);
};

Sistema.inicializarModulo = function(nome) {
    const moduloInfo = this.modulos.get(nome);
    if (!moduloInfo) {
        console.error(`❌ Módulo ${nome} não encontrado`);
        return false;
    }
    
    if (moduloInfo.inicializado) {
        console.log(`⚠️ Módulo ${nome} já inicializado`);
        return true;
    }
    
    // Verificar dependências
    if (!this.verificarDependencias(moduloInfo.dependencias)) {
        console.log(`⏳ Aguardando dependências para ${nome}...`);
        setTimeout(() => {
            this.inicializarModulo(nome);
        }, this.config.intervaloVerificacao);
        return false;
    }
    
    try {
        console.log(`🚀 Inicializando módulo ${nome}...`);
        
        if (typeof moduloInfo.modulo.inicializar === 'function') {
            moduloInfo.modulo.inicializar();
        }
        
        moduloInfo.inicializado = true;
        this.estado.modulosInicializados.add(nome);
        
        console.log(`✅ Módulo ${nome} inicializado com sucesso`);
        this.emit('modulo:inicializado', { nome, modulo: moduloInfo.modulo });
        
        return true;
        
    } catch (error) {
        console.error(`❌ Erro ao inicializar módulo ${nome}:`, error);
        return false;
    }
};

Sistema.verificarDependencias = function(dependencias) {
    return dependencias.every(dep => {
        if (dep === 'supabase') {
            return window.supabase && window.supabase.auth;
        }
        if (dep === 'dom') {
            return document.readyState === 'complete' || document.readyState === 'interactive';
        }
        return this.estado.modulosInicializados.has(dep);
    });
};

Sistema.obterModulo = function(nome) {
    const moduloInfo = this.modulos.get(nome);
    return moduloInfo ? moduloInfo.modulo : null;
};

// ===== SISTEMA DE CACHE =====
Sistema.atualizarCache = function(tipo, dados) {
    this.cache[tipo] = dados;
    this.cache.ultimaAtualizacao = new Date();
    
    if (this.config.debug) {
        console.log(`📝 Cache atualizado: ${tipo}`, dados);
    }
    
    this.emit('cache:atualizado', { tipo, dados });
};

Sistema.obterCache = function(tipo) {
    return this.cache[tipo];
};

Sistema.limparCache = function(tipo) {
    if (tipo) {
        delete this.cache[tipo];
    } else {
        this.cache = {
            clientes: [],
            receitas: [],
            tiposRefeicao: [],
            cardapios: {},
            ultimaAtualizacao: null
        };
    }
    
    this.emit('cache:limpo', { tipo });
};

// ===== SISTEMA DE AUTENTICAÇÃO =====
Sistema.configurarAutenticacao = async function() {
    if (!window.supabase) {
        console.error('❌ Supabase não disponível');
        return false;
    }
    
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (user) {
            this.estado.usuarioAtual = user;
            this.estado.supabaseConectado = true;
            
            console.log('✅ Usuário autenticado:', user.email);
            this.emit('auth:conectado', { user });
            
            return true;
        } else {
            console.log('⚠️ Usuário não autenticado');
            this.emit('auth:desconectado');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        return false;
    }
};

// ===== FUNÇÕES DE UTILIDADE =====
Sistema.aguardarCondicao = function(condicao, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const inicio = Date.now();
        
        const verificar = () => {
            if (condicao()) {
                resolve(true);
            } else if (Date.now() - inicio > timeout) {
                reject(new Error('Timeout aguardando condição'));
            } else {
                setTimeout(verificar, this.config.intervaloVerificacao);
            }
        };
        
        verificar();
    });
};

Sistema.toast = function(mensagem, tipo = 'info', duracao = 3000) {
    // Usar toast global se disponível
    if (window.mostrarToast && typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensagem, tipo, duracao);
        return;
    }
    
    // Toast simples como fallback
    console.log(`Toast ${tipo}: ${mensagem}`);
    
    // Criar toast visual se necessário
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#0c5460'};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        max-width: 400px;
    `;
    
    const icones = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `${icones[tipo] || icones.info} ${mensagem}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duracao);
};

Sistema.debug = function() {
    console.log('🔍 === DEBUG SISTEMA ===');
    console.log('Estado:', this.estado);
    console.log('Módulos:', Array.from(this.modulos.keys()));
    console.log('Cache:', this.cache);
    console.log('Eventos:', Array.from(this.eventos.keys()));
    console.log('========================');
};

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
Sistema.inicializar = async function() {
    console.log('🚀 Inicializando Sistema Central...');
    
    try {
        // Aguardar DOM
        await this.aguardarCondicao(() => 
            document.readyState === 'complete' || document.readyState === 'interactive'
        );
        
        // Configurar autenticação
        await this.configurarAutenticacao();
        
        // Inicializar módulos registrados
        for (const [nome] of this.modulos) {
            this.inicializarModulo(nome);
        }
        
        console.log('✅ Sistema Central inicializado');
        this.emit('sistema:inicializado');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
    }
};

// ===== AUTO-INICIALIZAÇÃO =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => Sistema.inicializar(), 100);
    });
} else {
    setTimeout(() => Sistema.inicializar(), 100);
}

// ===== EXPORTAR PARA COMPATIBILIDADE =====
window.SistemaCore = Sistema;

console.log('✅ Core.js carregado - Sistema Central disponível');