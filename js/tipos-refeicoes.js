// tipos-refeicoes.js - Sistema de Tipos de Refeições com Supabase (CORRIGIDO)

console.log('📁 Carregando tipos-refeicoes.js...');

// Variáveis globais
let tiposRefeicoesCarregados = [];
let editandoTipoRefeicao = null;

// Aguardar Supabase estar disponível
function aguardarSupabaseTipos(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para tipos-refeicoes.js');
        callback();
    } else if (tentativas < 50) {
        setTimeout(() => aguardarSupabaseTipos(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        alert('Erro: Não foi possível conectar com o Supabase.');
    }
}

// Verificar autenticação
async function verificarAutenticacaoTipos() {
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

// Inicializar quando aba tipos-refeicoes for aberta
async function inicializarTiposRefeicoes() {
    aguardarSupabaseTipos(async () => {
        if (await verificarAutenticacaoTipos()) {
            await carregarTiposRefeicoes();
            await gerarProximoCodigoTipoRefeicao();
            configurarEventosTipos();
        }
    });
}

// Configurar eventos
function configurarEventosTipos() {
    const form = document.getElementById('formTipoRefeicao');
    if (form) {
        // Remover listeners existentes para evitar duplicação
        form.removeEventListener('submit', salvarTipoRefeicaoHandler);
        form.addEventListener('submit', salvarTipoRefeicaoHandler);
    }
}

// Handler para salvar tipo de refeição
async function salvarTipoRefeicaoHandler(e) {
    e.preventDefault();
    await salvarTipoRefeicao();
}

// Carregar tipos de refeições do Supabase
async function carregarTiposRefeicoes() {
    try {
        console.log('📥 Carregando tipos de refeições...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data, error } = await window.supabase
            .from('tipos_refeicoes')
            .select('*')
            .eq('user_id', user.id)
            .order('codigo');

        if (error) throw error;

        tiposRefeicoesCarregados = data || [];
        atualizarTabelaTiposRefeicoes();
        
        // Disponibilizar globalmente para outros módulos
        window.tiposRefeicoesPadrao = tiposRefeicoesCarregados;
        
        console.log(`✅ ${tiposRefeicoesCarregados.length} tipos de refeições carregados`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar tipos de refeições:', error);
        alert('Erro ao carregar tipos de refeições: ' + error.message);
    }
}

// Gerar próximo código de tipo de refeição
async function gerarProximoCodigoTipoRefeicao() {
    try {
        console.log('🔢 Gerando próximo código de tipo de refeição...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        const { data, error } = await window.supabase.rpc('get_next_tipo_refeicao_codigo', {
            user_uuid: user.id
        });

        if (error) throw error;

        const input = document.getElementById('codigoTipoRefeicao');
        if (input) {
            input.value = data || 'TIPO001';
            console.log('✅ Próximo código gerado:', data);
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar código:', error);
        const input = document.getElementById('codigoTipoRefeicao');
        if (input) {
            input.value = 'TIPO001';
        }
    }
}

// Salvar tipo de refeição (CORRIGIDO PARA SUPABASE)
async function salvarTipoRefeicao() {
    try {
        console.log('💾 Salvando tipo de refeição...');
        
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

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

        console.log('📤 Dados do tipo de refeição:', tipoRefeicaoData);

        let result;
        if (editandoTipoRefeicao !== null) {
            // Atualizar tipo existente
            console.log('🔄 Atualizando tipo de refeição existente...');
            const tipoAtual = tiposRefeicoesCarregados[editandoTipoRefeicao];
            result = await window.supabase
                .from('tipos_refeicoes')
                .update(tipoRefeicaoData)
                .eq('id', tipoAtual.id)
                .eq('user_id', user.id);
        } else {
            // Criar novo tipo
            console.log('➕ Criando novo tipo de refeição...');
            result = await window.supabase
                .from('tipos_refeicoes')
                .insert([tipoRefeicaoData]);
        }

        if (result.error) throw result.error;

        console.log('✅ Tipo de refeição salvo com sucesso!');
        alert(editandoTipoRefeicao !== null ? 'Tipo de refeição atualizado com sucesso!' : 'Tipo de refeição criado com sucesso!');
        
        // Limpar formulário e recarregar lista
        limparFormularioTipoRefeicao();
        await carregarTiposRefeicoes();

    } catch (error) {
        console.error('❌ Erro ao salvar tipo de refeição:', error);
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

        console.log('🗑️ Excluindo tipo de refeição:', tipo.id);

        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await window.supabase
            .from('tipos_refeicoes')
            .delete()
            .eq('id', tipo.id)
            .eq('user_id', user.id);

        if (error) throw error;

        console.log('✅ Tipo de refeição excluído com sucesso!');
        alert('Tipo de refeição excluído com sucesso!');
        await carregarTiposRefeicoes();

    } catch (error) {
        console.error('❌ Erro ao excluir tipo de refeição:', error);
        alert('Erro ao excluir tipo de refeição: ' + error.message);
    }
}

// Modificar showTab para incluir inicialização quando necessário
const originalShowTabTipos = window.showTab;
if (originalShowTabTipos) {
    window.showTab = function(tabName) {
        originalShowTabTipos(tabName);
        
        if (tabName === 'tipos-refeicoes') {
            setTimeout(inicializarTiposRefeicoes, 100);
        }
    };
}

// Exportar funções para uso global
window.editarTipoRefeicao = editarTipoRefeicao;
window.excluirTipoRefeicao = excluirTipoRefeicao;
window.salvarTipoRefeicao = salvarTipoRefeicao;
window.limparFormularioTipoRefeicao = limparFormularioTipoRefeicao;
window.inicializarTiposRefeicoes = inicializarTiposRefeicoes;

console.log('✅ tipos-refeicoes.js carregado com sucesso!');