import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { anamnesisData } = await req.json();

    const risks: string[] = [];
    const suggestions: string[] = [];
    const detailedAnalysis: { section: string; findings: string[]; recommendations: string[] }[] = [];

    // --- Seção 1: Contato de Emergência (Validação básica) ---
    const emergencyFindings: string[] = [];
    const emergencyRecommendations: string[] = [];
    if (!anamnesisData.emergency_contact || !anamnesisData.emergency_phone) {
      emergencyFindings.push("Informações de contato de emergência incompletas.");
      emergencyRecommendations.push("Garantir que o contato e telefone de emergência estejam preenchidos e atualizados (ACSM, 2021).");
      risks.push("Risco de segurança: Contato de emergência ausente.");
    }
    if (emergencyFindings.length > 0) {
      detailedAnalysis.push({ section: "Contato de Emergência", findings: emergencyFindings, recommendations: emergencyRecommendations });
    }

    // --- Seção 2: Histórico Médico e Saúde Atual ---
    const medicalFindings: string[] = [];
    const medicalRecommendations: string[] = [];

    if (anamnesisData.medical_conditions && anamnesisData.medical_conditions.trim() !== "") {
      medicalFindings.push(`Condições médicas: ${anamnesisData.medical_conditions}.`);
      medicalRecommendations.push("Recomendar avaliação médica e liberação para exercício antes de iniciar/intensificar o programa (ACSM Pre-Exercise Screening, 2021).");
      risks.push("Risco médico: Condições de saúde preexistentes.");
    }
    if (anamnesisData.surgeries && anamnesisData.surgeries.trim() !== "") {
      medicalFindings.push(`Histórico de cirurgias: ${anamnesisData.surgeries}.`);
      medicalRecommendations.push("Verificar tempo de recuperação e possíveis limitações. Adaptar exercícios para evitar sobrecarga nas áreas afetadas.");
      risks.push("Risco de lesão: Histórico cirúrgico.");
    }
    if (anamnesisData.allergies && anamnesisData.allergies.trim() !== "") {
      medicalFindings.push(`Alergias: ${anamnesisData.allergies}.`);
      medicalRecommendations.push("Estar ciente das alergias para evitar exposição durante o treino ou com suplementos.");
      risks.push("Risco de saúde: Alergias conhecidas.");
    }
    if (anamnesisData.current_pain_level && anamnesisData.current_pain_level > 3) {
      medicalFindings.push(`Nível de dor atual: ${anamnesisData.current_pain_level} em ${anamnesisData.pain_locations || 'local não especificado'}.`);
      medicalRecommendations.push("Focar em exercícios de baixo impacto e mobilidade. Considerar encaminhamento para fisioterapia/ortopedia se a dor persistir ou for alta (NSCA, 2016).");
      risks.push("Risco de lesão: Dor crônica/aguda.");
    }
    if (anamnesisData.previous_injuries && anamnesisData.previous_injuries.trim() !== "") {
      medicalFindings.push(`Lesões anteriores: ${anamnesisData.previous_injuries}.`);
      medicalRecommendations.push("Adaptar exercícios para proteger áreas lesionadas. Fortalecer músculos estabilizadores e realizar aquecimento específico.");
      risks.push("Risco de recidiva de lesão.");
    }
    if (anamnesisData.family_medical_history && anamnesisData.family_medical_history.trim() !== "") {
      medicalFindings.push(`Histórico familiar: ${anamnesisData.family_medical_history}.`);
      medicalRecommendations.push("Monitorar fatores de risco e incentivar exames preventivos regulares.");
      risks.push("Risco genético: Predisposição a certas condições.");
    }
    if (anamnesisData.cardiovascular_risk_factors && anamnesisData.cardiovascular_risk_factors.trim() !== "") {
      medicalFindings.push(`Fatores de risco cardiovascular: ${anamnesisData.cardiovascular_risk_factors}.`);
      medicalRecommendations.push("Priorizar exercícios aeróbicos e monitorar a intensidade. Recomendar acompanhamento médico para controle dos fatores de risco (ACSM, 2021).");
      risks.push("Risco cardiovascular elevado.");
    }
    if (anamnesisData.respiratory_issues && anamnesisData.respiratory_issues.trim() !== "") {
      medicalFindings.push(`Problemas respiratórios: ${anamnesisData.respiratory_issues}.`);
      medicalRecommendations.push("Monitorar a respiração durante o exercício. Evitar ambientes com gatilhos. Ter plano de ação para crises.");
      risks.push("Risco respiratório.");
    }
    if (anamnesisData.digestive_issues && anamnesisData.digestive_issues.trim() !== "") {
      medicalFindings.push(`Problemas digestivos: ${anamnesisData.digestive_issues}.`);
      medicalRecommendations.push("Considerar o impacto da dieta e hidratação. Evitar exercícios de alta intensidade imediatamente após refeições.");
      risks.push("Risco digestivo.");
    }
    if (anamnesisData.neurological_issues && anamnesisData.neurological_issues.trim() !== "") {
      medicalFindings.push(`Problemas neurológicos: ${anamnesisData.neurological_issues}.`);
      medicalRecommendations.push("Adaptar exercícios para garantir equilíbrio e coordenação. Monitorar sinais de tontura ou desconforto.");
      risks.push("Risco neurológico.");
    }
    if (anamnesisData.bone_joint_issues && anamnesisData.bone_joint_issues.trim() !== "") {
      medicalFindings.push(`Problemas ósseos/articulares: ${anamnesisData.bone_joint_issues}.`);
      medicalRecommendations.push("Focar em exercícios de baixo impacto e fortalecimento muscular ao redor das articulações. Evitar movimentos que causem dor.");
      risks.push("Risco ósseo/articular.");
    }
    if (anamnesisData.mental_health_history && anamnesisData.mental_health_history.trim() !== "") {
      medicalFindings.push(`Histórico de saúde mental: ${anamnesisData.mental_health_history}.`);
      medicalRecommendations.push("Promover um ambiente de treino positivo e de apoio. Monitorar o bem-estar mental e ajustar o programa conforme necessário. Considerar encaminhamento para profissional de saúde mental.");
      risks.push("Risco de saúde mental.");
    }
    if (anamnesisData.recent_medical_exams && anamnesisData.recent_medical_exams.trim() !== "") {
      medicalFindings.push(`Exames médicos recentes: ${anamnesisData.recent_medical_exams}.`);
      medicalRecommendations.push("Revisar os resultados dos exames para identificar quaisquer implicações para o programa de exercícios.");
    }
    if (medicalFindings.length > 0) {
      detailedAnalysis.push({ section: "Histórico Médico e Saúde Atual", findings: medicalFindings, recommendations: medicalRecommendations });
    }

    // --- Seção 3: Medicamentos e Suplementos ---
    const medsSuppsFindings: string[] = [];
    const medsSuppsRecommendations: string[] = [];
    if (anamnesisData.current_medications && anamnesisData.current_medications.trim() !== "") {
      medsSuppsFindings.push(`Medicamentos em uso: ${anamnesisData.current_medications}.`);
      medsSuppsRecommendations.push("Pesquisar possíveis interações medicamentosas com o exercício (ex: beta-bloqueadores afetam FC, diuréticos afetam hidratação).");
      risks.push("Risco de interação medicamentosa.");
    }
    if (anamnesisData.supplement_use && anamnesisData.supplement_use.trim() !== "") {
      medsSuppsFindings.push(`Uso de suplementos: ${anamnesisData.supplement_use}.`);
      medsSuppsRecommendations.push("Avaliar a necessidade e eficácia dos suplementos. Orientar sobre uso seguro e regulamentado.");
    }
    if (medsSuppsFindings.length > 0) {
      detailedAnalysis.push({ section: "Medicamentos e Suplementação", findings: medsSuppsFindings, recommendations: medsSuppsRecommendations });
    }

    // --- Seção 4: Histórico de Treino e Atividade Física ---
    const trainingHistoryFindings: string[] = [];
    const trainingHistoryRecommendations: string[] = [];
    if (anamnesisData.training_experience === 'sedentario' || anamnesisData.current_fitness_level === 'baixo') {
      trainingHistoryFindings.push("Nível de experiência/condicionamento físico baixo.");
      trainingHistoryRecommendations.push("Iniciar com volume e intensidade baixos, focando na técnica e adaptação. Progressão gradual é crucial (ACSM, 2021).");
      risks.push("Risco de lesão por sobrecarga inicial.");
    }
    if (anamnesisData.reasons_for_stopping_training && anamnesisData.reasons_for_stopping_training.trim() !== "") {
      trainingHistoryFindings.push(`Motivos de interrupção anteriores: ${anamnesisData.reasons_for_stopping_training}.`);
      trainingHistoryRecommendations.push("Abordar proativamente os motivos de interrupção para aumentar a adesão e evitar a repetição de padrões.");
      risks.push("Risco de baixa adesão/desistência.");
    }
    if (trainingHistoryFindings.length > 0) {
      detailedAnalysis.push({ section: "Histórico de Treino e Atividade Física", findings: trainingHistoryFindings, recommendations: trainingHistoryRecommendations });
    }

    // --- Seção 5: Estilo de Vida e Hábitos Diários ---
    const lifestyleFindings: string[] = [];
    const lifestyleRecommendations: string[] = [];
    if (anamnesisData.sleep_quality === 'ruim' || anamnesisData.sleep_quality === 'muito_ruim' || (anamnesisData.average_sleep_hours && anamnesisData.average_sleep_hours < 6)) {
      lifestyleFindings.push(`Qualidade do sono ${anamnesisData.sleep_quality} e/ou ${anamnesisData.average_sleep_hours}h de sono.`);
      lifestyleRecommendations.push("Orientar sobre higiene do sono. O sono adequado é vital para recuperação e performance (NSCA, 2016).");
      risks.push("Risco de recuperação inadequada e fadiga.");
    }
    if (anamnesisData.stress_level === 'alto' || anamnesisData.stress_level === 'muito_alto') {
      lifestyleFindings.push(`Nível de estresse: ${anamnesisData.stress_level}.`);
      lifestyleRecommendations.push("Integrar técnicas de manejo de estresse (ex: meditação, mindfulness). Ajustar intensidade do treino em dias de alto estresse.");
      risks.push("Risco de overtraining e impacto negativo na saúde mental.");
    }
    if (anamnesisData.smoking_status === 'fumante_atual') {
      lifestyleFindings.push(`Fumante atual (${anamnesisData.cigarettes_per_day || 'quantidade não informada'} cigarros/dia).`);
      lifestyleRecommendations.push("Recomendar fortemente a cessação do tabagismo devido aos impactos negativos na saúde cardiovascular e respiratória (ACSM, 2021).");
      risks.push("Risco de saúde: Tabagismo.");
    }
    if (anamnesisData.alcohol_consumption === 'frequente') {
      lifestyleFindings.push(`Consumo de álcool: ${anamnesisData.alcohol_consumption}.`);
      lifestyleRecommendations.push("Orientar sobre os efeitos negativos do álcool na recuperação muscular e hidratação. Recomendar moderação.");
      risks.push("Risco de recuperação prejudicada: Consumo de álcool.");
    }
    if (anamnesisData.daily_water_intake_liters && anamnesisData.daily_water_intake_liters < 2) {
      lifestyleFindings.push(`Baixo consumo de água: ${anamnesisData.daily_water_intake_liters}L/dia.`);
      lifestyleRecommendations.push("Incentivar aumento da ingestão de água para otimizar hidratação e performance.");
      risks.push("Risco de desidratação.");
    }
    if (anamnesisData.daily_caffeine_intake_mg && anamnesisData.daily_caffeine_intake_mg > 400) {
      lifestyleFindings.push(`Alto consumo de cafeína: ${anamnesisData.daily_caffeine_intake_mg}mg/dia.`);
      lifestyleRecommendations.push("Orientar sobre os efeitos da cafeína no sono e ansiedade. Recomendar moderação, especialmente à noite.");
      risks.push("Risco de distúrbios do sono/ansiedade.");
    }
    if (anamnesisData.screen_time_hours_per_day && anamnesisData.screen_time_hours_per_day > 8) {
      lifestyleFindings.push(`Alto tempo de tela: ${anamnesisData.screen_time_hours_per_day}h/dia.`);
      lifestyleRecommendations.push("Sugerir pausas e atividades físicas leves para contrabalancear o sedentarismo e reduzir fadiga ocular.");
      risks.push("Risco de sedentarismo e fadiga ocular.");
    }
    if (anamnesisData.social_support_network === 'limitada') {
      lifestyleFindings.push("Rede de apoio social limitada.");
      lifestyleRecommendations.push("Incentivar a participação em grupos de treino ou atividades sociais para aumentar a motivação e adesão.");
      risks.push("Risco de desmotivação/isolamento.");
    }
    if (lifestyleFindings.length > 0) {
      detailedAnalysis.push({ section: "Estilo de Vida e Hábitos Diários", findings: lifestyleFindings, recommendations: lifestyleRecommendations });
    }

    // --- Seção 6: Objetivos e Barreiras ao Treino ---
    const goalsBarriersFindings: string[] = [];
    const goalsBarriersRecommendations: string[] = [];
    if (anamnesisData.main_goal && anamnesisData.main_goal.trim() === "") {
      goalsBarriersFindings.push("Objetivo principal do treino não especificado.");
      goalsBarriersRecommendations.push("Definir objetivos SMART (Specific, Measurable, Achievable, Relevant, Time-bound) com o aluno (NSCA, 2016).");
      risks.push("Risco de falta de direcionamento.");
    }
    if (anamnesisData.barriers_to_training && anamnesisData.barriers_to_training.trim() !== "") {
      goalsBarriersFindings.push(`Barreiras identificadas: ${anamnesisData.barriers_to_training}.`);
      goalsBarriersRecommendations.push("Desenvolver estratégias personalizadas para superar as barreiras (ex: treinos curtos, flexibilidade de horários, exercícios em casa).");
      risks.push("Risco de não adesão devido a barreiras.");
    }
    if (anamnesisData.motivation_level === 'baixa') {
      goalsBarriersFindings.push("Nível de motivação baixo.");
      goalsBarriersRecommendations.push("Focar em pequenas vitórias, feedback positivo e atividades prazerosas para aumentar a motivação intrínseca.");
      risks.push("Risco de desmotivação.");
    }
    if (goalsBarriersFindings.length > 0) {
      detailedAnalysis.push({ section: "Objetivos e Barreiras ao Treino", findings: goalsBarriersFindings, recommendations: goalsBarriersRecommendations });
    }

    // Resumo geral
    if (risks.length === 0) {
      risks.push("Nenhum risco significativo identificado pela IA. O aluno parece ter um perfil de saúde e estilo de vida favorável ao exercício.");
      suggestions.push("Manter monitoramento regular e focar na progressão do treino.");
    } else {
      suggestions.push("Revisar os riscos identificados e adaptar o plano de treino e acompanhamento conforme as recomendações detalhadas.");
    }

    const report = {
      summary: {
        overallRisks: risks,
        overallSuggestions: suggestions,
      },
      detailedAnalysis: detailedAnalysis,
      disclaimer: "Este relatório é uma análise gerada por Inteligência Artificial com base nos dados fornecidos na anamnese e em diretrizes gerais de saúde e fitness (ACSM/NSCA). Ele não substitui a avaliação e o julgamento clínico de um profissional de saúde qualificado. O profissional deve revisar, validar e adaptar todas as informações e sugestões.",
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating anamnesis report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});