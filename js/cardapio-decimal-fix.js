// ===== FUNÇÕES DE FORMATAÇÃO DECIMAL BRASILEIRA =====

/**
 * Formatar número para exibição brasileira (vírgula como separador decimal)
 * @param {number} numero - Número a ser formatado
 * @param {number} casasDecimais - Número de casas decimais (padrão: 3)
 * @returns {string} - Número formatado com vírgula
 */
function formatarDecimalBrasil(numero, casasDecimais = 3) {
    if (numero === null || numero === undefined || isNaN(numero)) {
        return '0' + ',000'.substring(0, casasDecimais + 1);
    }
    
    const numeroFormatado = parseFloat(numero).toFixed(casasDecimais);
    return numeroFormatado.replace('.', ',');
}

/**
 * Converter texto brasileiro (vírgula) para número (ponto)
 * @param {string} textoVirgula - Texto com vírgula decimal
 * @returns {number} - Número convertido
 */
function converterVirgulaParaNumero(textoVirgula) {
    if (!textoVirgula || textoVirgula === '') return 0;
    
    // Converter vírgula para ponto e retornar como número
    const numeroStr = String(textoVirgula).replace(',', '.');
    const numero = parseFloat(numeroStr);
    
    return isNaN(numero) ? 0 : numero;
}

// ===== FUNÇÃO CORRIGIDA: Renderizar receitas com campos editáveis (formatação brasileira) =====
function renderizarReceitasDoTipoEditavel(tipoCodigo) {
    const container = document.getElementById(`receitas-list-${tipoCodigo}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!receitasTemporarias[tipoCodigo] || receitasTemporarias[tipoCodigo].length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                📝 Nenhuma receita adicionada<br>
                <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
            </div>
        `;
        return;
    }
    
    receitasTemporarias[tipoCodigo].forEach(receita => {
        const div = document.createElement('div');
        div.className = 'receita-item-tabular';
        div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
        
        // Layout com campos editáveis
        div.style.cssText = `
            display: grid;
            grid-template-columns: 2fr 120px 150px 150px 90px;
            gap: 10px;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            transition: all 0.2s ease;
        `;
        
        // Buscar dados da receita original
        const receitaOriginal = receitasCarregadas.find(r => r.id === receita.receita_id);
        const rendimentoOriginal = receitaOriginal ? parseFloat(receitaOriginal.rendimento || 0) : 0;
        const unidadeRendimento = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        // Usar valores salvos ou padrão
        const comensaisAtual = receita.comensais || 0;
        const rendimentoAtual = receita.quantidadePorPessoa || rendimentoOriginal;
        const totalAtual = receita.totalPorComensais || 0;
        
        // ✅ FORMATAÇÃO BRASILEIRA COM VÍRGULA
        const rendimentoFormatado = formatarDecimalBrasil(rendimentoAtual, 3);
        const totalFormatado = formatarDecimalBrasil(totalAtual, 4);
        
        div.innerHTML = `
            <!-- ✅ COLUNA 1: Código + Nome da Receita -->
            <div class="receita-nome" style="font-weight: 500; color: #333; font-size: 14px; line-height: 1.3;">
                ${receita.codigo} - ${receita.descricao}
            </div>
            
            <!-- ✅ COLUNA 2: Comensais EDITÁVEL -->
            <div style="text-align: center;">
                <input type="number" 
                       class="campo-comensais-editavel" 
                       id="comensais-editavel-${tipoCodigo}-${receita.receita_id}"
                       value="${comensaisAtual}" 
                       min="1" 
                       max="9999" 
                       step="1"
                       onchange="atualizarComensaisReceita('${tipoCodigo}', '${receita.receita_id}', this.value)"
                       onblur="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')"
                       style="width: 80px; padding: 6px 8px; border: 2px solid #007bff; border-radius: 4px; text-align: center; font-weight: 600; font-size: 13px; background: #e7f3ff; color: #004085;">
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">pessoas</small>
            </div>
            
            <!-- ✅ COLUNA 3: Rendimento EDITÁVEL COM VÍRGULA -->
            <div style="text-align: center;">
                <input type="text" 
                       class="campo-rendimento-editavel" 
                       id="rendimento-editavel-${tipoCodigo}-${receita.receita_id}"
                       value="${rendimentoFormatado}" 
                       onchange="atualizarRendimentoReceitaVirgula('${tipoCodigo}', '${receita.receita_id}', this.value)"
                       onblur="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')"
                       placeholder="0,000"
                       pattern="[0-9]+([,][0-9]+)?"
                       style="width: 100px; padding: 6px 8px; border: 2px solid #28a745; border-radius: 4px; text-align: center; font-weight: 600; font-size: 13px; background: #d4edda; color: #155724;">
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">${unidadeRendimento}/pessoa</small>
            </div>
            
            <!-- ✅ COLUNA 4: Total CALCULADO COM VÍRGULA -->
            <div style="text-align: center;">
                <span class="total-calculado-editavel" id="total-${tipoCodigo}-${receita.receita_id}" 
                      style="display: inline-block; padding: 8px 12px; background: #fff3cd; color: #856404; border-radius: 6px; font-weight: 600; border: 2px solid #ffc107; font-size: 13px; min-width: 80px;">
                    ${totalFormatado} ${unidadeRendimento}
                </span>
                <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">total</small>
            </div>
            
            <!-- ✅ COLUNA 5: Ações -->
            <div style="text-align: center; display: flex; flex-direction: column; gap: 4px;">
                <button class="btn btn-success" onclick="calcularTotalReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 10px; width: 70px; border-radius: 4px; margin-bottom: 2px;"
                        title="Recalcular apenas esta receita">
                    Calc. esta
                </button>
                <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                        style="padding: 4px 8px; font-size: 10px; width: 70px; border-radius: 4px;"
                        title="Remover esta receita">
                    Excluir
                </button>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// ===== NOVA FUNÇÃO: Atualizar rendimento com vírgula =====
function atualizarRendimentoReceitaVirgula(tipoCodigo, receitaId, novoValor) {
    console.log(`⚖️ Atualizando rendimento da receita ${receitaId} para ${novoValor}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    // ✅ CONVERTER VÍRGULA PARA NÚMERO
    const rendimento = converterVirgulaParaNumero(novoValor);
    
    if (rendimento < 0) {
        mostrarToast('Rendimento não pode ser negativo', 'warning');
        return;
    }
    
    // Atualizar valor na receita
    receita.quantidadePorPessoa = rendimento;
    receita.alterada = true;
    
    // Feedback visual no campo
    const campo = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    if (campo) {
        // ✅ FORMATAR NOVAMENTE COM VÍRGULA NO CAMPO
        campo.value = formatarDecimalBrasil(rendimento, 3);
        
        campo.style.background = '#f8d7da';
        campo.style.borderColor = '#dc3545';
        setTimeout(() => {
            campo.style.background = '#d4edda';
            campo.style.borderColor = '#28a745';
        }, 1000);
    }
    
    console.log(`✅ Rendimento da receita ${receita.codigo} atualizado para ${rendimento}`);
}

// ===== FUNÇÃO CORRIGIDA: Calcular total com formatação brasileira =====
function calcularTotalReceita(tipoCodigo, receitaId) {
    console.log(`🧮 Calculando total da receita ${receitaId}`);
    
    if (!receitasTemporarias[tipoCodigo]) return;
    
    const receita = receitasTemporarias[tipoCodigo].find(r => r.receita_id === receitaId);
    if (!receita) return;
    
    // Obter valores atuais dos campos
    const comensaisInput = document.getElementById(`comensais-editavel-${tipoCodigo}-${receitaId}`);
    const rendimentoInput = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    
    const comensais = parseInt(comensaisInput?.value || receita.comensais || 0);
    
    // ✅ CONVERTER RENDIMENTO DE VÍRGULA PARA NÚMERO
    const rendimentoTexto = rendimentoInput?.value || receita.quantidadePorPessoa || 0;
    const rendimento = converterVirgulaParaNumero(rendimentoTexto);
    
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
        const receitaOriginal = receitasCarregadas.find(r => r.id === receitaId);
        const unidade = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
        
        // ✅ FORMATAR TOTAL COM VÍRGULA
        const totalFormatado = formatarDecimalBrasil(total, 4);
        totalElement.textContent = `${totalFormatado} ${unidade}`;
        
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
    
    // ✅ MOSTRAR FEEDBACK COM VÍRGULA
    const totalFormatado = formatarDecimalBrasil(total, 4);
    mostrarToast(`✅ Total recalculado: ${totalFormatado}`, 'success', 2000);
    
    // Atualizar calendário se disponível
    if (typeof forcarAtualizacaoCalendario === 'function') {
        setTimeout(() => {
            forcarAtualizacaoCalendario();
        }, 100);
    }
}

// ===== FUNÇÃO CORRIGIDA: Aplicar comensais e calcular com formatação brasileira =====
function aplicarComensaisECalcularDireto(tipoCodigo, comensaisGlobal) {
    let receitasProcessadas = 0;
    let receitasComErro = 0;
    
    try {
        if (!receitasTemporarias[tipoCodigo]) {
            return { success: false, receitasProcessadas: 0, message: 'Nenhuma receita encontrada' };
        }
        
        receitasTemporarias[tipoCodigo].forEach(receita => {
            // Buscar dados da receita original para obter rendimento
            const receitaOriginal = receitasCarregadas?.find(r => r.id === receita.receita_id);
            
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
                
                // ✅ ATUALIZAR CAMPOS VISUAIS COM FORMATAÇÃO BRASILEIRA
                atualizarCamposVisuaisDiretoVirgula(tipoCodigo, receita.receita_id, comensaisGlobal, rendimento);
                
                receitasProcessadas++;
            } else {
                console.warn(`⚠️ Receita ${receita.codigo} sem rendimento definido`);
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

// ===== FUNÇÃO CORRIGIDA: Atualizar campos visuais com vírgula =====
function atualizarCamposVisuaisDiretoVirgula(tipoCodigo, receitaId, comensais, rendimento) {
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
    
    // ✅ ATUALIZAR CAMPO DE RENDIMENTO COM VÍRGULA
    const campoRendimento = document.getElementById(`rendimento-editavel-${tipoCodigo}-${receitaId}`);
    if (campoRendimento) {
        campoRendimento.value = formatarDecimalBrasil(rendimento, 3);
        
        // Feedback visual
        campoRendimento.style.background = '#d4edda';
        campoRendimento.style.borderColor = '#28a745';
        setTimeout(() => {
            campoRendimento.style.background = '#d4edda';
            campoRendimento.style.borderColor = '#28a745';
        }, 800);
    }
}

// ===== FUNÇÃO AUXILIAR: Formatar números em outras partes do código =====
function formatarTodosOsNumeros() {
    // Buscar todos os elementos que podem conter números decimais
    const totaisCalculados = document.querySelectorAll('.total-calculado, .total-calculado-editavel');
    
    totaisCalculados.forEach(elemento => {
        const texto = elemento.textContent;
        const match = texto.match(/(\d+)\.(\d+)/);
        
        if (match) {
            const numeroFormatado = texto.replace(/(\d+)\.(\d+)/, '$1,$2');
            elemento.textContent = numeroFormatado;
        }
    });
}

// ===== EXPORTAR FUNÇÕES CORRIGIDAS =====

// Sobrescrever funções existentes
window.renderizarReceitasDoTipoEditavel = renderizarReceitasDoTipoEditavel;
window.atualizarRendimentoReceitaVirgula = atualizarRendimentoReceitaVirgula;
window.calcularTotalReceita = calcularTotalReceita;
window.aplicarComensaisECalcularDireto = aplicarComensaisECalcularDireto;
window.atualizarCamposVisuaisDiretoVirgula = atualizarCamposVisuaisDiretoVirgula;

// Exportar novas funções
window.formatarDecimalBrasil = formatarDecimalBrasil;
window.converterVirgulaParaNumero = converterVirgulaParaNumero;
window.formatarTodosOsNumeros = formatarTodosOsNumeros;

// ✅ APLICAR FORMATAÇÃO APÓS CARREGAMENTO
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar formatação a cada 2 segundos (para capturar conteúdo dinâmico)
    setInterval(formatarTodosOsNumeros, 2000);
});

console.log('✅ Formatação decimal brasileira implementada!');
console.log('📋 Funcionalidades:');
console.log('  ✓ Campos de rendimento aceitam vírgula como entrada');
console.log('  ✓ Totais são exibidos com vírgula (ex: 123,4567)');
console.log('  ✓ Conversão automática vírgula ↔ ponto para cálculos');
console.log('  ✓ Todos os campos editáveis mantêm formatação brasileira');
console.log('  ✓ Compatível com todas as funções existentes');
console.log('📝 Exemplo: Digite "1,250" no campo rendimento = 1.250 kg por pessoa');