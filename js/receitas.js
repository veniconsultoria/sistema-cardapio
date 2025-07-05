// receitas.js - Sistema de Receitas com Supabase (VERSÃO CORRIGIDA FINAL)

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

// Salvar receita - CORRIGIDO PARA USAR COLUNA 'texto'
async function salvarReceitaModulo() {
    try {
        console.log('💾 Salvando receita...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const codigo = document.getElementById('codigoReceita').value.trim();
        const descricao = document.getElementById('descricaoReceita').value.trim();
        const pesoFinal = parseFloat(document.getElementById('pesoFinal').value) || 0;
        const rendimento = parseFloat(document.getElementById('rendimento').value) || 0;
        const unidadeRendimento = document.getElementById('unidadeRendimento').value;
        const textoReceita = getRecipeText();

        let precoTotal = 0;
        if (window.receitaTemporaria) {
            precoTotal = window.receitaTemporaria.precoTotal || 0;
        }

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

        // CORRIGIDO: usar 'texto' ao invés de 'texto_receita'
        const receitaData = {
            codigo,
            descricao,
            peso_final: pesoFinal,
            rendimento,
            unidade_rendimento: unidadeRendimento,
            preco_total: precoTotal,
            texto: textoReceita, // ✅ CORRIGIDO
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

        alert(window.receitasModulo.editandoReceita !== null ? 'Receita atualizada com sucesso!' : 'Receita criada com sucesso!');
        
        limparFormularioReceitaModulo();
        await carregarReceitasModulo();

    } catch (error) {
        console.error('❌ Erro ao salvar receita:', error);
        alert('Erro ao salvar receita: ' + error.message);
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
                        unidade_medida: ingrediente.unidadeMedida || 'UN', // ✅ CORRETO
                        perda_percent: parseFloat(ingrediente.perdaPercent) || 0, // ✅ CORRETO
                        ganho_percent: parseFloat(ingrediente.ganhoPercent) || 0, // ✅ CORRETO
                        preco_unitario: parseFloat(ingrediente.precoUnitario) || 0 // ✅ CORRETO
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

// Editar receita - CORRIGIDO PARA USAR 'texto'
async function editarReceitaModulo(index) {
    const receita = window.receitasModulo.receitasCarregadas[index];
    if (!receita) {
        alert('Receita não encontrada');
        return;
    }

    document.getElementById('codigoReceita').value = receita.codigo;
    document.getElementById('descricaoReceita').value = receita.descricao;
    document.getElementById('pesoFinal').value = receita.peso_final ? receita.peso_final.toFixed(3) : '0';
    document.getElementById('rendimento').value = receita.rendimento ? receita.rendimento.toFixed(3) : '0';
    document.getElementById('unidadeRendimento').value = receita.unidade_rendimento || 'UN';
    
    window.receitasModulo.ingredientesReceita = [...(receita.ingredientes || [])];
    atualizarTabelaIngredientesModulo();
    setRecipeText(receita.texto || ''); // ✅ CORRIGIDO
    
    const precoTotal = document.getElementById('precoTotal');
    const pesoCalculado = document.getElementById('pesoFinalCalculado');
    if (precoTotal) precoTotal.textContent = `R$ ${receita.preco_total ? receita.preco_total.toFixed(2) : '0,00'}`;
    if (pesoCalculado) pesoCalculado.textContent = `${receita.peso_final ? receita.peso_final.toFixed(3) : '0,000'} KG`;
    
    window.receitasModulo.editandoReceita = index;
    document.getElementById('descricaoReceita').focus();
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

// ===== FUNÇÕES DE INGREDIENTES =====

function abrirModalIngredientes() {
    document.getElementById('modalIngredientes').style.display = 'block';
    carregarListaIngredientesModulo();
}

function carregarListaIngredientesModulo() {
    const container = document.getElementById('listaIngredientes');
    if (!container) return;
    
    container.innerHTML = '';

    if (window.receitasModulo.produtosCarregados.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhum produto cadastrado</p>';
        return;
    }

    window.receitasModulo.produtosCarregados.forEach((produto, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${produto.codigo} - ${produto.descricao}</span>
            <button class="btn btn-primary" onclick="adicionarIngredienteModulo(${index})">Adicionar</button>
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

function adicionarIngredienteModulo(produtoIndex) {
    const produto = window.receitasModulo.produtosCarregados[produtoIndex];
    
    if (!produto) {
        alert('Produto não encontrado');
        return;
    }
    
    if (window.receitasModulo.ingredientesReceita.find(ing => ing.codigoProduto === produto.codigo)) {
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

    window.receitasModulo.ingredientesReceita.push(ingrediente);
    atualizarTabelaIngredientesModulo();
    alert('Ingrediente adicionado!');
}

function atualizarTabelaIngredientesModulo() {
    const tbody = document.querySelector('#tabelaIngredientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (window.receitasModulo.ingredientesReceita.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum ingrediente adicionado
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
            <td><input type="number" class="inline-edit" value="${ingrediente.quantidade}" onchange="atualizarIngredienteModulo(${index}, 'quantidade', this.value)" step="0.001" min="0"></td>
            <td>${ingrediente.unidadeMedida}</td>
            <td><input type="number" class="inline-edit" value="${ingrediente.perdaPercent}" onchange="atualizarIngredienteModulo(${index}, 'perdaPercent', this.value)" step="0.01" min="0"></td>
            <td><input type="number" class="inline-edit" value="${ingrediente.ganhoPercent}" onchange="atualizarIngredienteModulo(${index}, 'ganhoPercent', this.value)" step="0.01" min="0"></td>
            <td>R$ ${ingrediente.precoUnitario.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removerIngredienteModulo(${index})">Remover</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function atualizarIngredienteModulo(index, campo, valor) {
    if (window.receitasModulo.ingredientesReceita[index]) {
        window.receitasModulo.ingredientesReceita[index][campo] = parseFloat(valor) || 0;
    }
}

function removerIngredienteModulo(index) {
    if (confirm('Tem certeza que deseja remover este ingrediente?')) {
        window.receitasModulo.ingredientesReceita.splice(index, 1);
        atualizarTabelaIngredientesModulo();
        alert('Ingrediente removido!');
    }
}

function calcularReceita() {
    let precoTotal = 0;
    let pesoFinal = 0;

    window.receitasModulo.ingredientesReceita.forEach(ingrediente => {
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
    if (window.receitasModulo.editandoReceita !== null) {
        window.receitasModulo.receitasCarregadas[window.receitasModulo.editandoReceita].preco_total = precoTotal;
        window.receitasModulo.receitasCarregadas[window.receitasModulo.editandoReceita].peso_final = pesoFinal;
    } else {
        window.receitaTemporaria = window.receitaTemporaria || {};
        window.receitaTemporaria.precoTotal = precoTotal;
        window.receitaTemporaria.pesoFinal = pesoFinal;
    }

    alert('Cálculos realizados!');
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

// Alias para compatibilidade
window.adicionarIngrediente = adicionarIngredienteModulo;
window.removerIngrediente = removerIngredienteModulo;
window.atualizarIngrediente = atualizarIngredienteModulo;
window.editarReceita = editarReceitaModulo;
window.excluirReceita = excluirReceitaModulo;
window.salvarReceita = salvarReceitaModulo;
window.limparFormularioReceita = limparFormularioReceitaModulo;

console.log('✅ receitas.js carregado e corrigido definitivamente!');