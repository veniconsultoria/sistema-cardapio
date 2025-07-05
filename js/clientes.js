// Funções específicas para clientes

function salvarCliente(e) {
    e.preventDefault();
    
    const cliente = {
        codigo: document.getElementById('codigoCliente').value,
        descricao: document.getElementById('descricaoCliente').value,
        endereco: document.getElementById('enderecoCliente').value,
        numero: document.getElementById('numeroCliente').value,
        telefone: document.getElementById('telefoneCliente').value,
        email: document.getElementById('emailCliente').value,
        tiposRefeicao: [...tiposRefeicaoTemp]
    };

    if (editandoCliente !== null) {
        clientes[editandoCliente] = cliente;
        editandoCliente = null;
        mostrarAlerta('Cliente editado com sucesso!', 'success');
    } else {
        clientes.push(cliente);
        proximoCodigoCliente++;
        mostrarAlerta('Cliente salvo com sucesso!', 'success');
    }

    limparFormularioCliente();
    atualizarTabelaClientes();
    carregarClientesCardapio();
}

function limparFormularioCliente() {
    document.getElementById('formCliente').reset();
    gerarProximoCodigoCliente();
    tiposRefeicaoTemp = [];
    atualizarTiposRefeicaoVinculados();
    editandoCliente = null;
}

function atualizarTabelaClientes() {
    const tbody = document.querySelector('#tabelaClientes tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    clientes.forEach((cliente, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${cliente.codigo}</td>
            <td>${cliente.descricao}</td>
            <td>${cliente.endereco} ${cliente.numero}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.email}</td>
            <td>
                <button class="btn btn-secondary" onclick="editarCliente(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirCliente(${index})">Excluir</button>
            </td>
        `;
    });
}

function editarCliente(index) {
    const cliente = clientes[index];
    document.getElementById('codigoCliente').value = cliente.codigo;
    document.getElementById('descricaoCliente').value = cliente.descricao;
    document.getElementById('enderecoCliente').value = cliente.endereco;
    document.getElementById('numeroCliente').value = cliente.numero;
    document.getElementById('telefoneCliente').value = cliente.telefone;
    document.getElementById('emailCliente').value = cliente.email;
    tiposRefeicaoTemp = [...cliente.tiposRefeicao];
    atualizarTiposRefeicaoVinculados();
    editandoCliente = index;
}

function excluirCliente(index) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        clientes.splice(index, 1);
        atualizarTabelaClientes();
        carregarClientesCardapio();
        mostrarAlerta('Cliente excluído com sucesso!', 'success');
    }
}

function abrirModalTiposRefeicao() {
    document.getElementById('modalTiposRefeicao').style.display = 'block';
    carregarListaTiposRefeicao();
}

function carregarListaTiposRefeicao() {
    const container = document.getElementById('listaTiposRefeicao');
    if (!container) return;
    
    container.innerHTML = '';

    tiposRefeicoes.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${tipo.codigo} - ${tipo.descricao}</span>
            <button class="btn btn-primary" onclick="adicionarTipoRefeicao(${index})">Adicionar</button>
        `;
        container.appendChild(div);
    });
}

function adicionarTipoRefeicao(index) {
    const tipo = tiposRefeicoes[index];
    
    if (tiposRefeicaoTemp.find(t => t.codigo === tipo.codigo)) {
        mostrarAlerta('Tipo de refeição já adicionado!', 'error');
        return;
    }

    tiposRefeicaoTemp.push(tipo);
    atualizarTiposRefeicaoVinculados();
    mostrarAlerta('Tipo de refeição adicionado!', 'success');
}

function atualizarTiposRefeicaoVinculados() {
    const container = document.getElementById('tiposRefeicaoVinculados');
    if (!container) return;
    
    container.innerHTML = '';

    tiposRefeicaoTemp.forEach((tipo, index) => {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <span>${tipo.codigo} - ${tipo.descricao}</span>
            <button class="btn btn-danger" onclick="removerTipoRefeicao(${index})">Excluir</button>
        `;
        container.appendChild(div);
    });
}

function removerTipoRefeicao(index) {
    if (confirm('Tem certeza que deseja remover este tipo de refeição?')) {
        tiposRefeicaoTemp.splice(index, 1);
        atualizarTiposRefeicaoVinculados();
        mostrarAlerta('Tipo de refeição removido!', 'success');
    }
}