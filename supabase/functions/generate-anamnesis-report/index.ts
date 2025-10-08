import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { anamnesisData } = await req.json();

    if (!anamnesisData) {
      return new Response(JSON.stringify({ error: 'Dados da anamnese ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const overallRisks: string[] = [];
    const overallSuggestions: string[] = [];
    const detailedAnalysis: { section: string; findings: string[]; recommendations: string[] }[] = [];

    const addSectionAnalysis = (sectionName: string, findings: string[], recommendations: string[]) => {
      if (findings.length > 0 || recommendations.length > 0) {
        detailedAnalysis.push({ section: sectionName, findings, recommendations });
      }
    };

    // Emergency Contact
    const emergencyFindings: string[] = [];
    const emergencyRecommendations: string[] = [];
    if (!anamnesisData.emergency_contact || !anamnesisData.emergency_phone) {
      emergencyFindings.push("Informações de contato de emergência incompletas.");
      emergencyRecommendations.push("Garantir que o contato de emergência esteja completo e acessível (ACSM, 2021).");
    }
    addSectionAnalysis("Contato de Emergência", emergencyFindings, emergencyRecommendations);

    // Medical History
    const medicalFindings: string[] = [];
    const medicalRecommendations: string[] = [];
    const medicalConditions = anamnesisData.medical_conditions?.toLowerCase() || '';
    if (medicalConditions && medicalConditions !== 'nenhuma' && medicalConditions !== 'não') {
      medicalFindings.push(`Condições médicas reportadas: ${anamnesisData.medical_conditions}.`);
      medicalRecommendations.push("Recomendar consulta médica para liberação e adaptação do treino (ACSM, 2021).");
      overallRisks.push("Presença de condições médicas que exigem atenção.");
    }
    const previousInjuries = anamnesisData.previous_injuries?.toLowerCase() || '';
    if (previousInjuries && previousInjuries !== 'nenhuma' && previousInjuries !== 'não') {
      medicalFindings.push(`Histórico de lesões: ${anamnesisData.previous_injuries}.`);
      medicalRecommendations.push("Focar em exercícios de fortalecimento e mobilidade específicos (NSCA, 2016).");
      overallRisks.push("Risco de recidiva de lesões anteriores.");
    }
    if (anamnesisData.current_pain_level && anamnesisData.current_pain_level > 3) {
      medicalFindings.push(`Nível de dor atual (${anamnesisData.current_pain_level}/10).`);
      medicalRecommendations.push("Priorizar exercícios de baixo impacto (ACSM, 2021).");
      overallRisks.push("Dor crônica ou aguda que pode limitar o exercício.");
    }
    addSectionAnalysis("Histórico Médico", medicalFindings, medicalRecommendations);

    // Lifestyle
    const lifestyleFindings: string[] = [];
    const lifestyleRecommendations: string[] = [];
    if (anamnesisData.sleep_quality === 'ruim' || (anamnesisData.average_sleep_hours && anamnesisData.average_sleep_hours < 6)) {
      lifestyleFindings.push(`Qualidade do sono comprometida (${anamnesisData.average_sleep_hours}h).`);
      lifestyleRecommendations.push('Priorizar higiene do sono (NSCA, 2016).');
      overallRisks.push("Recuperação comprometida devido à má qualidade do sono.");
    }
    if (anamnesisData.stress_level === 'alto') {
      lifestyleFindings.push(`Nível de estresse: ${anamnesisData.stress_level}.`);
      lifestyleRecommendations.push('Integrar técnicas de relaxamento (ACSM, 2021).');
      overallRisks.push("Estresse elevado pode impactar os resultados.");
    }
    if (anamnesisData.smoking_status === 'fumante_atual') {
      lifestyleFindings.push(`Fumante atual.`);
      lifestyleRecommendations.push('Incentivar a cessação do tabagismo (ACSM, 2021).');
      overallRisks.push("Risco cardiovascular aumentado devido ao tabagismo.");
    }
    addSectionAnalysis("Estilo de Vida", lifestyleFindings, lifestyleRecommendations);

    // Determine fitness readiness
    let fitnessReadiness: 'APTO' | 'APTO_COM_RESTRICOES' | 'NAO_APTO' = 'APTO';
    let fitnessReadinessReason = 'Cliente demonstra condições adequadas para iniciar programa de exercícios.';
    
    if (overallRisks.length > 3) {
      fitnessReadiness = 'APTO_COM_RESTRICOES';
      fitnessReadinessReason = 'Cliente apresenta alguns fatores de risco que requerem atenção especial e possivelmente avaliação médica.';
    }
    
    if (anamnesisData.current_pain_level && anamnesisData.current_pain_level > 7) {
      fitnessReadiness = 'NAO_APTO';
      fitnessReadinessReason = 'Cliente apresenta dor significativa que requer avaliação médica antes de iniciar exercícios.';
    }

    const finalReport = {
      summary: {
        fitnessReadiness,
        fitnessReadinessReason,
        overallRisks: overallRisks.length > 0 ? overallRisks : ["Nenhum risco significativo identificado."],
        overallSuggestions: ["Continuar com o plano de treino e monitorar o progresso regularmente."],
      },
      detailedAnalysis: detailedAnalysis,
      disclaimer: "Este relatório é gerado com base nos dados da anamnese e diretrizes gerais de fitness (ACSM/NSCA). Não substitui avaliação médica."
    };

    return new Response(JSON.stringify(finalReport), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});