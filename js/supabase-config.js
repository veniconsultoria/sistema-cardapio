// js/supabase-config.js - Configuração do Supabase (CORRIGIDA)

console.log('📁 Carregando supabase-config.js...');

// Verificar se já foi inicializado para evitar redeclaração
if (typeof window.supabaseConfigured === 'undefined') {
    
    // Suas credenciais do Supabase
    const supabaseUrlConfig = 'https://eahmfwhovcxikxlzrmll.supabase.co';
    const supabaseKeyConfig = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaG1md2hvdmN4aWt4bHpybWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTk5NTMsImV4cCI6MjA2NzI5NTk1M30.MMkS2beLMOYCXtfTLCDyUJIrbcmjygSbXFfRP2_LbTU';

    // Função para inicializar Supabase
    function inicializarSupabaseConfig() {
        console.log('🔄 Inicializando Supabase...');
        
        // Verificar se CDN carregou - CORRIGIDO
        if (typeof window.supabase?.createClient !== 'function') {
            console.log('⏳ Aguardando CDN do Supabase...');
            setTimeout(inicializarSupabaseConfig, 100);
            return;
        }
        
        try {
            // Criar cliente Supabase usando o método correto do CDN
            const { createClient } = window.supabase;
            window.supabase = createClient(supabaseUrlConfig, supabaseKeyConfig);
            
            console.log('✅ Supabase inicializado com sucesso!');
            console.log('🔗 URL:', supabaseUrlConfig);
            
            // Marcar como configurado
            window.supabaseConfigured = true;
            
            // Testar conexão
            testarConexaoConfig();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            alert('Erro ao conectar com Supabase: ' + error.message);
        }
    }

    // Testar conexão com Supabase
    async function testarConexaoConfig() {
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
        document.addEventListener('DOMContentLoaded', inicializarSupabaseConfig);
    } else {
        inicializarSupabaseConfig();
    }

} else {
    console.log('⚠️ Supabase já foi configurado anteriormente');
}

console.log('✅ supabase-config.js carregado!');