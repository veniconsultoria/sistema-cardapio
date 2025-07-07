// calculo.js - Módulo de Cálculo para Cardápios
// Este módulo gerencia todos os cálculos de receitas e comensais

console.log('📊 Carregando módulo de cálculo...');

// ===== VARIÁVEIS GLOBAIS DO MÓDULO =====
let calculoEmAndamento = false;

// ===== FUNÇÃO PRINCIPAL: ATUALIZAR E CALCULAR TIPO =====
/**
 * Função principal que atualiza comensais e calcula automaticamente
 * Esta é a função que o botão "Atualizar e Calcular" deve chamar
 */
function executarAtualizacaoECalculo(tipoCodigo) {
    if (calculoEmAndamento) {
        mostrarToast('Aguarde, cálculo em andamento...', 'warning');
        return;
    }

    console.log(`🔄 [MÓDULO CÁLCULO] Executando atualização e cálculo para tipo: ${tipoCodigo}`);
    calculoEmAndamento = true;

    try {
        // ✅ PASSO 1: Validar campo de comensais
        const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
        if (!comensaisInput) {
            mostrarToast('Campo de comensais não encontrado', 'error');
            return;
        }

        const comensaisGlobal = parseInt(comensaisInput.value || 0);
        if (comensaisGlobal <= 0) {
            mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
            comensaisInput.focus();
            return;
        }

        // ✅ PASSO 2: Verificar se tem receitas para processar
        if (!window.receitasTemporarias || !window.receitasTemporarias[tipoCodigo] || window.receitasTemporarias[tipoCodigo].length === 0) {
            mostrarToast(`ℹ️ Comensais definido para ${comensaisGlobal}. Adicione receitas para aplicar o cálculo.`, 'info');
            return;
        }

        // ✅ PASSO 3: Verificar se há edições manuais e confirmar sobrescrita
        const receitasComEdicao = window.receitasTemporarias[tipoCodigo].filter(r => r.alterada) || [];
        
        if (receitasComEdicao.length > 0) {
            const confirmar = confirm(
                `⚠️ ATENÇÃO!\n\n` +
                `Foram encontradas ${receitasComEdicao.length} receita(s) com valores editados manualmente.\n\n` +
                `Deseja aplicar ${comensaisGlobal} comensais para TODAS as receitas E calcular automaticamente?\n\n` +
                `• SIM = Aplica ${comensaisGlobal} para todas e calcula (sobrescreve edições manuais)\n` +
                `• NÃO = Mantém valores editados individualmente`
            );
            
            if (!confirmar) {
                mostrarToast('ℹ️ Operação cancelada. Valores individuais mantidos.', 'info');
                return;
            }
        }

        // ✅ PASSO 4: Aplicar comensais e calcular todas as receitas
        const resultado = aplicarComensaisECalcular(tipoCodigo, comensaisGlobal);
        
        if (resultado.success) {
            mostrarToast(
                `✅ ${resultado.receitasProcessadas} receita(s) atualizadas e calculadas com ${comensaisGlobal} comensais!`,
                'success'
            );

            // ✅ PASSO 5: Re-renderizar interface
            setTimeout(() => {
                if (typeof window.renderizarReceitasDoTipoEditavel === 'function') {
                    window.renderizarReceitasDoTipoEditavel(tipoCodigo);
                } else if (typeof window.renderizarReceitasDoTipo === 'function') {
                    window.renderizarReceitasDoTipo(tipoCodigo);
                }

                // ✅ PASSO 6: Atualizar calendário se disponível
                if (typeof window.forcarAtualizacaoCalendario === 'function') {
                    setTimeout(() => {
                        window.forcarAtualizacaoCalendario();
                    }, 200);
                }
            }, 100);

        } else {
            mostrarToast(resultado.message || 'Erro durante o cálculo', 'error');
        }

    } catch (error) {
        console.error('❌ Erro no módulo de cálculo:', error);
        mostrarToast('Erro interno no cálculo: ' + error.message, 'error');
    } finally {
        calculoEmAndamento = false;
    }
}

// ===== FUNÇÃO AUXILIAR: APLICAR COMENSAIS E CALCULAR =====
/**
 * Aplica comensais para todas as receitas de um tipo e calcula os totais
 */
function aplicarComensaisECalcular(tipoCodigo, comensaisGlobal) {
    let receitasProcessadas = 0;
    let receitasComErro = 0;
    
    try {
        window.receitasTemporarias[tipoCodigo].forEach(receita => {
            // Buscar dados da receita original para obter rendimento
            const receitaOriginal = window.receitasCarregadas?.find(r => r.id === receita.receita_id);
            
            if (receitaOriginal && receitaOriginal.rendimento > 0) {
                // ✅ CÁLCULO: comensais × rendimento da receita
                const rendimento = parseFloat(receitaOriginal.rendimento) || 0;
                const total = comensaisGlobal * rendimento;
                
                // Atualizar todos os valores da receita
                receita.comensais = comensaisGlobal;
                receita.quantidadePorPessoa = rendimento;
                receita.totalPorComensais = total;
                receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
                receita.alterada = true;
                
                console.log(`✅ Receita ${receita.codigo}: ${comensaisGlobal} × ${rendimento} = ${total} ${receita.unidadeBasica}`);
                
                // Atualizar campos visuais se existirem (campos editáveis)
                atualizarCamposVisuais(tipoCodigo, receita.receita_id, comensaisGlobal, rendimento);
                
                receitasProcessadas++;
            } else {
                console.warn(`⚠️ Receita ${receita.codigo} sem rendimento definido ou receita original não encontrada`);
                receitasComErro++;
            }
        });

        return {
            success: receitasProcessadas > 0,
            receitasProcessadas,
            receitasComErro,
            message: receitasComErro > 0 ? 
                `${receitasProcessadas} receitas calculadas, ${receitasComErro} com problemas` : 
                null
        };

    } catch (error) {
        console.error('❌ Erro ao aplicar comensais e calcular:', error);
        return {
            success: false,
            receitasProcessadas: 0,
            receitasComErro: 0,
            message: 'Erro interno durante o cálculo'
        };
    }
}

// ===== FUNÇÃO AUXILIAR: ATUALIZAR CAMPOS VISUAIS =====
/**
 * Atualiza os campos editáveis na interface (se existirem)
 */
function atualizarCamposVisuais(tipoCodigo, receitaId, comensais, rendimento) {
    // Atualizar campo de comensais se existir
    const campoComensais = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    if (campoComensais) {
        campoComensais.value = comensais;
        
        // Feedback visual
        campoComensais.style.background = '#d1ecf1';
        campoComensais.style.borderColor = '#17a2b8';
        setTimeout(() => {
            campoComensais.style.background = '#e7f3ff';
            campoComensais.style.borderColor = '#007bff';
        }, 800);
    }
    
    // Atualizar campo de rendimento se existir
    const campoRendimento = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    if (campoRendimento) {
        campoRendimento.value = rendimento.toFixed(3);
        
        // Feedback visual
        campoRendimento.style.background = '#d4edda';
        campoRendimento.style.borderColor = '#28a745';
        setTimeout(() => {
            campoRendimento.style.background = '#d4edda';
            campoRendimento.style.borderColor = '#28a745';
        }, 800);
    }
}

// ===== FUNÇÃO: CALCULAR APENAS UMA RECEITA =====
/**
 * Calcula o total de uma receita específica com base nos valores atuais dos campos
 */
function calcularReceitaIndividual(tipoCodigo, receitaId) {
    console.log(`🧮 [MÓDULO CÁLCULO] Calculando receita individual: ${receitaId}`);
    
    if (!window.receitasTemporarias[tipoCodigo]) {
        mostrarToast('Tipo de refeição não encontrado', 'error');
        return;
    }
    
    const receita = window.receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) {
        mostrarToast('Receita não encontrada', 'error');
        return;
    }
    
    // Obter valores dos campos (editáveis ou padrão)
    const comensaisInput = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    const rendimentoInput = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    
    const comensais = parseInt(comensaisInput?.value || receita.comensais || 0);
    const rendimento = parseFloat(rendimentoInput?.value || receita.quantidadePorPessoa || 0);
    
    if (comensais <= 0 || rendimento <= 0) {
        mostrarToast('Informe valores válidos para comensais e rendimento', 'warning');
        return;
    }
    
    // Calcular total
    const total = comensais * rendimento;
    
    // Atualizar receita
    receita.comensais = comensais;
    receita.quantidadePorPessoa = rendimento;
    receita.totalPorComensais = total;
    receita.alterada = true;
    
    // Atualizar display do total
    const totalElement = document.getElementById(`total-${tipoCodigo}-${receitaId}`);
    if (totalElement) {
        const receitaOriginal = window.receitasCarregadas?.find(r => r.id === receitaId);
        const unidade = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        totalElement.textContent = `${total.toFixed(3)} ${unidade}`;
        
        // Animação de atualização
        totalElement.style.transform = 'scale(1.1)';
        totalElement.style.background = '#d1ecf1';
        totalElement.style.borderColor = '#17a2b8';
        
        setTimeout(() => {
            totalElement.style.transform = 'scale(1)';
            totalElement.style.background = '#fff3cd';
            totalElement.style.borderColor = '#ffc107';
        }, 300);
    }
    
    console.log(`✅ Total calculado: ${comensais} × ${rendimento} = ${total}`);
    mostrarToast(`✅ Receita recalculada: ${total.toFixed(3)}`, 'success', 2000);
    
    // Atualizar calendário se disponível
    if (typeof window.forcarAtualizacaoCalendario === 'function') {
        setTimeout(() => {
            window.forcarAtualizacaoCalendario();
        }, 100);
    }
}

// ===== FUNÇÃO: CALCULAR TODAS AS RECEITAS DE UM TIPO =====
/**
 * Calcula todas as receitas de um tipo usando os valores atuais dos campos
 */
function calcularTodasReceitas(tipoCodigo) {
    console.log(`🧮 [MÓDULO CÁLCULO] Calculando todas as receitas do tipo: ${tipoCodigo}`);
    
    if (!window.receitasTemporarias[tipoCodigo] || window.receitasTemporarias[tipoCodigo].length === 0) {
        mostrarToast('Nenhuma receita encontrada para calcular', 'warning');
        return;
    }
    
    let receitasCalculadas = 0;
    
    window.receitasTemporarias[tipoCodigo].forEach(receita => {
        calcularReceitaIndividual(tipoCodigo, receita.receita_id);
        receitasCalculadas++;
    });
    
    if (receitasCalculadas > 0) {
        mostrarToast(`✅ ${receitasCalculadas} receita(s) recalculadas!`, 'success');
    }
}

// ===== FUNÇÕES DE COMPATIBILIDADE COM CÓDIGO EXISTENTE =====

// Sobrescrever função original para usar o módulo de cálculo
function atualizarECalcularTipoFinal(tipoCodigo) {
    console.log('🔄 [COMPATIBILIDADE] Redirecionando para módulo de cálculo...');
    executarAtualizacaoECalculo(tipoCodigo);
}

// Função para calcular receita individual (compatibilidade)
function calcularTotalReceita(tipoCodigo, receitaId) {
    calcularReceitaIndividual(tipoCodigo, receitaId);
}

// Função para calcular receitas do tipo (compatibilidade)
function calcularReceitasDoTipo(tipoCodigo) {
    calcularTodasReceitas(tipoCodigo);
}

// ===== EXPORTAR FUNÇÕES GLOBALMENTE =====
window.executarAtualizacaoECalculo = executarAtualizacaoECalculo;
window.calcularReceitaIndividual = calcularReceitaIndividual;
window.calcularTodasReceitas = calcularTodasReceitas;
window.atualizarECalcularTipoFinal = atualizarECalcularTipoFinal;
window.calcularTotalReceita = calcularTotalReceita;
window.calcularReceitasDoTipo = calcularReceitasDoTipo;

// ===== FUNÇÃO DE TESTE =====
function testarModuloCalculo() {
    console.log('🧪 Testando módulo de cálculo...');
    console.log('✅ Funções exportadas:');
    console.log('  - executarAtualizacaoECalculo()');
    console.log('  - calcularReceitaIndividual()');
    console.log('  - calcularTodasReceitas()');
    console.log('  - atualizarECalcularTipoFinal() [compatibilidade]');
    console.log('  - calcularTotalReceita() [compatibilidade]');
    console.log('  - calcularReceitasDoTipo() [compatibilidade]');
    
    // Verificar dependências
    const dependencias = [
        'receitasTemporarias',
        'receitasCarregadas',
        'mostrarToast'
    ];
    
    dependencias.forEach(dep => {
        if (window[dep] !== undefined) {
            console.log(`✅ Dependência encontrada: ${dep}`);
        } else {
            console.warn(`⚠️ Dependência não encontrada: ${dep}`);
        }
    });
}

// Testar módulo quando carregado
setTimeout(testarModuloCalculo, 1000);

console.log('✅ Módulo de cálculo carregado com sucesso!');
console.log('📋 Para usar, chame: executarAtualizacaoECalculo(tipoCodigo)');
console.log('📋 Ou use as funções de compatibilidade existentes');