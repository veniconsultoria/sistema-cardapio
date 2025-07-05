// Funções específicas para tipos de refeições

function salvarTipoRefeicao(e) {
    e.preventDefault();
    
    const tipoRefeicao = {
        codigo: document.getElementById('codigoTipoRefeicao').value,
        descricao: document.getElementById('descricaoTipoRefeicao').value
    };

    if (editandoTipoRefeicao !== null) {
        tiposRefeicoes[editandoTipoRefeicao] = tipoRefeicao;
        editandoTipoRefeicao = null;
        mostrarAlerta('Tipo de refeição editado com sucesso!', 'success');
    } else {
        tiposRefeicoes.push(tipoRefeicao);
        proximoCodigoTipoRefeicao++;
        mostrarAlerta('Tipo de refeição salvo com sucesso!', 'success');
    }

    limparFormularioTipoRefeicao();
    atualizarTabelaTiposRefeicoes();
}

function limparFormularioTipoRefeicao() {
    document.getElementById('formTipoRefeicao').reset();
    gerarProximoCodigoTipoRefeicao();
    editandoTipoRefeicao = null;
}

function atualizarTabelaTiposRefeicoes() {
    const tbody = document.querySelector('#tabelaTiposRefeicoes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    tiposRefeicoes.forEach((tipo, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${tipo.codigo}</td>
            <td>${tipo.descricao}</td>
            <td>
                <button class="btn btn-secondary" onclick="editarTipoRefeicao(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirTipoRefeicao(${index})">Excluir</button>
            </td>
        `;
    });
}

function editarTipoRefeicao(index) {
    const tipo = tiposRefeicoes[index];
    document.getElementById('codigoTipoRefeicao').value = tipo.codigo;
    document.getElementById('descricaoTipoRefeicao').value = tipo.descricao;
    editandoTipoRefeicao = index;
}

function excluirTipoRefeicao(index) {
    if (confirm('Tem certeza que deseja excluir este tipo de refeição?')) {
        tiposRefeicoes.splice(index, 1);
        atualizarTabelaTiposRefeicoes();
        mostrarAlerta('Tipo de refeição excluído com sucesso!', 'success');
    }
}