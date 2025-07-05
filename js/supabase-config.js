// js/supabase-config.js
// Configuração do Supabase para Sistema de Cardápio

console.log('📁 Carregando supabase-config.js...');

// Suas credenciais do Supabase
const supabaseUrl = 'https://eahmfwhovcxikxlzrmll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaG1md2hvdmN4aWt4bHpybWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTk5NTMsImV4cCI6MjA2NzI5NTk1M30.MMkS2beLMOYCXtfTLCDyUJIrbcmjygSbXFfRP2_LbTU'; // Substitua pela sua chave anon public

// Função para inicializar Supabase
function inicializarSupabase() {
    console.log('🔄 Inicializando Supabase...');
    
    // Verificar se CDN carregou
    if (typeof window.supabase === 'undefined') {
        console.log('⏳ Aguardando CDN do Supabase...');
        setTimeout(inicializarSupabase, 100);
        return;
    }
    
    // Verificar se a chave foi configurada
    if (supabaseKey === 'SUA_CHAVE_ANON_PUBLIC_AQUI') {
        console.error('❌ CONFIGURE SUA CHAVE ANON PUBLIC!');
        alert('⚠️ Você precisa configurar sua chave anon public!\n\n1. Vá para https://supabase.com/dashboard\n2. Entre no seu projeto\n3. Settings → API\n4. Copie a "anon public" key\n5. Cole no arquivo js/supabase-config.js na variável supabaseKey');
        return;
    }
    
    try {
        // Criar cliente Supabase usando o método do CDN
        window.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase inicializado com sucesso!');
        console.log('🔗 URL:', supabaseUrl);
        
        // Testar conexão
        testarConexao();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
        alert('Erro ao conectar com Supabase: ' + error.message);
    }
}

// Testar conexão com Supabase
async function testarConexao() {
    try {
        const { data, error } = await window.supabase.auth.getSession();
        if (error) {
            console.warn('⚠️ Sessão inválida (normal se não logado)');
        } else {
            console.log('🔗 Conexão com Supabase OK!');
        }
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
    }
}

// Iniciar quando página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
    inicializarSupabase();
}

// Testar conexão com Supabase
async function testarConexao() {
    try {
        const { data, error } = await window.supabase.auth.getSession();
        if (error) {
            console.warn('⚠️ Sessão inválida (normal se não logado)');
        } else {
            console.log('🔗 Conexão com Supabase OK!');
        }
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
    }
}

// Iniciar quando página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSupabase);
} else {
    inicializarSupabase();
}