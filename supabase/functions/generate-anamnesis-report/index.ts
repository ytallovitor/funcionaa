// Minimal declarations to satisfy TypeScript in a non-Deno environment
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export const serve: any;
}
declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export const createClient: any;
}
declare const Deno: any;

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const { student, anamnesis } = await req.json();

    if (!student || !anamnesis) {
      return new Response(JSON.stringify({ error: 'Dados do aluno ou anamnese ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const report: {
      summary: string;
      challenges_risks: string[];
      suggestions: string[];
      scientific_basis: string[];
    } = {
      summary: `Análise inicial da anamnese de ${student.name} (${student.age} anos, ${student.gender}).`,
      challenges_risks: [],
      suggestions: [],
      scientific_basis: [],
    };

    // --- Regras de Análise (Simulação de IA) ---

    // 1. Histórico Médico e Saúde Atual
    if (anamnesis.medical_conditions && anamnesis.medical_conditions.toLowerCase() !== 'nenhuma') {
      report.challenges_risks.push(`Condições médicas: ${anamnesis.medical_conditions}.`);
      report.suggestions.push('Recomendar consulta médica para liberação e adaptação do treino.');
      report.scientific_basis.push('ACSM (2021): Triagem pré-exercício é crucial para indivíduos com condições médicas conhecidas.');
    }
    if (anamnesis.previous_injuries && anamnesis.previous_injuries.toLowerCase() !== 'nenhuma') {
      report.challenges_risks.push(`Lesões anteriores: ${anamnesis.previous_injuries}.`);
      report.suggestions.push('Focar em exercícios de fortalecimento e mobilidade específicos para as áreas afetadas. Evitar movimentos que causem dor.');
      report.scientific_basis.push('NSCA (2016): Adaptação de exercícios para lesões prévias previne recidivas e otimiza a recuperação.');
    }
    if (anamnesis.current_pain_level && anamnesis.current_pain_level > 3) {
      report.challenges_risks.push(`Nível de dor atual (${anamnesis.current_pain_level}/10) em ${anamnesis.pain_locations || 'local não especificado'}.`);
      report.suggestions.push('Priorizar exercícios de baixo impacto e fortalecimento da musculatura estabilizadora. Considerar encaminhamento para fisioterapia.');
      report.scientific_basis.push('ACSM (2021): Dor durante o exercício é um sinal de alerta; modificações são necessárias para evitar agravamento.');
    }
    if (anamnesis.family_medical_history && anamnesis.family_medical_history.toLowerCase() !== 'nenhum') {
      report.challenges_risks.push(`Histórico médico familiar relevante: ${anamnesis.family_medical_history}.`);
      report.suggestions.push('Monitorar de perto fatores de risco relacionados e incentivar exames preventivos.');
      report.scientific_basis.push('ACSM (2021): Histórico familiar de doenças crônicas aumenta o risco individual.');
    }
    if (anamnesis.cardiovascular_risk_factors && anamnesis.cardiovascular_risk_factors.toLowerCase() !== 'nenhum') {
      report.challenges_risks.push(`Fatores de risco cardiovascular: ${anamnesis.cardiovascular_risk_factors}.`);
      report.suggestions.push('Foco em exercícios aeróbicos de intensidade moderada e controle da dieta. Recomendar acompanhamento médico.');
      report.scientific_basis.push('ACSM (2021): Exercício regular e dieta são pilares na prevenção e manejo de doenças cardiovasculares.');
    }
    if (anamnesis.mental_health_history && anamnesis.mental_health_history.toLowerCase() !== 'nenhum') {
      report.challenges_risks.push(`Histórico de saúde mental: ${anamnesis.mental_health_history}.`);
      report.suggestions.push('Integrar atividades que promovam bem-estar mental (ex: yoga, meditação, exercícios ao ar livre). Monitorar sinais de estresse/ansiedade.');
      report.scientific_basis.push('ACSM (2021): Exercício físico é um adjuvante eficaz no manejo de condições de saúde mental.');
    }


    // 2. Medicamentos e Suplementos
    if (anamnesis.current_medications && anamnesis.current_medications.toLowerCase() !== 'nenhum') {
      report.challenges_risks.push(`Uso de medicamentos: ${anamnesis.current_medications}.`);
      report.suggestions.push('Verificar possíveis interações com o exercício (ex: beta-bloqueadores afetam FC).');
      report.scientific_basis.push('ACSM (2021): Medicamentos podem alterar a resposta fisiológica ao exercício.');
    }

    // 3. Histórico de Treino e Atividade Física
    if (anamnesis.training_experience === 'sedentario' || anamnesis.current_fitness_level === 'sedentario') {
      report.challenges_risks.push('Nível de experiência/condicionamento: Sedentário.');
      report.suggestions.push('Iniciar com volume e intensidade baixos, progressão gradual. Foco em criar hábito e técnica correta.');
      report.scientific_basis.push('ACSM (2021): Iniciantes devem começar com baixa intensidade e volume para evitar lesões e promover adesão.');
    }
    if (anamnesis.reasons_for_stopping_training) {
      report.challenges_risks.push(`Motivos de interrupção anteriores: ${anamnesis.reasons_for_stopping_training}.`);
      report.suggestions.push('Abordar proativamente as barreiras identificadas para garantir a adesão ao novo programa.');
      report.scientific_basis.push('NSCA (2016): Identificar e mitigar barreiras é chave para a retenção de clientes.');
    }

    // 4. Estilo de Vida e Hábitos Diários
    if (anamnesis.sleep_quality === 'ruim' || anamnesis.sleep_quality === 'muito_ruim' || (anamnesis.average_sleep_hours && anamnesis.average_sleep_hours < 6)) {
      report.challenges_risks.push(`Qualidade do sono (${anamnesis.sleep_quality}) e/ou poucas horas de sono (${anamnesis.average_sleep_hours}h).`);
      report.suggestions.push('Priorizar higiene do sono. Ajustar volume de treino se a recuperação for comprometida.');
      report.scientific_basis.push('NSCA (2016): Sono inadequado compromete a recuperação muscular, performance e saúde geral.');
    }
    if (anamnesis.stress_level === 'alto' || anamnesis.stress_level === 'muito_alto') {
      report.challenges_risks.push(`Nível de estresse: ${anamnesis.stress_level}.`);
      report.suggestions.push('Integrar técnicas de relaxamento e mindfulness. Evitar treinos excessivamente estressantes. Monitorar sinais de overtraining.');
      report.scientific_basis.push('ACSM (2021): Estresse crônico pode impactar negativamente a adaptação ao exercício e aumentar o risco de lesões.');
    }
    if (anamnesis.smoking_status === 'fumante_atual') {
      report.challenges_risks.push(`Fumante atual (${anamnesis.cigarettes_per_day || 'quantidade não informada'} cigarros/dia).`);
      report.suggestions.push('Incentivar a cessação do tabagismo. Monitorar capacidade cardiorrespiratória.');
      report.scientific_basis.push('ACSM (2021): Tabagismo é um fator de risco cardiovascular e respiratório significativo.');
    }
    if (anamnesis.alcohol_consumption === 'frequente') {
      report.challenges_risks.push('Consumo de álcool: Frequente.');
      report.suggestions.push('Discutir moderação do consumo de álcool devido ao impacto na recuperação e nutrição.');
      report.scientific_basis.push('NSCA (2016): Álcool pode prejudicar a síntese proteica muscular e a recuperação.');
    }
    if (anamnesis.daily_water_intake_liters && anamnesis.daily_water_intake_liters < 2) {
      report.challenges_risks.push(`Baixo consumo de água (${anamnesis.daily_water_intake_liters}L/dia).`);
      report.suggestions.push('Educar sobre a importância da hidratação para performance e saúde.');
      report.scientific_basis.push('ACSM (2021): Hidratação adequada é essencial para a termorregulação e performance física.');
    }
    if (anamnesis.screen_time_hours_per_day && anamnesis.screen_time_hours_per_day > 6) {
      report.challenges_risks.push(`Alto tempo de tela (${anamnesis.screen_time_hours_per_day}h/dia).`);
      report.suggestions.push('Incentivar pausas ativas e atividades ao ar livre para reduzir o sedentarismo associado.');
      report.scientific_basis.push('OMS (2020): Tempo excessivo de tela está associado a comportamentos sedentários e riscos à saúde.');
    }
    if (anamnesis.social_support_network === 'limitada') {
      report.challenges_risks.push('Rede de apoio social limitada.');
      report.suggestions.push('Considerar treinos em grupo ou desafios para promover engajamento e senso de comunidade.');
      report.scientific_basis.push('NSCA (2016): O apoio social é um preditor significativo de adesão a programas de exercícios.');
    }

    // 5. Objetivos e Barreiras ao Treino
    if (anamnesis.barriers_to_training && anamnesis.barriers_to_training.toLowerCase() !== 'nenhuma') {
      report.challenges_risks.push(`Barreiras ao treino: ${anamnesis.barries_to_training}.`);
      report.suggestions.push('Desenvolver estratégias personalizadas para superar as barreiras identificadas (ex: treinos curtos, flexibilidade de horários).');
      report.scientific_basis.push('NSCA (2016): A identificação e superação de barreiras são cruciais para a manutenção da atividade física.');
    }
    if (anamnesis.motivation_level === 'baixa') {
      report.challenges_risks.push('Nível de motivação: Baixa.');
      report.suggestions.push('Focar em pequenas vitórias, feedback positivo e estabelecer metas realistas e alcançáveis para aumentar a autoeficácia.');
      report.scientific_basis.push('Teoria da Autoeficácia (Bandura): Pequenos sucessos aumentam a confiança e a motivação para continuar.');
    }

    // Resumo final
    if (report.challenges_risks.length === 0) {
      report.summary = `A anamnese de ${student.name} indica um perfil de baixo risco e boa saúde geral.`;
      report.suggestions.push('Manter o plano de treino e monitorar o progresso regularmente.');
    } else {
      report.summary = `A anamnese de ${student.name} revela alguns pontos de atenção que devem ser considerados no planejamento do treino.`;
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});