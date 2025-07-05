// Funções específicas para receitas - ARQUIVO COMPLETO CORRIGIDO

// =================== FUNÇÕES BÁSICAS DE RECEITAS ===================

function salvarReceita(e) {
    e.preventDefault();
    
    // Pegar valores calculados
    let precoTotal = 0;
    let pesoFinal = parseFloat(document.getElementById('pesoFinal').value) || 0;
    
    if (window.receitaTemporaria) {
        precoTotal = window.receitaTemporaria.precoTotal || 0;
        pesoFinal = window.receitaTemporaria.pesoFinal || pesoFinal;
    }
    
    const receita = {
        codigo: document.getElementById('codigoReceita').value,
        descricao: document.getElementById('descricaoReceita').value,
        pesoFinal: pesoFinal,
        rendimento: parseFloat(document.getElementById('rendimento').value) || 0,
        unidadeRendimento: document.getElementById('unidadeRendimento').value,
        ingredientes: [...ingredientesReceita],
        precoTotal: precoTotal, // Usar valor calculado
        textoReceita: getRecipeText()
    };

    if (editandoReceita !== null) {
        receitas[editandoReceita] = receita;
        editandoReceita = null;
        mostrarAlerta('Receita editada com sucesso!', 'success');
    } else {
        receitas.push(receita);
        proximoCodigoReceita++;
        mostrarAlerta('Receita salva com sucesso!', 'success');
        // Limpar variável temporária
        window.receitaTemporaria = null;
    }

    limparFormularioReceita();
    atualizarTabelaReceitas();
}

function atualizarTabelaReceitas() {
    const tbody = document.querySelector('#tabelaReceitas tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    receitas.forEach((receita, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${receita.codigo}</td>
            <td>${receita.descricao}</td>
            <td>${receita.pesoFinal.toFixed(3)} KG</td>
            <td>R$ ${receita.precoTotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-primary" onclick="abrirModalVisualizarReceita(${index})" title="Visualizar">👁️</button>
                <button class="btn btn-secondary" onclick="editarReceita(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirReceita(${index})">Excluir</button>
            </td>
        `;
    });
}


function limparFormularioReceita() {
document.getElementById('formReceita').reset();
    gerarProximoCodigoReceita();
    ingredientesReceita = [];
    atualizarTabelaIngredientes();
    setRecipeText('');
    
    // Limpar campos calculados
    document.getElementById('precoTotal').textContent = 'R$ 0,00';
    document.getElementById('pesoFinalCalculado').textContent = '0,000 KG';
    
    // Limpar variáveis temporárias
    window.receitaTemporaria = null;
    editandoReceita = null;
}

function atualizarTabelaReceitas() {
    const tbody = document.querySelector('#tabelaReceitas tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    receitas.forEach((receita, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${receita.codigo}</td>
            <td>${receita.descricao}</td>
            <td>${receita.rendimento} ${receita.unidadeRendimento}</td>
            <td>${receita.pesoFinal.toFixed(3)} KG</td>
            <td>R$ ${receita.precoTotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-primary" onclick="abrirModalVisualizarReceita(${index})" title="Visualizar">👁️</button>
                <button class="btn btn-secondary" onclick="editarReceita(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirReceita(${index})">Excluir</button>
            </td>
        `;
    });
}

function editarReceita(index) {
    const receita = receitas[index];
    document.getElementById('codigoReceita').value = receita.codigo;
    document.getElementById('descricaoReceita').value = receita.descricao;
    document.getElementById('pesoFinal').value = receita.pesoFinal.toFixed(3);
    document.getElementById('rendimento').value = receita.rendimento.toFixed(3);
    document.getElementById('unidadeRendimento').value = receita.unidadeRendimento;
    ingredientesReceita = [...receita.ingredientes];
    atualizarTabelaIngredientes();
    setRecipeText(receita.textoReceita || '');
    
    // Atualizar campos calculados na tela
    document.getElementById('precoTotal').textContent = `R$ ${receita.precoTotal.toFixed(2)}`;
    document.getElementById('pesoFinalCalculado').textContent = `${receita.pesoFinal.toFixed(3)} KG`;
    
    editandoReceita = index;
}

function excluirReceita(index) {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
        receitas.splice(index, 1);
        atualizarTabelaReceitas();
        mostrarAlerta('Receita excluída com sucesso!', 'success');
    }
}

// =================== FUNÇÕES DE INGREDIENTES ===================

function abrirModalIngredientes() {
    document.getElementById('modalIngredientes').style.display = 'block';
    carregarListaIngredientes();
}

function carregarListaIngredientes() {
    const container = document.getElementById('listaIngredientes');
    if (!container) return;
    
    container.innerHTML = '';

    produtos.forEach((produto, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${produto.codigo} - ${produto.descricao}</span>
            <button class="btn btn-primary" onclick="adicionarIngrediente(${index})">Adicionar</button>
        `;
        container.appendChild(div);
    });
}

function filtrarIngredientes() {
    const search = document.getElementById('searchIngredientes').value.toLowerCase();
    const items = document.querySelectorAll('#listaIngredientes .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

function adicionarIngrediente(produtoIndex) {
    const produto = produtos[produtoIndex];
    
    // Verificar se já existe
    if (ingredientesReceita.find(ing => ing.codigoProduto === produto.codigo)) {
        mostrarAlerta('Ingrediente já adicionado!', 'error');
        return;
    }

    const ingrediente = {
        codigoProduto: produto.codigo,
        nome: produto.descricao,
        quantidade: 0,
        unidadeMedida: produto.unidadeMedida,
        perdaPercent: 0,
        ganhoPercent: 0,
        precoUnitario: produto.precoItem
    };

    ingredientesReceita.push(ingrediente);
    atualizarTabelaIngredientes();
    mostrarAlerta('Ingrediente adicionado!', 'success');
}

function atualizarTabelaIngredientes() {
    const tbody = document.querySelector('#tabelaIngredientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    ingredientesReceita.forEach((ingrediente, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${ingrediente.codigoProduto}</td>
            <td>${ingrediente.nome}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.quantidade}" onchange="atualizarIngrediente(${index}, 'quantidade', this.value)" step="0.001"></td>
            <td>${ingrediente.unidadeMedida}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.perdaPercent}" onchange="atualizarIngrediente(${index}, 'perdaPercent', this.value)" step="0.01"></td>
            <td><input type="number" class="inline-edit" value="${ingrediente.ganhoPercent}" onchange="atualizarIngrediente(${index}, 'ganhoPercent', this.value)" step="0.01"></td>
            <td>R$ ${ingrediente.precoUnitario.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" onclick="removerIngrediente(${index})">Remover</button>
            </td>
        `;
    });
}

function atualizarIngrediente(index, campo, valor) {
    ingredientesReceita[index][campo] = parseFloat(valor) || 0;
}

function removerIngrediente(index) {
    if (confirm('Tem certeza que deseja remover este ingrediente?')) {
        ingredientesReceita.splice(index, 1);
        atualizarTabelaIngredientes();
        mostrarAlerta('Ingrediente removido!', 'success');
    }
}

function calcularReceita() {

    let precoTotal = 0;
    let pesoFinal = 0;

    ingredientesReceita.forEach(ingrediente => {
        // Calcular preço: Quantidade * Preço Unitário
        const precoIngrediente = ingrediente.quantidade * ingrediente.precoUnitario;
        precoTotal += precoIngrediente;

        // Calcular peso
        if (['KG', 'gr', 'mg'].includes(ingrediente.unidadeMedida)) {
            let peso = ingrediente.quantidade;
            
            // Converter para KG
            if (ingrediente.unidadeMedida === 'gr') peso /= 1000;
            if (ingrediente.unidadeMedida === 'mg') peso /= 1000000;
            
            // Aplicar perda e ganho
            peso = peso - (peso * ingrediente.perdaPercent / 100);
            peso = peso + (peso * ingrediente.ganhoPercent / 100);
            
            pesoFinal += peso;
        }
    });

    // Atualizar os campos na tela
    document.getElementById('precoTotal').textContent = `R$ ${precoTotal.toFixed(2)}`;
    document.getElementById('pesoFinalCalculado').textContent = `${pesoFinal.toFixed(3)} KG`;
    document.getElementById('pesoFinal').value = pesoFinal.toFixed(3);

    // CORREÇÃO PRINCIPAL: Atualizar precoTotal na receita atual para salvar
    if (editandoReceita !== null) {
        // Se estamos editando, atualizar a receita existente
        receitas[editandoReceita].precoTotal = precoTotal;
        receitas[editandoReceita].pesoFinal = pesoFinal;
    } else {
        // Se é uma nova receita, criar variável temporária
        window.receitaTemporaria = window.receitaTemporaria || {};
        window.receitaTemporaria.precoTotal = precoTotal;
        window.receitaTemporaria.pesoFinal = pesoFinal;
    }

    mostrarAlerta('Cálculos realizados!', 'success');
}


// =================== EDITOR DE RECEITAS MELHORADO ===================

function formatText(command, value = null) {
    const editor = document.getElementById('textoReceita');
    editor.focus();
    
    document.execCommand(command, false, value);
    updateToolbarButtons();
    updateCharCount();
}

function changeFontSize(size) {
    const editor = document.getElementById('textoReceita');
    editor.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        document.execCommand('fontSize', false, '7');
        
        const fontElements = editor.querySelectorAll('font[size="7"]');
        fontElements.forEach(element => {
            element.style.fontSize = size;
            element.removeAttribute('size');
        });
    } else {
        editor.style.fontSize = size;
    }
    
    updateCharCount();
}

function clearFormatting() {
    const editor = document.getElementById('textoReceita');
    editor.focus();
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        document.execCommand('removeFormat', false, null);
    } else {
        if (confirm('Deseja limpar toda a formatação do texto?')) {
            const content = editor.innerText;
            editor.innerHTML = content.replace(/\n/g, '<br>');
        }
    }
    
    updateToolbarButtons();
    updateCharCount();
}

function updateToolbarButtons() {
    const commands = ['bold', 'italic', 'underline'];
    
    commands.forEach(command => {
        const button = document.querySelector(`[onclick="formatText('${command}')"]`);
        if (button) {
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
}

function updateCharCount() {
    const editor = document.getElementById('textoReceita');
    const counter = document.getElementById('charCount');
    
    if (editor && counter) {
        const text = editor.innerText || editor.textContent || '';
        counter.textContent = text.length;
        
        if (text.length > 2000) {
            counter.style.color = '#dc3545';
        } else if (text.length > 1500) {
            counter.style.color = '#ffc107';
        } else {
            counter.style.color = '#667eea';
        }
    }
}

function updateRecipeText() {
    updateCharCount();
    updateToolbarButtons();
}

function handleEditorKeydown(event) {
    if (event.ctrlKey) {
        switch (event.key.toLowerCase()) {
            case 'b':
                event.preventDefault();
                formatText('bold');
                break;
            case 'i':
                event.preventDefault();
                formatText('italic');
                break;
            case 'u':
                event.preventDefault();
                formatText('underline');
                break;
        }
    }
    
    setTimeout(() => {
        updateCharCount();
    }, 10);
}

function previewReceita() {
    const editor = document.getElementById('textoReceita');
    const content = editor.innerHTML;
    const titulo = document.getElementById('descricaoReceita').value || 'Receita sem título';
    
    if (!content.trim() || content.trim() === '') {
        mostrarAlerta('Digite o modo de preparo antes de visualizar!', 'error');
        return;
    }
    
    // Criar janela de preview
    const previewWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=yes');
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preview - ${titulo}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                .content {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                .print-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 20px 0;
                }
                @media print {
                    .print-btn { display: none; }
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${titulo}</h1>
                <button class="print-btn" onclick="window.print()">Imprimir Receita</button>
            </div>
            <div class="content">
                ${content}
            </div>
        </body>
        </html>
    `);
    previewWindow.document.close();
}

// Função para obter o texto da receita (para salvar)
function getRecipeText() {
    const editor = document.getElementById('textoReceita');
    return editor.innerHTML;
}

// Função para definir o texto da receita (para carregar)
function setRecipeText(htmlContent) {
    const editor = document.getElementById('textoReceita');
    editor.innerHTML = htmlContent || '';
    updateCharCount();
}

// =================== FUNÇÕES DE REDIMENSIONAMENTO ===================

function setEditorSize(size) {
    const editor = document.getElementById('recipeEditor');
    
    // Remover classes de tamanho existentes
    editor.classList.remove('size-small', 'size-medium', 'size-large');
    
    // Adicionar nova classe de tamanho
    if (size !== 'auto') {
        editor.classList.add(`size-${size}`);
    }
    
    // Remover estilos inline para permitir que as classes CSS funcionem
    if (size !== 'auto') {
        editor.style.width = '';
        editor.style.height = '';
    }
}

function initializeResizeHandle() {
    const editor = document.getElementById('recipeEditor');
    const handle = document.getElementById('resizeHandle');
    
    if (!editor || !handle) return;
    
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    
    handle.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(editor).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(editor).height, 10);
        
        document.body.style.cursor = 'nw-resize';
        editor.classList.add('resizing');
        
        // Remover classes de tamanho pré-definido
        editor.classList.remove('size-small', 'size-medium', 'size-large');
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const width = startWidth + e.clientX - startX;
        const height = startHeight + e.clientY - startY;
        
        // Limites mínimos e máximos
        if (width >= 300 && width <= 1200) {
            editor.style.width = width + 'px';
        }
        if (height >= 250 && height <= 800) {
            editor.style.height = height + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            editor.classList.remove('resizing');
        }
    });
}

// =================== MODAL DE VISUALIZAÇÃO DE RECEITA ===================

let receitaAtualModal = null;

function abrirModalVisualizarReceita(index) {
    const receita = receitas[index];
    if (!receita) return;
    
    receitaAtualModal = index;
    
    // Preencher informações da receita
    document.getElementById('tituloReceitaModal').textContent = receita.descricao;
    document.getElementById('rendimentoReceitaModal').textContent = 
        `Rendimento: ${receita.rendimento || 0} ${receita.unidadeRendimento || 'UN'}`;
    document.getElementById('pesoReceitaModal').textContent = 
        `Peso: ${receita.pesoFinal ? receita.pesoFinal.toFixed(3) : '0,000'} KG`;
    document.getElementById('precoReceitaModal').textContent = 
        `Preço: R$ ${receita.precoTotal ? receita.precoTotal.toFixed(2) : '0,00'}`;
    
    // Carregar modo de preparo
    const textoReceita = document.getElementById('textoReceitaModal');
    if (receita.textoReceita && receita.textoReceita.trim()) {
        textoReceita.innerHTML = receita.textoReceita;
    } else {
        textoReceita.innerHTML = '<p style="color: #999; font-style: italic;">Modo de preparo não cadastrado.</p>';
    }
    
    // Carregar ingredientes
    carregarIngredientesModal(receita);
    
    // Mostrar primeiro tab (preparo)
    showReceitaTab('preparo');
    
    // Abrir modal
    document.getElementById('modalVisualizarReceita').style.display = 'block';
}

function carregarIngredientesModal(receita) {
    const container = document.getElementById('ingredientesReceitaModal');
    container.innerHTML = '';
    
    if (!receita.ingredientes || receita.ingredientes.length === 0) {
        container.innerHTML = '<p style="padding: 20px; color: #999; font-style: italic; text-align: center;">Nenhum ingrediente cadastrado.</p>';
        return;
    }
    
    receita.ingredientes.forEach(ingrediente => {
        const div = document.createElement('div');
        div.className = 'ingrediente-modal-item';
        
        div.innerHTML = `
            <div>
                <div class="ingrediente-nome">${ingrediente.nome}</div>
                <div class="ingrediente-detalhes">
                    Código: ${ingrediente.codigoProduto} | 
                    Perda: ${ingrediente.perdaPercent}% | 
                    Ganho: ${ingrediente.ganhoPercent}% | 
                    Preço unitário: R$ ${ingrediente.precoUnitario.toFixed(2)}
                </div>
            </div>
            <div class="ingrediente-quantidade">
                ${ingrediente.quantidade} ${ingrediente.unidadeMedida}
            </div>
        `;
        
        container.appendChild(div);
    });
}

function showReceitaTab(tabName) {
    // Remover active de todas as abas
    document.querySelectorAll('.receita-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.receita-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar aba selecionada
    const tabButton = document.querySelector(`[onclick="showReceitaTab('${tabName}')"]`);
    const tabContent = document.getElementById(`${tabName}-tab`);
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

function editarReceitaModal() {
    if (receitaAtualModal !== null) {
        // Fechar modal
        fecharModal('modalVisualizarReceita');
        
        // Ir para aba de receitas
        showTab('receitas');
        
        // Carregar receita para edição
        editarReceita(receitaAtualModal);
        
        mostrarAlerta('Receita carregada para edição!', 'success');
    }
}

function imprimirReceitaModal() {
    if (receitaAtualModal === null) return;
    
    const receita = receitas[receitaAtualModal];
    const textoReceita = receita.textoReceita || '<p>Modo de preparo não cadastrado.</p>';
    
    // Gerar HTML para impressão
    let htmlImpressao = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receita - ${receita.descricao}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    line-height: 1.6;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                }
                .header h1 {
                    color: #667eea;
                    margin-bottom: 15px;
                }
                .receita-info {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .receita-info span {
                    background: #f8f9fa;
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid #e9ecef;
                    font-weight: 500;
                    font-size: 14px;
                }
                .section {
                    margin-bottom: 30px;
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .section h2 {
                    color: #667eea;
                    margin-bottom: 15px;
                    font-size: 18px;
                    border-bottom: 1px solid #e9ecef;
                    padding-bottom: 8px;
                }
                .ingredientes-grid {
                    display: grid;
                    grid-template-columns: 1fr 100px;
                    gap: 10px;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #f8f9fa;
                }
                .ingredientes-grid:last-child {
                    border-bottom: none;
                }
                .ingrediente-nome {
                    font-weight: 500;
                }
                .ingrediente-quantidade {
                    text-align: right;
                    color: #667eea;
                    font-weight: 600;
                }
                .preparo-content {
                    line-height: 1.7;
                }
                .preparo-content p {
                    margin-bottom: 12px;
                }
                .preparo-content ul, .preparo-content ol {
                    margin: 15px 0;
                    padding-left: 25px;
                }
                .preparo-content li {
                    margin: 8px 0;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    border-top: 1px solid #e9ecef;
                    padding-top: 15px;
                }
                @media print {
                    body { padding: 20px; }
                    .section { 
                        box-shadow: none; 
                        border: 1px solid #e9ecef;
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${receita.descricao}</h1>
                <div class="receita-info">
                    <span>Rendimento: ${receita.rendimento || 0} ${receita.unidadeRendimento || 'UN'}</span>
                    <span>Peso Final: ${receita.pesoFinal ? receita.pesoFinal.toFixed(3) : '0,000'} KG</span>
                    <span>Preço Total: R$ ${receita.precoTotal ? receita.precoTotal.toFixed(2) : '0,00'}</span>
                </div>
            </div>
    `;
    
    // Adicionar ingredientes se existirem
    if (receita.ingredientes && receita.ingredientes.length > 0) {
        htmlImpressao += `
            <div class="section">
                <h2>Ingredientes</h2>
        `;
        
        receita.ingredientes.forEach(ingrediente => {
            htmlImpressao += `
                <div class="ingredientes-grid">
                    <div class="ingrediente-nome">${ingrediente.nome}</div>
                    <div class="ingrediente-quantidade">${ingrediente.quantidade} ${ingrediente.unidadeMedida}</div>
                </div>
            `;
        });
        
        htmlImpressao += `</div>`;
    }
    
    // Adicionar modo de preparo
    htmlImpressao += `
            <div class="section">
                <h2>Modo de Preparo</h2>
                <div class="preparo-content">
                    ${textoReceita}
                </div>
            </div>
            
            <div class="footer">
                Receita impressa em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
        </body>
        </html>
    `;
    
    // Abrir janela de impressão
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(htmlImpressao);
    janelaImpressao.document.close();
    janelaImpressao.focus();
    
    setTimeout(() => {
        janelaImpressao.print();
    }, 500);
}

// =================== INICIALIZAÇÃO MELHORADA ===================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos do editor
    const editor = document.getElementById('textoReceita');
    if (editor) {
        updateCharCount();
        
        editor.addEventListener('mouseup', updateToolbarButtons);
        editor.addEventListener('keyup', updateToolbarButtons);
        editor.addEventListener('focus', updateToolbarButtons);
    }
    
    // Inicializar redimensionamento com delay
    setTimeout(() => {
        initializeResizeHandle();
        console.log('Editor de receitas melhorado inicializado!');
    }, 500);
});

// Função para quando a aba de receitas for aberta
function onReceitasTabOpened() {
    setTimeout(function() {
        initializeResizeHandle();
    }, 100);
}