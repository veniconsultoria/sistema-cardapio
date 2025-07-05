// supabase-config.js - Configuração limpa do Supabase

// ⚠️ SUBSTITUA ESTAS CREDENCIAIS PELAS SUAS REAIS:
const SUPABASE_URL = 'https://eahmfwhovcxikxlzrmll.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaG1md2hvdmN4aWt4bHpybWxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTk5NTMsImV4cCI6MjA2NzI5NTk1M30.MMkS2beLMOYCXtfTLCDyUJIrbcmjygSbXFfRP2_LbTU';

// Aguardar carregamento do CDN e criar cliente
(function() {
    function initSupabase() {
        // Verificar se CDN carregou
        if (typeof window.supabase === 'undefined') {
            console.log('Aguardando Supabase CDN...');
            setTimeout(initSupabase, 100);
            return;
        }

        // Verificar se credenciais foram configuradas
        if (SUPABASE_URL === 'https://seu-projeto-id.supabase.co' || SUPABASE_ANON_KEY === 'sua-chave-publica-aqui') {
            console.error('❌ Configure suas credenciais Supabase!');
            alert('⚠️ Configure as credenciais do Supabase no arquivo supabase-config.js');
            return;
        }

        try {
            // Criar cliente global
            window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase configurado com sucesso!');
            
            // Disparar evento de pronto
            window.dispatchEvent(new Event('supabaseReady'));
            
        } catch (error) {
            console.error('❌ Erro ao configurar Supabase:', error);
            alert('Erro: ' + error.message);
        }
    }
    
    // Iniciar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
})();