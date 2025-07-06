// receitas.js - Sistema de Receitas com Supabase (CORREÇÕES FINAIS)

console.log('📁 Carregando receitas.js...');

// Verificar se as variáveis já existem para evitar redeclaração
if (typeof window.receitasModulo === 'undefined') {
    window.receitasModulo = {
        receitasCarregadas: [],
        produtosCarregados: [],
        ingredientesReceita: [],
        editandoReceita: null,
        inicializado: false
    };
}

// Aguardar Supabase estar disponível
function aguardarSupabaseReceitas(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para receitas.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseReceitas(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        alert('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar autenticação
async function verificarAutenticacaoReceitas() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            alert('Você precisa estar logado para acessar esta página.');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return false;
    }
}

// Inicializar receitas quando aba for aberta
async function inicializarReceitas() {
    if (window.receitasModulo.inicializado) {
        console.log('⚠️ Receitas já inicializadas');
        return;
    }

    aguardarSupabaseReceitas(async () => {
        if (await verificarAutenticacaoReceitas()) {
            await carregarReceitasModulo();
            await carregarProdutosReceitas();
            await gerarProximoCodigoReceitaModulo();
            configurarEventosReceitas();
            
            setTimeout(() => {
                initializeResizeHandle();
                updateCharCount();
            }, 500);
            
            window.receitasModulo.inicializado = true;
            console.log('✅ Receitas inicializadas com sucesso');
        }
    });
}

// Configurar eventos
function configurarEventosReceitas() {
    console.log('⚙️ Configurando eventos de receitas...');
    
    const form = document.getElementById('formReceita');
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', salvarReceitaHandler);
    }
    
    const editor = document.getElementById('textoReceita');
    if (editor) {
        const newEditor = editor.cloneNode(true);
        editor.parentNode.replaceChild(newEditor, editor);
        
        const finalEditor = document.getElementById('textoReceita');
        finalEditor.addEventListener('input', updateCharCount);
        finalEditor.addEventListener('mouseup', updateToolbarButtons);
        finalEditor.addEventListener('keyup', updateToolbarButtons);
        finalEditor.addEventListener('keydown', handleEditorKeydown);
    }
}

async function salvarReceitaHandler(e) {
    e.preventDefault();
    await salvarReceitaModulo();
}

// Carregar receitas - ESTRATÉGIA DEFENSIVA
async function carregarReceitasModulo() {
    try {
        console.log('📥 Carregando receitas...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // ESTRATÉGIA: Carregar primeiro só receitas, depois tentar ingredientes
        console.log('🔍 Carregando receitas básicas...');
        const { data: receitasData, error: receitasError } = await window.supabase
            .from('receitas')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (receitasError) throw receitasError;

        // Inicializar com receitas sem ingredientes
        window.receitasModulo.receitasCarregadas = (receitasData || []).map(receita => ({
            ...receita,
            ingredientes: []
        }));

        console.log(`✅ ${window.receitasModulo.receitasCarregadas.length} receitas carregadas`);

        // Tentar carregar ingredientes separadamente
        console.log('🔍 Tentando carregar ingredientes...');
        await carregarIngredientesReceitas();
        
        atualizarTabelaReceitasModulo();
        
    } catch (error) {
        console.error('❌ Erro ao carregar receitas:', error);
        alert('Erro ao carregar receitas: ' + error.message);
        window.receitasModulo.receitasCarregadas = [];
        atualizarTabelaReceitasModulo();
    }
}

// Carregar ingredientes separadamente
async function carregarIngredientesReceitas() {
    try {
        // Tentar carregar ingredientes com join
        const { data: ingredientesData, error } = await window.supabase
            .from('ingredientes')
            .select(`
                *,
                produtos (codigo, descricao),
                receitas!inner (user_id)
            `)
            .eq('receitas.user_id', (await window.supabase.auth.getUser()).data.user.id);

        if (error) {
            console.warn('⚠️ Não foi possível carregar ingredientes com join:', error.message);
            return;
        }

        // Organizar ingredientes por receita
        const ingredientesPorReceita = {};
        (ingredientesData || []).forEach(ing => {
            if (!ingredientesPorReceita[ing.receita_id]) {
                ingredientesPorReceita[ing.receita_id] = [];
            }
            ingredientesPorReceita[ing.receita_id].push({
                codigoProduto: ing.produtos?.codigo || 'N/A',
                nome: ing.produtos?.descricao || 'Produto não encontrado',
                quantidade: ing.quantidade,
                unidadeMedida: ing.unidade_medida || 'UN',
                perdaPercent: ing.perda_percent || 0,
                ganhoPercent: ing.ganho_percent || 0,
                precoUnitario: ing.preco_unitario || 0,
                produtoId: ing.produto_id
            });
        });

        // Associar ingredientes às receitas
        window.receitasModulo.receitasCarregadas.forEach(receita => {
            receita.ingredientes = ingredientesPorReceita[receita.id] || [];
        });

        console.log('✅ Ingredientes carregados com sucesso');

    } catch (error) {
        console.warn('⚠️ Erro ao carregar ingredientes:', error.message);
    }
}

// Carregar produtos para ingredientes
async function carregarProdutosReceitas() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await window.supabase
            .from('produtos')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;
        window.receitasModulo.produtosCarregados = data || [];
        
        console.log(`✅ ${window.receitasModulo.produtosCarregados.length} produtos carregados para receitas`);
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        window.receitasModulo.produtosCarregados = [];
    }
}

// Gerar próximo código de receita
async function gerarProximoCodigoReceitaModulo() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_receita_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;
        const input = document.getElementById('codigoReceita');
        if (input) {
            input.value = data || 'REC001';
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('codigoReceita');
        if (input) {
            input.value = 'REC001';
        }
    }
}

// ===== VALIDAÇÃO E SALVAMENTO CORRIGIDOS =====
async function salvarReceitaModulo() {
    try {
        console.log('💾 Tentando salvar receita...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const codigo = document.getElementById('codigoReceita').value.trim();
        const descricao = document.getElementById('descricaoReceita').value.trim();
        const pesoFinal = parseFloat(document.getElementById('pesoFinal').value) || 0;
        const rendimento = parseFloat(document.getElementById('rendimento').value) || 0;
        const unidadeRendimento = document.getElementById('unidadeRendimento').value;
        const textoReceita = getRecipeText();

        // VALIDAÇÕES OBRIGATÓRIAS
        if (!descricao) {
            mostrarToast('Por favor, informe a descrição da receita', 'warning');
            document.getElementById('descricaoReceita').focus();
            return;
        }

        if (!codigo) {
            mostrarToast('Por favor, informe o código da receita', 'warning');
            document.getElementById('codigoReceita').focus();
            return;
        }

        // ✅ NOVA VALIDAÇÃO: Verificar se há ingredientes
        if (!window.receitasModulo.ingredientesReceita || window.receitasModulo.ingredientesReceita.length === 0) {
            mostrarToast('❌ Adicione pelo menos um ingrediente antes de salvar a receita!', 'error');
            const btnIngredientes = document.querySelector('[onclick="abrirModalIngredientes()"]');
            if (btnIngredientes) {
                btnIngredientes.focus();
            }
            return;
        }

        // Recalcular valores antes de salvar
        calcularReceita();
        
        // ✅ CORREÇÃO PRINCIPAL: Buscar preço correto dependendo se é edição ou nova receita
        let precoTotal = 0;
        if (window.receitasModulo.editandoReceita !== null) {
            // Se estamos editando, pegar da receita carregada
            const receitaAtual = window.receitasModulo.receitasCarregadas[window.receitasModulo.editandoReceita];
            precoTotal = receitaAtual?.preco_total || 0;
            console.log('📝 Editando receita - Preço total:', precoTotal);
        } else {
            // Se é nova receita, pegar da temporária
            precoTotal = window.receitaTemporaria?.precoTotal || 0;
            console.log('➕ Nova receita - Preço total:', precoTotal);
        }

        // ✅ CORREÇÃO: Buscar peso final correto dependendo se é edição ou nova receita
        let pesoFinalSalvar = 0;
        if (window.receitasModulo.editandoReceita !== null) {
            // Se estamos editando, pegar da receita carregada
            const receitaAtual = window.receitasModulo.receitasCarregadas[window.receitasModulo.editandoReceita];
            pesoFinalSalvar = receitaAtual?.peso_final || pesoFinal;
            console.log('📝 Editando receita - Peso final:', pesoFinalSalvar);
        } else {
            // Se é nova receita, pegar da temporária ou usar o calculado
            pesoFinalSalvar = window.receitaTemporaria?.pesoFinal || pesoFinal;
            console.log('➕ Nova receita - Peso final:', pesoFinalSalvar);
        }

        const receitaData = {
            codigo,
            descricao,
            peso_final: pesoFinalSalvar,
            rendimento,
            unidade_rendimento: unidadeRendimento,
            preco_total: precoTotal,
            texto: textoReceita,
            user_id: user.id
        };

        let receitaId;
        
        if (window.receitasModulo.editandoReceita !== null) {
            const receitaAtual = window.receitasModulo.receitasCarregadas[window.receitasModulo.editandoReceita];
            const { error } = await window.supabase
                .from('receitas')
                .update(receitaData)
                .eq('id', receitaAtual.id)
                .eq('user_id', user.id);

            if (error) throw error;
            receitaId = receitaAtual.id;
        } else {
            const { data, error } = await window.supabase
                .from('receitas')
                .insert([receitaData])
                .select()
                .single();

            if (error) throw error;
            receitaId = data.id;
        }

        await salvarIngredientesReceitaModulo(receitaId);

        mostrarToast(
            window.receitasModulo.editandoReceita !== null ? 
            '✅ Receita atualizada com sucesso!' : 
            '✅ Receita criada com sucesso!', 
            'success'
        );
        
        limparFormularioReceitaModulo();
        await carregarReceitasModulo();

    } catch (error) {
        console.error('❌ Erro ao salvar receita:', error);
        mostrarToast('Erro ao salvar receita: ' + error.message, 'error');
    }
}

// Salvar ingredientes - CORRIGIDO PARA USAR TODOS OS NOMES CORRETOS
async function salvarIngredientesReceitaModulo(receitaId) {
    try {
        console.log('💾 Salvando ingredientes da receita...', receitaId);
        
        // Remover ingredientes existentes
        await window.supabase
            .from('ingredientes')
            .delete()
            .eq('receita_id', receitaId);

        if (window.receitasModulo.ingredientesReceita.length > 0) {
            const ingredientesData = [];
            
            for (const ingrediente of window.receitasModulo.ingredientesReceita) {
                const produto = window.receitasModulo.produtosCarregados.find(p => p.codigo === ingrediente.codigoProduto);
                if (produto) {
                    const ingredienteData = {
                        receita_id: receitaId,
                        produto_id: produto.id,
                        quantidade: parseFloat(ingrediente.quantidade) || 0,
                        unidade_medida: ingrediente.unidadeMedida || 'UN',
                        perda_percent: parseFloat(ingrediente.perdaPercent) || 0,
                        ganho_percent: parseFloat(ingrediente.ganhoPercent) || 0,
                        preco_unitario: parseFloat(ingrediente.precoUnitario) || 0
                    };
                    
                    console.log('📤 Ingrediente a inserir:', ingredienteData);
                    ingredientesData.push(ingredienteData);
                }
            }

            if (ingredientesData.length > 0) {
                console.log('📤 Inserindo ingredientes:', ingredientesData);
                
                const { error } = await window.supabase
                    .from('ingredientes')
                    .insert(ingredientesData);

                if (error) {
                    console.error('❌ Erro ao inserir ingredientes:', error);
                    throw error;
                }
                
                console.log('✅ Ingredientes salvos com sucesso!');
            }
        }

    } catch (error) {
        console.error('❌ Erro ao salvar ingredientes:', error);
        throw error;
    }
}

// Limpar formulário
function limparFormularioReceitaModulo() {
    const form = document.getElementById('formReceita');
    if (form) {
        form.reset();
    }
    
    window.receitasModulo.ingredientesReceita = [];
    atualizarTabelaIngredientesModulo();
    setRecipeText('');
    
    const precoTotal = document.getElementById('precoTotal');
    const pesoCalculado = document.getElementById('pesoFinalCalculado');
    if (precoTotal) precoTotal.textContent = 'R$ 0,00';
    if (pesoCalculado) pesoCalculado.textContent = '0,000 KG';
    
    window.receitaTemporaria = null;
    window.receitasModulo.editandoReceita = null;
    
    gerarProximoCodigoReceitaModulo();
}

// Renderizar tabela de receitas
function atualizarTabelaReceitasModulo() {
    const tbody = document.querySelector('#tabelaReceitas tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (window.receitasModulo.receitasCarregadas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                    Nenhuma receita encontrada
                </td>
            </tr>
        `;
        return;
    }

    window.receitasModulo.receitasCarregadas.forEach((receita, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${receita.codigo}</td>
            <td>${receita.descricao}</td>
            <td>${receita.rendimento} ${receita.unidade_rendimento}</td>
            <td>${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG</td>
            <td>R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}</td>
            <td>
                <button onclick="editarReceitaModulo(${index})" class="btn btn-sm btn-secondary">Editar</button>
                <button onclick="excluirReceitaModulo(${index})" class="btn btn-sm btn-danger">Excluir</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== EDITAR RECEITA CORRIGIDA =====
async function editarReceitaModulo(index) {
    const receita = window.receitasModulo.receitasCarregadas[index];
    if (!receita) {
        alert('Receita não encontrada');
        return;
    }

    console.log('✏️ Editando receita:', receita.descricao);

    document.getElementById('codigoReceita').value = receita.codigo;
    document.getElementById('descricaoReceita').value = receita.descricao;
    document.getElementById('pesoFinal').value = receita.peso_final ? receita.peso_final.toFixed(3) : '0';
    document.getElementById('rendimento').value = receita.rendimento ? receita.rendimento.toFixed(3) : '0';
    document.getElementById('unidadeRendimento').value = receita.unidade_rendimento || 'UN';
    
    // ✅ CORREÇÃO PRINCIPAL: Carregar ingredientes na memória temporária
    window.receitasModulo.ingredientesReceita = [...(receita.ingredientes || [])];
    atualizarTabelaIngredientesModulo();
    setRecipeText(receita.texto || '');
    
    // ✅ CORREÇÃO: Definir receita como editando ANTES de calcular
    window.receitasModulo.editandoReceita = index;
    
    // ✅ IMPORTANTE: Calcular valores após carregar ingredientes
    setTimeout(() => {
        calcularReceita();
    }, 100);
    
    document.getElementById('descricaoReceita').focus();
    
    console.log('✅ Receita carregada para edição com', window.receitasModulo.ingredientesReceita.length, 'ingredientes');
}

// Excluir receita
async function excluirReceitaModulo(index) {
    try {
        const receita = window.receitasModulo.receitasCarregadas[index];
        if (!receita || !confirm(`Tem certeza que deseja excluir a receita "${receita.descricao}"?`)) {
            return;
        }

        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        await window.supabase.from('ingredientes').delete().eq('receita_id', receita.id);
        
        const { error } = await window.supabase
            .from('receitas')
            .delete()
            .eq('id', receita.id)
            .eq('user_id', user.id);

        if (error) throw error;

        alert('Receita excluída com sucesso!');
        await carregarReceitasModulo();

    } catch (error) {
        console.error('❌ Erro ao excluir receita:', error);
        alert('Erro ao excluir receita: ' + error.message);
    }
}

// ===== FUNÇÕES DE INGREDIENTES MELHORADAS =====

function abrirModalIngredientes() {
    document.getElementById('modalIngredientes').style.display = 'block';
    carregarListaIngredientesModulo();
}

// ✅ NOVA FUNÇÃO: Carregar lista com checkboxes
function carregarListaIngredientesModulo() {
    const container = document.getElementById('listaIngredientes');
    if (!container) return;
    
    container.innerHTML = '';

    if (window.receitasModulo.produtosCarregados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum produto cadastrado</p>';
        return;
    }

    // ✅ MELHORADO: Adicionar botões de seleção global
    const headerControls = document.createElement('div');
    headerControls.style.cssText = 'padding: 10px; border-bottom: 1px solid #e9ecef; margin-bottom: 10px; display: flex; gap: 10px; align-items: center;';
    headerControls.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="selecionarTodosIngredientes()">Selecionar Todos</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="desmarcarTodosIngredientes()">Desmarcar Todos</button>
        <button type="button" class="btn btn-primary" onclick="adicionarIngredientesSelecionados()">Adicionar Selecionados</button>
    `;
    container.appendChild(headerControls);

    // ✅ MELHORADO: Lista com checkboxes
    window.receitasModulo.produtosCarregados.forEach((produto, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.style.cssText = 'display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #e9ecef; border-radius: 5px; margin-bottom: 5px; background: white;';
        
        // Verificar se ingrediente já foi adicionado
        const jaAdicionado = window.receitasModulo.ingredientesReceita.find(ing => ing.codigoProduto === produto.codigo);
        
        div.innerHTML = `
            <input type="checkbox" id="produto-${index}" value="${index}" ${jaAdicionado ? 'disabled checked' : ''}>
            <label for="produto-${index}" style="flex: 1; margin: 0; cursor: pointer; ${jaAdicionado ? 'color: #6c757d;' : ''}">${produto.codigo} - ${produto.descricao}${jaAdicionado ? ' ✅' : ''}</label>
            <span style="font-size: 12px; color: #666;">R$ ${parseFloat(produto.preco || 0).toFixed(2)}</span>
        `;
        container.appendChild(div);
    });
}

// ✅ NOVA FUNÇÃO: Selecionar todos os ingredientes
function selecionarTodosIngredientes() {
    const checkboxes = document.querySelectorAll('#listaIngredientes input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
}

// ✅ NOVA FUNÇÃO: Desmarcar todos os ingredientes
function desmarcarTodosIngredientes() {
    const checkboxes = document.querySelectorAll('#listaIngredientes input[type="checkbox"]:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

// ✅ NOVA FUNÇÃO: Adicionar ingredientes selecionados
function adicionarIngredientesSelecionados() {
    const checkboxes = document.querySelectorAll('#listaIngredientes input[type="checkbox"]:checked:not(:disabled)');
    
    if (checkboxes.length === 0) {
        mostrarToast('Selecione pelo menos um ingrediente para adicionar', 'warning');
        return;
    }
    
    let adicionados = 0;
    
    checkboxes.forEach(checkbox => {
        const produtoIndex = parseInt(checkbox.value);
        const produto = window.receitasModulo.produtosCarregados[produtoIndex];
        
        if (!produto) return;
        
        // Verificar se já existe
        if (window.receitasModulo.ingredientesReceita.find(ing => ing.codigoProduto === produto.codigo)) {
            return; // Já adicionado
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

        window.receitasModulo.ingredientesReceita.push(ingrediente);
        adicionados++;
    });
    
    if (adicionados > 0) {
        atualizarTabelaIngredientesModulo();
        mostrarToast(`✅ ${adicionados} ingrediente(s) adicionado(s) com sucesso!`, 'success');
        
        // Fechar modal
        fecharModal('modalIngredientes');
        
        // Recalcular após adicionar
        setTimeout(() => {
            calcularReceita();
        }, 100);
    } else {
        mostrarToast('Todos os ingredientes selecionados já foram adicionados', 'info');
    }
}

function filtrarIngredientes() {
    const search = document.getElementById('searchIngredientes').value.toLowerCase();
    const items = document.querySelectorAll('#listaIngredientes .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// Função individual (mantida para compatibilidade)
function adicionarIngredienteModulo(produtoIndex) {
    const produto = window.receitasModulo.produtosCarregados[produtoIndex];
    
    if (!produto) {
        mostrarToast('Produto não encontrado', 'error');
        return;
    }
    
    if (window.receitasModulo.ingredientesReceita.find(ing => ing.codigoProduto === produto.codigo)) {
        mostrarToast('Ingrediente já adicionado!', 'warning');
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

    window.receitasModulo.ingredientesReceita.push(ingrediente);
    atualizarTabelaIngredientesModulo();
    mostrarToast('Ingrediente adicionado com sucesso!', 'success');
}

function atualizarTabelaIngredientesModulo() {
    const tbody = document.querySelector('#tabelaIngredientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (window.receitasModulo.ingredientesReceita.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum ingrediente adicionado<br>
                    <small>Use o botão "Selecionar Ingredientes" para adicionar produtos</small>
                </td>
            </tr>
        `;
        return;
    }

    window.receitasModulo.ingredientesReceita.forEach((ingrediente, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ingrediente.codigoProduto}</td>
            <td>${ingrediente.nome}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.quantidade || 0}" onchange="atualizarIngredienteModulo(${index}, 'quantidade', this.value)" step="0.001" min="0"></td>
            <td>${ingrediente.unidadeMedida}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.perdaPercent || 0}" onchange="atualizarIngredienteModulo(${index}, 'perdaPercent', this.value)" step="0.01" min="0"></td>
            <td><input type="number" class="inline-edit" value="${ingrediente.ganhoPercent || 0}" onchange="atualizarIngredienteModulo(${index}, 'ganhoPercent', this.value)" step="0.01" min="0"></td>
            <td>R$ ${parseFloat(ingrediente.precoUnitario || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removerIngredienteModulo(${index})">Remover</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ✅ CORREÇÃO: Função de atualizar ingredientes melhorada
function atualizarIngredienteModulo(index, campo, valor) {
    if (window.receitasModulo.ingredientesReceita[index]) {
        const valorNumerico = parseFloat(valor) || 0;
        window.receitasModulo.ingredientesReceita[index][campo] = valorNumerico;
        
        console.log(`✅ Ingrediente ${index} atualizado - ${campo}: ${valorNumerico}`);
        
        // ✅ CORREÇÃO: Auto-calcular após qualquer mudança (com delay para evitar múltiplas chamadas)
        clearTimeout(window.calculoTimeout);
        window.calculoTimeout = setTimeout(() => {
            calcularReceita();
        }, 300);
    }
}

function removerIngredienteModulo(index) {
    if (confirm('Tem certeza que deseja remover este ingrediente?')) {
        const ingrediente = window.receitasModulo.ingredientesReceita[index];
        window.receitasModulo.ingredientesReceita.splice(index, 1);
        atualizarTabelaIngredientesModulo();
        mostrarToast(`Ingrediente "${ingrediente.nome}" removido!`, 'success');
        
        // Recalcular após remoção
        setTimeout(() => {
            calcularReceita();
        }, 100);
    }
}

// ===== FUNÇÃO DE CALCULAR CORRIGIDA FINAL =====
function calcularReceita() {
    console.log('🧮 Iniciando cálculo da receita...');
    
    let precoTotal = 0;
    let pesoFinal = 0;

    // Verificar se há ingredientes
    if (!window.receitasModulo.ingredientesReceita || window.receitasModulo.ingredientesReceita.length === 0) {
        console.log('⚠️ Nenhum ingrediente para calcular');
        
        // Zerar campos
        const precoTotalEl = document.getElementById('precoTotal');
        const pesoCalculadoEl = document.getElementById('pesoFinalCalculado');
        const pesoFinalEl = document.getElementById('pesoFinal');
        
        if (precoTotalEl) precoTotalEl.textContent = 'R$ 0,00';
        if (pesoCalculadoEl) pesoCalculadoEl.textContent = '0,000 KG';
        if (pesoFinalEl) pesoFinalEl.value = '0';
        
        // Limpar valores temporários
        if (window.receitaTemporaria) {
            window.receitaTemporaria.precoTotal = 0;
            window.receitaTemporaria.pesoFinal = 0;
        }
        
        return;
    }

    console.log(`📊 Calculando ${window.receitasModulo.ingredientesReceita.length} ingredientes...`);

    window.receitasModulo.ingredientesReceita.forEach((ingrediente, index) => {
        console.log(`Calculando ingrediente ${index}:`, ingrediente);
        
        // Garantir que valores sejam numéricos
        const quantidade = parseFloat(ingrediente.quantidade) || 0;
        const precoUnitario = parseFloat(ingrediente.precoUnitario) || 0;
        const perdaPercent = parseFloat(ingrediente.perdaPercent) || 0;
        const ganhoPercent = parseFloat(ingrediente.ganhoPercent) || 0;

        // Calcular preço: Quantidade * Preço Unitário
        const precoIngrediente = quantidade * precoUnitario;
        precoTotal += precoIngrediente;
        
        console.log(`Ingrediente ${ingrediente.nome}: Qtd=${quantidade}, Preço=${precoUnitario}, Total=${precoIngrediente}`);

        // Calcular peso (apenas para ingredientes com unidades de peso)
        if (['KG', 'gr', 'mg'].includes(ingrediente.unidadeMedida)) {
            let peso = quantidade;
            
            // Converter para KG
            if (ingrediente.unidadeMedida === 'gr') peso /= 1000;
            if (ingrediente.unidadeMedida === 'mg') peso /= 1000000;
            
            // Aplicar perda e ganho
            peso = peso - (peso * perdaPercent / 100);
            peso = peso + (peso * ganhoPercent / 100);
            
            pesoFinal += peso;
            console.log(`Peso calculado para ${ingrediente.nome}: ${peso} KG`);
        }
    });

    console.log(`✅ Cálculo final - Preço: R$ ${precoTotal.toFixed(2)}, Peso: ${pesoFinal.toFixed(3)} KG`);

    // Atualizar os campos na tela
    const precoTotalEl = document.getElementById('precoTotal');
    const pesoCalculadoEl = document.getElementById('pesoFinalCalculado');
    const pesoFinalEl = document.getElementById('pesoFinal');
    
    if (precoTotalEl) precoTotalEl.textContent = `R$ ${precoTotal.toFixed(2)}`;
    if (pesoCalculadoEl) pesoCalculadoEl.textContent = `${pesoFinal.toFixed(3)} KG`;
    if (pesoFinalEl) pesoFinalEl.value = pesoFinal.toFixed(3);

    // ✅ CORREÇÃO PRINCIPAL: Salvar valores na estrutura correta
    if (window.receitasModulo.editandoReceita !== null) {
        // Se estamos editando uma receita existente
        const receitaIndex = window.receitasModulo.editandoReceita;
        if (window.receitasModulo.receitasCarregadas[receitaIndex]) {
            window.receitasModulo.receitasCarregadas[receitaIndex].preco_total = precoTotal;
            window.receitasModulo.receitasCarregadas[receitaIndex].peso_final = pesoFinal;
            console.log(`💾 Valores salvos na receita editada (índice ${receitaIndex}): Preço=R${precoTotal.toFixed(2)}, Peso=${pesoFinal.toFixed(3)}KG`);
        }
    } else {
        // Se é uma receita nova
        if (!window.receitaTemporaria) {
            window.receitaTemporaria = {};
        }
        window.receitaTemporaria.precoTotal = precoTotal;
        window.receitaTemporaria.pesoFinal = pesoFinal;
        console.log(`💾 Valores salvos na receita temporária: Preço=R${precoTotal.toFixed(2)}, Peso=${pesoFinal.toFixed(3)}KG`);
    }

    mostrarToast('✅ Cálculos realizados com sucesso!', 'success');
}

// ===== EDITOR DE RECEITAS =====

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

function setEditorSize(size) {
    const editor = document.getElementById('recipeEditor');
    if (!editor) return;
    
    editor.classList.remove('size-small', 'size-medium', 'size-large');
    
    if (size !== 'auto') {
        editor.classList.add(`size-${size}`);
    }
    
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
        
        editor.classList.remove('size-small', 'size-medium', 'size-large');
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const width = startWidth + e.clientX - startX;
        const height = startHeight + e.clientY - startY;
        
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

// Toast notification system
function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    // Remover toast existente se houver
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar elemento toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${tipo}`;
    
    // Definir ícones por tipo
    const icones = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icones[tipo] || icones.info}</span>
            <span class="toast-message">${mensagem}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(toast);
    
    // Remover automaticamente
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('toast-fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duracao);
}

// Exportar funções para uso global
window.editarReceitaModulo = editarReceitaModulo;
window.excluirReceitaModulo = excluirReceitaModulo;
window.abrirModalIngredientes = abrirModalIngredientes;
window.adicionarIngredienteModulo = adicionarIngredienteModulo;
window.removerIngredienteModulo = removerIngredienteModulo;
window.atualizarIngredienteModulo = atualizarIngredienteModulo;
window.filtrarIngredientes = filtrarIngredientes;
window.calcularReceita = calcularReceita;
window.formatText = formatText;
window.changeFontSize = changeFontSize;
window.clearFormatting = clearFormatting;
window.previewReceita = previewReceita;
window.setEditorSize = setEditorSize;
window.inicializarReceitas = inicializarReceitas;
window.salvarReceitaModulo = salvarReceitaModulo;
window.limparFormularioReceitaModulo = limparFormularioReceitaModulo;
window.handleEditorKeydown = handleEditorKeydown;
window.updateCharCount = updateCharCount;
window.updateToolbarButtons = updateToolbarButtons;
window.mostrarToast = mostrarToast;
window.atualizarTabelaIngredientesModulo = atualizarTabelaIngredientesModulo;
window.selecionarTodosIngredientes = selecionarTodosIngredientes;
window.desmarcarTodosIngredientes = desmarcarTodosIngredientes;
window.adicionarIngredientesSelecionados = adicionarIngredientesSelecionados;
window.fecharModal = fecharModal;

// Alias para compatibilidade
window.adicionarIngrediente = adicionarIngredienteModulo;
window.removerIngrediente = removerIngredienteModulo;
window.atualizarIngrediente = atualizarIngredienteModulo;
window.editarReceita = editarReceitaModulo;
window.excluirReceita = excluirReceitaModulo;
window.salvarReceita = salvarReceitaModulo;
window.limparFormularioReceita = limparFormularioReceitaModulo;

console.log('✅ receitas.js FINAL - Todas as correções aplicadas!');