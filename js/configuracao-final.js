// configuracao-final.js - Script TOTALMENTE CORRIGIDO para configurar sistema

console.log('🔧 Carregando configuração final CORRIGIDA...');

// ===== CONFIGURAÇÃO DE DEPENDÊNCIAS SIMPLIFICADA =====
window.sistemaConfiguracaoInicializado = false;

// ===== FUNÇÃO SIMPLIFICADA: AGUARDAR DEPENDÊNCIAS =====
function aguardarDependenciasBasicas(callback, tentativas = 0, maxTentativas = 30) {
    console.log(`⏳ Aguardando dependências básicas... Tentativa ${tentativas + 1}`);
    
    // ✅ VERIFICAÇÕES ESSENCIAIS APENAS
    const checks = {
        supabase: !!(window.supabase && window.supabase.auth),
        dom: !!(document.getElementById('dataCardapio') && document.getElementById('clienteCardapio')),
        mostrarToast: typeof window.mostrarToast === 'function'
    };
    
    console.log('📊 Status das dependências:', checks);
    
    // ✅ VERIFICAR SE DEPENDÊNCIAS MÍNIMAS ESTÃO OK
    if (checks.supabase && checks.dom) {
        console.log('✅ Dependências mínimas carregadas!');
        callback();
        return true;
    }
    
    // ✅ TENTAR NOVAMENTE OU TIMEOUT
    if (tentativas < maxTentativas) {
        setTimeout(() => {
            aguardarDependenciasBasicas(callback, tentativas + 1, maxTentativas);
        }, 300);
    } else {
        console.warn('⚠️ Timeout nas dependências - continuando mesmo assim...');
        callback();
    }
    
    return false;
}

// ===== FUNÇÃO PRINCIPAL DE CONFIGURAÇÃO SIMPLIFICADA =====
async function configurarSistemaSimplificado() {
    if (window.sistemaConfiguracaoInicializado) {
        console.log('⚠️ Sistema de configuração já inicializado');
        return;
    }
    
    console.log('🚀 Iniciando configuração simplificada...');
    
    try {
        // ✅ VERIFICAR SE A FUNÇÃO PRINCIPAL EXISTE
        if (typeof window.executarAtualizacaoECalculoFinal !== 'function') {
            console.log('🔧 Criando função executarAtualizacaoECalculoFinal...');
            criarFuncaoPrincipalCalculo();
        } else {
            console.log('✅ Função executarAtualizacaoECalculoFinal já existe');
        }
        
        // ✅ VERIFICAR FUNÇÃO DE RENDERIZAÇÃO
        if (typeof window.renderizarReceitasDoTipoEditavel !== 'function') {
            console.log('🔧 Criando função de renderização...');
            criarFuncaoRenderizacao();
        } else {
            console.log('✅ Função de renderização já existe');
        }
        
        // ✅ CORRIGIR BOTÕES NO DOM
        setTimeout(() => {
            corrigirBotoesNoDom();
        }, 500);
        
        // ✅ CONFIGURAR INTERCEPTAÇÃO DE NOVOS BOTÕES
        configurarInterceptacaoBotoes();
        
        // ✅ MARCAR COMO INICIALIZADO
        window.sistemaConfiguracaoInicializado = true;
        
        console.log('✅ Configuração simplificada concluída com sucesso!');
        
        // ✅ FEEDBACK VISUAL
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('✅ Sistema de cálculo configurado!', 'success', 3000);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na configuração simplificada:', error);
        
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('⚠️ Aviso: Alguns recursos podem não funcionar corretamente', 'warning');
        }
        
        return false;
    }
}

// ===== FUNÇÃO: CRIAR FUNÇÃO PRINCIPAL DE CÁLCULO =====
function criarFuncaoPrincipalCalculo() {
    console.log('🔧 Criando função principal de cálculo...');
    
    window.executarAtualizacaoECalculoFinal = function(tipoCodigo) {
        console.log(`🔄 Executando cálculo para tipo: ${tipoCodigo}`);
        
        try {
            // ✅ VERIFICAR CAMPO DE COMENSAIS
            const comensaisInput = document.getElementById(`comensais-${tipoCodigo}`);
            if (!comensaisInput) {
                console.error('❌ Campo de comensais não encontrado');
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast('Campo de comensais não encontrado', 'error');
                }
                return;
            }
            
            const comensais = parseInt(comensaisInput.value || 0);
            
            if (comensais <= 0) {
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast('Informe um número válido de comensais (maior que 0)', 'warning');
                }
                comensaisInput.focus();
                return;
            }
            
            console.log(`👥 Comensais definidos: ${comensais}`);
            
            // ✅ VERIFICAR SE TEM RECEITAS
            if (!window.receitasTemporarias || !window.receitasTemporarias[tipoCodigo] || window.receitasTemporarias[tipoCodigo].length === 0) {
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast(`ℹ️ Comensais definido para ${comensais}. Adicione receitas para aplicar o cálculo.`, 'info');
                }
                return;
            }
            
            // ✅ PROCESSAR RECEITAS
            let receitasProcessadas = 0;
            
            window.receitasTemporarias[tipoCodigo].forEach(receita => {
                // Buscar receita original para obter rendimento
                const receitaOriginal = window.receitasCarregadas?.find(r => r.id === receita.receita_id);
                
                if (receitaOriginal && receitaOriginal.rendimento > 0) {
                    const rendimento = parseFloat(receitaOriginal.rendimento) || 0;
                    const total = comensais * rendimento;
                    
                    // ✅ ATUALIZAR RECEITA
                    receita.comensais = comensais;
                    receita.quantidadePorPessoa = rendimento;
                    receita.totalPorComensais = total;
                    receita.unidadeBasica = receitaOriginal.unidade_rendimento || 'UN';
                    receita.alterada = true;
                    
                    console.log(`✅ ${receita.codigo}: ${comensais} × ${rendimento} = ${total}`);
                    receitasProcessadas++;
                } else {
                    console.warn(`⚠️ Receita ${receita.codigo} sem rendimento`);
                }
            });
            
            // ✅ FEEDBACK E RE-RENDERIZAÇÃO
            if (receitasProcessadas > 0) {
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast(`✅ ${receitasProcessadas} receita(s) calculadas com ${comensais} comensais!`, 'success');
                }
                
                // ✅ RE-RENDERIZAR
                setTimeout(() => {
                    if (typeof window.renderizarReceitasDoTipoEditavel === 'function') {
                        window.renderizarReceitasDoTipoEditavel(tipoCodigo);
                    } else if (typeof window.renderizarReceitasBasico === 'function') {
                        window.renderizarReceitasBasico(tipoCodigo, window.receitasTemporarias[tipoCodigo]);
                    } else {
                        console.warn('⚠️ Função de renderização não encontrada');
                    }
                    
                    // ✅ ATUALIZAR CALENDÁRIO
                    if (typeof window.forcarAtualizacaoCalendario === 'function') {
                        setTimeout(() => {
                            window.forcarAtualizacaoCalendario();
                        }, 200);
                    }
                }, 100);
                
            } else {
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast('Nenhuma receita pôde ser calculada. Verifique se as receitas têm rendimento definido.', 'warning');
                }
            }
            
        } catch (error) {
            console.error('❌ Erro na função de cálculo:', error);
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast(`❌ Erro no cálculo: ${error.message}`, 'error');
            }
        }
    };
    
    console.log('✅ Função principal de cálculo criada');
}

// ===== FUNÇÃO: CRIAR FUNÇÃO DE RENDERIZAÇÃO =====
function criarFuncaoRenderizacao() {
    console.log('🔧 Criando função de renderização...');
    
    window.renderizarReceitasDoTipoEditavel = function(tipoCodigo) {
        console.log(`🎨 Renderizando receitas para tipo: ${tipoCodigo}`);
        
        const container = document.getElementById(`receitas-list-${tipoCodigo}`);
        if (!container) {
            console.warn(`⚠️ Container para tipo ${tipoCodigo} não encontrado`);
            return;
        }
        
        container.innerHTML = '';
        
        // ✅ VERIFICAR SE TEM RECEITAS
        if (!window.receitasTemporarias || !window.receitasTemporarias[tipoCodigo] || window.receitasTemporarias[tipoCodigo].length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #666; padding: 20px; background: #f8f9fa; border-radius: 5px; margin: 10px 0;">
                    📝 Nenhuma receita adicionada<br>
                    <small>Use o botão "Adicionar Receitas" para incluir receitas neste tipo</small>
                </div>
            `;
            return;
        }
        
        // ✅ RENDERIZAR CADA RECEITA
        window.receitasTemporarias[tipoCodigo].forEach(receita => {
            const div = document.createElement('div');
            div.className = 'receita-item-tabular';
            div.id = `receita-${tipoCodigo}-${receita.receita_id}`;
            
            // ✅ LAYOUT RESPONSIVO
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
                transition: all 0.2s ease;
            `;
            
            // ✅ BUSCAR DADOS DA RECEITA ORIGINAL
            const receitaOriginal = window.receitasCarregadas?.find(r => r.id === receita.receita_id);
            const unidadeRendimento = receitaOriginal ? (receitaOriginal.unidade_rendimento || 'UN') : 'UN';
            
            // ✅ CONTEÚDO DA RECEITA
            div.innerHTML = `
                <!-- Nome da Receita -->
                <div style="font-weight: 500; color: #333; font-size: 14px; line-height: 1.3;">
                    ${receita.codigo} - ${receita.descricao}
                </div>
                
                <!-- Comensais -->
                <div style="text-align: center;">
                    <span style="display: inline-block; padding: 4px 8px; background: #e7f3ff; color: #0066cc; border-radius: 4px; font-weight: 600; font-size: 13px;">
                        ${receita.comensais || 0}
                    </span>
                    <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">pessoas</small>
                </div>
                
                <!-- Rendimento -->
                <div style="text-align: center;">
                    <span style="font-weight: 500; color: #495057;">
                        ${(receita.quantidadePorPessoa || 0).toFixed(3)} ${unidadeRendimento}
                    </span>
                    <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">por pessoa</small>
                </div>
                
                <!-- Total -->
                <div style="text-align: center;">
                    <span style="display: inline-block; padding: 6px 10px; background: #e8f5e8; color: #2e7d32; border-radius: 6px; font-weight: 600; border: 2px solid #4caf50; font-size: 13px;">
                        ${(receita.totalPorComensais || 0).toFixed(3)} ${unidadeRendimento}
                    </span>
                    <small style="display: block; color: #666; font-size: 10px; margin-top: 2px;">total</small>
                </div>
                
                <!-- Ação -->
                <div style="text-align: center;">
                    <button class="btn btn-danger" onclick="removerReceita('${tipoCodigo}', '${receita.receita_id}')" 
                            style="padding: 4px 8px; font-size: 11px; width: 60px; border-radius: 4px;">
                        Excluir
                    </button>
                </div>
            `;
            
            container.appendChild(div);
        });
        
        console.log(`✅ ${window.receitasTemporarias[tipoCodigo].length} receitas renderizadas para tipo ${tipoCodigo}`);
    };
    
    console.log('✅ Função de renderização criada');
}

// ===== FUNÇÃO: CORRIGIR BOTÕES NO DOM =====
function corrigirBotoesNoDom() {
    console.log('🔧 Verificando e corrigindo botões no DOM...');
    
    // ✅ BUSCAR BOTÕES COM FUNÇÃO ANTIGA OU INCORRETA
    const seletores = [
        'button[onclick*="atualizarECalcularTipoFinal"]',
        'button[onclick*="atualizarECalcularTipo"]',
        'button:contains("📝 Atualizar e Calcular")'
    ];
    
    let botoesCorrigidos = 0;
    
    seletores.forEach(seletor => {
        try {
            const botoes = document.querySelectorAll(seletor);
            
            botoes.forEach(botao => {
                const onclickOriginal = botao.getAttribute('onclick');
                
                if (onclickOriginal) {
                    // ✅ EXTRAIR CÓDIGO DO TIPO
                    const matches = onclickOriginal.match(/['"]([^'"]+)['"]/g);
                    if (matches && matches.length > 0) {
                        const tipoCodigo = matches[0].replace(/['"]/g, '');
                        
                        // ✅ CORRIGIR ONCLICK
                        botao.setAttribute('onclick', `executarAtualizacaoECalculoFinal('${tipoCodigo}')`);
                        botao.title = 'Atualiza comensais e calcula automaticamente todas as receitas';
                        
                        // ✅ GARANTIR TEXTO DO BOTÃO
                        if (!botao.textContent.includes('📝')) {
                            botao.innerHTML = '📝 Atualizar e Calcular';
                        }
                        
                        console.log(`✅ Botão corrigido para tipo: ${tipoCodigo}`);
                        botoesCorrigidos++;
                    }
                }
            });
        } catch (error) {
            console.warn(`⚠️ Erro ao processar seletor ${seletor}:`, error);
        }
    });
    
    console.log(`✅ ${botoesCorrigidos} botão(ões) corrigido(s) no DOM`);
}

// ===== FUNÇÃO: CONFIGURAR INTERCEPTAÇÃO DE BOTÕES =====
function configurarInterceptacaoBotoes() {
    console.log('🔧 Configurando interceptação de novos botões...');
    
    // ✅ OBSERVER PARA NOVOS ELEMENTOS
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // ✅ VERIFICAR SE O NÓ OU SEUS FILHOS CONTÊM BOTÕES
                        let botoesNovos = [];
                        
                        if (node.tagName === 'BUTTON') {
                            botoesNovos = [node];
                        } else if (node.querySelectorAll) {
                            botoesNovos = Array.from(node.querySelectorAll('button[onclick*="atualizarECalcular"]'));
                        }
                        
                        botoesNovos.forEach(botao => {
                            const onclick = botao.getAttribute('onclick');
                            if (onclick && (onclick.includes('atualizarECalcularTipoFinal') || onclick.includes('atualizarECalcularTipo'))) {
                                // ✅ EXTRAIR TIPO E CORRIGIR
                                const matches = onclick.match(/['"]([^'"]+)['"]/g);
                                if (matches && matches.length > 0) {
                                    const tipoCodigo = matches[0].replace(/['"]/g, '');
                                    
                                    botao.setAttribute('onclick', `executarAtualizacaoECalculoFinal('${tipoCodigo}')`);
                                    botao.title = 'Atualiza comensais e calcula automaticamente';
                                    
                                    console.log(`🔄 Botão dinâmico corrigido para tipo: ${tipoCodigo}`);
                                }
                            }
                        });
                    }
                });
            }
        });
    });
    
    // ✅ OBSERVAR TODO O BODY
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('✅ Interceptação de botões configurada');
}

// ===== FUNÇÃO DE TESTE DO SISTEMA =====
function testarSistemaConfigurado() {
    console.log('🧪 Testando sistema configurado...');
    
    const testes = {
        funcaoPrincipal: typeof window.executarAtualizacaoECalculoFinal === 'function',
        funcaoRenderizacao: typeof window.renderizarReceitasDoTipoEditavel === 'function',
        supabase: !!(window.supabase && window.supabase.auth),
        elementos: !!(document.getElementById('dataCardapio') && document.getElementById('clienteCardapio')),
        mostrarToast: typeof window.mostrarToast === 'function'
    };
    
    console.log('📊 Resultado dos testes:', testes);
    
    const todosFuncionam = Object.values(testes).every(t => t);
    
    if (todosFuncionam) {
        console.log('✅ Todos os testes passaram!');
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('✅ Sistema funcionando perfeitamente!', 'success');
        }
    } else {
        console.warn('⚠️ Alguns testes falharam');
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast('⚠️ Sistema parcialmente funcional', 'warning');
        }
    }
    
    return {
        sucesso: todosFuncionam,
        detalhes: testes
    };
}

// ===== FUNÇÃO DE MONITORAMENTO =====
function monitorarSistema() {
    console.log('👁️ Iniciando monitoramento do sistema...');
    
    setInterval(() => {
        // ✅ VERIFICAR FUNÇÃO PRINCIPAL
        if (typeof window.executarAtualizacaoECalculoFinal !== 'function') {
            console.warn('⚠️ Função principal perdida, recriando...');
            criarFuncaoPrincipalCalculo();
        }
        
        // ✅ VERIFICAR FUNÇÃO DE RENDERIZAÇÃO
        if (typeof window.renderizarReceitasDoTipoEditavel !== 'function') {
            console.warn('⚠️ Função de renderização perdida, recriando...');
            criarFuncaoRenderizacao();
        }
        
    }, 15000); // Verificar a cada 15 segundos
}

// ===== FUNÇÃO DE RECONFIGURAÇÃO =====
function reconfigurarSistema() {
    console.log('🔄 Reconfigurando sistema...');
    
    // ✅ RESETAR FLAG
    window.sistemaConfiguracaoInicializado = false;
    
    // ✅ RECRIAR FUNÇÕES
    criarFuncaoPrincipalCalculo();
    criarFuncaoRenderizacao();
    
    // ✅ CORRIGIR BOTÕES
    setTimeout(() => {
        corrigirBotoesNoDom();
    }, 500);
    
    // ✅ MARCAR COMO INICIALIZADO
    window.sistemaConfiguracaoInicializado = true;
    
    console.log('✅ Sistema reconfigurado');
    
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast('✅ Sistema reconfigurado com sucesso!', 'success');
    }
}

// ===== INICIALIZAÇÃO AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM carregado - iniciando configuração automática...');
    
    setTimeout(() => {
        aguardarDependenciasBasicas(async () => {
            const sucesso = await configurarSistemaSimplificado();
            
            if (sucesso) {
                // ✅ TESTAR SISTEMA
                setTimeout(() => {
                    const resultadoTeste = testarSistemaConfigurado();
                    
                    if (resultadoTeste.sucesso) {
                        // ✅ INICIAR MONITORAMENTO
                        monitorarSistema();
                        console.log('✅ Sistema totalmente funcional e monitorado!');
                    }
                }, 1000);
            }
        });
    }, 800);
});

// ===== EXPORTAR FUNÇÕES PRINCIPAIS =====
window.configurarSistemaSimplificado = configurarSistemaSimplificado;
window.testarSistemaConfigurado = testarSistemaConfigurado;
window.reconfigurarSistema = reconfigurarSistema;
window.criarFuncaoPrincipalCalculo = criarFuncaoPrincipalCalculo;
window.criarFuncaoRenderizacao = criarFuncaoRenderizacao;

console.log('✅ Configuração final TOTALMENTE CORRIGIDA carregada!');
console.log('📋 Funcionalidades:');
console.log('  ✓ Aguarda apenas dependências essenciais');
console.log('  ✓ Cria funções ausentes automaticamente');
console.log('  ✓ Corrige botões existentes e futuros');
console.log('  ✓ Sistema de monitoramento ativo');
console.log('  ✓ Função de teste: testarSistemaConfigurado()');
console.log('  ✓ Reconfiguração: reconfigurarSistema()');