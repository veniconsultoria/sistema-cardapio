// produtos.js - Sistema de Produtos com Supabase (SEM CONFLITOS)

console.log('📁 Carregando produtos.js...');

// Variáveis globais do módulo produtos (prefixadas para evitar conflito)
let produtosCarregadosModulo = [];
let editandoProdutoModulo = null;

// Aguardar Supabase estar disponível
function aguardarSupabaseProdutos(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para produtos.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseProdutos(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        alert('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar autenticação
async function verificarAutenticacaoProdutos() {
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

// Inicializar sistema quando aba for aberta
async function inicializarSistema() {
    aguardarSupabaseProdutos(async () => {
        console.log('🔐 Verificando autenticação...');
        
        if (await verificarAutenticacaoProdutos()) {
            console.log('✅ Usuário autenticado, carregando sistema...');
            await carregarProdutosSistema();
            await gerarProximoCodigoProduto();
            configurarEventosProdutos();
        }
    });
}

// Configurar eventos dos botões
function configurarEventosProdutos() {
    console.log('⚙️ Configurando eventos de produtos...');
    
    // Formulário de produto
    const formProduto = document.getElementById('formProduto');
    if (formProduto) {
        // Remover listeners existentes para evitar duplicação
        formProduto.removeEventListener('submit', salvarProdutoOriginalHandler);
        formProduto.addEventListener('submit', salvarProdutoOriginalHandler);
    }
}

// Handler para salvar produto
async function salvarProdutoOriginalHandler(e) {
    e.preventDefault();
    await salvarProdutoOriginal();
}

// Gerar próximo código
async function gerarProximoCodigoProduto() {
    try {
        console.log('🔢 Gerando próximo código...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_produto_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;

        const input = document.getElementById('codigoProduto');
        if (input) {
            input.value = data || 'PR000001';
            console.log('✅ Próximo código gerado:', data);
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('codigoProduto');
        if (input) {
            input.value = 'PR000001';
        }
    }
}

// Carregar produtos do Supabase
async function carregarProdutosSistema() {
    try {
        console.log('📥 Carregando produtos do Supabase...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('produtos')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        produtosCarregadosModulo = data || [];
        console.log(`✅ ${produtosCarregadosModulo.length} produtos carregados`);
        
        renderizarTabelaProdutosSistema();
        
        // Disponibilizar globalmente para outros módulos
        if (window.produtosCarregados !== undefined) {
            window.produtosCarregados = produtosCarregadosModulo;
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos: ' + error.message);
    }
}

// Renderizar tabela de produtos
function renderizarTabelaProdutosSistema() {
    console.log('🎨 Renderizando tabela com', produtosCarregadosModulo.length, 'produtos');
    
    const tbody = document.querySelector('#tabelaProdutos tbody');
    if (!tbody) {
        console.warn('⚠️ Elemento #tabelaProdutos tbody não encontrado');
        return;
    }

    tbody.innerHTML = '';

    if (produtosCarregadosModulo.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum produto encontrado
                </td>
            </tr>
        `;
        return;
    }

    produtosCarregadosModulo.forEach((produto, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.descricao}</td>
            <td>${produto.grupo}</td>
            <td>${produto.unidade_medida}</td>
            <td>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</td>
            <td>
                <button onclick="editarProdutoOriginal(${index})" class="btn btn-sm btn-primary">
                    Editar
                </button>
                <button onclick="excluirProdutoOriginal(${index})" class="btn btn-sm btn-danger">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('✅ Tabela renderizada');
}

// Salvar produto (CORRIGIDO PARA SUPABASE)
async function salvarProdutoOriginal() {
    try {
        console.log('💾 Salvando produto...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Coletar dados do formulário
        const codigo = document.getElementById('codigoProduto').value.trim();
        const descricao = document.getElementById('descricaoProduto').value.trim();
        const grupo = document.getElementById('grupoProduto').value;
        const unidade_medida = document.getElementById('unidadeMedida').value;
        const peso_bruto = document.getElementById('pesoBruto').value;
        const peso_liquido = document.getElementById('pesoLiquido').value;
        const preco = document.getElementById('precoItem').value;
        const perda_percent = document.getElementById('perdaPercent').value;
        const volume_m3 = document.getElementById('volumeM3').value;
        const unidade_peso = document.getElementById('unidadePeso').value;

        // Validações
        if (!descricao) {
            alert('Por favor, informe a descrição do produto');
            document.getElementById('descricaoProduto').focus();
            return;
        }

        if (!codigo) {
            alert('Por favor, informe o código do produto');
            return;
        }

        if (!grupo) {
            alert('Por favor, selecione o grupo do produto');
            document.getElementById('grupoProduto').focus();
            return;
        }

        if (!unidade_medida) {
            alert('Por favor, selecione a unidade de medida');
            document.getElementById('unidadeMedida').focus();
            return;
        }

        // Preparar dados para salvar
        const produtoData = {
            codigo,
            descricao,
            grupo,
            unidade_medida,
            peso_bruto: peso_bruto ? parseFloat(peso_bruto) : null,
            peso_liquido: peso_liquido ? parseFloat(peso_liquido) : null,
            preco: preco ? parseFloat(preco) : null,
            perda_percent: perda_percent ? parseFloat(perda_percent) : null,
            volume_m3: volume_m3 ? parseFloat(volume_m3) : null,
            unidade_peso: unidade_peso || null,
            user_id: user.id
        };

        console.log('📤 Dados do produto:', produtoData);

        let result;
        if (editandoProdutoModulo !== null) {
            // Atualizar produto existente
            console.log('🔄 Atualizando produto existente...');
            const produtoAtual = produtosCarregadosModulo[editandoProdutoModulo];
            result = await window.supabase
                .from('produtos')
                .update(produtoData)
                .eq('id', produtoAtual.id)
                .eq('user_id', user.id);
        } else {
            // Criar novo produto
            console.log('➕ Criando novo produto...');
            result = await window.supabase
                .from('produtos')
                .insert([produtoData]);
        }

        if (result.error) throw result.error;

        console.log('✅ Produto salvo com sucesso!');
        alert(editandoProdutoModulo !== null ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        
        // Limpar formulário e recarregar lista
        limparFormularioProduto();
        await carregarProdutosSistema();

    } catch (error) {
        console.error('❌ Erro ao salvar produto:', error);
        alert('Erro ao salvar produto: ' + error.message);
    }
}

// Editar produto existente
function editarProdutoOriginal(index) {
    try {
        console.log('✏️ Editando produto:', index);
        
        const produto = produtosCarregadosModulo[index];
        if (!produto) {
            alert('Produto não encontrado');
            return;
        }

        // Preencher formulário
        document.getElementById('codigoProduto').value = produto.codigo;
        document.getElementById('descricaoProduto').value = produto.descricao;
        document.getElementById('grupoProduto').value = produto.grupo;
        document.getElementById('unidadeMedida').value = produto.unidade_medida;
        document.getElementById('pesoBruto').value = produto.peso_bruto || '';
        document.getElementById('pesoLiquido').value = produto.peso_liquido || '';
        document.getElementById('precoItem').value = produto.preco || '';
        document.getElementById('perdaPercent').value = produto.perda_percent || '';
        document.getElementById('volumeM3').value = produto.volume_m3 || '';
        document.getElementById('unidadePeso').value = produto.unidade_peso || '';

        editandoProdutoModulo = index;
        document.getElementById('descricaoProduto').focus();

    } catch (error) {
        console.error('❌ Erro ao editar produto:', error);
        alert('Erro ao carregar produto para edição: ' + error.message);
    }
}

// Excluir produto
async function excluirProdutoOriginal(index) {
    try {
        const produto = produtosCarregadosModulo[index];
        if (!produto) {
            alert('Produto não encontrado');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o produto "${produto.descricao}"?`)) {
            return;
        }

        console.log('🗑️ Excluindo produto:', produto.id);

        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await window.supabase
            .from('produtos')
            .delete()
            .eq('id', produto.id)
            .eq('user_id', user.id);

        if (error) throw error;

        console.log('✅ Produto excluído com sucesso!');
        alert('Produto excluído com sucesso!');
        await carregarProdutosSistema();

    } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        alert('Erro ao excluir produto: ' + error.message);
    }
}

// Limpar formulário
function limparFormularioProduto() {
    const form = document.getElementById('formProduto');
    if (form) {
        form.reset();
    }
    
    editandoProdutoModulo = null;
    gerarProximoCodigoProduto();
}

// Exportar funções para uso global
window.editarProdutoOriginal = editarProdutoOriginal;
window.excluirProdutoOriginal = excluirProdutoOriginal;
window.salvarProdutoOriginal = salvarProdutoOriginal;
window.limparFormularioProduto = limparFormularioProduto;
window.inicializarSistema = inicializarSistema;

console.log('✅ produtos.js carregado sem conflitos!');