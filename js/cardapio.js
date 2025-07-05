// Funções específicas para cardápio - VERSÃO COMPLETA ATUALIZADA

function carregarTiposRefeicaoCliente() {
    const clienteIndex = document.getElementById('clienteCardapio').value;
    const container = document.getElementById('tiposRefeicaoCardapio');
    if (!container) return;
    
    container.innerHTML = '';

    if (clienteIndex === '') return;

    const cliente = clientes[clienteIndex];
    clienteAtualCardapio = cliente;

    cliente.tiposRefeicao.forEach(tipo => {
        const expandable = document.createElement('div');
        expandable.className = 'expandable';
        expandable.innerHTML = `
            <div class="expandable-header" onclick="toggleExpandable(this)">
                <span>${tipo.descricao}</span>
                <span>▼</span>
            </div>
            <div class="expandable-content">
                <div class="comensais-section">
                    <label>Comensais:</label>
                    <input type="number" class="comensais-input" min="1" placeholder="0">
                    <button class="btn btn-secondary" onclick="atualizarComensais(this)">Atualizar</button>
                </div>
                <button class="btn btn-primary" onclick="abrirModalReceitasTipo('${tipo.codigo}')">Adicionar Receitas</button>
                <div class="actions" style="margin-top: 10px;">
                    <button class="btn btn-success compact-btn" onclick="calcularTipoRefeicao('${tipo.codigo}')">Calcular</button>
                    <button class="btn btn-primary compact-btn" onclick="gravarTipoRefeicao('${tipo.codigo}')">Gravar</button>
                </div>
                <div class="receitas-container" data-tipo="${tipo.codigo}">
                </div>
            </div>
        `;
        container.appendChild(expandable);
    });
}

function toggleExpandable(header) {
    const content = header.nextElementSibling;
    const arrow = header.querySelector('span:last-child');
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        arrow.textContent = '▼';
    } else {
        content.classList.add('active');
        arrow.textContent = '▲';
    }
}

function abrirModalReceitasTipo(tipoRefeicaoCodigo) {
    tipoRefeicaoAtualCardapio = tipoRefeicaoCodigo;
    document.getElementById('modalReceitas').style.display = 'block';
    carregarListaReceitasModal();
}

function carregarListaReceitasModal() {
    const container = document.getElementById('listaReceitasModal');
    if (!container) return;
    
    container.innerHTML = '';

    receitas.forEach((receita, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <input type="checkbox" id="receita-${index}" value="${index}">
            <label for="receita-${index}">${receita.codigo} - ${receita.descricao}</label>
        `;
        container.appendChild(div);
    });
}

function filtrarReceitas() {
    const search = document.getElementById('searchReceitas').value.toLowerCase();
    const items = document.querySelectorAll('#listaReceitasModal .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

function adicionarReceitasSelecionadas() {
    const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked');
    const data = document.getElementById('dataCardapio').value;
    
    if (!data) {
        mostrarAlerta('Selecione uma data primeiro!', 'error');
        return;
    }

    if (!cardapios[data]) {
        cardapios[data] = {};
    }

    if (!cardapios[data][clienteAtualCardapio.codigo]) {
        cardapios[data][clienteAtualCardapio.codigo] = {};
    }

    if (!cardapios[data][clienteAtualCardapio.codigo][tipoRefeicaoAtualCardapio]) {
        cardapios[data][clienteAtualCardapio.codigo][tipoRefeicaoAtualCardapio] = [];
    }

    checkboxes.forEach(checkbox => {
        const receitaIndex = parseInt(checkbox.value);
        const receita = receitas[receitaIndex];
        
        const receitaCardapio = {
            codigo: receita.codigo,
            descricao: receita.descricao,
            comensais: 0,
            quantidadePorPessoa: receita.rendimento || 1,
            totalPorComensais: 0,
            unidadeBasica: receita.unidadeRendimento || 'UN',
            alterada: false,
            ingredientes: receita.ingredientes || []
        };

        cardapios[data][clienteAtualCardapio.codigo][tipoRefeicaoAtualCardapio].push(receitaCardapio);
    });

    fecharModal('modalReceitas');
    carregarCardapioData();
    mostrarAlerta('Receitas adicionadas com sucesso!', 'success');
}

function carregarCardapioData() {
    const data = document.getElementById('dataCardapio').value;
    const clienteIndex = document.getElementById('clienteCardapio').value;
    
    if (!data || clienteIndex === '') return;

    const cliente = clientes[clienteIndex];
    dataAtualCardapio = data;

    // Carregar receitas do cardápio
    cliente.tiposRefeicao.forEach(tipo => {
        const container = document.querySelector(`[data-tipo="${tipo.codigo}"]`);
        if (container) {
            container.innerHTML = '';
            
            if (cardapios[data] && cardapios[data][cliente.codigo] && cardapios[data][cliente.codigo][tipo.codigo]) {
                const receitas = cardapios[data][cliente.codigo][tipo.codigo];
                
                receitas.forEach((receita, index) => {
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h4>${receita.descricao}</h4>
                            <button class="btn btn-danger" onclick="removerReceitaCardapio('${tipo.codigo}', ${index})">Remover</button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px;">
                            <div>
                                <label>Comensais</label>
                                <input type="number" class="inline-edit" value="${receita.comensais}" 
                                       onchange="atualizarReceitaCardapio('${tipo.codigo}', ${index}, 'comensais', this.value)">
                            </div>
                            <div>
                                <label>Qtd/Pessoa</label>
                                <input type="number" class="inline-edit" value="${receita.quantidadePorPessoa}" step="0.001"
                                       onchange="atualizarReceitaCardapio('${tipo.codigo}', ${index}, 'quantidadePorPessoa', this.value)">
                            </div>
                            <div>
                                <label>Total</label>
                                <input type="number" class="inline-edit" value="${receita.totalPorComensais}" readonly>
                            </div>
                            <div>
                                <label>UnB</label>
                                <span>${receita.unidadeBasica}</span>
                            </div>
                        </div>
                        ${receita.alterada ? '<p style="color: orange; font-size: 12px;">Quantidade alterada - diverge do cadastro da receita</p>' : ''}
                    `;
                    container.appendChild(div);
                });
            }
        }
    });
}

function atualizarReceitaCardapio(tipoCodigo, receitaIndex, campo, valor) {
    const data = document.getElementById('dataCardapio').value;
    const cliente = clienteAtualCardapio;
    
    if (cardapios[data] && cardapios[data][cliente.codigo] && cardapios[data][cliente.codigo][tipoCodigo]) {
        const receita = cardapios[data][cliente.codigo][tipoCodigo][receitaIndex];
        receita[campo] = parseFloat(valor) || 0;
        
        if (campo === 'quantidadePorPessoa') {
            const receitaOriginal = receitas.find(r => r.codigo === receita.codigo);
            if (receitaOriginal && receitaOriginal.rendimento !== receita.quantidadePorPessoa) {
                receita.alterada = true;
            }
        }
        
        carregarCardapioData();
    }
}

function removerReceitaCardapio(tipoCodigo, receitaIndex) {
    if (confirm('Tem certeza que deseja remover esta receita?')) {
        const data = document.getElementById('dataCardapio').value;
        const cliente = clienteAtualCardapio;
        
        if (cardapios[data] && cardapios[data][cliente.codigo] && cardapios[data][cliente.codigo][tipoCodigo]) {
            cardapios[data][cliente.codigo][tipoCodigo].splice(receitaIndex, 1);
            carregarCardapioData();
            mostrarAlerta('Receita removida do cardápio!', 'success');
        }
    }
}

function atualizarComensais(botao) {
    const container = botao.closest('.expandable-content');
    const input = container.querySelector('.comensais-input');
    const totalComensais = parseInt(input.value) || 0;
    const tipoCodigo = container.querySelector('.receitas-container').dataset.tipo;
    
    if (totalComensais <= 0) {
        mostrarAlerta('Informe um número válido de comensais!', 'error');
        return;
    }
    
    const data = document.getElementById('dataCardapio').value;
    const cliente = clienteAtualCardapio;
    
    if (cardapios[data] && cardapios[data][cliente.codigo] && cardapios[data][cliente.codigo][tipoCodigo]) {
        cardapios[data][cliente.codigo][tipoCodigo].forEach(receita => {
            receita.comensais = totalComensais;
        });
        carregarCardapioData();
        mostrarAlerta('Comensais atualizados!', 'success');
    }
}

// Funções específicas para botões globais
function atualizarParaTodos() {
    const totalComensais = parseInt(document.getElementById('totalComensais').value) || 0;
    const data = document.getElementById('dataCardapio').value;
    const cliente = clienteAtualCardapio;
    
    if (totalComensais <= 0) {
        mostrarAlerta('Informe um número válido de comensais!', 'error');
        return;
    }
    
    if (!data || !cliente) {
        mostrarAlerta('Selecione cliente e data!', 'error');
        return;
    }
    
    // Atualizar todos os inputs de comensais
    document.querySelectorAll('.comensais-input').forEach(input => {
        input.value = totalComensais;
    });
    
    // Atualizar nos dados
    if (cardapios[data] && cardapios[data][cliente.codigo]) {
        Object.keys(cardapios[data][cliente.codigo]).forEach(tipoCodigo => {
            cardapios[data][cliente.codigo][tipoCodigo].forEach(receita => {
                receita.comensais = totalComensais;
            });
        });
        carregarCardapioData();
    }
    
    mostrarAlerta('Comensais atualizados para todos os tipos!', 'success');
}

function calcularParaTodos() {
    const data = document.getElementById('dataCardapio').value;
    const cliente = clienteAtualCardapio;
    
    if (!data || !cliente) {
        mostrarAlerta('Selecione cliente e data!', 'error');
        return;
    }
    
    if (cardapios[data] && cardapios[data][cliente.codigo]) {
        Object.keys(cardapios[data][cliente.codigo]).forEach(tipoCodigo => {
            cardapios[data][cliente.codigo][tipoCodigo].forEach(receita => {
                receita.totalPorComensais = receita.quantidadePorPessoa * receita.comensais;
            });
        });
        carregarCardapioData();
        mostrarAlerta('Cálculos realizados para todos os tipos!', 'success');
    }
}

function gravarParaTodos() {
    const data = document.getElementById('dataCardapio').value;
    const clienteIndex = document.getElementById('clienteCardapio').value;
    
    if (!data || clienteIndex === '') {
        mostrarAlerta('Selecione cliente e data!', 'error');
        return;
    }
    
    // Calcular automaticamente antes de gravar
    calcularParaTodos();
    
    // Marcar dia no calendário
    atualizarCalendario();
    
    mostrarAlerta('Cardápio gravado para todos os tipos!', 'success');
}

function calcularTipoRefeicao(tipoCodigo) {
    const data = document.getElementById('dataCardapio').value;
    const cliente = clienteAtualCardapio;
    
    if (!data || !cliente) return;
    
    if (cardapios[data] && cardapios[data][cliente.codigo] && cardapios[data][cliente.codigo][tipoCodigo]) {
        cardapios[data][cliente.codigo][tipoCodigo].forEach(receita => {
            receita.totalPorComensais = receita.quantidadePorPessoa * receita.comensais;
        });
        carregarCardapioData();
        mostrarAlerta('Cálculo realizado para este tipo de refeição!', 'success');
    }
}

function gravarTipoRefeicao(tipoCodigo) {
    const data = document.getElementById('dataCardapio').value;
    const cliente = clienteAtualCardapio;
    
    if (!data || !cliente) {
        mostrarAlerta('Selecione cliente e data!', 'error');
        return;
    }
    
    // Calcular antes de gravar
    calcularTipoRefeicao(tipoCodigo);
    
    // Marcar dia no calendário
    atualizarCalendario();
    
    mostrarAlerta('Tipo de refeição gravado!', 'success');
}

// =================== FUNÇÕES DE IMPRESSÃO MELHORADAS ===================

function abrirModalImpressao() {
    const dataAtual = document.getElementById('dataCardapio').value;
    
    // Definir valores padrão
    if (dataAtual) {
        document.getElementById('dataInicioPeriodo').value = dataAtual;
        document.getElementById('dataFimPeriodo').value = dataAtual;
    }
    
    // Carregar listas de clientes e tipos de refeição
    carregarClientesParaImpressao();
    carregarTiposRefeicaoParaImpressao();
    
    document.getElementById('modalImpressao').style.display = 'block';
}

function carregarClientesParaImpressao() {
    const container = document.getElementById('listaClientesImpressao');
    if (!container) return;
    
    container.innerHTML = '';
    
    clientes.forEach((cliente, index) => {
        if (cliente.tiposRefeicao && cliente.tiposRefeicao.length > 0) {
            const div = document.createElement('div');
            div.className = 'checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="cliente-${index}" value="${index}">
                <label for="cliente-${index}">${cliente.descricao}</label>
            `;
            container.appendChild(div);
        }
    });
}

function carregarTiposRefeicaoParaImpressao() {
    const container = document.getElementById('listaTiposRefeicaoImpressao');
    if (!container) return;
    
    container.innerHTML = '';
    
    tiposRefeicoes.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        div.innerHTML = `
            <input type="checkbox" id="tipo-${index}" value="${tipo.codigo}">
            <label for="tipo-${index}">${tipo.descricao}</label>
        `;
        container.appendChild(div);
    });
}

function toggleClienteSelection() {
    const tipoSelecionado = document.querySelector('input[name="tipoCliente"]:checked').value;
    const selecaoClientes = document.getElementById('selecaoClientes');
    
    if (tipoSelecionado === 'especificos') {
        selecaoClientes.classList.remove('hidden');
    } else {
        selecaoClientes.classList.add('hidden');
        // Desmarcar todos os checkboxes de clientes
        document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
}

function toggleTipoRefeicaoSelection() {
    const tipoSelecionado = document.querySelector('input[name="tipoRefeicao"]:checked').value;
    const selecaoTipos = document.getElementById('selecaoTiposRefeicao');
    
    if (tipoSelecionado === 'especificos') {
        selecaoTipos.classList.remove('hidden');
    } else {
        selecaoTipos.classList.add('hidden');
        // Desmarcar todos os checkboxes de tipos
        document.querySelectorAll('#listaTiposRefeicaoImpressao input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
}

function obterClientesSelecionados() {
    const tipoCliente = document.querySelector('input[name="tipoCliente"]:checked').value;
    
    if (tipoCliente === 'todos') {
        return clientes.filter(cliente => cliente.tiposRefeicao && cliente.tiposRefeicao.length > 0);
    } else {
        const clientesSelecionados = [];
        document.querySelectorAll('#listaClientesImpressao input[type="checkbox"]:checked').forEach(cb => {
            const clienteIndex = parseInt(cb.value);
            clientesSelecionados.push(clientes[clienteIndex]);
        });
        return clientesSelecionados;
    }
}

function obterTiposRefeicaoSelecionados() {
    const tipoRefeicao = document.querySelector('input[name="tipoRefeicao"]:checked').value;
    
    if (tipoRefeicao === 'todos') {
        return tiposRefeicoes.map(tipo => tipo.codigo);
    } else {
        const tiposSelecionados = [];
        document.querySelectorAll('#listaTiposRefeicaoImpressao input[type="checkbox"]:checked').forEach(cb => {
            tiposSelecionados.push(cb.value);
        });
        return tiposSelecionados;
    }
}

// NOVA FUNÇÃO: Imprimir Receitas Completas
function imprimirReceitasCompletas() {
    const dataInicio = document.getElementById('dataInicioPeriodo').value;
    const dataFim = document.getElementById('dataFimPeriodo').value;
    
    if (!dataInicio || !dataFim) {
        mostrarAlerta('Preencha o período!', 'error');
        return;
    }
    
    const clientesSelecionados = obterClientesSelecionados();
    const tiposRefeicaoSelecionados = obterTiposRefeicaoSelecionados();
    
    if (clientesSelecionados.length === 0) {
        mostrarAlerta('Selecione pelo menos um cliente!', 'error');
        return;
    }
    
    if (tiposRefeicaoSelecionados.length === 0) {
        mostrarAlerta('Selecione pelo menos um tipo de refeição!', 'error');
        return;
    }
    
    const datasParaImprimir = obterDatasIntervalo(dataInicio, dataFim);
    const receitasUtilizadas = coletarReceitasUtilizadas(clientesSelecionados, tiposRefeicaoSelecionados, datasParaImprimir);
    
    let conteudoImpressao = gerarCabecalhoImpressao(clientesSelecionados, dataInicio, dataFim, 'Receitas Completas');
    
    conteudoImpressao += `
        <div class="receitas-section">
            <h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin: 20px 0;">
                📋 Receitas com Modo de Preparo
            </h2>
            <p style="margin-bottom: 30px; color: #666; font-style: italic;">
                Receitas utilizadas no período com quantidades calculadas para cada cliente
            </p>
    `;
    
    receitasUtilizadas.forEach(receitaInfo => {
        const receita = receitas.find(r => r.codigo === receitaInfo.codigo);
        if (!receita) return;
        
        conteudoImpressao += `
            <div class="receita-completa" style="page-break-inside: avoid; margin-bottom: 40px; border: 2px solid #e9ecef; border-radius: 10px; overflow: hidden;">
                <div class="receita-header" style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px;">
                    <h3 style="margin: 0; font-size: 24px;">${receita.descricao}</h3>
                    <div style="margin-top: 10px; display: flex; gap: 20px; flex-wrap: wrap;">
                        <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; font-size: 14px;">
                            📏 Rendimento Original: ${receita.rendimento} ${receita.unidadeRendimento}
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; font-size: 14px;">
                            ⚖️ Peso: ${receita.pesoFinal ? receita.pesoFinal.toFixed(3) : '0,000'} KG
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 15px; font-size: 14px;">
                            💰 Custo: R$ ${receita.precoTotal ? receita.precoTotal.toFixed(2) : '0,00'}
                        </span>
                    </div>
                </div>
                
                <div class="receita-utilizacoes" style="background: #f8f9fa; padding: 15px;">
                    <h4 style="color: #495057; margin-bottom: 10px;">📍 Onde será utilizada:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">
        `;
        
        receitaInfo.utilizacoes.forEach(uso => {
            const fatorMultiplicador = uso.totalPorComensais / (receita.rendimento || 1);
            conteudoImpressao += `
                <div style="background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #28a745;">
                    <strong>${uso.cliente}</strong> - ${uso.data}<br>
                    <span style="color: #667eea;">${uso.tipoRefeicao}</span> | 
                    <span style="color: #28a745; font-weight: bold;">${uso.totalPorComensais} ${receita.unidadeRendimento}</span>
                    (${uso.comensais} comensais × ${uso.quantidadePorPessoa})
                    ${fatorMultiplicador !== 1 ? `<br><em style="color: #666; font-size: 12px;">Fator: ${fatorMultiplicador.toFixed(2)}x</em>` : ''}
                </div>
            `;
        });
        
        conteudoImpressao += `
                    </div>
                </div>
                
                <div class="receita-body" style="padding: 25px; background: white;">
        `;
        
        // Ingredientes
        if (receita.ingredientes && receita.ingredientes.length > 0) {
            conteudoImpressao += `
                <div class="ingredientes-section" style="margin-bottom: 30px;">
                    <h4 style="color: #667eea; margin-bottom: 15px; border-bottom: 1px solid #e9ecef; padding-bottom: 8px;">
                        🥘 Ingredientes (Receita Base)
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px;">
            `;
            
            receita.ingredientes.forEach(ingrediente => {
                conteudoImpressao += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 5px; border-left: 3px solid #28a745;">
                        <span style="font-weight: 500;">${ingrediente.nome}</span>
                        <span style="color: #667eea; font-weight: 600;">${ingrediente.quantidade} ${ingrediente.unidadeMedida}</span>
                    </div>
                `;
            });
            
            conteudoImpressao += `
                    </div>
                </div>
            `;
        }
        
        // Modo de preparo
        conteudoImpressao += `
            <div class="modo-preparo-section">
                <h4 style="color: #667eea; margin-bottom: 15px; border-bottom: 1px solid #e9ecef; padding-bottom: 8px;">
                    👨‍🍳 Modo de Preparo
                </h4>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; line-height: 1.6;">
        `;
        
        if (receita.textoReceita && receita.textoReceita.trim()) {
            conteudoImpressao += receita.textoReceita;
        } else {
            conteudoImpressao += '<p style="color: #999; font-style: italic;">Modo de preparo não cadastrado.</p>';
        }
        
        conteudoImpressao += `
                </div>
            </div>
        `;
        
        // Cálculos para cada utilização
        if (receitaInfo.utilizacoes.length > 0) {
            conteudoImpressao += `
                <div class="calculos-section" style="margin-top: 25px;">
                    <h4 style="color: #667eea; margin-bottom: 15px; border-bottom: 1px solid #e9ecef; padding-bottom: 8px;">
                        🧮 Cálculos de Ingredientes por Utilização
                    </h4>
            `;
            
            receitaInfo.utilizacoes.forEach(uso => {
                const fatorMultiplicador = uso.totalPorComensais / (receita.rendimento || 1);
                
                conteudoImpressao += `
                    <div style="margin-bottom: 20px; background: #f0f8ff; padding: 15px; border-radius: 8px; border: 1px solid #cce7ff;">
                        <h5 style="color: #333; margin-bottom: 10px;">
                            ${uso.cliente} - ${uso.data} - ${uso.tipoRefeicao} 
                            (${uso.comensais} comensais)
                        </h5>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px;">
                `;
                
                if (receita.ingredientes && receita.ingredientes.length > 0) {
                    receita.ingredientes.forEach(ingrediente => {
                        const quantidadeCalculada = ingrediente.quantidade * fatorMultiplicador;
                        conteudoImpressao += `
                            <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: white; border-radius: 3px; font-size: 13px;">
                                <span>${ingrediente.nome}</span>
                                <span style="color: #667eea; font-weight: 600;">
                                    ${quantidadeCalculada.toFixed(3)} ${ingrediente.unidadeMedida}
                                </span>
                            </div>
                        `;
                    });
                }
                
                conteudoImpressao += `
                        </div>
                    </div>
                `;
            });
            
            conteudoImpressao += `</div>`;
        }
        
        conteudoImpressao += `
                </div>
            </div>
        `;
    });
    
    conteudoImpressao += `
        </div>
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e9ecef; padding-top: 15px;">
            Receitas impressas em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </div>
        </body></html>
    `;
    
    abrirJanelaImpressao(conteudoImpressao);
    fecharModal('modalImpressao');
}

// Função auxiliar para coletar receitas utilizadas
function coletarReceitasUtilizadas(clientesSelecionados, tiposRefeicaoSelecionados, datasParaImprimir) {
    const receitasMap = new Map();
    
    clientesSelecionados.forEach(cliente => {
        datasParaImprimir.forEach(data => {
            if (cardapios[data] && cardapios[data][cliente.codigo]) {
                cliente.tiposRefeicao.forEach(tipo => {
                    if (tiposRefeicaoSelecionados.includes(tipo.codigo) &&
                        cardapios[data][cliente.codigo][tipo.codigo]) {
                        
                        cardapios[data][cliente.codigo][tipo.codigo].forEach(receita => {
                            if (!receitasMap.has(receita.codigo)) {
                                receitasMap.set(receita.codigo, {
                                    codigo: receita.codigo,
                                    descricao: receita.descricao,
                                    utilizacoes: []
                                });
                            }
                            
                            receitasMap.get(receita.codigo).utilizacoes.push({
                                cliente: cliente.descricao,
                                data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR'),
                                tipoRefeicao: tipo.descricao,
                                comensais: receita.comensais,
                                quantidadePorPessoa: receita.quantidadePorPessoa,
                                totalPorComensais: receita.totalPorComensais
                            });
                        });
                    }
                });
            }
        });
    });
    
    return Array.from(receitasMap.values()).sort((a, b) => a.descricao.localeCompare(b.descricao));
}

function imprimirPreparos() {
    const dataInicio = document.getElementById('dataInicioPeriodo').value;
    const dataFim = document.getElementById('dataFimPeriodo').value;
    
    if (!dataInicio || !dataFim) {
        mostrarAlerta('Preencha o período!', 'error');
        return;
    }
    
    const clientesSelecionados = obterClientesSelecionados();
    const tiposRefeicaoSelecionados = obterTiposRefeicaoSelecionados();
    
    if (clientesSelecionados.length === 0) {
        mostrarAlerta('Selecione pelo menos um cliente!', 'error');
        return;
    }
    
    if (tiposRefeicaoSelecionados.length === 0) {
        mostrarAlerta('Selecione pelo menos um tipo de refeição!', 'error');
        return;
    }
    
    const datasParaImprimir = obterDatasIntervalo(dataInicio, dataFim);
    let conteudoImpressao = gerarCabecalhoImpressao(clientesSelecionados, dataInicio, dataFim, 'Preparos');
    
    clientesSelecionados.forEach(cliente => {
        conteudoImpressao += `<div class="cliente-section">`;
        conteudoImpressao += `<h2 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin: 20px 0;">${cliente.descricao}</h2>`;
        
        datasParaImprimir.forEach(data => {
            const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
            conteudoImpressao += `<div class="data"><h3>${dataFormatada}</h3>`;
            
            if (cardapios[data] && cardapios[data][cliente.codigo]) {
                let temCardapio = false;
                
                cliente.tiposRefeicao.forEach(tipo => {
                    if (tiposRefeicaoSelecionados.includes(tipo.codigo) &&
                        cardapios[data][cliente.codigo][tipo.codigo] && 
                        cardapios[data][cliente.codigo][tipo.codigo].length > 0) {
                        
                        temCardapio = true;
                        conteudoImpressao += `<div class="tipo-refeicao"><h4>${tipo.descricao}</h4>`;
                        
                        cardapios[data][cliente.codigo][tipo.codigo].forEach(receita => {
                            conteudoImpressao += `<div class="receita-preparo">`;
                            conteudoImpressao += `<h5>${receita.descricao} - ${receita.totalPorComensais} ${receita.unidadeBasica}</h5>`;
                            
                            // Calcular ingredientes para a quantidade total
                            if (receita.ingredientes && receita.ingredientes.length > 0) {
                                const receitaOriginal = receitas.find(r => r.codigo === receita.codigo);
                                const fatorMultiplicador = receita.totalPorComensais / (receitaOriginal?.rendimento || 1);
                                
                                conteudoImpressao += `<div class="ingredientes">`;
                                conteudoImpressao += `<strong>Ingredientes:</strong><br>`;
                                
                                receita.ingredientes.forEach(ingrediente => {
                                    const quantidadeCalculada = ingrediente.quantidade * fatorMultiplicador;
                                    conteudoImpressao += `• ${ingrediente.nome}: ${quantidadeCalculada.toFixed(3)} ${ingrediente.unidadeMedida}<br>`;
                                });
                                
                                conteudoImpressao += `</div>`;
                            }
                            
                            conteudoImpressao += `</div>`;
                        });
                        
                        conteudoImpressao += `</div>`;
                    }
                });
                
                if (!temCardapio) {
                    conteudoImpressao += `<div class="sem-cardapio">Nenhum cardápio cadastrado para esta data nos tipos selecionados</div>`;
                }
            } else {
                conteudoImpressao += `<div class="sem-cardapio">Nenhum cardápio cadastrado para esta data</div>`;
            }
            
            conteudoImpressao += `</div>`;
        });
        
        conteudoImpressao += `</div>`;
    });
    
    conteudoImpressao += `</body></html>`;
    
    abrirJanelaImpressao(conteudoImpressao);
    fecharModal('modalImpressao');
}

function imprimirListaProdutos() {
    const dataInicio = document.getElementById('dataInicioPeriodo').value;
    const dataFim = document.getElementById('dataFimPeriodo').value;
    
    if (!dataInicio || !dataFim) {
        mostrarAlerta('Preencha o período!', 'error');
        return;
    }
    
    const clientesSelecionados = obterClientesSelecionados();
    const tiposRefeicaoSelecionados = obterTiposRefeicaoSelecionados();
    
    if (clientesSelecionados.length === 0) {
        mostrarAlerta('Selecione pelo menos um cliente!', 'error');
        return;
    }
    
    if (tiposRefeicaoSelecionados.length === 0) {
        mostrarAlerta('Selecione pelo menos um tipo de refeição!', 'error');
        return;
    }
    
    const datasParaImprimir = obterDatasIntervalo(dataInicio, dataFim);
    
    // Consolidar todos os produtos necessários
    const produtosConsolidados = {};
    
    clientesSelecionados.forEach(cliente => {
        datasParaImprimir.forEach(data => {
            if (cardapios[data] && cardapios[data][cliente.codigo]) {
                cliente.tiposRefeicao.forEach(tipo => {
                    if (tiposRefeicaoSelecionados.includes(tipo.codigo) &&
                        cardapios[data][cliente.codigo][tipo.codigo]) {
                        
                        cardapios[data][cliente.codigo][tipo.codigo].forEach(receita => {
                            if (receita.ingredientes && receita.ingredientes.length > 0) {
                                const receitaOriginal = receitas.find(r => r.codigo === receita.codigo);
                                const fatorMultiplicador = receita.totalPorComensais / (receitaOriginal?.rendimento || 1);
                                
                                receita.ingredientes.forEach(ingrediente => {
                                    const quantidadeCalculada = ingrediente.quantidade * fatorMultiplicador;
                                    
                                    if (!produtosConsolidados[ingrediente.codigoProduto]) {
                                        produtosConsolidados[ingrediente.codigoProduto] = {
                                            nome: ingrediente.nome,
                                            quantidade: 0,
                                            unidade: ingrediente.unidadeMedida
                                        };
                                    }
                                    
                                    produtosConsolidados[ingrediente.codigoProduto].quantidade += quantidadeCalculada;
                                });
                            }
                        });
                    }
                });
            }
        });
    });
    
    let conteudoImpressao = gerarCabecalhoImpressao(clientesSelecionados, dataInicio, dataFim, 'Lista de Produtos');
    
    conteudoImpressao += `<div class="lista-produtos">`;
    conteudoImpressao += `<h3>Produtos Necessários</h3>`;
    conteudoImpressao += `<p><strong>Clientes:</strong> ${clientesSelecionados.map(c => c.descricao).join(', ')}</p>`;
    conteudoImpressao += `<p><strong>Tipos de Refeição:</strong> ${tiposRefeicaoSelecionados.map(codigo => {
        const tipo = tiposRefeicoes.find(t => t.codigo === codigo);
        return tipo ? tipo.descricao : codigo;
    }).join(', ')}</p>`;
    conteudoImpressao += `<table border="1" style="width: 100%; border-collapse: collapse; margin-top: 20px;">`;
    conteudoImpressao += `<thead><tr><th>Código</th><th>Produto</th><th>Quantidade</th><th>Unidade</th></tr></thead>`;
    conteudoImpressao += `<tbody>`;
    
    // Ordenar produtos por nome
    const produtosOrdenados = Object.keys(produtosConsolidados)
        .map(codigo => ({
            codigo,
            ...produtosConsolidados[codigo]
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    
    produtosOrdenados.forEach(produto => {
        conteudoImpressao += `<tr>`;
        conteudoImpressao += `<td>${produto.codigo}</td>`;
        conteudoImpressao += `<td>${produto.nome}</td>`;
        conteudoImpressao += `<td>${produto.quantidade.toFixed(3)}</td>`;
        conteudoImpressao += `<td>${produto.unidade}</td>`;
        conteudoImpressao += `</tr>`;
    });
    
    conteudoImpressao += `</tbody>`;
    conteudoImpressao += `</table>`;
    
    // Resumo
    conteudoImpressao += `<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">`;
    conteudoImpressao += `<h4>Resumo</h4>`;
    conteudoImpressao += `<p><strong>Total de produtos diferentes:</strong> ${produtosOrdenados.length}</p>`;
    conteudoImpressao += `<p><strong>Período:</strong> ${datasParaImprimir.length} dias</p>`;
    conteudoImpressao += `<p><strong>Clientes:</strong> ${clientesSelecionados.length}</p>`;
    conteudoImpressao += `</div>`;
    
    conteudoImpressao += `</div>`;
    conteudoImpressao += `</body></html>`;
    
    abrirJanelaImpressao(conteudoImpressao);
    fecharModal('modalImpressao');
}

function obterDatasIntervalo(dataInicio, dataFim) {
    const datasParaImprimir = [];
    const dataAtual = new Date(dataInicio);
    const dataFinal = new Date(dataFim);
    
    while (dataAtual <= dataFinal) {
        datasParaImprimir.push(dataAtual.toISOString().split('T')[0]);
        dataAtual.setDate(dataAtual.getDate() + 1);
    }
    
    return datasParaImprimir;
}

function gerarCabecalhoImpressao(clientesSelecionados, dataInicio, dataFim, tipoImpressao) {
    const nomeClientes = clientesSelecionados.length === 1 
        ? clientesSelecionados[0].descricao
        : `${clientesSelecionados.length} clientes selecionados`;
        
    return `
        <html>
        <head>
            <title>${tipoImpressao} - ${nomeClientes}</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    margin: 20px; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 20px;
                }
                .cliente-section {
                    margin-bottom: 30px;
                    page-break-before: auto;
                }
                .data { 
                    margin-bottom: 25px; 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    border-radius: 8px; 
                    background: #f9f9f9;
                }
                .tipo-refeicao { 
                    margin-bottom: 15px; 
                    padding: 10px;
                    background: white;
                    border-radius: 5px;
                }
                .tipo-refeicao h4 { 
                    color: #667eea; 
                    margin-bottom: 10px; 
                    border-bottom: 1px solid #eee;
                    padding-bottom: 5px;
                }
                .receita { 
                    margin-left: 20px; 
                    margin-bottom: 8px; 
                }
                .receita-preparo {
                    margin-left: 20px;
                    margin-bottom: 15px;
                    padding: 10px;
                    border: 1px solid #eee;
                    border-radius: 5px;
                    background: #fdfdfd;
                }
                .receita-preparo h5 {
                    color: #333;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                .ingredientes {
                    margin-top: 10px;
                    padding: 8px;
                    background: #f5f5f5;
                    border-radius: 3px;
                    font-size: 12px;
                }
                .sem-cardapio { 
                    color: #999; 
                    font-style: italic; 
                    text-align: center;
                    padding: 20px;
                }
                .lista-produtos {
                    margin: 20px 0;
                }
                .lista-produtos table {
                    margin-top: 15px;
                }
                .lista-produtos th {
                    background: #667eea;
                    color: white;
                    padding: 10px;
                    text-align: left;
                }
                .lista-produtos td {
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                }
                @media print {
                    body { margin: 0; font-size: 12px; }
                    .data { page-break-inside: avoid; }
                    .receita-preparo { page-break-inside: avoid; }
                    .cliente-section { page-break-before: always; }
                    .cliente-section:first-child { page-break-before: auto; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${tipoImpressao} - ${nomeClientes}</h1>
                <p><strong>Período:</strong> ${new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                <p><strong>Data de Impressão:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
    `;
}

function abrirJanelaImpressao(conteudoHtml) {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(conteudoHtml);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    
    // Aguardar o carregamento antes de imprimir
    setTimeout(() => {
        janelaImpressao.print();
    }, 500);
}

// =================== VISUALIZAÇÃO SEMANAL ===================

function abrirVisualizacaoSemanal() {
    const janelaVisualizacao = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes');
    janelaVisualizacao.document.write(gerarHtmlVisualizacaoSemanal());
    janelaVisualizacao.document.close();
    
    setTimeout(() => {
        configurarVisualizacaoSemanal(janelaVisualizacao);
    }, 500);
}

function configurarVisualizacaoSemanal(janela) {
    const doc = janela.document;
    
    janela.cardapiosData = cardapios;
    janela.clientesData = clientes;
    janela.tiposRefeicoesData = tiposRefeicoes;
    janela.receitasData = receitas;
    
    const hoje = new Date();
    doc.getElementById('dataReferencia').value = hoje.toISOString().split('T')[0];
    
    const filtroCliente = doc.getElementById('filtroCliente');
    filtroCliente.innerHTML = '<option value="">Todos os clientes</option>';
    clientes.forEach((cliente, index) => {
        if (cliente.tiposRefeicao && cliente.tiposRefeicao.length > 0) {
            const option = doc.createElement('option');
            option.value = index;
            option.textContent = cliente.descricao;
            filtroCliente.appendChild(option);
        }
    });
    
    const filtroTipo = doc.getElementById('filtroTipoRefeicao');
    filtroTipo.innerHTML = '<option value="">Todos os tipos</option>';
    tiposRefeicoes.forEach(tipo => {
        const option = doc.createElement('option');
        option.value = tipo.codigo;
        option.textContent = tipo.descricao;
        filtroTipo.appendChild(option);
    });
    
    janela.carregarSemana = function() {
        carregarDadosSemana(janela);
    };
    
    janela.navegarSemana = function(direcao) {
        const dataRef = new Date(doc.getElementById('dataReferencia').value);
        dataRef.setDate(dataRef.getDate() + (direcao * 7));
        doc.getElementById('dataReferencia').value = dataRef.toISOString().split('T')[0];
        carregarDadosSemana(janela);
    };
    
    janela.alternarVisualizacao = function(tipo) {
        const btnGrid = doc.getElementById('btnGrid');
        const btnDetalhada = doc.getElementById('btnDetalhada');
        const gridView = doc.getElementById('gridView');
        const detailedView = doc.getElementById('detailedView');
        
        btnGrid.classList.toggle('active', tipo === 'grid');
        btnDetalhada.classList.toggle('active', tipo === 'detalhada');
        
        if (tipo === 'grid') {
            gridView.classList.remove('hidden');
            detailedView.classList.add('hidden');
        } else {
            gridView.classList.add('hidden');
            detailedView.classList.remove('hidden');
        }
    };
    
    carregarDadosSemana(janela);
}

function carregarDadosSemana(janela) {
    const doc = janela.document;
    const dataRef = new Date(doc.getElementById('dataReferencia').value);
    const filtroClienteIndex = doc.getElementById('filtroCliente').value;
    const filtroTipoRefeicao = doc.getElementById('filtroTipoRefeicao').value;
    
    const inicioSemana = new Date(dataRef);
    inicioSemana.setDate(dataRef.getDate() - dataRef.getDay());
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    
    const weekDisplay = doc.getElementById('weekDisplay');
    weekDisplay.textContent = 
        `${inicioSemana.getDate().toString().padStart(2, '0')}/${(inicioSemana.getMonth() + 1).toString().padStart(2, '0')} - ${fimSemana.getDate().toString().padStart(2, '0')}/${(fimSemana.getMonth() + 1).toString().padStart(2, '0')}/${fimSemana.getFullYear()}`;
    
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        diasSemana.push(dia.toISOString().split('T')[0]);
    }
    
    let clientesFiltrados = clientes.filter(cliente => 
        cliente.tiposRefeicao && cliente.tiposRefeicao.length > 0
    );
    
    if (filtroClienteIndex !== '') {
        clientesFiltrados = [clientes[parseInt(filtroClienteIndex)]];
    }
    
    gerarVisualizacaoGrade(janela, clientesFiltrados, diasSemana, filtroTipoRefeicao);
    gerarVisualizacaoDetalhada(janela, clientesFiltrados, diasSemana, filtroTipoRefeicao);
    atualizarResumoSemana(janela, clientesFiltrados, diasSemana, filtroTipoRefeicao);
}

function gerarVisualizacaoGrade(janela, clientesFiltrados, diasSemana, filtroTipoRefeicao) {
    const doc = janela.document;
    const weekGrid = doc.getElementById('weekGrid');
    
    weekGrid.innerHTML = '';
    
    const headerCliente = doc.createElement('div');
    headerCliente.className = 'week-header';
    headerCliente.textContent = 'Cliente';
    weekGrid.appendChild(headerCliente);
    
    diasSemana.forEach(data => {
        const dataObj = new Date(data + 'T00:00:00');
        const diasSemanaNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const header = doc.createElement('div');
        header.className = 'week-header';
        header.innerHTML = `${diasSemanaNames[dataObj.getDay()]}<br>${dataObj.getDate().toString().padStart(2, '0')}/${(dataObj.getMonth() + 1).toString().padStart(2, '0')}`;
        weekGrid.appendChild(header);
    });
    
    clientesFiltrados.forEach(cliente => {
        const clienteHeader = doc.createElement('div');
        clienteHeader.className = 'client-header';
        clienteHeader.textContent = cliente.descricao;
        weekGrid.appendChild(clienteHeader);
        
        diasSemana.forEach(data => {
            const dayCell = doc.createElement('div');
            dayCell.className = 'day-cell';
            
            if (cardapios[data] && cardapios[data][cliente.codigo]) {
                let temCardapio = false;
                let conteudoCell = '';
                
                cliente.tiposRefeicao.forEach(tipo => {
                    if ((filtroTipoRefeicao === '' || filtroTipoRefeicao === tipo.codigo) &&
                        cardapios[data][cliente.codigo][tipo.codigo] && 
                        cardapios[data][cliente.codigo][tipo.codigo].length > 0) {
                        
                        temCardapio = true;
                        conteudoCell += `<div class="meal-type">${tipo.descricao}</div>`;
                        
                        cardapios[data][cliente.codigo][tipo.codigo].forEach(receita => {
                            conteudoCell += `
                                <div class="recipe-item">
                                    ${receita.descricao} 
                                    <span class="recipe-quantity">${receita.totalPorComensais} ${receita.unidadeBasica}</span>
                                </div>
                            `;
                        });
                    }
                });
                
                if (temCardapio) {
                    dayCell.classList.add('has-menu');
                    dayCell.innerHTML = conteudoCell;
                } else {
                    dayCell.innerHTML = '<div class="no-menu">Nenhum cardápio</div>';
                }
            } else {
                dayCell.innerHTML = '<div class="no-menu">Nenhum cardápio</div>';
            }
            
            weekGrid.appendChild(dayCell);
        });
    });
}

function gerarVisualizacaoDetalhada(janela, clientesFiltrados, diasSemana, filtroTipoRefeicao) {
    const doc = janela.document;
    const detailedView = doc.getElementById('detailedView');
    
    detailedView.innerHTML = '';
    
    clientesFiltrados.forEach(cliente => {
        const clienteSection = doc.createElement('div');
        clienteSection.className = 'client-section';
        
        const header = doc.createElement('div');
        header.className = 'client-section-header';
        header.textContent = `🏪 ${cliente.descricao}`;
        clienteSection.appendChild(header);
        
        const content = doc.createElement('div');
        content.className = 'client-section-content';
        
        diasSemana.forEach(data => {
            if (cardapios[data] && cardapios[data][cliente.codigo]) {
                let temCardapioNoDia = false;
                let conteudoDia = '';
                
                cliente.tiposRefeicao.forEach(tipo => {
                    if ((filtroTipoRefeicao === '' || filtroTipoRefeicao === tipo.codigo) &&
                        cardapios[data][cliente.codigo][tipo.codigo] && 
                        cardapios[data][cliente.codigo][tipo.codigo].length > 0) {
                        
                        temCardapioNoDia = true;
                        
                        const totalComensais = Math.max(...cardapios[data][cliente.codigo][tipo.codigo].map(r => r.comensais || 0));
                        
                        conteudoDia += `
                            <div class="meal-detail">
                                <div class="meal-header">
                                    <div class="meal-type-detail">🍽️ ${tipo.descricao}</div>
                                    <div class="comensais-info">${totalComensais} comensais</div>
                                </div>
                                <div class="recipe-list">
                        `;
                        
                        cardapios[data][cliente.codigo][tipo.codigo].forEach(receita => {
                            conteudoDia += `
                                <div class="recipe-detail">
                                    <div class="recipe-name">${receita.descricao}</div>
                                    <div class="recipe-amount">${receita.totalPorComensais} ${receita.unidadeBasica}</div>
                                </div>
                            `;
                        });
                        
                        conteudoDia += `
                                </div>
                            </div>
                        `;
                    }
                });
                
                if (temCardapioNoDia) {
                    const dataObj = new Date(data + 'T00:00:00');
                    const diasSemanaNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    
                    const dayDetail = doc.createElement('div');
                    dayDetail.className = 'day-detail';
                    dayDetail.innerHTML = `
                        <div class="day-label">${diasSemanaNames[dataObj.getDay()]}<br>${dataObj.getDate().toString().padStart(2, '0')}/${(dataObj.getMonth() + 1).toString().padStart(2, '0')}</div>
                        <div class="day-meals">
                            ${conteudoDia}
                        </div>
                    `;
                    content.appendChild(dayDetail);
                }
            }
        });
        
        clienteSection.appendChild(content);
        detailedView.appendChild(clienteSection);
    });
}

function atualizarResumoSemana(janela, clientesFiltrados, diasSemana, filtroTipoRefeicao) {
    const doc = janela.document;
    
    let totalCardapios = 0;
    let clientesAtivos = 0;
    let tiposRefeicaoUtilizados = new Set();
    let totalComensais = 0;
    
    clientesFiltrados.forEach(cliente => {
        let clienteTemCardapio = false;
        
        diasSemana.forEach(data => {
            if (cardapios[data] && cardapios[data][cliente.codigo]) {
                cliente.tiposRefeicao.forEach(tipo => {
                    if ((filtroTipoRefeicao === '' || filtroTipoRefeicao === tipo.codigo) &&
                        cardapios[data][cliente.codigo][tipo.codigo] && 
                        cardapios[data][cliente.codigo][tipo.codigo].length > 0) {
                        
                        totalCardapios++;
                        clienteTemCardapio = true;
                        tiposRefeicaoUtilizados.add(tipo.codigo);
                        
                        cardapios[data][cliente.codigo][tipo.codigo].forEach(receita => {
                            totalComensais += receita.comensais || 0;
                        });
                    }
                });
            }
        });
        
        if (clienteTemCardapio) {
            clientesAtivos++;
        }
    });
    
    doc.getElementById('totalCardapios').textContent = totalCardapios;
    doc.getElementById('clientesAtivos').textContent = clientesAtivos;
    doc.getElementById('tiposRefeicoes').textContent = tiposRefeicaoUtilizados.size;
    doc.getElementById('totalComensais').textContent = totalComensais.toLocaleString('pt-BR');
}

function gerarHtmlVisualizacaoSemanal() {
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Visualização Semanal de Cardápios</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; } .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; } .header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 20px; text-align: center; } .controls { padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; display: flex; gap: 15px; align-items: center; flex-wrap: wrap; } .control-group { display: flex; flex-direction: column; gap: 5px; } .control-group label { font-weight: 600; color: #333; font-size: 12px; } .control-group input, .control-group select { padding: 8px 12px; border: 1px solid #e9ecef; border-radius: 5px; font-size: 14px; } .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; } .btn-primary { background: linear-gradient(45deg, #667eea, #764ba2); color: white; } .btn-secondary { background: #6c757d; color: white; } .week-navigation { display: flex; align-items: center; gap: 10px; margin-left: auto; } .week-display { background: white; padding: 8px 15px; border-radius: 20px; border: 2px solid #667eea; font-weight: 600; color: #667eea; min-width: 200px; text-align: center; } .content { padding: 20px; } .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; } .summary-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-left: 4px solid #667eea; } .summary-card h3 { color: #667eea; margin-bottom: 10px; font-size: 16px; } .summary-value { font-size: 24px; font-weight: bold; color: #333; } .view-toggle { display: flex; gap: 10px; margin-bottom: 20px; } .toggle-btn { padding: 8px 16px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; } .toggle-btn.active { background: #667eea; color: white; } .week-grid { display: grid; grid-template-columns: 150px repeat(7, 1fr); gap: 1px; background: #e9ecef; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); } .week-header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 15px 10px; text-align: center; font-weight: 600; font-size: 14px; } .client-header { background: #495057; color: white; padding: 15px 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 13px; } .day-cell { background: white; padding: 10px 8px; min-height: 120px; font-size: 11px; line-height: 1.3; } .day-cell.has-menu { background: #e8f5e8; border-left: 3px solid #28a745; } .meal-type { background: #667eea; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-bottom: 4px; display: inline-block; } .recipe-item { background: #f8f9fa; padding: 3px 6px; border-radius: 3px; margin-bottom: 2px; border-left: 2px solid #28a745; font-size: 10px; } .recipe-quantity { color: #666; font-weight: 600; } .no-menu { color: #999; font-style: italic; text-align: center; padding-top: 40px; } .hidden { display: none !important; } .client-section { background: white; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden; } .client-section-header { background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 15px 20px; font-weight: 600; font-size: 18px; } .client-section-content { padding: 20px; } .day-detail { display: grid; grid-template-columns: 100px 1fr; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e9ecef; } .day-detail:last-child { border-bottom: none; margin-bottom: 0; } .day-label { font-weight: 600; color: #495057; display: flex; align-items: center; background: #f8f9fa; padding: 10px; border-radius: 5px; text-align: center; justify-content: center; } .day-meals { display: flex; flex-direction: column; gap: 10px; } .meal-detail { background: #f8f9fa; border-radius: 8px; padding: 15px; border-left: 4px solid #28a745; } .meal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; } .meal-type-detail { font-weight: 600; color: #495057; font-size: 14px; } .comensais-info { background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; } .recipe-list { display: flex; flex-direction: column; gap: 5px; } .recipe-detail { background: white; padding: 8px 12px; border-radius: 5px; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; } .recipe-name { font-weight: 500; color: #333; } .recipe-amount { color: #667eea; font-weight: 600; font-size: 12px; } @media (max-width: 768px) { .week-grid { display: none; } .controls { flex-direction: column; align-items: stretch; } .summary-cards { grid-template-columns: 1fr; } .day-detail { grid-template-columns: 1fr; } }</style></head><body><div class="container"><div class="header"><h1>📅 Visualização Semanal de Cardápios</h1><p>Visão geral completa dos cardápios de todos os clientes</p></div><div class="controls"><div class="control-group"><label>Data de Referência</label><input type="date" id="dataReferencia" onchange="carregarSemana()"></div><div class="control-group"><label>Filtrar Cliente</label><select id="filtroCliente" onchange="carregarSemana()"><option value="">Todos os clientes</option></select></div><div class="control-group"><label>Filtrar Tipo de Refeição</label><select id="filtroTipoRefeicao" onchange="carregarSemana()"><option value="">Todos os tipos</option></select></div><div class="week-navigation"><button class="btn btn-secondary" onclick="navegarSemana(-1)">❮ Semana Anterior</button><div class="week-display" id="weekDisplay">Carregando...</div><button class="btn btn-secondary" onclick="navegarSemana(1)">Próxima Semana ❯</button></div></div><div class="content"><div class="view-toggle"><button class="toggle-btn active" onclick="alternarVisualizacao('grid')" id="btnGrid">📊 Visão em Grade</button><button class="toggle-btn" onclick="alternarVisualizacao('detalhada')" id="btnDetalhada">📋 Visão Detalhada</button></div><div class="summary-cards"><div class="summary-card"><h3>📊 Total de Cardápios</h3><div class="summary-value" id="totalCardapios">0</div></div><div class="summary-card"><h3>👥 Clientes Ativos</h3><div class="summary-value" id="clientesAtivos">0</div></div><div class="summary-card"><h3>🍽️ Tipos de Refeições</h3><div class="summary-value" id="tiposRefeicoes">0</div></div><div class="summary-card"><h3>👨‍🍳 Total de Comensais</h3><div class="summary-value" id="totalComensais">0</div></div></div><div class="week-overview" id="gridView"><div class="week-grid" id="weekGrid"></div></div><div class="detailed-view hidden" id="detailedView"></div></div></div></body></html>`;
}