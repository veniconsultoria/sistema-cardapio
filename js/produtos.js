// Funções específicas para produtos

function salvarProduto(e) {
    e.preventDefault();
    
    const produto = {
        codigo: document.getElementById('codigoProduto').value,
        descricao: document.getElementById('descricaoProduto').value,
        grupo: document.getElementById('grupoProduto').value,
        unidadeMedida: document.getElementById('unidadeMedida').value,
        pesoBruto: parseFloat(document.getElementById('pesoBruto').value) || 0,
        unidadePeso: document.getElementById('unidadePeso').value,
        pesoLiquido: parseFloat(document.getElementById('pesoLiquido').value) || 0,
        volumeM3: parseFloat(document.getElementById('volumeM3').value) || 0,
        perdaPercent: parseFloat(document.getElementById('perdaPercent').value) || 0,
        precoItem: parseFloat(document.getElementById('precoItem').value) || 0
    };

    if (editandoProduto !== null) {
        produtos[editandoProduto] = produto;
        editandoProduto = null;
        mostrarAlerta('Produto editado com sucesso!', 'success');
    } else {
        produtos.push(produto);
        proximoCodigoProduto++;
        mostrarAlerta('Produto salvo com sucesso!', 'success');
    }

    limparFormularioProduto();
    atualizarTabelaProdutos();
}

function limparFormularioProduto() {
    document.getElementById('formProduto').reset();
    gerarProximoCodigoProduto();
    editandoProduto = null;
}

function atualizarTabelaProdutos() {
    const tbody = document.querySelector('#tabelaProdutos tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    produtos.forEach((produto, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.descricao}</td>
            <td>${produto.grupo}</td>
            <td>${produto.unidadeMedida}</td>
            <td>R$ ${produto.precoItem.toFixed(2)}</td>
            <td>
                <button class="btn btn-secondary" onclick="editarProduto(${index})">Editar</button>
                <button class="btn btn-danger" onclick="excluirProduto(${index})">Excluir</button>
            </td>
        `;
    });
}

function editarProduto(index) {
    const produto = produtos[index];
    document.getElementById('codigoProduto').value = produto.codigo;
    document.getElementById('descricaoProduto').value = produto.descricao;
    document.getElementById('grupoProduto').value = produto.grupo;
    document.getElementById('unidadeMedida').value = produto.unidadeMedida;
    document.getElementById('pesoBruto').value = produto.pesoBruto;
    document.getElementById('unidadePeso').value = produto.unidadePeso;
    document.getElementById('pesoLiquido').value = produto.pesoLiquido;
    document.getElementById('volumeM3').value = produto.volumeM3;
    document.getElementById('perdaPercent').value = produto.perdaPercent;
    document.getElementById('precoItem').value = produto.precoItem;
    editandoProduto = index;
}

function excluirProduto(index) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        produtos.splice(index, 1);
        atualizarTabelaProdutos();
        mostrarAlerta('Produto excluído com sucesso!', 'success');
    }
}