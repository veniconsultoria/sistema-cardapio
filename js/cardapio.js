// cardapio.js - Sistema de Cardápios com Supabase
// Semana 2 - Adaptação para Supabase (Parte 1)

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
let clientesCarregados = [];
let receitasCarregadas = [];
let tiposRefeicaoCarregados = [];
let cardapiosCarregados = {};
let clienteAtualCardapio = null;
let tipoRefeicaoAtualCardapio = null;
let dataAtualCardapio = null;

// Inicializar página de cardápios
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!await verificarAutenticacao()) {
        return;
    }
    
    // Carregar dados do Supabase
    await carregarDadosIniciais();
    
    // Configurar eventos
    configurarEventos();
    
    // Configurar data atual
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('dataCardapio');
    if (inputData) {
        inputData.value = hoje;
    }
});

// Carregar todos os dados necessários
async function carregarDadosIniciais() {
    try {
        await Promise.all([
            carregarClientes(),
            carregarReceitas(),
            carregarTiposRefeicao(),
            carregarCardapios()
        ]);
        
        // Carregar clientes no select
        carregarClientesCardapio();
        
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        alert('Erro ao carregar dados: ' + error.message);
    }
}

// Carregar clientes do Supabase
async function carregarClientes() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('clientes')
            .select(`
                *,
                cliente_tipos_refeicao (
                    tipos_refeicoes (*)
                )
            `)
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        clientesCarregados = (data || []).map(cliente => ({
            ...cliente,
            tiposRefeicao: cliente.cliente_tipos_refeicao.map(rel => rel.tipos_refeicoes)
        }));
        
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        clientesCarregados = [];
    }
}

// Carregar receitas do Supabase
async function carregarReceitas() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('receitas')
            .select(`
                *,
                ingredientes (
                    *,
                    produtos (codigo, descricao)
                )
            `)
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        receitasCarregadas = (data || []).map(receita => ({
            ...receita,
            ingredientes: receita.ingredientes.map(ing => ({
                codigoProduto: ing.produtos.codigo,
                nome: ing.produtos.descricao,
                quantidade: ing.quantidade,
                unidadeMedida: ing.unidade_medida,
                perdaPercent: ing.perda_percent,
                ganhoPercent: ing.ganho_percent,
                precoUnitario: ing.preco_unitario
            }))
        }));
        
    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
        receitasCarregadas = [];
    }
}

// Carregar tipos de refeição do Supabase
async function carregarTiposRefeicao() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        tiposRefeicaoCarregados = data || [];
        
    } catch (error) {
        console.error('Erro ao carregar tipos de refeição:', error);
        tiposRefeicaoCarregados = [];
    }
}

// Carregar cardápios existentes
async function carregarCardapios() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
            .from('cardapios')
            .select(`
                *,
                clientes (codigo, descricao),
                tipos_refeicoes (codigo, descricao),
                receitas (codigo, descricao, rendimento, unidade_rendimento)
            `)
            .eq('user_id', user.id);

        if (error) throw error;

        // Organizar cardápios por data -> cliente -> tipo
        cardapiosCarregados = {};
        
        (data || []).forEach(item => {
            const data = item.data;
            const clienteCodigo = item.clientes.codigo;
            const tipoCodigo = item.tipos_refeicoes.codigo;
            
            if (!cardapiosCarregados[data]) {
                cardapiosCarregados[data] = {};
            }
            
            if (!cardapiosCarregados[data][clienteCodigo]) {
                cardapiosCarregados[data][clienteCodigo] = {};
            }
            
            if (!cardapiosCarregados[data][clienteCodigo][tipoCodigo]) {
                cardapiosCarregados[data][clienteCodigo][tipoCodigo] = [];
            }
            
            cardapiosCarregados[data][clienteCodigo][tipoCodigo].push({
                id: item.id,
                codigo: item.receitas.codigo,
                descricao: item.receitas.descricao,
                comensais: item.comensais,
                quantidadePorPessoa: item.quantidade_por_pessoa,
                totalPorComensais: item.total_por_comensais,
                unidadeBasica: item.unidade_basica,
                alterada: item.alterada || false,
                ingredientes: [] // Será carregado quando necessário
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar cardápios:', error);
        cardapiosCarregados = {};
    }
}

// Configurar eventos
function configurarEventos() {
    // Select de cliente
    const selectCliente = document.getElementById('clienteCardapio');
    if (selectCliente) {
        selectCliente.addEventListener('change', carregarTiposRefeicaoCliente);
    }
    
    // Input de data
    const inputData = document.getElementById('dataCardapio');
    if (inputData) {
        inputData.addEventListener('change', carregarCardapioData);
    }
    
    // Botões globais
    const btnAtualizarTodos = document.getElementById('btn-atualizar-todos');
    if (btnAtualizarTodos) {
        btnAtualizarTodos.addEventListener('click', atualizarParaTodos);
    }
    
    const btnCalcularTodos = document.getElementById('btn-calcular-todos');
    if (btnCalcularTodos) {
        btnCalcularTodos.addEventListener('click', calcularParaTodos);
    }
    
    const btnGravarTodos = document.getElementById('btn-gravar-todos');
    if (btnGravarTodos) {
        btnGravarTodos.addEventListener('click', gravarParaTodos);
    }
}

// Carregar clientes no select
function carregarClientesCardapio() {
    const select = document.getElementById('clienteCardapio');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    clientesCarregados.forEach((cliente, index) => {
        if (cliente.tiposRefeicao && cliente.tiposRefeicao.length > 0) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = cliente.descricao;
            select.appendChild(option);
        }
    });
}

// Carregar tipos de refeição do cliente selecionado
function carregarTiposRefeicaoCliente() {
    const clienteIndex = document.getElementById('clienteCardapio').value;
    const container = document.getElementById('tiposRefeicaoCardapio');
    
    if (!container) return;
    container.innerHTML = '';

    if (clienteIndex === '') {
        clienteAtualCardapio = null;
        return;
    }

    const cliente = clientesCarregados[clienteIndex];
    clienteAtualCardapio = cliente;

    if (!cliente.tiposRefeicao || cliente.tiposRefeicao.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Cliente não possui tipos de refeição cadastrados</p>';
        return;
    }

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
    
    // Carregar dados da data atual se houver
    carregarCardapioData();
}

// Toggle expandable
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

// Abrir modal de receitas para tipo específico
function abrirModalReceitasTipo(tipoRefeicaoCodigo) {
    tipoRefeicaoAtualCardapio = tipoRefeicaoCodigo;
    document.getElementById('modalReceitas').style.display = 'block';
    carregarListaReceitasModal();
}

// Carregar lista de receitas no modal
function carregarListaReceitasModal() {
    const container = document.getElementById('listaReceitasModal');
    if (!container) return;
    
    container.innerHTML = '';

    if (receitasCarregadas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Nenhuma receita cadastrada</p>';
        return;
    }

    receitasCarregadas.forEach((receita, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <input type="checkbox" id="receita-${index}" value="${index}">
            <label for="receita-${index}">${receita.codigo} - ${receita.descricao}</label>
        `;
        container.appendChild(div);
    });
}

// Filtrar receitas no modal
function filtrarReceitas() {
    const search = document.getElementById('searchReceitas').value.toLowerCase();
    const items = document.querySelectorAll('#listaReceitasModal .ingredient-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

// Adicionar receitas selecionadas ao cardápio
async function adicionarReceitasSelecionadas() {
    try {
        const checkboxes = document.querySelectorAll('#listaReceitasModal input[type="checkbox"]:checked');
        const data = document.getElementById('dataCardapio').value;
        
        if (!data) {
            alert('Selecione uma data primeiro!');
            return;
        }

        if (!clienteAtualCardapio) {
            alert('Selecione um cliente primeiro!');
            return;
        }

        if (checkboxes.length === 0) {
            alert('Selecione pelo menos uma receita!');
            return;
        }

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Usuário não autenticado');

        // Buscar IDs necessários
        const cliente = clientesCarregados.find(c => c.codigo === clienteAtualCardapio.codigo);
        const tipoRefeicao = tiposRefeicaoCarregados.find(t => t.codigo === tipoRefeicaoAtualCardapio);

        if (!cliente || !tipoRefeicao) {
            alert('Erro: Cliente ou tipo de refeição não encontrado');
            return;
        }

        // Preparar dados para inserção
        const cardapiosParaInserir = [];

        for (const checkbox of checkboxes) {
            const receitaIndex = parseInt(checkbox.value);
            const receita = receitasCarregadas[receitaIndex];
            
            if (receita) {
                cardapiosParaInserir.push({
                    data: data,
                    cliente_id: cliente.id,
                    tipo_refeicao_id: tipoRefeicao.id,
                    receita_id: receita.id,
                    comensais: 0,
                    quantidade_por_pessoa: receita.rendimento || 1,
                    total_por_comensais: 0,
                    unidade_basica: receita.unidade_rendimento || 'UN',
                    alterada: false,
                    user_id: userData.user.id
                });
            }
        }

        // Inserir no Supabase
        const { error } = await supabase
            .from('cardapios')
            .insert(cardapiosParaInserir);

        if (error) throw error;

        // Fechar modal e recarregar
        fecharModal('modalReceitas');
        await carregarCardapios();
        carregarCardapioData();
        
        alert('Receitas adicionadas com sucesso!');

    } catch (error) {
        console.error('Erro ao adicionar receitas:', error);
        alert('Erro ao adicionar receitas: ' + error.message);
    }
}

// Carregar cardápio da data selecionada
function carregarCardapioData() {
    const data = document.getElementById('dataCardapio').value;
    const clienteIndex = document.getElementById('clienteCardapio').value;
    
    if (!data || clienteIndex === '' || !clienteAtualCardapio) return;

    dataAtualCardapio = data;

    // Carregar receitas do cardápio para cada tipo
    clienteAtualCardapio.tiposRefeicao.forEach(tipo => {
        const container = document.querySelector(`[data-tipo="${tipo.codigo}"]`);
        if (container) {
            container.innerHTML = '';
            
            if (cardapiosCarregados[data] && 
                cardapiosCarregados[data][clienteAtualCardapio.codigo] && 
                cardapiosCarregados[data][clienteAtualCardapio.codigo][tipo.codigo]) {
                
                const receitas = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipo.codigo];
                
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

// Atualizar receita do cardápio
async function atualizarReceitaCardapio(tipoCodigo, receitaIndex, campo, valor) {
    try {
        const data = document.getElementById('dataCardapio').value;
        
        if (!cardapiosCarregados[data] || 
            !cardapiosCarregados[data][clienteAtualCardapio.codigo] || 
            !cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo]) {
            return;
        }

        const receita = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo][receitaIndex];
        if (!receita) return;

        const novoValor = parseFloat(valor) || 0;
        receita[campo] = novoValor;
        
        // Verificar se foi alterada a quantidade por pessoa
        if (campo === 'quantidadePorPessoa') {
            const receitaOriginal = receitasCarregadas.find(r => r.codigo === receita.codigo);
            if (receitaOriginal && receitaOriginal.rendimento !== novoValor) {
                receita.alterada = true;
            }
        }
        
        // Recalcular total
        if (campo === 'comensais' || campo === 'quantidadePorPessoa') {
            receita.totalPorComensais = receita.quantidadePorPessoa * receita.comensais;
        }
        
        // Atualizar no Supabase
        await atualizarCardapioSupabase(receita);
        
        // Recarregar visualização
        carregarCardapioData();

    } catch (error) {
        console.error('Erro ao atualizar receita:', error);
        alert('Erro ao atualizar receita: ' + error.message);
    }
}

// Atualizar cardápio no Supabase
async function atualizarCardapioSupabase(receita) {
    try {
        const { error } = await supabase
            .from('cardapios')
            .update({
                comensais: receita.comensais,
                quantidade_por_pessoa: receita.quantidadePorPessoa,
                total_por_comensais: receita.totalPorComensais,
                alterada: receita.alterada
            })
            .eq('id', receita.id);

        if (error) throw error;

    } catch (error) {
        console.error('Erro ao atualizar no Supabase:', error);
        throw error;
    }
}

// Remover receita do cardápio
async function removerReceitaCardapio(tipoCodigo, receitaIndex) {
    try {
        if (!confirm('Tem certeza que deseja remover esta receita?')) {
            return;
        }

        const data = document.getElementById('dataCardapio').value;
        
        if (!cardapiosCarregados[data] || 
            !cardapiosCarregados[data][clienteAtualCardapio.codigo] || 
            !cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo]) {
            return;
        }

        const receita = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo][receitaIndex];
        if (!receita) return;

        // Remover do Supabase
        const { error } = await supabase
            .from('cardapios')
            .delete()
            .eq('id', receita.id);

        if (error) throw error;

        // Remover do array local
        cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo].splice(receitaIndex, 1);
        
        // Recarregar visualização
        carregarCardapioData();
        
        alert('Receita removida do cardápio!');

    } catch (error) {
        console.error('Erro ao remover receita:', error);
        alert('Erro ao remover receita: ' + error.message);
    }
}

// Atualizar comensais para um tipo
async function atualizarComensais(botao) {
    try {
        const container = botao.closest('.expandable-content');
        const input = container.querySelector('.comensais-input');
        const totalComensais = parseInt(input.value) || 0;
        const tipoCodigo = container.querySelector('.receitas-container').dataset.tipo;
        
        if (totalComensais <= 0) {
            alert('Informe um número válido de comensais!');
            return;
        }
        
        const data = document.getElementById('dataCardapio').value;
        
        if (!cardapiosCarregados[data] || 
            !cardapiosCarregados[data][clienteAtualCardapio.codigo] || 
            !cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo]) {
            return;
        }

        const receitas = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo];
        
        // Atualizar todas as receitas do tipo
        for (const receita of receitas) {
            receita.comensais = totalComensais;
            receita.totalPorComensais = receita.quantidadePorPessoa * totalComensais;
            await atualizarCardapioSupabase(receita);
        }
        
        carregarCardapioData();
        alert('Comensais atualizados!');

    } catch (error) {
        console.error('Erro ao atualizar comensais:', error);
        alert('Erro ao atualizar comensais: ' + error.message);
    }
}

// Atualizar para todos os tipos
async function atualizarParaTodos() {
    try {
        const totalComensais = parseInt(document.getElementById('totalComensais').value) || 0;
        const data = document.getElementById('dataCardapio').value;
        
        if (totalComensais <= 0) {
            alert('Informe um número válido de comensais!');
            return;
        }
        
        if (!data || !clienteAtualCardapio) {
            alert('Selecione cliente e data!');
            return;
        }
        
        // Atualizar todos os inputs de comensais
        document.querySelectorAll('.comensais-input').forEach(input => {
            input.value = totalComensais;
        });
        
        // Atualizar nos dados e no Supabase
        if (cardapiosCarregados[data] && cardapiosCarregados[data][clienteAtualCardapio.codigo]) {
            for (const tipoCodigo of Object.keys(cardapiosCarregados[data][clienteAtualCardapio.codigo])) {
                const receitas = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo];
                for (const receita of receitas) {
                    receita.comensais = totalComensais;
                    receita.totalPorComensais = receita.quantidadePorPessoa * totalComensais;
                    await atualizarCardapioSupabase(receita);
                }
            }
        }
        
        carregarCardapioData();
        alert('Comensais atualizados para todos os tipos!');

    } catch (error) {
        console.error('Erro ao atualizar para todos:', error);
        alert('Erro ao atualizar para todos: ' + error.message);
    }
}

// Calcular para todos
async function calcularParaTodos() {
    try {
        const data = document.getElementById('dataCardapio').value;
        
        if (!data || !clienteAtualCardapio) {
            alert('Selecione cliente e data!');
            return;
        }
        
        if (cardapiosCarregados[data] && cardapiosCarregados[data][clienteAtualCardapio.codigo]) {
            for (const tipoCodigo of Object.keys(cardapiosCarregados[data][clienteAtualCardapio.codigo])) {
                const receitas = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo];
                for (const receita of receitas) {
                    receita.totalPorComensais = receita.quantidadePorPessoa * receita.comensais;
                    await atualizarCardapioSupabase(receita);
                }
            }
        }
        
        carregarCardapioData();
        alert('Cálculos realizados para todos os tipos!');

    } catch (error) {
        console.error('Erro ao calcular para todos:', error);
        alert('Erro ao calcular para todos: ' + error.message);
    }
}

// Gravar para todos
async function gravarParaTodos() {
    try {
        const data = document.getElementById('dataCardapio').value;
        const clienteIndex = document.getElementById('clienteCardapio').value;
        
        if (!data || clienteIndex === '') {
            alert('Selecione cliente e data!');
            return;
        }
        
        // Calcular automaticamente antes de gravar
        await calcularParaTodos();
        
        alert('Cardápio gravado para todos os tipos!');

    } catch (error) {
        console.error('Erro ao gravar para todos:', error);
        alert('Erro ao gravar para todos: ' + error.message);
    }
}

// Calcular tipo específico
async function calcularTipoRefeicao(tipoCodigo) {
    try {
        const data = document.getElementById('dataCardapio').value;
        
        if (!data || !clienteAtualCardapio) return;
        
        if (cardapiosCarregados[data] && 
            cardapiosCarregados[data][clienteAtualCardapio.codigo] && 
            cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo]) {
            
            const receitas = cardapiosCarregados[data][clienteAtualCardapio.codigo][tipoCodigo];
            for (const receita of receitas) {
                receita.totalPorComensais = receita.quantidadePorPessoa * receita.comensais;
                await atualizarCardapioSupabase(receita);
            }
        }
        
        carregarCardapioData();
        alert('Cálculo realizado para este tipo de refeição!');

    } catch (error) {
        console.error('Erro ao calcular tipo:', error);
        alert('Erro ao calcular tipo: ' + error.message);
    }
}

// Gravar tipo específico
async function gravarTipoRefeicao(tipoCodigo) {
    try {
        const data = document.getElementById('dataCardapio').value;
        
        if (!data || !clienteAtualCardapio) {
            alert('Selecione cliente e data!');
            return;
        }
        
        // Calcular antes de gravar
        await calcularTipoRefeicao(tipoCodigo);
        
        alert('Tipo de refeição gravado!');

    } catch (error) {
        console.error('Erro ao gravar tipo:', error);
        alert('Erro ao gravar tipo: ' + error.message);
    }
}

// Fechar modal
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Exportar funções para uso global
window.toggleExpandable = toggleExpandable;
window.abrirModalReceitasTipo = abrirModalReceitasTipo;
window.filtrarReceitas = filtrarReceitas;
window.adicionarReceitasSelecionadas = adicionarReceitasSelecionadas;
window.atualizarReceitaCardapio = atualizarReceitaCardapio;
window.removerReceitaCardapio = removerReceitaCardapio;
window.atualizarComensais = atualizarComensais;
window.atualizarParaTodos = atualizarParaTodos;
window.calcularParaTodos = calcularParaTodos;
window.gravarParaTodos = gravarParaTodos;
window.calcularTipoRefeicao = calcularTipoRefeicao;
window.gravarTipoRefeicao = gravarTipoRefeicao;
window.fecharModal = fecharModal;