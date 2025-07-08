// js/auth.js - Sistema de autenticação (CORRIGIDO)

console.log('📁 Carregando auth.js...');

// Aguardar Supabase estar disponível
function aguardarSupabase(callback, tentativas = 0) {
    if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase disponível para auth.js');
        callback();
    } else if (tentativas < 50) { // 5 segundos máximo
        setTimeout(() => aguardarSupabase(callback, tentativas + 1), 100);
    } else {
        console.error('❌ Timeout: Supabase não ficou disponível');
        alert('Erro: Não foi possível conectar com o Supabase. Verifique sua conexão.');
    }
}

// Função de login
async function login() {
    console.log('🔐 Tentando fazer login...');
    
    aguardarSupabase(async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('login-btn');
        
        // Validações
        if (!email || !password) {
            mostrarErro('Por favor, preencha todos os campos');
            return;
        }
        
        // Desabilitar botão
        loginBtn.textContent = 'Entrando...';
        loginBtn.disabled = true;
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Login realizado:', data.user.email);
            mostrarSucesso('Login realizado com sucesso! Redirecionando...');
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            
            let errorMessage = 'Erro no login. Tente novamente.';
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou senha incorretos.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor, confirme seu email antes de fazer login.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Muitas tentativas. Aguarde um momento e tente novamente.';
            }
            
            mostrarErro(errorMessage);
        } finally {
            // Reabilitar botão
            loginBtn.textContent = 'Entrar';
            loginBtn.disabled = false;
        }
    });
}

// Função de registro
async function register() {
    console.log('📝 Tentando fazer registro...');
    
    aguardarSupabase(async () => {
        const name = document.getElementById('name')?.value?.trim();
        const company = document.getElementById('company')?.value?.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validações
        if (!email || !password || !confirmPassword) {
            mostrarErro('Por favor, preencha todos os campos obrigatórios');
            return;
        }
        
        if (password !== confirmPassword) {
            mostrarErro('As senhas não coincidem');
            return;
        }
        
        if (password.length < 6) {
            mostrarErro('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        try {
            const { data, error } = await window.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name || 'Usuário',
                        company: company || 'Empresa'
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Registro realizado:', data.user?.email);
            mostrarSucesso('Conta criada com sucesso! Verifique seu email para confirmar.');
            
            // Limpar formulário
            document.getElementById('registerForm')?.reset();
            
        } catch (error) {
            console.error('❌ Erro no registro:', error);
            
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            if (error.message.includes('User already registered')) {
                errorMessage = 'Este email já está cadastrado.';
            } else if (error.message.includes('Password should be at least 6 characters')) {
                errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            }
            
            mostrarErro(errorMessage);
        }
    });
}

// Função para logout
async function logout() {
    aguardarSupabase(async () => {
        try {
            const { error } = await window.supabase.auth.signOut();
            if (error) throw error;
            
            console.log('✅ Logout realizado');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            alert('Erro no logout: ' + error.message);
        }
    });
}

// Função para mostrar UUID (debug)
async function mostrarUUID() {
    console.log('🔍 Buscando UUID do usuário...');
    
    aguardarSupabase(async () => {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            
            if (error) throw error;
            
            if (user) {
                console.log('👤 Usuário encontrado:');
                console.log('UUID:', user.id);
                console.log('Email:', user.email);
                
                alert(`✅ USUÁRIO LOGADO!\n\nUUID: ${user.id}\nEmail: ${user.email}\n\n📋 Copie este UUID para usar no teste SQL do Supabase!`);
                
                // Testar função RPC se existir
                try {
                    const { data, error: rpcError } = await window.supabase.rpc('get_next_produto_codigo', {
                        user_uuid: user.id
                    });
                    
                    if (rpcError) {
                        console.error('⚠️ Função RPC não encontrada ou erro:', rpcError);
                        alert('⚠️ Função get_next_produto_codigo ainda não foi criada no Supabase.\n\nVá para SQL Editor e execute a função que foi enviada.');
                    } else {
                        console.log('✅ Função RPC OK! Próximo código:', data);
                        alert(`✅ FUNÇÃO RPC FUNCIONANDO!\n\nPróximo código de produto: ${data}`);
                    }
                } catch (rpcError) {
                    console.error('⚠️ Erro ao testar RPC:', rpcError);
                }
                
            } else {
                console.log('❌ Usuário não está logado');
                alert('❌ Usuário não está logado!\n\nFaça login primeiro.');
            }
        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error);
            alert('❌ Erro: ' + error.message);
        }
    });
}

// Verificar autenticação ao carregar página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página carregada, verificando autenticação...');
    
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    
    if (!isLoginPage && !isRegisterPage) {
        // Página que precisa de autenticação
        aguardarSupabase(async () => {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                if (!user) {
                    console.log('🚫 Usuário não autenticado, redirecionando...');
                    window.location.href = 'login.html';
                } else {
                    console.log('✅ Usuário autenticado:', user.email);
                }
            } catch (error) {
                console.error('❌ Erro ao verificar autenticação:', error);
                window.location.href = 'login.html';
            }
        });
    }
});

// Funções auxiliares para mostrar mensagens
function mostrarErro(mensagem) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    
    if (errorDiv) {
        errorDiv.textContent = mensagem;
        errorDiv.style.display = 'block';
    } else {
        console.error('Erro:', mensagem);
        alert('Erro: ' + mensagem);
    }
    
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

function mostrarSucesso(mensagem) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    
    if (successDiv) {
        successDiv.textContent = mensagem;
        successDiv.style.display = 'block';
    } else {
        console.log('Sucesso:', mensagem);
        alert(mensagem);
    }
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Exportar funções para uso global
window.login = login;
window.register = register;
window.logout = logout;
window.mostrarUUID = mostrarUUID;

console.log('✅ auth.js carregado com sucesso!');