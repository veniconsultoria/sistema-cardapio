// js/core/utils.js - Módulo de Utilitários Centralizado

console.log('🔧 Carregando módulo de utilitários...');

/**
 * Classe de utilitários centralizados do sistema
 * Extraído do main.js para evitar duplicação de código
 */
export class Utils {
    
    // ===== FORMATAÇÃO DE DATAS =====
    
    /**
     * Formata data ISO para formato brasileiro
     * @param {string} dataISO - Data no formato ISO (YYYY-MM-DD)
     * @returns {string} Data formatada (DD/MM/YYYY)
     */
    static formatarDataBrasil(dataISO) {
        if (!dataISO) return '';
        try {
            const data = new Date(dataISO + 'T00:00:00');
            return data.toLocaleDateString('pt-BR');
        } catch (error) {
            console.warn('Erro ao formatar data:', error);
            return dataISO;
        }
    }
    
    /**
     * Formata data atual para input date
     * @returns {string} Data no formato YYYY-MM-DD
     */
    static obterDataHoje() {
        return new Date().toISOString().split('T')[0];
    }
    
    /**
     * Converte data brasileira para ISO
     * @param {string} dataBrasil - Data no formato DD/MM/YYYY
     * @returns {string} Data no formato ISO
     */
    static converterDataBrasilParaISO(dataBrasil) {
        if (!dataBrasil) return '';
        try {
            const partes = dataBrasil.split('/');
            if (partes.length === 3) {
                return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            }
        } catch (error) {
            console.warn('Erro ao converter data:', error);
        }
        return '';
    }
    
    // ===== FORMATAÇÃO DE NÚMEROS =====
    
    /**
     * Formatar número para exibição brasileira (vírgula como separador decimal)
     * @param {number} numero - Número a ser formatado
     * @param {number} casasDecimais - Número de casas decimais (padrão: 3)
     * @returns {string} Número formatado com vírgula
     */
    static formatarDecimalBrasil(numero, casasDecimais = 3) {
        if (numero === null || numero === undefined || isNaN(numero)) {
            return '0' + ',000'.substring(0, casasDecimais + 1);
        }
        
        const numeroFormatado = parseFloat(numero).toFixed(casasDecimais);
        return numeroFormatado.replace('.', ',');
    }
    
    /**
     * Converter texto brasileiro (vírgula) para número (ponto)
     * @param {string} textoVirgula - Texto com vírgula decimal
     * @returns {number} Número convertido
     */
    static converterVirgulaParaNumero(textoVirgula) {
        if (!textoVirgula || textoVirgula === '') return 0;
        
        const numeroStr = String(textoVirgula).replace(',', '.');
        const numero = parseFloat(numeroStr);
        
        return isNaN(numero) ? 0 : numero;
    }
    
    /**
     * Formatar valor monetário brasileiro
     * @param {number} valor - Valor a ser formatado
     * @returns {string} Valor formatado (R$ 0,00)
     */
    static formatarMoeda(valor) {
        if (valor === null || valor === undefined || isNaN(valor)) {
            return 'R$ 0,00';
        }
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
    
    // ===== VALIDAÇÕES =====
    
    /**
     * Validar email
     * @param {string} email - Email a ser validado
     * @returns {boolean} True se válido
     */
    static validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    /**
     * Validar CPF/CNPJ básico
     * @param {string} documento - CPF ou CNPJ
     * @returns {boolean} True se formato válido
     */
    static validarDocumento(documento) {
        if (!documento) return false;
        
        // Remove caracteres não numéricos
        const nums = documento.replace(/\D/g, '');
        
        // CPF (11 dígitos) ou CNPJ (14 dígitos)
        return nums.length === 11 || nums.length === 14;
    }
    
    /**
     * Validar código de produto/receita/cliente
     * @param {string} codigo - Código a ser validado
     * @returns {boolean} True se válido
     */
    static validarCodigo(codigo) {
        if (!codigo || typeof codigo !== 'string') return false;
        return codigo.trim().length >= 3;
    }
    
    // ===== FORMATAÇÃO DE TEXTO =====
    
    /**
     * Capitalizar primeira letra de cada palavra
     * @param {string} texto - Texto a ser formatado
     * @returns {string} Texto capitalizado
     */
    static capitalizarTexto(texto) {
        if (!texto) return '';
        
        return texto
            .toLowerCase()
            .split(' ')
            .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
            .join(' ');
    }
    
    /**
     * Remover acentos do texto
     * @param {string} texto - Texto com acentos
     * @returns {string} Texto sem acentos
     */
    static removerAcentos(texto) {
        if (!texto) return '';
        
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    /**
     * Gerar slug a partir de texto
     * @param {string} texto - Texto original
     * @returns {string} Slug gerado
     */
    static gerarSlug(texto) {
        if (!texto) return '';
        
        return this.removerAcentos(texto)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    
    // ===== FORMATAÇÃO DE TELEFONE =====
    
    /**
     * Formatar telefone brasileiro
     * @param {string} telefone - Telefone não formatado
     * @returns {string} Telefone formatado
     */
    static formatarTelefone(telefone) {
        if (!telefone) return '';
        
        // Remove tudo que não é número
        let nums = telefone.replace(/\D/g, '');
        
        // Formatar conforme o tamanho
        if (nums.length === 11) {
            // Celular: (11) 99999-9999
            return nums.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (nums.length === 10) {
            // Fixo: (11) 9999-9999
            return nums.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        }
        
        return telefone;
    }
    
    /**
     * Limpar formatação de telefone
     * @param {string} telefone - Telefone formatado
     * @returns {string} Apenas números
     */
    static limparTelefone(telefone) {
        if (!telefone) return '';
        return telefone.replace(/\D/g, '');
    }
    
    // ===== UTILITÁRIOS DE ARRAY E OBJETO =====
    
    /**
     * Agrupar array por propriedade
     * @param {Array} array - Array a ser agrupado
     * @param {string} propriedade - Propriedade para agrupar
     * @returns {Object} Objeto agrupado
     */
    static agruparPor(array, propriedade) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((grupos, item) => {
            const chave = item[propriedade];
            if (!grupos[chave]) {
                grupos[chave] = [];
            }
            grupos[chave].push(item);
            return grupos;
        }, {});
    }
    
    /**
     * Remover duplicatas de array de objetos
     * @param {Array} array - Array com possíveis duplicatas
     * @param {string} propriedade - Propriedade única para comparação
     * @returns {Array} Array sem duplicatas
     */
    static removerDuplicatas(array, propriedade) {
        if (!Array.isArray(array)) return [];
        
        const vistos = new Set();
        return array.filter(item => {
            const valor = item[propriedade];
            if (vistos.has(valor)) {
                return false;
            }
            vistos.add(valor);
            return true;
        });
    }
    
    /**
     * Ordenar array de objetos por propriedade
     * @param {Array} array - Array a ser ordenado
     * @param {string} propriedade - Propriedade para ordenação
     * @param {boolean} crescente - Ordem crescente (default: true)
     * @returns {Array} Array ordenado
     */
    static ordenarPor(array, propriedade, crescente = true) {
        if (!Array.isArray(array)) return [];
        
        return [...array].sort((a, b) => {
            const valA = a[propriedade];
            const valB = b[propriedade];
            
            if (valA < valB) return crescente ? -1 : 1;
            if (valA > valB) return crescente ? 1 : -1;
            return 0;
        });
    }
    
    // ===== UTILITÁRIOS DE DOM =====
    
    /**
     * Verificar se elemento existe
     * @param {string} seletor - Seletor CSS do elemento
     * @returns {boolean} True se elemento existe
     */
    static elementoExiste(seletor) {
        return !!document.querySelector(seletor);
    }
    
    /**
     * Aguardar elemento aparecer no DOM
     * @param {string} seletor - Seletor CSS do elemento
     * @param {number} timeout - Timeout em ms (default: 5000)
     * @returns {Promise<Element>} Promise que resolve com o elemento
     */
    static aguardarElemento(seletor, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const elemento = document.querySelector(seletor);
            
            if (elemento) {
                resolve(elemento);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const elemento = document.querySelector(seletor);
                if (elemento) {
                    observer.disconnect();
                    resolve(elemento);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Timeout
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento ${seletor} não encontrado em ${timeout}ms`));
            }, timeout);
        });
    }
    
    // ===== UTILITÁRIOS DE PERFORMANCE =====
    
    /**
     * Debounce - limita execução de função
     * @param {Function} func - Função a ser executada
     * @param {number} delay - Delay em ms
     * @returns {Function} Função com debounce
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    /**
     * Throttle - limita taxa de execução
     * @param {Function} func - Função a ser executada
     * @param {number} limit - Limite em ms
     * @returns {Function} Função com throttle
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ===== UTILITÁRIOS DE STORAGE =====
    
    /**
     * Salvar no localStorage com tratamento de erro
     * @param {string} chave - Chave do storage
     * @param {any} valor - Valor a ser salvo
     * @returns {boolean} True se salvou com sucesso
     */
    static salvarLocalStorage(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
            return false;
        }
    }
    
    /**
     * Ler do localStorage com tratamento de erro
     * @param {string} chave - Chave do storage
     * @param {any} valorPadrao - Valor padrão se não encontrar
     * @returns {any} Valor encontrado ou padrão
     */
    static lerLocalStorage(chave, valorPadrao = null) {
        try {
            const item = localStorage.getItem(chave);
            return item ? JSON.parse(item) : valorPadrao;
        } catch (error) {
            console.warn('Erro ao ler localStorage:', error);
            return valorPadrao;
        }
    }
    
    // ===== UTILITÁRIOS DE URL =====
    
    /**
     * Obter parâmetros da URL
     * @returns {Object} Objeto com parâmetros da URL
     */
    static obterParametrosURL() {
        const params = new URLSearchParams(window.location.search);
        const resultado = {};
        
        for (const [chave, valor] of params) {
            resultado[chave] = valor;
        }
        
        return resultado;
    }
    
    /**
     * Atualizar parâmetro da URL sem recarregar página
     * @param {string} chave - Chave do parâmetro
     * @param {string} valor - Valor do parâmetro
     */
    static atualizarParametroURL(chave, valor) {
        const url = new URL(window.location);
        url.searchParams.set(chave, valor);
        window.history.replaceState({}, '', url);
    }
    
    // ===== DEBUGGING E LOG =====
    
    /**
     * Log estruturado para debugging
     * @param {string} modulo - Nome do módulo
     * @param {string} acao - Ação executada
     * @param {any} dados - Dados relevantes
     * @param {string} tipo - Tipo do log (info, warn, error)
     */
    static log(modulo, acao, dados = null, tipo = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const emoji = {
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌',
            success: '✅'
        };
        
        const mensagem = `${emoji[tipo] || emoji.info} [${timestamp}] ${modulo} - ${acao}`;
        
        if (dados) {
            console[tipo](mensagem, dados);
        } else {
            console[tipo](mensagem);
        }
    }
}

// ===== COMPATIBILIDADE COM CÓDIGO EXISTENTE =====

// Funções globais para manter compatibilidade
window.formatarDataBrasil = (data) => Utils.formatarDataBrasil(data);
window.formatarDecimalBrasil = (numero, casas) => Utils.formatarDecimalBrasil(numero, casas);
window.converterVirgulaParaNumero = (texto) => Utils.converterVirgulaParaNumero(texto);
window.formatarMoeda = (valor) => Utils.formatarMoeda(valor);
window.validarEmail = (email) => Utils.validarEmail(email);
window.capitalizarTexto = (texto) => Utils.capitalizarTexto(texto);
window.formatarTelefone = (telefone) => Utils.formatarTelefone(telefone);

// Disponibilizar classe globalmente
window.Utils = Utils;

console.log('✅ Módulo de utilitários carregado com sucesso!');
console.log('📋 Funções disponíveis: formatação, validação, DOM, performance, storage e mais');

export { showToast };