// produtos.js - Sistema de Produtos com Supabase (VERSÃO CORRIGIDA)

console.log('📁 Carregando produtos.js...');

// Variáveis globais
let produtosCarregados = [];
let editandoProduto = null;

// Aguardar Supabase estar disponível
function aguardarSupabase(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para produtos.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabase(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        alert('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar autenticação
async function verificarAutenticacao() {
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

// Inicializar quando página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado, inicializando produtos...');
    
    aguardarSupabase(async () => {
        console.log('🔐 Verificando autenticação...');
        
        if (await verificarAutenticacao()) {
            console.log('✅ Usuário autenticado, carregando sistema...');
            await inicializarSistema();
        }
    });
});

// Inicializar sistema completo
async function inicializarSistema() {
    try {
        console.log('🚀 Inicializando sistema de produtos...');
        
        // Carregar produtos
        await carregarProdutos();
        
        // Gerar próximo código
        await gerarProximoCodigo();
        
        // Configurar eventos
        configurarEventos();
        
        console.log('✅ Sistema de produtos inicializado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
        alert('Erro ao inicializar sistema: ' + error.message);
    }
}

// Configurar eventos dos botões
function configurarEventos() {
    // Botão Novo Produto
    const btnNovo = document.getElementById('btn-novo-produto');
    if (btnNovo) {
        btnNovo.addEventListener('click', abrirModalNovoProduto);
    }
    
    // Botão Salvar
    const btnSalvar = document.getElementById('btn-salvar-produto');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarProduto);
    }
    
    // Botão Cancelar
    const btnCancelar = document.getElementById('btn-cancelar-produto');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', fecharModal);
    }
    
    // Botão Limpar (se existir)
    const btnLimpar = document.getElementById('btn-limpar-produto');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormulario);
    }
    
    // Campo de busca
    const inputBusca = document.getElementById('busca-produtos');
    if (inputBusca) {
        inputBusca.addEventListener('input', filtrarProdutos);
    }
    
    // Filtro por grupo
    const selectGrupo = document.getElementById('filtro-grupo');
    if (selectGrupo) {
        selectGrupo.addEventListener('change', filtrarProdutos);
    }
}

// Gerar próximo código
async function gerarProximoCodigo() {
    try {
        console.log('🔢 Gerando próximo código...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_produto_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;

        const input = document.getElementById('produto-codigo');
        if (input) {
            input.value = data || 'PR000001';
            console.log('✅ Próximo código gerado:', data);
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('produto-codigo');
        if (input) {
            input.value = 'PR000001';
        }
    }
}

// Carregar produtos do Supabase
async function carregarProdutos() {
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

        produtosCarregados = data || [];
        console.log(`✅ ${produtosCarregados.length} produtos carregados`);
        
        renderizarTabelaProdutos(produtosCarregados);
        
    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos: ' + error.message);
    }
}

// Renderizar tabela de produtos
function renderizarTabelaProdutos(produtos) {
    console.log('🎨 Renderizando tabela com', produtos.length, 'produtos');
    
    const tbody = document.getElementById('produtos-tbody');
    if (!tbody) {
        console.warn('⚠️ Elemento produtos-tbody não encontrado');
        return;
    }

    tbody.innerHTML = '';

    if (produtos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum produto encontrado
                </td>
            </tr>
        `;
        return;
    }

    produtos.forEach((produto, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.descricao}</td>
            <td>${produto.grupo}</td>
            <td>${produto.unidade_medida}</td>
            <td>${produto.peso_bruto || '-'}</td>
            <td>${produto.peso_liquido || '-'}</td>
            <td>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</td>
            <td>
                <button onclick="editarProduto('${produto.id}')" class="btn btn-sm btn-primary">
                    Editar
                </button>
                <button onclick="excluirProduto('${produto.id}')" class="btn btn-sm btn-danger">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('✅ Tabela renderizada');
}

// Filtrar produtos
function filtrarProdutos() {
    const busca = document.getElementById('busca-produtos')?.value.toLowerCase() || '';
    const grupo = document.getElementById('filtro-grupo')?.value || '';

    let produtosFiltrados = produtosCarregados;

    if (busca) {
        produtosFiltrados = produtosFiltrados.filter(produto =>
            produto.descricao.toLowerCase().includes(busca) ||
            produto.codigo.toLowerCase().includes(busca)
        );
    }

    if (grupo) {
        produtosFiltrados = produtosFiltrados.filter(produto => produto.grupo === grupo);
    }

    renderizarTabelaProdutos(produtosFiltrados);
}

// Abrir modal para novo produto
async function abrirModalNovoProduto() {
    try {
        console.log('➕ Abrindo modal para novo produto...');
        
        // Gerar próximo código
        await gerarProximoCodigo();

        // Limpar formulário
        document.getElementById('produto-id').value = '';
        document.getElementById('produto-descricao').value = '';
        document.getElementById('produto-grupo').value = 'Ingredientes';
        document.getElementById('produto-unidade').value = 'KG';
        document.getElementById('produto-peso-bruto').value = '';
        document.getElementById('produto-peso-liquido').value = '';
        document.getElementById('produto-preco').value = '';

        // Mostrar modal
        const modal = document.getElementById('modal-produto');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('produto-descricao').focus();
        }

    } catch (error) {
        console.error('❌ Erro ao abrir modal:', error);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

// Salvar produto (novo ou editado)
async function salvarProduto() {
    try {
        console.log('💾 Salvando produto...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Coletar dados do formulário
        const id = document.getElementById('produto-id').value;
        const codigo = document.getElementById('produto-codigo').value.trim();
        const descricao = document.getElementById('produto-descricao').value.trim();
        const grupo = document.getElementById('produto-grupo').value;
        const unidade_medida = document.getElementById('produto-unidade').value;
        const peso_bruto = document.getElementById('produto-peso-bruto').value;
        const peso_liquido = document.getElementById('produto-peso-liquido').value;
        const preco = document.getElementById('produto-preco').value;

        // Validações
        if (!descricao) {
            alert('Por favor, informe a descrição do produto');
            document.getElementById('produto-descricao').focus();
            return;
        }

        if (!codigo) {
            alert('Por favor, informe o código do produto');
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
            user_id: user.id
        };

        console.log('📤 Dados do produto:', produtoData);

        let result;
        if (id) {
            // Atualizar produto existente
            console.log('🔄 Atualizando produto existente...');
            result = await window.supabase
                .from('produtos')
                .update(produtoData)
                .eq('id', id)
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
        alert(id ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        
        // Fechar modal e recarregar lista
        fecharModal();
        await carregarProdutos();

    } catch (error) {
        console.error('❌ Erro ao salvar produto:', error);
        alert('Erro ao salvar produto: ' + error.message);
    }
}

// Editar produto existente
async function editarProduto(id) {
    try {
        console.log('✏️ Editando produto:', id);
        
        const produto = produtosCarregados.find(p => p.id === id);
        if (!produto) {
            alert('Produto não encontrado');
            return;
        }

        // Preencher formulário
        document.getElementById('produto-id').value = produto.id;
        document.getElementById('produto-codigo').value = produto.codigo;
        document.getElementById('produto-descricao').value = produto.descricao;
        document.getElementById('produto-grupo').value = produto.grupo;
        document.getElementById('produto-unidade').value = produto.unidade_medida;
        document.getElementById('produto-peso-bruto').value = produto.peso_bruto || '';
        document.getElementById('produto-peso-liquido').value = produto.peso_liquido || '';
        document.getElementById('produto-preco').value = produto.preco || '';

        // Mostrar modal
        const modal = document.getElementById('modal-produto');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('produto-descricao').focus();
        }

    } catch (error) {
        console.error('❌ Erro ao editar produto:', error);
        alert('Erro ao carregar produto para edição: ' + error.message);
    }
}

// Excluir produto
async function excluirProduto(id) {
    try {
        const produto = produtosCarregados.find(p => p.id === id);
        if (!produto) {
            alert('Produto não encontrado');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o produto "${produto.descricao}"?`)) {
            return;
        }

        console.log('🗑️ Excluindo produto:', id);

        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await window.supabase
            .from('produtos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        console.log('✅ Produto excluído com sucesso!');
        alert('Produto excluído com sucesso!');
        await carregarProdutos();

    } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        alert('Erro ao excluir produto: ' + error.message);
    }
}

// Limpar formulário
function limparFormulario() {
    document.getElementById('produto-id').value = '';
    document.getElementById('produto-descricao').value = '';
    document.getElementById('produto-grupo').value = 'Ingredientes';
    document.getElementById('produto-unidade').value = 'KG';
    document.getElementById('produto-peso-bruto').value = '';
    document.getElementById('produto-peso-liquido').value = '';
    document.getElementById('produto-preco').value = '';
    
    gerarProximoCodigo();
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal-produto');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função para recarregar produtos (debug)
async function recarregarProdutos() {
    console.log('🔄 Recarregando produtos...');
    await carregarProdutos();
}

// Exportar funções para uso global
window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;
window.abrirModalNovoProduto = abrirModalNovoProduto;
window.salvarProduto = salvarProduto;
window.fecharModal = fecharModal;
window.recarregarProdutos = recarregarProdutos;

console.log('✅ produtos.js carregado com sucesso!');