// receitas.js - Sistema de Receitas com Supabase
// Semana 2 - Adaptação para Supabase

// Verificar se o usuário está logado
async function verificarAutenticacao() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Variáveis globais
let receitasCarregadas = [];
let produtosCarregados = [];
let ingredientesReceita = [];
let editandoReceita = null;

// Inicializar página de receitas
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!await verificarAutenticacao()) {
        return;
    }
    
    // Carregar dados do Supabase
    await carregarReceitas();
    await carregarProdutos();
    
    // Configurar eventos dos botões
    configurarEventos();
    
    // Gerar próximo código
    await gerarProximoCodigoReceita();
    
    // Inicializar editor
    setTimeout(() => {
        initializeResizeHandle();
        updateCharCount();
    }, 500);
});

// Configurar eventos
function configurarEventos() {
    // Formulário de salvar
    const form = document.getElementById('formReceita');
    if (form) {
        form.addEventListener('submit', salvarReceita);
    }
    
    // Botões
    const btnLimpar = document.getElementById('btn-limpar-receita');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormularioReceita);
    }
    
    const btnIngredientes = document.getElementById('btn-ingredientes');
    if (btnIngredientes) {
        btnIngredientes.addEventListener('click', abrirModalIngredientes);
    }
    
    const btnCalcular = document.getElementById('btn-calcular');
    if (btnCalcular) {
        btnCalcular.addEventListener('click', calcularReceita);
    }
    
    // Editor de texto
    const editor = document.getElementById('textoReceita');
    if (editor) {
        editor.addEventListener('input', updateCharCount);
        editor.addEventListener('mouseup', updateToolbarButtons);
        editor.addEventListener('keyup', updateToolbarButtons);
        editor.addEventListener('keydown', handleEditorKeydown);
    }
}

// Carregar receitas do Supabase
async function carregarReceitas() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
            .from('receitas')
            .select(`
                *,
                ingredientes (
                    id,
                    receita_id,
                    produto_id,
                    quantidade,
                    unidade_medida,
                    perda_percent,
                    ganho_percent,
                    preco_unitario,
                    produtos (
                        codigo,
                        descricao
                    )
                )
            `)
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            throw error;
        }

        // Transformar dados para formato compatível
        receitasCarregadas = (data || []).map(receita => ({
            ...receita,
            ingredientes: receita.ingredientes.map(ing => ({
                codigoProduto: ing.produtos.codigo,
                nome: ing.produtos.descricao,
                quantidade: ing.quantidade,
                unidadeMedida: ing.unidade_medida,
                perdaPercent: ing.perda_percent,
                ganhoPercent: ing.ganho_percent,
                precoUnitario: ing.preco_unitario,
                produtoId: ing.produto_id
            }))
        }));
        
        atualizarTabelaReceitas();
        
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
        alert('Erro ao carregar receitas: ' + error.message);
    }
}

// Carregar produtos para ingredientes
async function carregarProdutos() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            throw error;
        }

        produtosCarregados = data || [];
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        produtosCarregados = [];
    }
}

// Gerar próximo código de receita
async function gerarProximoCodigoReceita() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.rpc('get_next_receita_codigo', {
            user_uuid: user.id
        });

        if (error) {
            throw error;
        }

        const input = document.getElementById('codigoReceita');
        if (input) {
            input.value = data || 'REC001';
        }
        
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        const input = document.getElementById('codigoReceita');
        if (input) {
            input.value = 'REC001';
        }
    }
}

// Salvar receita (novo ou editado)
async function salvarReceita(e) {
    e.preventDefault();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Coletar dados do formulário
        const codigo = document.getElementById('codigoReceita').value.trim();
        const descricao = document.getElementById('descricaoReceita').value.trim();
        const pesoFinal = parseFloat(document.getElementById('pesoFinal').value) || 0;
        const rendimento = parseFloat(document.getElementById('rendimento').value) || 0;
        const unidadeRendimento = document.getElementById('unidadeRendimento').value;
        const textoReceita = getRecipeText();

        // Pegar valores calculados
        let precoTotal = 0;
        if (window.receitaTemporaria) {
            precoTotal = window.receitaTemporaria.precoTotal || 0;
        }

        // Validações
        if (!descricao) {
            alert('Por favor, informe a descrição da receita');
            document.getElementById('descricaoReceita').focus();
            return;
        }

        if (!codigo) {
            alert('Por favor, informe o código da receita');
            document.getElementById('codigoReceita').focus();
            return;
        }

        // Preparar dados da receita
        const receitaData = {
            codigo,
            descricao,
            peso_final: pesoFinal,
            rendimento,
            unidade_rendimento: unidadeRendimento,
            preco_total: precoTotal,
            texto_receita: textoReceita,
            user_id: user.id
        };

        let receitaId;
        
        if (editandoReceita !== null) {
            // Atualizar receita existente
            const receitaAtual = receitasCarregadas[editandoReceita];
            const { error } = await supabase
                .from('receitas')
                .update(receitaData)
                .eq('id', receitaAtual.id)
                .eq('user_id', user.id);

            if (error) throw error;
            receitaId = receitaAtual.id;
        } else {
            // Criar nova receita
            const { data, error } = await supabase
                .from('receitas')
                .insert([receitaData])
                .select()
                .single();

            if (error) throw error;
            receitaId = data.id;
        }

        // Salvar ingredientes
        await salvarIngredientesReceita(receitaId);

        alert(editandoReceita !== null ? 'Receita atualizada com sucesso!' : 'Receita criada com sucesso!');
        
        // Limpar formulário e recarregar lista
        limparFormularioReceita();
        await carregarReceitas();

    } catch (error) {
        console.error('Erro ao salvar receita:', error);
        alert('Erro ao salvar receita: ' + error.message);
    }
}

// Salvar ingredientes da receita
async function salvarIngredientesReceita(receitaId) {
    try {
        // Remover ingredientes existentes
        await supabase
            .from('ingredientes')
            .delete()
            .eq('receita_id', receitaId);

        // Adicionar novos ingredientes
        if (ingredientesReceita.length > 0) {
            const ingredientesData = [];
            
            for (const ingrediente of ingredientesReceita) {
                // Buscar produto_id pelo código
                const produto = produtosCarregados.find(p => p.codigo === ingrediente.codigoProduto);
                if (produto) {
                    ingredientesData.push({
                        receita_id: receitaId,
                        produto_id: produto.id,
                        quantidade: ingrediente.quantidade,
                        unidade_medida: ingrediente.unidadeMedida,
                        perda_percent: ingrediente.perdaPercent,
                        ganho_percent: ingrediente.ganhoPercent,
                        preco_unitario: ingrediente.precoUnitario
                    });
                }
            }

            if (ingredientesData.length > 0) {
                const { error } = await supabase
                    .from('ingredientes')
                    .insert(ingredientesData);

                if (error) throw error;
            }
        }

    } catch (error) {
        console.error('Erro ao salvar ingredientes:', error);
        throw error;
    }
}

// Limpar formulário
function limparFormularioReceita() {
    const form = document.getElementById('formReceita');
    if (form) {
        form.reset();
    }
    
    ingredientesReceita = [];
    atualizarTabelaIngredientes();
    setRecipeText('');
    
    // Limpar campos calculados
    const precoTotal = document.getElementById('precoTotal');
    const pesoCalculado = document.getElementById('pesoFinalCalculado');
    if (precoTotal) precoTotal.textContent = 'R$ 0,00';
    if (pesoCalculado) pesoCalculado.textContent = '0,000 KG';
    
    // Limpar variáveis temporárias
    window.receitaTemporaria = null;
    editandoReceita = null;
    
    gerarProximoCodigoReceita();
}

// Renderizar tabela de receitas
function atualizarTabelaReceitas() {
    const tbody = document.querySelector('#tabelaReceitas tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (receitasCarregadas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                    Nenhuma receita encontrada
                </td>
            </tr>
        `;
        return;
    }

    receitasCarregadas.forEach((receita, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${receita.codigo}</td>
            <td>${receita.descricao}</td>
            <td>${receita.rendimento} ${receita.unidade_rendimento}</td>
            <td>${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG</td>
            <td>R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}</td>
            <td>
                <button onclick="abrirModalVisualizarReceita(${index})" class="btn btn-sm btn-primary" title="Visualizar">👁️</button>
                <button onclick="editarReceita(${index})" class="btn btn-sm btn-secondary">Editar</button>
                <button onclick="excluirReceita(${index})" class="btn btn-sm btn-danger">Excluir</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Editar receita
async function editarReceita(index) {
    const receita = receitasCarregadas[index];
    if (!receita) {
        alert('Receita não encontrada');
        return;
    }

    document.getElementById('codigoReceita').value = receita.codigo;
    document.getElementById('descricaoReceita').value = receita.descricao;
    document.getElementById('pesoFinal').value = receita.peso_final ? receita.peso_final.toFixed(3) : '0';
    document.getElementById('rendimento').value = receita.rendimento ? receita.rendimento.toFixed(3) : '0';
    document.getElementById('unidadeRendimento').value = receita.unidade_rendimento || 'UN';
    
    ingredientesReceita = [...(receita.ingredientes || [])];
    atualizarTabelaIngredientes();
    setRecipeText(receita.texto_receita || '');
    
    // Atualizar campos calculados
    const precoTotal = document.getElementById('precoTotal');
    const pesoCalculado = document.getElementById('pesoFinalCalculado');
    if (precoTotal) precoTotal.textContent = `R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}`;
    if (pesoCalculado) pesoCalculado.textContent = `${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG`;
    
    editandoReceita = index;
    document.getElementById('descricaoReceita').focus();
}

// Excluir receita
async function excluirReceita(index) {
    try {
        const receita = receitasCarregadas[index];
        if (!receita) {
            alert('Receita não encontrada');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir a receita "${receita.descricao}"?`)) {
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Excluir ingredientes primeiro
        await supabase
            .from('ingredientes')
            .delete()
            .eq('receita_id', receita.id);

        // Excluir receita
        const { error } = await supabase
            .from('receitas')
            .delete()
            .eq('id', receita.id)
            .eq('user_id', user.id);

        if (error) {
            throw error;
        }

        alert('Receita excluída com sucesso!');
        await carregarReceitas();

    } catch (error) {
        console.error('Erro ao excluir receita:', error);
        alert('Erro ao excluir receita: ' + error.message);
    }
}

// =================== FUNÇÕES DE INGREDIENTES ===================

// Abrir modal de ingredientes
function abrirModalIngredientes() {
    document.getElementById('modalIngredientes').style.display = 'block';
    carregarListaIngredientes();
}

// Carregar lista de ingredientes (produtos)
function carregarListaIngredientes() {
    const container = document.getElementById('listaIngredientes');
    if (!container) return;
    
    container.innerHTML = '';

    if (produtosCarregados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum produto cadastrado</p>';
        return;
    }

    produtosCarregados.forEach((produto, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${produto.codigo} - ${produto.descricao}</span>
            <button class="btn btn-primary" onclick="adicionarIngrediente(${index})">Adicionar</button>
        `;
        container.appendChild(div);
    });
}

// Filtrar ingredientes
function filtrarIngredientes() {
    const search = document.getElementById('searchIngredientes').value.toLowerCase();
    const items = document.querySelectorAll('#listaIngredientes .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// Adicionar ingrediente
function adicionarIngrediente(produtoIndex) {
    const produto = produtosCarregados[produtoIndex];
    
    if (!produto) {
        alert('Produto não encontrado');
        return;
    }
    
    // Verificar se já existe
    if (ingredientesReceita.find(ing => ing.codigoProduto === produto.codigo)) {
        alert('Ingrediente já adicionado!');
        return;
    }

    const ingrediente = {
        codigoProduto: produto.codigo,
        nome: produto.descricao,
        quantidade: 0,
        unidadeMedida: produto.unidade_medida,
        perdaPercent: 0,
        ganhoPercent: 0,
        precoUnitario: produto.preco || 0,
        produtoId: produto.id
    };

    ingredientesReceita.push(ingrediente);
    atualizarTabelaIngredientes();
    alert('Ingrediente adicionado!');
}

// Atualizar tabela de ingredientes
function atualizarTabelaIngredientes() {
    const tbody = document.querySelector('#tabelaIngredientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (ingredientesReceita.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum ingrediente adicionado
                </td>
            </tr>
        `;
        return;
    }

    ingredientesReceita.forEach((ingrediente, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ingrediente.codigoProduto}</td>
            <td>${ingrediente.nome}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.quantidade}" onchange="atualizarIngrediente(${index}, 'quantidade', this.value)" step="0.001" min="0"></td>
            <td>${ingrediente.unidadeMedida}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.perdaPercent}" onchange="atualizarIngrediente(${index}, 'perdaPercent', this.value)" step="0.01" min="0"></td>
            <td><input type="number" class="inline-edit" value="${ingrediente.ganhoPercent}" onchange="atualizarIngrediente(${index}, 'ganhoPercent', this.value)" step="0.01" min="0"></td>
            <td>R$ ${ingrediente.precoUnitario.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removerIngrediente(${index})">Remover</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Atualizar ingrediente
function atualizarIngrediente(index, campo, valor) {
    if (ingredientesReceita[index]) {
        ingredientesReceita[index][campo] = parseFloat(valor) || 0;
    }
}

// Remover ingrediente
function removerIngrediente(index) {
    if (confirm('Tem certeza que deseja remover este ingrediente?')) {
        ingredientesReceita.splice(index, 1);
        atualizarTabelaIngredientes();
        alert('Ingrediente removido!');
    }
}

// Calcular receita
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
    const precoTotalEl = document.getElementById('precoTotal');
    const pesoCalculadoEl = document.getElementById('pesoFinalCalculado');
    const pesoFinalEl = document.getElementById('pesoFinal');
    
    if (precoTotalEl) precoTotalEl.textContent = `R$ ${precoTotal.toFixed(2)}`;
    if (pesoCalculadoEl) pesoCalculadoEl.textContent = `${pesoFinal.toFixed(3)} KG`;
    if (pesoFinalEl) pesoFinalEl.value = pesoFinal.toFixed(3);

    // Salvar valores calculados
    if (editandoReceita !== null) {
        receitasCarregadas[editandoReceita].preco_total = precoTotal;
        receitasCarregadas[editandoReceita].peso_final = pesoFinal;
    } else {
        window.receitaTemporaria = window.receitaTemporaria || {};
        window.receitaTemporaria.precoTotal = precoTotal;
        window.receitaTemporaria.pesoFinal = pesoFinal;
    }

    alert('Cálculos realizados!');
}

// =================== EDITOR DE RECEITAS ===================

function formatText(command, value = null) {
    const editor = document.getElementById('textoReceita');
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    updateToolbarButtons();
    updateCharCount();
}

function changeFontSize(size) {
    const editor = document.getElementById('textoReceita');
    if (!editor) return;
    
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
    if (!editor) return;
    
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
    
    setTimeout(updateCharCount, 10);
}

function getRecipeText() {
    const editor = document.getElementById('textoReceita');
    return editor ? editor.innerHTML : '';
}

function setRecipeText(htmlContent) {
    const editor = document.getElementById('textoReceita');
    if (editor) {
        editor.innerHTML = htmlContent || '';
        updateCharCount();
    }
}

function previewReceita() {
    const editor = document.getElementById('textoReceita');
    const content = editor ? editor.innerHTML : '';
    const titulo = document.getElementById('descricaoReceita')?.value || 'Receita sem título';
    
    if (!content.trim()) {
        alert('Digite o modo de preparo antes de visualizar!');
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

// =================== MODAL DE VISUALIZAÇÃO ===================

let receitaAtualModal = null;

function abrirModalVisualizarReceita(index) {
    const receita = receitasCarregadas[index];
    if (!receita) return;
    
    receitaAtualModal = index;
    
    // Preencher informações da receita
    document.getElementById('tituloReceitaModal').textContent = receita.descricao;
    document.getElementById('rendimentoReceitaModal').textContent = 
        `Rendimento: ${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}`;
    document.getElementById('pesoReceitaModal').textContent = 
        `Peso: ${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG`;
    document.getElementById('precoReceitaModal').textContent = 
        `Preço: R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}`;
    
    // Carregar modo de preparo
    const textoReceita = document.getElementById('textoReceitaModal');
    if (receita.texto_receita && receita.texto_receita.trim()) {
        textoReceita.innerHTML = receita.texto_receita;
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
    if (!container) return;
    
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
        
        // Carregar receita para edição
        editarReceita(receitaAtualModal);
        
        alert('Receita carregada para edição!');
    }
}

function imprimirReceitaModal() {
    if (receitaAtualModal === null) return;
    
    const receita = receitasCarregadas[receitaAtualModal];
    const textoReceita = receita.texto_receita || '<p>Modo de preparo não cadastrado.</p>';
    
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
                    <span>Rendimento: ${receita.rendimento || 0} ${receita.unidade_rendimento || 'UN'}</span>
                    <span>Peso Final: ${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG</span>
                    <span>Preço Total: R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}</span>
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

// =================== REDIMENSIONAMENTO ===================

function setEditorSize(size) {
    const editor = document.getElementById('recipeEditor');
    if (!editor) return;
    
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

// Fechar modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Exportar funções para uso global
window.editarReceita = editarReceita;
window.excluirReceita = excluirReceita;
window.abrirModalIngredientes = abrirModalIngredientes;
window.adicionarIngrediente = adicionarIngrediente;
window.removerIngrediente = removerIngrediente;
window.atualizarIngrediente = atualizarIngrediente;
window.filtrarIngredientes = filtrarIngredientes;
window.calcularReceita = calcularReceita;
window.formatText = formatText;
window.changeFontSize = changeFontSize;
window.clearFormatting = clearFormatting;
window.previewReceita = previewReceita;
window.setEditorSize = setEditorSize;
window.abrirModalVisualizarReceita = abrirModalVisualizarReceita;
window.showReceitaTab = showReceitaTab;
window.editarReceitaModal = editarReceitaModal;
window.imprimirReceitaModal = imprimirReceitaModal;
window.fecharModal = fecharModal;