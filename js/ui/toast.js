// js/ui/toast.js - Sistema de Notificações Unificado

console.log('🍞 Carregando sistema de toast...');

/**
 * Sistema de notificações toast centralizado
 * Extraído e melhorado do main.js
 */
export class Toast {
    
    // Configurações padrão
    static config = {
        duracao: {
            success: 3000,
            info: 3000, 
            warning: 4000,
            error: 5000
        },
        posicao: 'top-right', // top-right, top-left, bottom-right, bottom-left
        maxToasts: 5,
        animacao: true
    };
    
    // Container de toasts ativos
    static toastsAtivos = new Set();
    
    /**
     * Mostrar notificação toast
     * @param {string} mensagem - Mensagem a ser exibida
     * @param {string} tipo - Tipo da notificação (success, error, warning, info)
     * @param {number} duracao - Duração em ms (opcional)
     * @param {Object} opcoes - Opções adicionais
     */
    static mostrar(mensagem, tipo = 'info', duracao = null, opcoes = {}) {
        try {
            // Limitar número de toasts
            this.limparToastsExcessivos();
            
            // Usar duração padrão se não especificada
            const duracaoFinal = duracao || this.config.duracao[tipo] || this.config.duracao.info;
            
            // Criar elemento toast
            const toast = this.criarElementoToast(mensagem, tipo, opcoes);
            
            // Adicionar ao DOM
            this.adicionarAoDOM(toast);
            
            // Registrar como ativo
            this.toastsAtivos.add(toast);
            
            // Animação de entrada
            if (this.config.animacao) {
                this.animarEntrada(toast);
            }
            
            // Auto-remoção
            if (duracaoFinal > 0) {
                setTimeout(() => {
                    this.remover(toast);
                }, duracaoFinal);
            }
            
            return toast;
            
        } catch (error) {
            console.error('❌ Erro ao mostrar toast:', error);
            // Fallback para alert em caso de erro crítico
            alert(`${this.obterIcone(tipo)} ${mensagem}`);
        }
    }
    
    /**
     * Criar elemento toast
     */
    static criarElementoToast(mensagem, tipo, opcoes) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        
        // Aplicar estilos
        this.aplicarEstilos(toast, tipo);
        
        // Conteúdo do toast
        const icone = this.obterIcone(tipo);
        const tempoExibicao = opcoes.mostrarTempo ? `<small>${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>` : '';
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-header">
                    <span class="toast-icon">${icone}</span>
                    <span class="toast-message">${mensagem}</span>
                    ${opcoes.fecharManual !== false ? '<button class="toast-close" onclick="this.closest(\'.toast\').remove()" title="Fechar">×</button>' : ''}
                </div>
                ${tempoExibicao}
                ${opcoes.progresso ? '<div class="toast-progress"><div class="toast-progress-bar"></div></div>' : ''}
            </div>
        `;
        
        return toast;
    }
    
    /**
     * Aplicar estilos CSS ao toast
     */
    static aplicarEstilos(toast, tipo) {
        const cores = {
            success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
            error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
            warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
            info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' }
        };
        
        const cor = cores[tipo] || cores.info;
        const posicao = this.obterPosicaoCSS();
        
        toast.style.cssText = `
            position: fixed;
            ${posicao}
            z-index: 10000;
            background: ${cor.bg};
            color: ${cor.text};
            border: 1px solid ${cor.border};
            border-left: 4px solid ${cor.border};
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 400px;
            min-width: 300px;
            line-height: 1.4;
            transform: translateX(${this.config.posicao.includes('right') ? '100%' : '-100%'});
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            margin-bottom: 10px;
        `;
        
        // Estilos internos
        const style = document.createElement('style');
        style.textContent = `
            .toast-content {
                padding: 12px 16px;
            }
            
            .toast-header {
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }
            
            .toast-icon {
                font-size: 16px;
                flex-shrink: 0;
                margin-top: 1px;
            }
            
            .toast-message {
                flex: 1;
                word-wrap: break-word;
            }
            
            .toast-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                opacity: 0.7;
                padding: 0;
                margin-left: auto;
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .toast-close:hover {
                opacity: 1;
                background: rgba(0, 0, 0, 0.1);
            }
            
            .toast small {
                display: block;
                opacity: 0.7;
                font-size: 11px;
                margin-top: 4px;
            }
            
            .toast-progress {
                height: 3px;
                background: rgba(0, 0, 0, 0.1);
                margin: 8px -16px -12px;
                border-radius: 0 0 8px 8px;
                overflow: hidden;
            }
            
            .toast-progress-bar {
                height: 100%;
                background: currentColor;
                opacity: 0.7;
                animation: toast-progress-animation var(--duracao, 3s) linear forwards;
            }
            
            @keyframes toast-progress-animation {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .toast:hover .toast-progress-bar {
                animation-play-state: paused;
            }
        `;
        
        if (!document.querySelector('#toast-styles')) {
            style.id = 'toast-styles';
            document.head.appendChild(style);
        }
    }
    
    /**
     * Obter ícone para o tipo de toast
     */
    static obterIcone(tipo) {
        const icones = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icones[tipo] || icones.info;
    }
    
    /**
     * Obter posição CSS baseada na configuração
     */
    static obterPosicaoCSS() {
        const posicoes = {
            'top-right': 'top: 20px; right: 20px;',
            'top-left': 'top: 20px; left: 20px;',
            'bottom-right': 'bottom: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;'
        };
        
        return posicoes[this.config.posicao] || posicoes['top-right'];
    }
    
    /**
     * Adicionar toast ao DOM
     */
    static adicionarAoDOM(toast) {
        // Verificar se existe container de toasts
        let container = document.querySelector('.toast-container');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = `
                position: fixed;
                ${this.obterPosicaoCSS()}
                z-index: 10000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        
        // Permitir interação apenas com o toast
        toast.style.pointerEvents = 'auto';
        
        // Adicionar ao container
        if (this.config.posicao.includes('bottom')) {
            container.prepend(toast);
        } else {
            container.appendChild(toast);
        }
    }
    
    /**
     * Animação de entrada
     */
    static animarEntrada(toast) {
        // Trigger da animação
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
    }
    
    /**
     * Remover toast
     */
    static remover(toast) {
        if (!toast || !toast.parentNode) return;
        
        // Animação de saída
        if (this.config.animacao) {
            toast.style.transform = `translateX(${this.config.posicao.includes('right') ? '100%' : '-100%'})`;
            toast.style.opacity = '0';
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                    this.toastsAtivos.delete(toast);
                }
            }, 300);
        } else {
            toast.remove();
            this.toastsAtivos.delete(toast);
        }
        
        // Remover container se vazio
        this.limparContainerVazio();
    }
    
    /**
     * Limpar toasts excessivos
     */
    static limparToastsExcessivos() {
        if (this.toastsAtivos.size >= this.config.maxToasts) {
            const toastMaisAntigo = Array.from(this.toastsAtivos)[0];
            if (toastMaisAntigo) {
                this.remover(toastMaisAntigo);
            }
        }
    }
    
    /**
     * Limpar container se não há toasts
     */
    static limparContainerVazio() {
        const container = document.querySelector('.toast-container');
        if (container && container.children.length === 0) {
            container.remove();
        }
    }
    
    /**
     * Remover todos os toasts
     */
    static limparTodos() {
        const toasts = Array.from(this.toastsAtivos);
        toasts.forEach(toast => this.remover(toast));
    }
    
    // ===== MÉTODOS DE CONVENIÊNCIA =====
    
    static sucesso(mensagem, duracao = null, opcoes = {}) {
        return this.mostrar(mensagem, 'success', duracao, opcoes);
    }
    
    static erro(mensagem, duracao = null, opcoes = {}) {
        return this.mostrar(mensagem, 'error', duracao, opcoes);
    }
    
    static aviso(mensagem, duracao = null, opcoes = {}) {
        return this.mostrar(mensagem, 'warning', duracao, opcoes);
    }
    
    static info(mensagem, duracao = null, opcoes = {}) {
        return this.mostrar(mensagem, 'info', duracao, opcoes);
    }
    
    /**
     * Toast de carregamento
     */
    static carregando(mensagem = 'Carregando...', opcoes = {}) {
        const opcoesCarregamento = {
            fecharManual: false,
            progresso: false,
            ...opcoes
        };
        
        const toast = this.mostrar(mensagem, 'info', 0, opcoesCarregamento);
        
        // Adicionar spinner
        const icon = toast.querySelector('.toast-icon');
        if (icon) {
            icon.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span>';
        }
        
        // Adicionar CSS para animação do spinner
        if (!document.querySelector('#spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return {
            toast,
            finalizar: (mensagem = 'Concluído!', tipo = 'success') => {
                this.remover(toast);
                return this.mostrar(mensagem, tipo);
            }
        };
    }
    
    /**
     * Configurar sistema de toast
     */
    static configurar(novaConfig) {
        this.config = { ...this.config, ...novaConfig };
    }
}

// ===== COMPATIBILIDADE COM CÓDIGO EXISTENTE =====

// Função global principal (mantém assinatura do main.js)
window.mostrarToast = function(mensagem, tipo = 'info', duracao = null) {
    return Toast.mostrar(mensagem, tipo, duracao);
};

// Aliases adicionais
window.toast = {
    mostrar: (msg, tipo, duracao) => Toast.mostrar(msg, tipo, duracao),
    sucesso: (msg, duracao) => Toast.sucesso(msg, duracao),
    erro: (msg, duracao) => Toast.erro(msg, duracao),
    aviso: (msg, duracao) => Toast.aviso(msg, duracao),
    info: (msg, duracao) => Toast.info(msg, duracao),
    carregando: (msg) => Toast.carregando(msg),
    limpar: () => Toast.limparTodos()
};

// Disponibilizar classe globalmente
window.Toast = Toast;

console.log('✅ Sistema de toast carregado com sucesso!');
console.log('📋 Use: mostrarToast(), Toast.sucesso(), Toast.erro(), Toast.aviso(), Toast.info()');