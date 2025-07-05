// auth.js - Sistema de autenticação com Supabase + Debug

// Verificar se usuário está logado ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se estamos nas páginas de login/registro
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    
    if (!isLoginPage && !isRegisterPage) {
        // Verificar autenticação para outras páginas
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
        }
    }
});

// Função de login
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Por favor, preencha todos os campos');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro no login: ' + error.message);
    }
}

// Função de registro
async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!email || !password || !confirmPassword) {
        alert('Por favor, preencha todos os campos');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('As senhas não coincidem');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        alert('Usuário registrado com sucesso! Faça login para continuar.');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Erro no registro:', error);
        alert('Erro no registro: ' + error.message);
    }
}

// Função de logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro no logout:', error);
        alert('Erro no logout: ' + error.message);
    }
}

// =============================================================================
// CÓDIGO DE DEBUG - ADICIONE ESTA PARTE PARA ENCONTRAR O UUID
// =============================================================================

// Verificar se o Supabase está carregado
function verificarSupabase() {
    console.log('=== VERIFICANDO SUPABASE ===');
    console.log('window.supabase:', window.supabase);
    console.log('Supabase global:', typeof supabase);
    
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase não está definido!');
        return false;
    } else {
        console.log('✅ Supabase carregado com sucesso!');
        return true;
    }
}

// Função para mostrar UUID (versão segura)
async function mostrarUUIDSeguro() {
    console.log('=== TENTANDO BUSCAR UUID ===');
    
    // Verificar se Supabase está carregado
    if (!verificarSupabase()) {
        alert('❌ Erro: Supabase não foi carregado corretamente!\n\nVerifique:\n1. Se o arquivo supabase-config.js está sendo carregado\n2. Se as chaves estão corretas\n3. Se o CDN do Supabase está funcionando');
        return;
    }
    
    try {
        console.log('Buscando usuário...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Erro ao buscar usuário:', error);
            alert('Erro ao buscar usuário: ' + error.message);
            return;
        }
        
        if (user) {
            console.log('=== USUÁRIO ENCONTRADO ===');
            console.log('UUID:', user.id);
            console.log('Email:', user.email);
            console.log('========================');
            
            alert(`✅ UUID ENCONTRADO!\n\nUUID: ${user.id}\nEmail: ${user.email}\n\nCopie este UUID para usar no teste SQL!`);
            
            // Testar a função RPC
            console.log('Testando função RPC...');
            const { data, error: rpcError } = await supabase.rpc('get_next_produto_codigo', {
                user_uuid: user.id
            });
            
            if (rpcError) {
                console.error('Erro RPC:', rpcError);
                alert('❌ Erro ao testar função RPC: ' + rpcError.message);
            } else {
                console.log('✅ Função RPC OK! Próximo código:', data);
                alert(`✅ FUNÇÃO RPC FUNCIONANDO!\n\nPróximo código: ${data}`);
            }
            
        } else {
            console.log('❌ Usuário não está logado');
            alert('❌ Usuário não está logado!\n\nFaça login primeiro em: login.html');
        }
    } catch (error) {
        console.error('Erro geral:', error);
        alert('❌ Erro: ' + error.message);
    }
}

// Aguardar carregamento e disponibilizar funções no console
setTimeout(() => {
    if (typeof supabase !== 'undefined') {
        window.mostrarUUID = mostrarUUIDSeguro;
        window.verificarSupabase = verificarSupabase;
        
        console.log('✅ Funções de debug disponíveis no console:');
        console.log('- mostrarUUID() - para encontrar seu UUID');
        console.log('- verificarSupabase() - para verificar se Supabase carregou');
    }
}, 2000);

// Exportar funções para uso global
window.login = login;
window.register = register;
window.logout = logout;