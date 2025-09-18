// Minimal declarations to satisfy TypeScript in a non-Deno environment
// These declare module blocks are removed as they cause TS2664 errors in a non-Deno environment.
// The Deno runtime handles these imports directly.

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => { // Explicitly typing 'req' as Request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { 'Authorization': req.headers.get('Authorization')! } },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

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

    // Helper to add findings and recommendations to a section
    const addSectionAnalysis = (sectionName: string, findings: string[], recommendations: string[]) => {
      if (findings.length > 0 || recommendations.length > 0) {
        detailedAnalysis.push({ section: sectionName, findings, recommendations });
      }
    };

    // --- Análise da Anamnese (Simulação de IA baseada em ACSM/NSCA) ---

    // Seção 1: Contato de Emergência (apenas para garantir que está preenchido)
    const emergencyFindings: string[] = [];
    const emergencyRecommendations: string[] = [];
    if (!anamnesisData.emergency_contact || !anamnesisData.emergency_phone) {
      emergencyFindings.push("Informações de contato de emergência incompletas.");
      emergencyRecommendations.push("Garantir que o contato de emergência esteja completo e acessível (ACSM, 2021).");
    }
    addSectionAnalysis("Contato de Emergência", emergencyFindings, emergencyRecommendations);


    // Seção 2: Histórico Médico e Saúde Atual
    const medicalFindings: string[] = [];
    const medicalRecommendations: string[] = [];

    const medicalConditions = anamnesisData.medical_conditions?.toLowerCase() || '';
    if (medicalConditions && medicalConditions !== 'nenhuma' && medicalConditions !== 'não') {
      medicalFindings.push(`Condições médicas reportadas: ${anamnesisData.medical_conditions}.`);
      medicalRecommendations.push("Recomendar consulta médica para liberação e adaptação do treino. Monitorar sinais e sintomas durante o exercício (ACSM, 2021).");
      overallRisks.push("Presença de condições médicas que exigem atenção e possível liberação médica.");
    }
    const previousInjuries = anamnesisData.previous_injuries?.toLowerCase() || '';
    if (previousInjuries && previousInjuries !== 'nenhuma' && previousInjuries !== 'não') {
      medicalFindings.push(`Histórico de lesões: ${anamnesisData.previous_injuries}.`);
      medicalRecommendations.push("Focar em exercícios de fortalecimento e mobilidade específicos para as áreas afetadas. Evitar movimentos que causem dor. Progressão gradual (NSCA, 2016).");
      overallRisks.push("Risco de recidiva de lesões anteriores.");
    }
    if (anamnesisData.current_pain_level && anamnesisData.current_pain_level > 3) {
      medicalFindings.push(`Nível de dor atual (${anamnesisData.current_pain_level}/10) em ${anamnesisData.pain_locations || 'local não especificado'}.`);
      medicalRecommendations.push("Priorizar exercícios de baixo impacto e fortalecimento da musculatura estabilizadora. Considerar encaminhamento para fisioterapia ou médico. Evitar exercícios que exacerbam a dor (ACSM, 2021).");
      overallRisks.push("Dor crônica ou aguda que pode limitar o exercício e indicar necessidade de avaliação especializada.");
    }
    const familyHistory = anamnesisData.family_medical_history?.toLowerCase() || '';
    if (familyHistory && familyHistory !== 'nenhum' && familyHistory !== 'não') {
      medicalFindings.push(`Histórico médico familiar relevante: ${anamnesisData.family_medical_history}.`);
      medicalRecommendations.push("Monitorar de perto fatores de risco relacionados e incentivar exames preventivos regulares (ACSM, 2021).");
      overallRisks.push("Predisposição genética a certas condições de saúde.");
    }
    const cardiovascularFactors = anamnesisData.cardiovascular_risk_factors?.toLowerCase() || '';
    if (cardiovascularFactors && cardiovascularFactors !== 'nenhum' && cardiovascularFactors !== 'não') {
      medicalFindings.push(`Fatores de risco cardiovascular: ${anamnesisData.cardiovascular_risk_factors}.`);
      medicalRecommendations.push("Foco em exercícios aeróbicos de intensidade moderada e controle da dieta. Recomendar acompanhamento médico para manejo dos fatores de risco (ACSM, 2021).");
      overallRisks.push("Aumento do risco cardiovascular.");
    }
    const mentalHealth = anamnesisData.mental_health_history?.toLowerCase() || '';
    if (mentalHealth && mentalHealth !== 'nenhum' && mentalHealth !== 'não') {
      medicalFindings.push(`Histórico de saúde mental: ${anamnesisData.mental_health_history}.`);
      medicalRecommendations.push("Integrar atividades que promovam bem-estar mental (ex: yoga, meditação, exercícios ao ar livre). Monitorar sinais de estresse/ansiedade e ajustar o treino conforme necessário (ACSM, 2021).");
      overallRisks.push("Impacto potencial na adesão e percepção do exercício devido a questões de saúde mental.");
    }
    addSectionAnalysis("Histórico Médico e Saúde Atual", medicalFindings, medicalRecommendations);

    // Seção 3: Medicamentos e Suplementos
    const medsSuppsFindings: string[] = [];
    const medsSuppsRecommendations: string[] = [];
    const currentMedications = anamnesisData.current_medications?.toLowerCase() || '';
    if (currentMedications && currentMedications !== 'nenhum' && currentMedications !== 'não') {
      medsSuppsFindings.push(`Uso de medicamentos contínuos: ${anamnesisData.current_medications}.`);
      medsSuppsRecommendations.push("Verificar possíveis interações com o exercício (ex: beta-bloqueadores afetam FC, diuréticos afetam hidratação). Consultar bula ou médico se necessário (ACSM, 2021).");
      overallRisks.push("Medicamentos podem alterar a resposta fisiológica ao exercício.");
    }
    addSectionAnalysis("Medicamentos e Suplementação", medsSuppsFindings, medsSuppsRecommendations);

    // Seção 4: Histórico de Treino e Atividade Física
    const trainingHistoryFindings: string[] = [];
    const trainingHistoryRecommendations: string[] = [];
    if (anamnesisData.training_experience === 'sedentario' || anamnesisData.current_fitness_level === 'sedentario') {
      trainingHistoryFindings.push('Nível de experiência/condicionamento: Sedentário.');
      trainingHistoryRecommendations.push('Iniciar com volume e intensidade baixos, progressão gradual. Foco em criar hábito e técnica correta para evitar lesões e promover adesão (ACSM, 2021).');
      overallRisks.push("Risco elevado de lesões e baixa adesão se a progressão for muito rápida.");
    }
    if (anamnesisData.reasons_for_stopping_training) {
      trainingHistoryFindings.push(`Motivos de interrupção anteriores: ${anamnesisData.reasons_for_stopping_training}.`);
      trainingHistoryRecommendations.push('Abordar proativamente as barreiras identificadas para garantir a adesão ao novo programa. Desenvolver estratégias de superação (NSCA, 2016).');
    }
    addSectionAnalysis("Histórico de Treino e Atividade Física", trainingHistoryFindings, trainingHistoryRecommendations);

    // Seção 5: Estilo de Vida e Hábitos Diários
    const lifestyleFindings: string[] = [];
    const lifestyleRecommendations: string[] = [];
    if (anamnesisData.sleep_quality === 'ruim' || anamnesisData.sleep_quality === 'muito_ruim' || (anamnesisData.average_sleep_hours && anamnesisData.average_sleep_hours < 6)) {
      lifestyleFindings.push(`Qualidade do sono (${anamnesisData.sleep_quality}) e/ou poucas horas de sono (${anamnesisData.average_sleep_hours}h).`);
      lifestyleRecommendations.push('Priorizar higiene do sono. Ajustar volume de treino se a recuperação for comprometida. O sono inadequado afeta a recuperação muscular, performance e saúde geral (NSCA, 2016).');
      overallRisks.push("Recuperação comprometida e risco de overtraining devido à má qualidade do sono.");
    }
    if (anamnesisData.stress_level === 'alto' || anamnesisData.stress_level === 'muito_alto') {
      lifestyleFindings.push(`Nível de estresse: ${anamnesisData.stress_level}.`);
      lifestyleRecommendations.push('Integrar técnicas de relaxamento e mindfulness. Evitar treinos excessivamente estressantes. Monitorar sinais de overtraining. Estresse crônico impacta negativamente a adaptação ao exercício (ACSM, 2021).');
      overallRisks.push("Estresse elevado pode impactar negativamente a adesão e os resultados do treino.");
    }
    if (anamnesisData.smoking_status === 'fumante_atual') {
      lifestyleFindings.push(`Fumante atual (${anamnesisData.cigarettes_per_day || 'quantidade não informada'} cigarros/dia).`);
      lifestyleRecommendations.push('Incentivar a cessação do tabagismo. Monitorar capacidade cardiorrespiratória. Tabagismo é um fator de risco cardiovascular e respiratório significativo (ACSM, 2021).');
      overallRisks.push("Risco cardiovascular e respiratório aumentado devido ao tabagismo.");
    }
    if (anamnesisData.alcohol_consumption === 'frequente') {
      lifestyleFindings.push('Consumo de álcool: Frequente.');
      lifestyleRecommendations.push('Discutir moderação do consumo de álcool devido ao impacto na recuperação e nutrição. Álcool pode prejudicar a síntese proteica muscular (NSCA, 2016).');
      overallRisks.push("Impacto negativo na recuperação e nutrição devido ao consumo frequente de álcool.");
    }
    if (anamnesisData.daily_water_intake_liters && anamnesisData.daily_water_intake_liters < 2) {
      lifestyleFindings.push(`Baixo consumo de água (${anamnesisData.daily_water_intake_liters}L/dia).`);
      lifestyleRecommendations.push('Educar sobre a importância da hidratação para performance e saúde. Hidratação adequada é essencial para a termorregulação e performance física (ACSM, 2021).');
    }
    addSectionAnalysis("Estilo de Vida e Hábitos Diários", lifestyleFindings, lifestyleRecommendations);

    // Seção 6: Objetivos e Barreiras ao Treino
    const goalsBarriersFindings: string[] = [];
    const goalsBarriersRecommendations: string[] = [];
    if (anamnesisData.barriers_to_training && anamnesisData.barriers_to_training.toLowerCase() !== 'nenhuma' && anamnesisData.barriers_to_training.toLowerCase() !== 'não') {
      goalsBarriersFindings.push(`Barreiras ao treino identificadas: ${anamnesisData.barriers_to_training}.`);
      goalsBarriersRecommendations.push('Desenvolver estratégias personalizadas para superar as barreiras identificadas (ex: treinos curtos, flexibilidade de horários). A identificação e superação de barreiras são cruciais para a manutenção da atividade física (NSCA, 2016).');
      overallRisks.push("Barreiras significativas podem levar à baixa adesão e desistência.");
    }
    if (anamnesisData.motivation_level === 'baixa') {
      goalsBarriersFindings.push('Nível de motivação: Baixa.');
      goalsBarriersRecommendations.push('Focar em pequenas vitórias, feedback positivo e estabelecer metas realistas e alcançáveis para aumentar a autoeficácia (Teoria da Autoeficácia, Bandura).');
      overallRisks.push("Baixa motivação pode dificultar a adesão e o alcance dos objetivos.");
    }
    addSectionAnalysis("Objetivos e Barreiras ao Treino", goalsBarriersFindings, goalsBarriersRecommendations);


    const finalReport = {
      summary: {
        overallRisks: overallRisks.length > 0 ? overallRisks : ["Nenhum risco significativo identificado com base nos dados fornecidos."],
        overallSuggestions: overallSuggestions.length > 0 ? overallSuggestions : ["Continuar com o plano de treino e monitorar o progresso regularmente."],
      },
      detailedAnalysis: detailedAnalysis,
      disclaimer: "Este relatório é gerado por IA com base nos dados da anamnese e diretrizes gerais de fitness (ACSM/NSCA). Ele serve como uma ferramenta auxiliar para o profissional. A decisão final e a personalização do programa de treino devem sempre ser feitas por um profissional qualificado, considerando o contexto individual do aluno e, se necessário, com consulta médica. Não substitui avaliação médica."
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