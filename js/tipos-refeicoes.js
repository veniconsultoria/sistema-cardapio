// tipos-refeicoes.js - Sistema de Tipos de Refeições com Supabase
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

// Variável global para armazenar tipos de refeições
let tiposRefeicoesCarregados = [];
let editandoTipoRefeicao = null;

// Inicializar página de tipos de refeições
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação
    if (!await verificarAutenticacao()) {
        return;
    }
    
    // Carregar tipos de refeições do Supabase
    await carregarTiposRefeicoes();
    
    // Configurar eventos dos botões
    configurarEventos();
    
    // Gerar próximo código
    await gerarProximoCodigoTipoRefeicao();
});

// Configurar eventos dos botões e formulários
function configurarEventos() {
    // Formulário de salvar
    const form = document.getElementById('formTipoRefeicao');
    if (form) {
        form.addEventListener('submit', salvarTipoRefeicao);
    }
    
    // Botão Limpar
    const btnLimpar = document.getElementById('btn-limpar-tipo');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormularioTipoRefeicao);
    }
}

// Carregar tipos de refeições do Supabase
async function carregarTiposRefeicoes() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const { data, error } = await supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) {
            throw error;
        }

        tiposRefeicoesCarregados = data || [];
        atualizarTabelaTiposRefeicoes();
        
    } catch (error) {
        console.error('Erro ao carregar tipos de refeições:', error);
        alert('Erro ao carregar tipos de refeições: ' + error.message);
    }
}

// Gerar próximo código de tipo de refeição
async function gerarProximoCodigoTipoRefeicao() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.rpc('get_next_tipo_refeicao_codigo', {
            user_uuid: user.id
        });

        if (error) {
            throw error;
        }

        const input = document.getElementById('codigoTipoRefeicao');
        if (input) {
            input.value = data || 'TIPO001';
        }
        
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        const input = document.getElementById('codigoTipoRefeicao');
        if (input) {
            input.value = 'TIPO001';
        }
    }
}

// Salvar tipo de refeição (novo ou editado)
async function salvarTipoRefeicao(e) {
    e.preventDefault();
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Coletar dados do formulário
        const codigo = document.getElementById('codigoTipoRefeicao').value.trim();
        const descricao = document.getElementById('descricaoTipoRefeicao').value.trim();

        // Validações
        if (!descricao) {
            alert('Por favor, informe a descrição do tipo de refeição');
            document.getElementById('descricaoTipoRefeicao').focus();
            return;
        }

        if (!codigo) {
            alert('Por favor, informe o código do tipo de refeição');
            document.getElementById('codigoTipoRefeicao').focus();
            return;
        }

        // Preparar dados para salvar
        const tipoRefeicaoData = {
            codigo,
            descricao,
            user_id: user.id
        };

        let result;
        if (editandoTipoRefeicao !== null) {
            // Atualizar tipo existente
            const tipoAtual = tiposRefeicoesCarregados[editandoTipoRefeicao];
            result = await supabase
                .from('tipos_refeicoes')
                .update(tipoRefeicaoData)
                .eq('id', tipoAtual.id)
                .eq('user_id', user.id);
        } else {
            // Criar novo tipo
            result = await supabase
                .from('tipos_refeicoes')
                .insert([tipoRefeicaoData]);
        }

        if (result.error) {
            throw result.error;
        }

        alert(editandoTipoRefeicao !== null ? 'Tipo de refeição atualizado com sucesso!' : 'Tipo de refeição criado com sucesso!');
        
        // Limpar formulário e recarregar lista
        limparFormularioTipoRefeicao();
        await carregarTiposRefeicoes();

    } catch (error) {
        console.error('Erro ao salvar tipo de refeição:', error);
        alert('Erro ao salvar tipo de refeição: ' + error.message);
    }
}

// Limpar formulário
function limparFormularioTipoRefeicao() {
    const form = document.getElementById('formTipoRefeicao');
    if (form) {
        form.reset();
    }
    editandoTipoRefeicao = null;
    gerarProximoCodigoTipoRefeicao();
}

// Renderizar tabela de tipos de refeições
function atualizarTabelaTiposRefeicoes() {
    const tbody = document.querySelector('#tabelaTiposRefeicoes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (tiposRefeicoesCarregados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; color: #666; padding: 20px;">
                    Nenhum tipo de refeição encontrado
                </td>
            </tr>
        `;
        return;
    }

    tiposRefeicoesCarregados.forEach((tipo, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tipo.codigo}</td>
            <td>${tipo.descricao}</td>
            <td>
                <button onclick="editarTipoRefeicao(${index})" class="btn btn-sm btn-primary">
                    Editar
                </button>
                <button onclick="excluirTipoRefeicao(${index})" class="btn btn-sm btn-danger">
                    Excluir
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Editar tipo de refeição
function editarTipoRefeicao(index) {
    const tipo = tiposRefeicoesCarregados[index];
    if (!tipo) {
        alert('Tipo de refeição não encontrado');
        return;
    }

    document.getElementById('codigoTipoRefeicao').value = tipo.codigo;
    document.getElementById('descricaoTipoRefeicao').value = tipo.descricao;
    editandoTipoRefeicao = index;
    
    document.getElementById('descricaoTipoRefeicao').focus();
}

// Excluir tipo de refeição
async function excluirTipoRefeicao(index) {
    try {
        const tipo = tiposRefeicoesCarregados[index];
        if (!tipo) {
            alert('Tipo de refeição não encontrado');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o tipo de refeição "${tipo.descricao}"?`)) {
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const { error } = await supabase
            .from('tipos_refeicoes')
            .delete()
            .eq('id', tipo.id)
            .eq('user_id', user.id);

        if (error) {
            throw error;
        }

        alert('Tipo de refeição excluído com sucesso!');
        await carregarTiposRefeicoes();

    } catch (error) {
        console.error('Erro ao excluir tipo de refeição:', error);
        alert('Erro ao excluir tipo de refeição: ' + error.message);
    }
}

// Exportar funções para uso global
window.editarTipoRefeicao = editarTipoRefeicao;
window.excluirTipoRefeicao = excluirTipoRefeicao;