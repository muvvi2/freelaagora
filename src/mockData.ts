import type { AppData, Category, MacroCategory, VipPlan, EstVipPlan, MetroMap, User, WeekAvailability, Job, Contract, WalletTx, AppNotification, Address } from './types';

// ============================================================
// MACRO-CATEGORIES (8 Setores Principais)
// ============================================================
export const MACRO_CATEGORIES: MacroCategory[] = [
  { id: 'tecnico', label: 'Técnico, Saúde, Educação e Digital', icon: 'Stethoscope', color: '#8b5cf6' },
  { id: 'alimentacao', label: 'Alimentação e Gastronomia', icon: 'ChefHat', color: '#f97316' },
  { id: 'eventos', label: 'Eventos, Entretenimento e Estética', icon: 'PartyPopper', color: '#ec4899' },
  { id: 'manutencao', label: 'Manutenção, Reformas e Emergências', icon: 'Wrench', color: '#f59e0b' },
  { id: 'domesticos', label: 'Domésticos e Cuidados', icon: 'Home', color: '#22c55e' },
  { id: 'logistica', label: 'Logística, Segurança e Serviços Gerais', icon: 'Truck', color: '#3b82f6' },
  { id: 'varejo', label: 'Varejo, Comércio e Atendimento', icon: 'Store', color: '#0891b2' },
  { id: 'agronegocio', label: 'Agronegócio e Meio Ambiente', icon: 'Sprout', color: '#10b981' },
];

// ============================================================
// CATEGORIES — Combos Originais + Opções Individuais Adicionadas
// ============================================================
export const CATEGORIES: Category[] = [
  // ==========================================
  // Técnico, Saúde, Educação e Digital
  // ==========================================
  // Combos Originais
  { id: 'suporte_de_ti_infraestrutura_redes', label: 'Suporte de TI / Infraestrutura / Redes', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'assistencia_tecnica_de_celulares_tablets_e_eletronicos', label: 'Assistência Técnica de Celulares, Tablets e Eletrônicos', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'enfermeiroa_particular_home_care', label: 'Enfermeiro(a) Particular / Home Care', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tecnicoa_em_enfermagem_plantonista', label: 'Técnico(a) em Enfermagem Plantonista', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'fisioterapeuta_domiciliar_ortopedico_e_respiratorio', label: 'Fisioterapeuta Domiciliar / Ortopédico e Respiratório', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'massoterapeuta_terapeuta_holistico', label: 'Massoterapeuta / Terapeuta Holístico', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'acupunturista_quiropraxista', label: 'Acupunturista / Quiropraxista', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'personal_trainer_educadora_fisico', label: 'Personal Trainer / Educador(a) Físico', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'professora_particular_reforco_escolar_idiomas', label: 'Professor(a) Particular / Reforço Escolar / Idiomas', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'psicologoa_clinico_terapeuta', label: 'Psicólogo(a) Clínico / Terapeuta', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'fonoaudiologoa', label: 'Fonoaudiólogo(a)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'nutricionista_clinico_esportivo_domiciliar', label: 'Nutricionista Clínico / Esportivo Domiciliar', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'medicoa_veterinarioa_home_care_pet', label: 'Médico(a) Veterinário(a) Home Care / Pet', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tradutora_interprete_comercial_e_juramentado', label: 'Tradutor(a) / Intérprete Comercial e Juramentado', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'desenvolvedora_programadora_web_e_apps', label: 'Desenvolvedor(a) / Programador(a) Web e Apps', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'designer_grafico_ui_ux_motion_designer', label: 'Designer Gráfico / UI/UX / Motion Designer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'social_media_gestora_de_trafego_pago', label: 'Social Media / Gestor(a) de Tráfego Pago', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'redatora_copywriter_revisora_de_texto', label: 'Redator(a) / Copywriter / Revisor(a) de Texto', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'contadora_consultora_fiscal_e_tributario', label: 'Contador(a) / Consultor(a) Fiscal e Tributário', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'advogadoa_consultora_freelancer', label: 'Advogado(a) Consultor(a) Freelancer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_marketplaces_mercadolivre_shopee_amazon', label: 'Especialista em Marketplaces (MercadoLivre/Shopee/Amazon)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'gestor_de_trafego_pago_meta_google_ads', label: 'Gestor de Tráfego Pago (Meta/Google Ads)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'programador_php_wordpress_woocommerce', label: 'Programador PHP / WordPress / WooCommerce', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'desenvolvedor_front_end_react_vue', label: 'Desenvolvedor Front-End (React/Vue)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'desenvolvedor_back_end_node_python', label: 'Desenvolvedor Back-End (Node/Python)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_seo_e_marketing_de_conteudo', label: 'Especialista em SEO e Marketing de Conteúdo', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'editor_de_video_para_youtube_tiktok_e_reels', label: 'Editor de Vídeo para YouTube, TikTok e Reels', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'analista_de_dados_bi_excel_avancado', label: 'Analista de Dados / BI / Excel Avançado', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'consultor_de_lgpd_e_conformidade_digital', label: 'Consultor de LGPD e Conformidade Digital', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'perito_grafotecnico_e_documentoscopia', label: 'Perito Grafotécnico e Documentoscopia', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tradutor_tecnico_simultaneo_ingles_espanhol', label: 'Tradutor Técnico / Simultâneo (Inglês/Espanhol)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'professor_de_ingles_conversacao', label: 'Professor de Inglês (Conversação)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'professor_de_espanhol', label: 'Professor de Espanhol', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'professor_de_frances_ou_alemao', label: 'Professor de Francês ou Alemão', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'professor_de_redacao_para_enem_e_concursos', label: 'Professor de Redação para ENEM e Concursos', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tutor_de_matematica_e_fisica', label: 'Tutor de Matemática e Física', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tutor_de_quimica_e_biologia', label: 'Tutor de Química e Biologia', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'instrutor_de_informatica_para_idosos', label: 'Professor de Informática para Idosos', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'instrutor_de_oratoria_e_comunicacao', label: 'Instrutor de Oratória e Comunicação', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'mentor_de_carreira_e_rh', label: 'Mentor de Carreira e RH', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'psicanalista_clinico', label: 'Psicanalista Clínico', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'terapeuta_holistico_reiki_e_acupuntura', label: 'Terapeuta Holístico (Reiki e Acupuntura)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'psicopedagogo_clinico_e_escolar', label: 'Psicopedagogo Clínico e Escolar', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'musicoterapeuta', label: 'Musicoterapeuta', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'terapeuta_ocupacional_domiciliar', label: 'Terapeuta Ocupacional Domiciliar', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tecnico_em_radiologia_medica', label: 'Técnico em Radiología Médica', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tecnico_em_protese_dentaria', label: 'Técnico em Prótese Dentária', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'instrumentador_cirurgico_freelancer', label: 'Instrumentador Cirúrgico Freelancer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'enfermeiro_obstetra_doula', label: 'Enfermeiro Obstetra / Doula', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tecnico_em_seguranca_do_trabalho_te_st', label: 'Técnico em Segurança do Trabalho (TST)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'engenheiro_de_seguranca_do_trabalho', label: 'Engenheiro de Segurança do Trabalho', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'consultor_ambiental_e_licenciamento', label: 'Consultor Ambiental e Licenciamento', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'biologo_consultor_fauna_e_flora', label: 'Biólogo Consultor (Fauna e Flora)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'quimico_responsavel_tecnico_industria', label: 'Químico Responsável Técnico (Indústria)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'engenheiro_eletricista_projetos_e_laudos', label: 'Engenheiro Eletricista (Projetos e Laudos)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'engenheiro_mecanico_art_e_pericias', label: 'Engenheiro Mecânico (ART e Perícias)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'arquiteto_e_urbanista_projetos_e_3d', label: 'Arquiteto e Urbanista (Projetos e 3D)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'designer_de_interiores_renderizacao', label: 'Designer de Interiores (Renderização)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'desenhista_projetista_cad_bim', label: 'Desenhista Projetista (CAD/BIM)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'topografo_e_agrimensor', label: 'Topógrafo e Agrimensor', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'tecnico_em_geoprocessamento_gis', label: 'Técnico em Geoprocessamento / GIS', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'auditor_interno_iso_9001', label: 'Auditor Interno ISO 9001', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'consultor_financeiro_e_bpo_financeiro', label: 'Consultor Financeiro e BPO Financeiro', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_licitacoes_publicas', label: 'Especialista em Licitações Públicas', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'analista_de_departamento_pessoal_folha', label: 'Analista de Departamento Pessoal (Folha)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'consultor_de_reestruturacao_de_empresas', label: 'Consultor de Reestruturação de Empresas', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'redator_de_contratos_societarios', label: 'Redator de Contratos Societários', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_direito_trabalhista', label: 'Especialista em Direito Trabalhista', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_direito_tributario', label: 'Especialista em Direito Tributário', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_direito_digital_e_lgpd', label: 'Especialista em Direito Digital e LGPD', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'jornalista_assessor_de_imprensa', label: 'Jornalista / Assessor de Imprensa', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'locutor_publicitario_e_voz_original', label: 'Locutor Publicitário e Voz Original (Voice Over)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'roteirista_de_videos_e_institucionais', label: 'Roteirista de Vídeos e Institucionais', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'fotografo_de_produtos_packshot', label: 'Fotógrafo de Produtos (Packshot)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'diretor_de_arte_freelancer', label: 'Diretor de Arte Freelancer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'motion_designer_pos_producao', label: 'Motion Designer (Pós-Produção)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'modelador_3d_e_animador_blender_maya', label: 'Modelador 3D e Animador (Blender/Maya)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'editor_de_audio_e_mixagem_podcast', label: 'Editor de Áudio e Mixagem (Podcast)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'compositor_trilhas_sonoras', label: 'Compositor de Trilhas Sonoras', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'curador_de_arte_e_produtor_cultural', label: 'Curador de Arte e Produtor Cultural', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'organizador_de_conferencias_e_webinars', label: 'Organizador de Conferências e Webinars', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_crm_hubspot_rd_station', label: 'Especialista em CRM (HubSpot/RD Station)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'growth_hacker_freelancer', label: 'Growth Hacker Freelancer', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'especialista_em_ux_research_e_testes_de_usabilidade', label: 'Especialista em UX Research e Testes de Usabilidade', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'arquiteto_de_solucoes_cloud_aws_azure', label: 'Arquiteto de Soluções Cloud (AWS/Azure)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },

  // Adicionadas Individuais (Técnico)
  { id: 'ind_suporte_ti', label: 'Suporte de TI (Individual)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'ind_infraestrutura', label: 'Infraestrutura (Individual)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'ind_redes', label: 'Redes (Individual)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'ind_celular', label: 'Assistência de Celulares (Individual)', icon: 'Stethoscope', color: '#8b5cf6', macro: 'tecnico' },

  // ==========================================
  // Alimentação e Gastronomia
  // ==========================================
  // Combos Originais
  { id: 'cozinheiroa_auxiliar_de_cozinha', label: 'Cozinheiro(a) / Auxiliar de Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiroa_executivo_chef_de_cozinha', label: 'Cozinheiro(a) Executivo / Chef de Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'sous_chef_coordenador_de_cozinha', label: 'Sous Chef / Coordenador de Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiroa_de_cozinha_fria_saladeria', label: 'Cozinheiro(a) de Cozinha Fria / Saladeria', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'garcom_garconete', label: 'Garçom / Garçonete', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'garcom_garconete_bilingue_protocolo_vip', label: 'Garçom / Garçonete Bilíngue / Protocolo VIP', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cumim_auxiliar_de_salao', label: 'Cumim / Auxiliar de Salão', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'barista_especialista_em_cafes', label: 'Barista / Especialista em Cafés', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'bartender_barman_mixologista', label: 'Bartender / Barman / Mixologista', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'padeiroa_artesanal_industrial', label: 'Padeiro(a) Artesanal / Industrial', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'confeiteiroa_cake_designer', label: 'Confeiteiro(a) / Cake Designer', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'pizzaioloa_forneiro', label: 'Pizzaiolo(a) / Forneiro', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'churrasqueiroa_mestre_braseiro', label: 'Churrasqueiro(a) / Mestre Braseiro', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'acougueiroa_desossadora', label: 'Açougueiro(a) / Desossador(a)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'sushiman_culinaria_japonesa', label: 'Sushiman / Culinária Japonesa', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'atendente_de_lanchonete_fast_food', label: 'Atendente de Lanchonete / Fast Food', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'passador_de_carnes_rodizio', label: 'Passador de Carnes / Rodízio', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'sommelier_especialista_em_vinhos_e_bebidas', label: 'Sommelier / Especialista em Vinhos e Bebidas', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'mestre_cervejeiro_auxiliar_de_chopes', label: 'Mestre Cervejeiro / Auxiliar de Chopes', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'copeiroa_de_restaurante_cozinha', label: 'Copeiro(a) de Restaurante / Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'host_hostess_recepcao_de_salao', label: 'Host / Hostess / Recepção de Salão', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'salgadeiroa_producao_de_massas', label: 'Salgadeiro(a) / Produção de Massas', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'sorveteiroa_gelatier', label: 'Sorveteiro(a) / Gelatier', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'chocolatier_especialista_em_doces_finos', label: 'Chocolatier / Especialista em Doces Finos', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'maitre_gestor_de_salao', label: 'Maître / Gestor de Salão', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'crepeiroa_masseiroa_de_eventos', label: 'Crepeiro(a) / Masseiro(a) de Eventos', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiroa_veganoa_vegetarianoa', label: 'Cozinheiro(a) Vegano(a) / Vegetariano(a)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'pizzaiolo_forneiro_a_lenha', label: 'Pizzaiolo / Forneiro a Lenha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cortador_de_frios_e_atendente_de_fiambreira', label: 'Cortador de Frios e Atendente de Fiambreira', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiro_de_linha_hospitalar_ou_coletiva', label: 'Cozinheiro de Linha Hospitalar ou Coletiva', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'auxiliar_de_linha_de_producao_de_alimentos', label: 'Auxiliar de Linha de Produção de Alimentos', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'barman_flair_bartender_acrobatico', label: 'Barman Flair (Bartender Acrobático)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'especialista_em_drinks_sem_alcool_mocktails', label: 'Especialista em Drinks sem Álcool (Mocktails)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiro_para_churrasco_particular_home_grill', label: 'Cozinheiro para Churrasco Particular (Home Grill)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },

  // Adicionadas Individuais (Alimentação)
  { id: 'ind_cozinheiro', label: 'Cozinheiro (Individual)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'ind_aux_cozinha', label: 'Auxiliar de Cozinha (Individual)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'ind_garcom', label: 'Garçom (Individual)', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },

  // ==========================================
  // Eventos, Entretenimento e Estética
  // ==========================================
  { id: 'promotora_de_eventos_feiras', label: 'Promotor(a) de Eventos / Feiras', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'recreadora_animadora_infantil', label: 'Recreador(a) / Animador(a) Infantil', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'recepcionista_cerimonialista_de_eventos', label: 'Recepcionista / Cerimonialista de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'dj_produtor_musical_de_pista', label: 'DJ / Produtor Musical de Pista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'sonoplasta_tecnico_de_som_de_eventos', label: 'Sonoplasta / Técnico de Som de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'iluminador_cenico_tecnico_de_luz', label: 'Iluminador Cênico / Técnico de Luz', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'fotografoa_profissional', label: 'Fotógrafo(a) Profissional', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'videomaker_cinegrafista', label: 'Videomaker / Cinegrafista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'montadora_de_palco_roadie', label: 'Montador(a) de Palco / Roadie', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'cabeleireiroa_colorista', label: 'Cabeleireiro(a) / Colorista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'barbeiro_visagista', label: 'Barbeiro / Visagista', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'manicure_pedicure_podologa', label: 'Manicure / Pedicure / Podóloga', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'maquiadora_profissional_noivas', label: 'Maquiador(a) Profissional / Noivas', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'produtora_executivo_de_eventos', label: 'Produtor(a) Executivo de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'valet_manobrista_de_eventos', label: 'Valet / Manobrista de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'esteticista_designer_de_sobrancelhas', label: 'Esteticista / Designer de Sobrancelhas', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'lash_designer_extensao_de_cilios', label: 'Lash Designer / Extensão de Cílios', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'massagista_esteticoa_modeladora', label: 'Massagista Estético(a) / Modeladora', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'magico_artista_de_rua_perna_de_pau', label: 'Mágico / Artista de Rua / Perna de Pau', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'musicoa_cantora_solo_banda_de_baile', label: 'Músico(a) / Cantor(a) Solo / Banda de Baile', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'tecnico_de_painel_de_led', label: 'Técnico de Painel de LED', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'dancarino_coreografo', label: 'Dançarino/Coreógrafo', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'humorista_ator_de_stand_up', label: 'Humorista / Ator de Stand-up', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'caricaturista_e_desenhista_ao_vivo', label: 'Caricaturista e Desenhista ao Vivo', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'estatua_viva_e_personagem_vivente', label: 'Estátua Viva e Personagem Vivente', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'especialista_em_brinquedos_inflaveis_e_seguranca', label: 'Especialista em Brinquedos Infláveis e Segurança', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'cerimonialista_de_casamentos_e_debutantes', label: 'Cerimonialista de Casamentos e Debutantes', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'operador_de_drone_para_filmagem_de_eventos', label: 'Operador de Drone para Filmagem de Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'designer_de_baloes_e_decoracao_festiva', label: 'Designer de Balões e Decoração Festiva', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'florista_e_decorador_floral_para_eventos', label: 'Florista e Decorador Floral para Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'cabine_de_fotos_e_totem_fotografico_operador', label: 'Cabine de Fotos e Totem Fotográfico (Operador)', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'seguranca_particular_para_camarotes_e_festas', label: 'Segurança Particular para Camarotes e Festas', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'personal_stylist_e_consultor_de_imagem_para_eventos', label: 'Personal Stylist e Consultor de Imagem para Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'massagista_express_quick_massage_para_eventos', label: 'Massagista Express / Quick Massage para Eventos', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },

  // ==========================================
  // Manutenção, Reformas e Emergências
  // ==========================================
  { id: 'montadora_de_moveis', label: 'Montador(a) de Móveis', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'pintora_residencial_e_comercial', label: 'Pintor(a) Residencial e Comercial', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'gesseiroa_instalador_de_drywall', label: 'Gesseiro(a) / Instalador de Drywall', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'eletricista_residencial_comercial_e_predial', label: 'Eletricista Residencial, Comercial e Predial', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'encanadora_bombeiro_hidraulico', label: 'Encanador(a) / Bombeiro Hidráulico', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'pedreiroa_azulejista_ajudante', label: 'Pedreiro(a) / Azulejista / Ajudante', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'marceneiroa_projetados', label: 'Marceneiro(a) / Projetados', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'serralheiroa_estruturas_metalicas', label: 'Serralheiro(a) / Estruturas Metálicas', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'tecnico_de_ar_condicionado_climatizacao', label: 'Técnico de Ar-Condicionado / Climatização', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'chaveiroa_residencial_e_automotivo', label: 'Chaveiro(a) Residencial e Automotivo', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'vidraceiroa_esquadrias', label: 'Vidraceiro(a) / Esquadrias', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'desentupidora_profissional_hidrojato', label: 'Desentupidor(a) Profissional / Hidrojato', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'engenheiroa_civil_perito_calculista', label: 'Engenheiro(a) Civil / Perito / Calculista', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'arquitetoa_urbanista_interiores', label: 'Arquiteto(a) / Urbanista / Interiores', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'mestre_de_obras_apontador', label: 'Mestre de Obras / Apontador', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'impermeabilizadora_de_lajes_e_piscinas', label: 'Impermeabilizador(a) de Lajes e Piscinas', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'calheiroa_instalacao_de_rufos', label: 'Calheiro(a) / Instalação de Rufos', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'instaladora_de_pisos_vinilicos_laminados_e_carpetes', label: 'Instalador(a) de Pisos Vinílicos, Laminados e Carpetes', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'limpadora_de_fachadas_alpinista_predial', label: 'Limpador(a) de Fachadas / Alpinista Predial', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'tecnico_de_conserto_de_eletrodomesticos_lavadoras_geladeiras', label: 'Técnico de Conserto de Eletrodomésticos (Lavadoras/Geladeiras)', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'marmorista_polidora_de_marmores_e_granitos', label: 'Marmorista / Polidor(a) de Mármores e Granitos', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'instalador_de_papel_de_parede', label: 'Instalador de Papel de Parede', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'telhadista_especialista_em_coberturas', label: 'Telhadista / Especialista em Coberturas', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'tecnico_de_aquecedores_a_gas', label: 'Técnico de Aquecedores a Gás', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'instalador_de_redes_de_protecao_e_telas', label: 'Instalador de Redes de Proteção e Telas', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'tecnico_em_energia_solar_fotovoltaica', label: 'Técnico em Energia Solar Fotovoltaica', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'tecnico_em_automacao_residencial_smart_home', label: 'Técnico em Automação Residencial (Smart Home)', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'instalador_de_antenas_e_cftv_cameras_de_seguranca', label: 'Instalador de Antenas e CFTV (Câmeras de Segurança)', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'bombeiro_hidraulico_industrial_e_comercial', label: 'Bombeiro Hidráulico Industrial e Comercial', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'especialista_em_tratamento_de_trincas_e_recalques', label: 'Especialista em Tratamento de Trincas e Recalques', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'polidor_de_pisos_granilite_e_porcelanato', label: 'Polidor de Pisos (Granilite e Porcelanato)', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'montador_de_estruturas_de_atencao_e_stands', label: 'Montador de Estruturas de Atenção e Stands', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'tecnico_em_portoes_automaticos_e_basculantes', label: 'Técnico em Portões Automáticos e Basculantes', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },

  // ==========================================
  // Domésticos e Cuidados
  // ==========================================
  { id: 'baba_cuidadora_infantil', label: 'Babá / Cuidador(a) Infantil', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'baba_bilingue_recem_nascidos_nursery_nurse', label: 'Babá Bilíngue / Recém-Nascidos (Nursery Nurse)', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'cuidadora_de_idosos', label: 'Cuidador(a) de Idosos', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'cuidadora_de_pessoas_com_deficiencia_pcd', label: 'Cuidador(a) de Pessoas com Deficiência (PCD)', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'caseiroa_casal_de_caseiros', label: 'Caseiro(a) / Casal de Caseiros', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'diarista_limpeza_residencial', label: 'Diarista / Limpeza Residencial', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'faxineiroa_pos_obra_limpeza_pesada', label: 'Faxineiro(a) Pós-Obra / Limpeza Pesada', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'passadeiroa_de_roupas', label: 'Passadeiro(a) de Roupas', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'cozinheiroa_residencial_particular', label: 'Cozinheiro(a) Residencial Particular', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'jardineiroa_paisagista_residencial', label: 'Jardineiro(a) / Paisagista Residencial', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'piscineiroa_tratamento_de_agua', label: 'Piscineiro(a) / Tratamento de Água', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'pet_sitter_passeador_de_caes_dog_walker', label: 'Pet Sitter / Passeador de Cães (Dog Walker)', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'governanta_residencial_house_manager', label: 'Governanta Residencial (House Manager)', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'personal_organizer_arrumadora', label: 'Personal Organizer / Arrumador(a)', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'lavadeira_lavadora_de_roupas_finas', label: 'Lavadeira / Lavador(a) de Roupas Finas', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'motorista_particular_familiar', label: 'Motorista Particular / Familiar', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'cozinheira_de_fim_de_semana_para_chales_e_sitios', label: 'Cozinheira de Fim de Semana para Chalés e Sítios', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'auxiliar_de_limpeza_e_arrumacao_diaria', label: 'Auxiliar de Limpeza e Arrumação Diária', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'cuidador_de_pets_exoticos_e_passarinhos', label: 'Cuidador de Pets Exóticos e Passarinhos', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'banhista_e_tosa_domiciliar_pet', label: 'Banhista e Tosa Domiciliar (Pet)', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'lavador_de_tapetes_e_estofados_a_domicilio', label: 'Lavador de Tapetes e Estofados a Domicílio', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'passadeira_especializada_em_roupas_de_festa_e_alfaiataria', label: 'Passadeira Especializada em Roupas de Festa e Alfaiataria', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'acompanhante_hospitalar_noturno_e_diurno', label: 'Acompanhante Hospitalar Noturno e Diurno', icon: 'Home', color: '#22c55e', macro: 'domesticos' },
  { id: 'motorista_escolar_freelancer_ou_substituto', label: 'Motorista Escolar Freelancer ou Substituto', icon: 'Home', color: '#22c55e', macro: 'domesticos' },

  // ==========================================
  // Logística, Segurança e Serviços Gerais
  // ==========================================
  { id: 'motoboy_entregadora_com_moto', label: 'Motoboy / Entregador(a) com Moto', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'motorista_entregadora_de_carro_van_fiorino', label: 'Motorista Entregador(a) de Carro / Van / Fiorino', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'motorista_de_caminhao_toco_truck_carreta', label: 'Motorista de Caminhão (Toco, Truck, Carreta)', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'carregador_chapa_carga_descarga_e_mudancas', label: 'Carregador / Chapa (Carga, Descarga e Mudanças)', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'seguranca_privada_guarda_costas', label: 'Segurança Privada / Guarda-Costas', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'vigilante_armado_escolta', label: 'Vigilante Armado / Escolta', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'controladora_de_acesso_portaria', label: 'Controlador(a) de Acesso / Portaria', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'porteiroa_vigia_noturno', label: 'Porteiro(a) / Vigia Noturno', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'lavadora_de_carros_estetica_automotiva', label: 'Lavador(a) de Carros / Estética Automotiva', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'borrachiroa_borracharia_movel_de_emergencia', label: 'Borrachiro(a) / Borracharia Móvel de Emergência', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'mecanicoa_de_emergencia_socorrista_automotivo', label: 'Mecânico(a) de Emergência / Socorrista Automotivo', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'operadora_de_guincho_reboque', label: 'Operador(a) de Guincho / Reboque', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'auxiliar_de_logistica_expedicao_armazem', label: 'Auxiliar de Logística / Expedição / Armazém', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'conferente_de_carga_e_notas_fiscais', label: 'Conferente de Carga e Notas Fiscais', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'operadora_de_empilhadeira_certificadoa', label: 'Operador(a) de Empilhadeira Certificado(a)', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'zeladora_predial_condominios', label: 'Zelador(a) Predial / Condomínios', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'auxiliar_de_limpeza_geral_faxineiroa_comercial', label: 'Auxiliar de Limpeza Geral / Faxineiro(a) Comercial', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'ajudante_de_mudancas_residencial_e_comercial', label: 'Ajudante de Mudanças (Residencial e Comercial)', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'motorista_de_aplicativo_substituto', label: 'Motorista de Aplicativo Substituto', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'fiscal_de_pista_de_estacionamento', label: 'Fiscal de Pista de Estacionamento', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'operador_de_transpaleteira_eletrica_e_manual', label: 'Operador de Transpaleteira Elétrica e Manual', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'embalador_industrial_e_de_expedicao', label: 'Embalador Industrial e de Expedição', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'vigia_de_obras_e_patrimonial_noturno', label: 'Vigia de Obras e Patrimonial Noturno', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },
  { id: 'limpador_de_vidros_e_calcadas_comerciais', label: 'Limpador de Vidros e Calçadas Comerciais', icon: 'Truck', color: '#3b82f6', macro: 'logistica' },

  // ==========================================
  // Varejo, Comércio e Atendimento
  // ==========================================
  { id: 'balconista_atendente_de_loja', label: 'Balconista / Atendente de Loja', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'operadora_de_caixa_frente_de_loja', label: 'Operador(a) de Caixa / Frente de Loja', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'repositora_de_mercadorias_estoque', label: 'Repositor(a) de Mercadorias / Estoque', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'panfleteiroa_divulgadoa_de_rua', label: 'Panfleteiro(a) / Divulgador(a) de Rua', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'fiscal_de_loja_prevencao_de_perdas', label: 'Fiscal de Loja / Prevenção de Perdas', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'inventariante_auditora_de_estoque', label: 'Inventariante / Auditor(a) de Estoque', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'promotora_de_vendas_merchandising', label: 'Promotor(a) de Vendas / Merchandising', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'demonstradora_de_produtos_degustadora', label: 'Demonstrador(a) de Produtos / Degustador(a)', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'empacotadora_de_supermercado', label: 'Empacotador(a) de Supermercado', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'vendedora_temporarioa_de_shopping', label: 'Vendedor(a) Temporário(a) de Shopping', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'operadora_de_telemarketing_atendimento_receptivo', label: 'Operador(a) de Telemarketing / Atendimento Receptivo', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'atendente_de_e_commerce_chat_suporte_online', label: 'Atendente de E-commerce / Chat / Suporte Online', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'caixa_operador_de_pdv_para_eventos_e_feiras', label: 'Caixa / Operador de PDV para Eventos e Feiras', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'atendente_de_farmacia_e_perfumaria', label: 'Atendente de Farmácia e Perfumaria', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'vendedor_de_concessionaria_e_veiculos_freelancer', label: 'Vendedor de Concessionária e Veículos (Freelancer)', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'atendente_de_posto_de_gasolina_e_conveniencia', label: 'Atendente de Posto de Gasolina e Conveniência', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'organizador_de_vitrines_e_visual_merchandising', label: 'Organizador de Vitrines e Visual Merchandising', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'consultor_de_vendas_porta_a_porta_e_externas', label: 'Consultor de Vendas Porta a Porta e Externas', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'atendente_de_bilheteria_e_cinema', label: 'Atendente de Bilheteria e Cinema', icon: 'Store', color: '#0891b2', macro: 'varejo' },

  // ==========================================
  // Agronegócio e Meio Ambiente
  // ==========================================
  { id: 'operador_de_drone_agricola', label: 'Operador de Drone Agrícola', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'tratorista_freelancer_operador_de_maquinario_pesado', label: 'Tratorista Freelancer / Operador de Maquinário Pesado', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'consultor_agronomo_tecnico_agricola', label: 'Consultor Agrônomo / Técnico Agrícola', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'topografo_agrimensor', label: 'Topógrafo / Agrimensor', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'classificador_de_graos', label: 'Classificador de Grãos', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'podador_de_arvores_fruticultores', label: 'Podador de Árvores / Fruticultores', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'auxiliar_de_colheita_e_poda', label: 'Auxiliar de Colheita e Poda', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'operador_de_irrigacao', label: 'Operador de Irrigacao', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'analista_de_meio_ambiente_licenciamento', label: 'Analista de Meio Ambiente / Licenciamento', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'monitor_de_fauna_e_flora_inventariante_ambiental', label: 'Monitor de Fauna e Flora / Inventariante Ambiental', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'consultor_de_sustentabilidade_rural', label: 'Consultor de Sustentabilidade Rural', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
  { id: 'operador_de_compostagem_e_residuos', label: 'Operador de Compostagem e Resíduos', icon: 'Sprout', color: '#10b981', macro: 'agronegocio' },
];

// ============================================================
// FREELANCER VIP PLANS
// ============================================================
export const VIP_PLANS: VipPlan[] = [
  { tier: 'free', label: 'Free', maxCategories: 2, features: ['Até 2 categorias ativas', 'Aparição padrão nas buscas'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'vip1', label: 'VIP 1', maxCategories: 4, features: ['Até 4 categorias ativas', 'Impulso leve nas buscas'], prices: { monthly: 14.90, semestral: 59.90, annual: 99.90 }, boost: 'light' },
  { tier: 'vip2', label: 'VIP 2', maxCategories: 5, features: ['Até 5 categorias ativas', 'Selo verificado', 'Ranking superior nas buscas'], prices: { monthly: 24.90, semestral: 99.90, annual: 169.90 }, badge: 'verified', boost: 'top' },
  { tier: 'vip3', label: 'VIP 3', maxCategories: 999, features: ['Categorias ilimitadas', 'Destaque visual máximo', 'Suporte prioritário', 'Ranking máximo'], prices: { monthly: 39.90, semestral: 159.90, annual: 279.90 }, badge: 'diamond', boost: 'max' },
];

// ============================================================
// ESTABLISHMENT VIP PLANS (COM O VIP 4 ADICIONADO)
// ============================================================
export const EST_VIP_PLANS: EstVipPlan[] = [
  { tier: 'free', label: 'Plano Gratuito', intermediationFee: 15.0, maxActiveJobs: 2, features: ['Até 2 vagas por semana', 'Taxa de intermediação de 15,0%', 'Gratuito', 'Acesso completo ao marketplace'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'trial', label: 'Teste Gratuito (15 dias)', intermediationFee: 7.5, maxActiveJobs: 10, features: ['Até 10 vagas por semana durante o teste', 'Taxa reduzida de 7,5%', 'Sem compromisso'], prices: { monthly: 0, semestral: 0, annual: 0 } },
  { tier: 'vip1', label: 'Plano VIP 1', intermediationFee: 7.5, maxActiveJobs: 5, features: ['Até 5 vagas por semana', 'Taxa reduzida de 7,5%', 'Prioridade no suporte'], prices: { monthly: 29.90, semestral: 149.90, annual: 249.90 } },
  { tier: 'vip2', label: 'Plano VIP 2', intermediationFee: 5.0, maxActiveJobs: 20, features: ['Até 20 vagas por semana', 'Taxa reduzida de 5,0%', 'Prioridade no suporte', 'Destaque nas buscas'], prices: { monthly: 59.90, semestral: 299.90, annual: 499.90 } },
  { tier: 'vip3', label: 'Plano VIP 3', intermediationFee: 0.0, maxActiveJobs: 999, features: ['Vagas ilimitadas por semana', 'Isenção total (0%) de taxas', 'Suporte prioritário VIP', 'Destaque máximo'], prices: { monthly: 119.90, semestral: 549.00, annual: 949.00 } },
  { tier: 'vip4', label: 'Plano VIP 4', intermediationFee: 0.0, maxActiveJobs: 999, features: ['Vagas ilimitadas por semana', 'Isenção total (0%) de taxas', 'Suporte VIP exclusivo', 'Anúncios ativos'], prices: { monthly: 149.90, semestral: 699.00, annual: 1199.00 }, allowAds: true },
];

export const LEGAL_VERSION = 'v1.9';

export const tierLabel: Record<string, string> = { free: 'Free', vip1: 'VIP 1', vip2: 'VIP 2', vip3: 'VIP 3', vip4: 'VIP 4' };
export const estTierLabel: Record<string, string> = { free: 'Gratuito', trial: 'Teste Gratuito', vip1: 'VIP 1', vip2: 'VIP 2', vip3: 'VIP 3', vip4: 'VIP 4' };

// ============================================================
// METRO MAP — São Paulo
// ============================================================
export const METRO_MAP: MetroMap = {
  'São Paulo': ['Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul', 'Diadema', 'Taboão da Serra', 'Embu das Artes'],
  'Guarulhos': ['São Paulo'],
  'Osasco': ['São Paulo', 'Barueri'],
  'Santo André': ['São Paulo', 'São Bernardo do Campo', 'São Caetano do Sul', 'Mauá'],
  'São Bernardo do Campo': ['São Paulo', 'Santo André', 'São Caetano do Sul', 'Diadema'],
  'São Caetano do Sul': ['São Paulo', 'Santo André', 'São Bernardo do Campo'],
  'Diadema': ['São Paulo', 'São Bernardo do Campo'],
  'Taboão da Serra': ['São Paulo', 'Embu das Artes'],
  'Embu das Artes': ['São Paulo', 'Taboão da Serra'],
  'Barueri': ['Osasco', 'Carapicuíba'],
  'Carapicuíba': ['Osasco', 'Barueri'],
  'Mauá': ['Santo André', 'Ribeirão Pires'],
  'Ribeirão Pires': ['Mauá', 'Santo André'],
};

export function metroNearby(city: string): string[] {
  const nearby = METRO_MAP[city] ?? [];
  return [city, ...nearby];
}

// ============================================================
// AVAILABILITY helpers
// ============================================================
export function emptyAvailability(): WeekAvailability {
  const days: WeekAvailability = {} as WeekAvailability;
  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    days[d] = { manha: false, tarde: false, noite: false };
  }
  return days;
}

export function fullAvailability(): WeekAvailability {
  const days: WeekAvailability = {} as WeekAvailability;
  for (const d of ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const) {
    days[d] = { manha: true, tarde: true, noite: true };
  }
  return days;
}

export const DAY_LABELS: { key: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'; label: string; short: string }[] = [
  { key: 'seg', label: 'Segunda', short: 'Seg' },
  { key: 'ter', label: 'Terça', short: 'Ter' },
  { key: 'qua', label: 'Quarta', short: 'Qua' },
  { key: 'qui', label: 'Quinta', short: 'Qui' },
  { key: 'sex', label: 'Sexta', short: 'Sex' },
  { key: 'sab', label: 'Sábado', short: 'Sáb' },
  { key: 'dom', label: 'Domingo', short: 'Dom' },
];

export const SHIFT_LABELS: { key: 'manha' | 'tarde' | 'noite'; label: string; icon: string }[] = [
  { key: 'manha', label: 'Manhã', icon: 'Sunrise' },
  { key: 'tarde', label: 'Tarde', icon: 'Sun' },
  { key: 'noite', label: 'Noite', icon: 'Moon' },
];

// ============================================================
// DEMO USERS
// ============================================================
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

const addrSP = (street: string, num: string, bairro: string, lat = -23.56, lng = -46.65): Address => ({ cep: '01310-100', street, number: num, neighborhood: bairro, city: 'São Paulo', state: 'SP', lat, lng });

export const SEED_USERS: User[] = [
  {
    id: 'admin1', accountType: 'freelancer', isAdmin: true, adminRole: 'super',
    email: 'admin@freelaagora.com', password: 'admin123', name: 'Administrador FreelaAgora',
    photo: 'https://images.pexels.com/photos/804009/pexels-photo-804009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 90000-0000', whatsapp: '(11) 90000-0000', address: addrSP('R. Augusta', '100', 'Consolação'),
    walletBalance: 0, createdAt: daysAgo(120),
    termsAcceptance: { timestamp: daysAgo(120), ip: '189.45.22.10', userAgent: 'Mozilla/5.0 FreelaAgora', legalVersion: 'v1.0' },
  },
  {
    id: 'admin2', accountType: 'freelancer', isAdmin: true, adminRole: 'regular',
    email: 'moderador@freelaagora.com', password: 'mod123', name: 'Moderador FreelaAgora',
    photo: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 90000-0001', whatsapp: '(11) 90000-0001', address: addrSP('R. Augusta', '200', 'Consolação'),
    walletBalance: 0, createdAt: daysAgo(60),
    termsAcceptance: { timestamp: daysAgo(60), ip: '189.45.22.11', userAgent: 'Mozilla/5.0 FreelaAgora', legalVersion: 'v1.0' },
  },
  {
    id: 'fl1', accountType: 'freelancer', email: 'marcos@freelaagora.com', password: '123456',
    name: 'Marcos "Tigrão" Araújo', nickname: 'Tigrão', photo: 'https://images.pexels.com/photos/26621714/pexels-photo-26621714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 98888-1111', whatsapp: '(11) 98888-1111', address: addrSP('R. dos Pinheiros', '842', 'Pinheiros', -23.57, -46.70),
    cpf: '111.444.777-35', bio: '15 anos de brasa na chapa. Especialista em costela fogo de chão e buffet para grandes eventos.',
    specialties: ['Churrasqueiro', 'Cozinheiro'], hourlyRate: 45, dailyRate: 320, pixKey: 'marcos.tigrao@pix.com',
    rating: 4.9, reviewsCount: 47, completedShifts: 142, vipTier: 'vip2',
    vipExpiresAt: new Date(now + 20 * 86400000).toISOString(), categories: ['churrasqueiro', 'cozinha', 'garcom', 'bartender', 'promotor_eventos'],
    availability: fullAvailability(), walletBalance: 1240, documentVerified: true, createdAt: daysAgo(90),
    serviceRadiusKm: 25, acceptsInterstate: true,
    termsAcceptance: { timestamp: daysAgo(90), ip: '201.55.33.22', userAgent: 'Mozilla/5.0 Chrome', legalVersion: 'v1.0' },
  },
  {
    id: 'fl2', accountType: 'freelancer', email: 'juliana@freelaagora.com', password: '123456',
    name: 'Juliana Mendes', nickname: 'Ju', photo: 'https://images.pexels.com/photos/28945105/pexels-photo-28945105.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 97777-2222', whatsapp: '(11) 97777-2222', address: { cep: '02011-000', street: 'R. Voluntários da Pátria', number: '500', neighborhood: 'Santana', city: 'São Paulo', state: 'SP', lat: -23.50, lng: -46.62 },
    cpf: '222.333.444-05', bio: 'Garçonete de evento desde 2018. Atendo casamentos, confraternizações e jantares corporativos.',
    specialties: ['Garçonete', 'Recepcionista'], hourlyRate: 32, dailyRate: 220, pixKey: 'ju.mendes@pix.com',
    rating: 4.8, reviewsCount: 63, completedShifts: 98, vipTier: 'free',
    categories: ['garcom', 'recepcionista'],
    availability: { ...emptyAvailability(), seg: { manha: false, tarde: true, noite: true }, qua: { manha: false, tarde: true, noite: true }, sex: { manha: false, tarde: false, noite: true }, sab: { manha: true, tarde: true, noite: true }, dom: { manha: true, tarde: true, noite: false } },
    walletBalance: 860, createdAt: daysAgo(60), serviceRadiusKm: 10, acceptsInterstate: false,
    termsAcceptance: { timestamp: daysAgo(60), ip: '189.22.44.55', userAgent: 'Mozilla/5.0 Safari', legalVersion: 'v1.0' },
  },
  {
    id: 'fl3', accountType: 'freelancer', email: 'diego@freelaagora.com', password: '123456',
    name: 'Diego Santos', photo: 'https://images.pexels.com/photos/14164521/pexels-photo-14164521.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 96666-3333', whatsapp: '(11) 96666-3333', address: { cep: '07041-050', street: 'R. Felício Marcondes', number: '123', neighborhood: 'Centro', city: 'Guarulhos', state: 'SP', lat: -23.45, lng: -46.53 },
    cpf: '333.222.111-04', bio: 'Auxiliar de cozinha ágil e organizado. Disponível para plantões de fim de semana e coberturas.',
    specialties: ['Auxiliar de Cozinha', 'Copeiro'], hourlyRate: 24, dailyRate: 160, pixKey: 'diegosantos@pix.com',
    rating: 4.7, reviewsCount: 29, completedShifts: 54, vipTier: 'free', categories: ['cozinha'],
    availability: { ...emptyAvailability(), sab: { manha: true, tarde: true, noite: true }, dom: { manha: true, tarde: true, noite: true } },
    walletBalance: 320, createdAt: daysAgo(45), serviceRadiusKm: 15, acceptsInterstate: false,
    termsAcceptance: { timestamp: daysAgo(45), ip: '177.33.55.66', userAgent: 'Mozilla/5.0 Firefox', legalVersion: 'v1.0' },
  },
  {
    id: 'fl4', accountType: 'freelancer', email: 'rafael@freelaagora.com', password: '123456',
    name: 'Rafael "Rafa" Costa', nickname: 'Rafa', photo: 'https://images.pexels.com/photos/19652091/pexels-photo-19652091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 95555-4444', whatsapp: '(11) 95555-4444', address: addrSP('Al. Santos', '2000', 'Jardim Paulista', -23.58, -46.67),
    cpf: '444.555.666-07', bio: 'Bartender premiado em duas edições da São Paulo Cocktail Week. Levo minha própria estação.',
    specialties: ['Bartender', 'Somelier'], hourlyRate: 40, dailyRate: 280, pixKey: 'rafa.cocktails@pix.com',
    rating: 5.0, reviewsCount: 41, completedShifts: 87, vipTier: 'vip3',
    vipExpiresAt: new Date(now + 60 * 86400000).toISOString(), categories: ['bartender', 'promotor_eventos', 'cozinha', 'dj', 'garcom'],
    availability: fullAvailability(), walletBalance: 2100, documentVerified: true, createdAt: daysAgo(80),
    serviceRadiusKm: 50, acceptsInterstate: true,
    termsAcceptance: { timestamp: daysAgo(80), ip: '201.44.66.77', userAgent: 'Mozilla/5.0 Chrome Mobile', legalVersion: 'v1.0' },
  },
  {
    id: 'es1', accountType: 'establishment', email: 'contato@bardoze.com.br', password: '123456',
    name: 'Bar do Zé', photo: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 98888-1234', whatsapp: '(11) 98888-1234', address: addrSP('R. dos Pinheiros', '842', 'Pinheiros', -23.57, -46.70),
    cnpj: '12.345.678/0001-90', establishmentType: 'Bar & Restaurante',
    estVipTier: 'vip2', rating: 4.6, reviewsCount: 124, walletBalance: 500, createdAt: daysAgo(100),
    termsAcceptance: { timestamp: daysAgo(100), ip: '189.55.77.88', userAgent: 'Mozilla/5.0 Chrome', legalVersion: 'v1.0' },
  },
  {
    id: 'es2', accountType: 'establishment', email: 'eventos@lumiere.com.br', password: '123456',
    name: 'Casa de Eventos Lumière', photo: 'https://images.pexels.com/photos/13869884/pexels-photo-13869884.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    phone: '(11) 97777-5678', whatsapp: '(11) 97777-5678', address: { cep: '04547-000', street: 'Av. das Nações', number: '1500', neighborhood: 'Itaim Bibi', city: 'São Paulo', state: 'SP', lat: -23.59, lng: -46.68 },
    cnpj: '98.765.432/0001-10', establishmentType: 'Buffet & Eventos',
    estVipTier: 'vip3', estVipExpiresAt: new Date(now + 90 * 86400000).toISOString(),
    rating: 4.8, reviewsCount: 89, walletBalance: 1200, createdAt: daysAgo(95),
    termsAcceptance: { timestamp: daysAgo(95), ip: '201.66.88.99', userAgent: 'Mozilla/5.0 Safari', legalVersion: 'v1.0' },
  },
];

export const SEED_JOBS: Job[] = [
  { id: 'job1', establishmentId: 'es1', establishmentName: 'Bar do Zé', establishmentPhoto: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'garcom', title: 'Cobertura de sexta à noite', description: 'Preciso de 1 garçom para a noite de sexta. Casa lotada por causa do show.', date: new Date(now + 2 * 86400000).toISOString(), startTime: '18:00', hours: 6, value: 210, urgency: 'hoje', status: 'active', city: 'São Paulo', state: 'SP', applicants: ['fl2'], createdAt: daysAgo(1) },
  { id: 'job2', establishmentId: 'es2', establishmentName: 'Casa de Eventos Lumière', establishmentPhoto: 'https://images.pexels.com/photos/13869884/pexels-photo-13869884.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'bartender', title: 'Casamento sábado — bar de drinks', description: 'Casamento para 180 convidados. Bartender com experiência em drinks autorais.', date: new Date(now + 4 * 86400000).toISOString(), startTime: '16:00', hours: 8, value: 380, urgency: 'esta_semana', status: 'active', city: 'São Paulo', state: 'SP', applicants: ['fl4'], createdAt: daysAgo(2) },
  { id: 'job3', establishmentId: 'es1', establishmentName: 'Bar do Zé', establishmentPhoto: 'https://images.pexels.com/photos/5531664/pexels-photo-5531664.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', category: 'cozinha', title: 'Churrasco de domingo — urgente', description: 'Churrasqueiro escalado faltou. Rodízio de carnes das 12h às 17h.', date: new Date(now + 1 * 86400000).toISOString(), startTime: '11:00', hours: 7, value: 350, urgency: 'hoje', status: 'active', city: 'São Paulo', state: 'SP', applicants: ['fl1'], createdAt: daysAgo(1) },
];

export const SEED_CONTRACTS: Contract[] = [
  { id: 'ct1', jobId: null, establishmentId: 'es1', establishmentName: 'Bar do Zé', freelancerId: 'fl1', freelancerName: 'Marcos "Tigrão" Araújo', freelancerPhoto: 'https://images.pexels.com/photos/26621714/pexels-photo-26621714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', freelancerPhone: '(11) 98888-1111', freelancerWhatsapp: '(11) 98888-1111', category: 'cozinha', date: daysAgo(12), hours: 7, freelancerFee: 380, platformFeePercentage: 5.0, platformFee: 19, total: 399, status: 'completed', createdAt: daysAgo(15), history: [{ status: 'requested', at: daysAgo(15) }, { status: 'confirmed', at: daysAgo(15) }, { status: 'paid', at: daysAgo(14) }, { status: 'checked_in', at: daysAgo(12) }, { status: 'completed', at: daysAgo(12) }], reviewFromEstablishment: { id: 'rv1', fromId: 'es1', fromName: 'Bar do Zé', toId: 'fl1', rating: 5, comment: 'Tigrão salvou nosso domingo. Brasa no ponto!', date: daysAgo(12) }, reviewFromFreelancer: { id: 'rv2', fromId: 'fl1', fromName: 'Marcos "Tigrão" Araújo', toId: 'es1', rating: 5, comment: 'Estrutura impecável, pagamento no mesmo dia.', date: daysAgo(12) } },
  { id: 'ct2', jobId: 'job2', establishmentId: 'es2', establishmentName: 'Casa de Eventos Lumière', freelancerId: 'fl4', freelancerName: 'Rafael "Rafa" Costa', freelancerPhoto: 'https://images.pexels.com/photos/19652091/pexels-photo-19652091.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', freelancerPhone: '(11) 95555-4444', freelancerWhatsapp: '(11) 95555-4444', category: 'bartender', date: daysAgo(3), hours: 8, freelancerFee: 340, platformFeePercentage: 0.0, platformFee: 0, total: 340, status: 'paid', createdAt: daysAgo(6), coraInvoiceId: 'cora-inv-002', history: [{ status: 'requested', at: daysAgo(6) }, { status: 'confirmed', at: daysAgo(5) }, { status: 'paid', at: daysAgo(3) }] },
];

export const SEED_WALLET_TXS: WalletTx[] = [
  { id: 'wt1', userId: 'fl1', type: 'escrow_release', amount: 380, description: 'Repasse do turno — Bar do Zé', contractId: 'ct1', date: daysAgo(12) },
  { id: 'wt2', userId: 'fl1', type: 'platform_fee', amount: -19, description: 'Taxa de intermediação FreelaAgora (5%)', contractId: 'ct1', date: daysAgo(12) },
  { id: 'wt3', userId: 'fl4', type: 'escrow_hold', amount: 0, description: 'Garantia retida — Casa de Eventos Lumière', contractId: 'ct2', date: daysAgo(3) },
  { id: 'wt4', userId: 'es1', type: 'escrow_hold', amount: -399, description: 'Pagamento em garantia — Marcos Tigrão', contractId: 'ct1', date: daysAgo(14) },
  { id: 'wt5', userId: 'es2', type: 'escrow_hold', amount: -340, description: 'Pagamento em garantia — Rafael Costa (0% taxa)', contractId: 'ct2', date: daysAgo(3) },
  { id: 'wt6', userId: 'admin1', type: 'platform_fee', amount: 19, description: 'Taxa de intermediação recebida — contrato ct1 (5%)', contractId: 'ct1', date: daysAgo(12) },
  { id: 'wt7', userId: 'es1', type: 'vip_charge_est', amount: -59.90, description: 'Assinatura VIP 2 (mensal)', date: daysAgo(30) },
  { id: 'wt8', userId: 'fl1', type: 'vip_charge', amount: -24.90, description: 'Assinatura VIP 2 (mensal)', date: daysAgo(30) },
  { id: 'wt9', userId: 'es2', type: 'vip_charge_est', amount: -119.90, description: 'Assinatura VIP 3 (mensal)', date: daysAgo(30) },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', userId: 'fl1', type: 'contract_update', title: 'Repasse realizado', body: 'Seu pagamento de R$ 380,00 foi liberado para sua carteira.', read: true, date: daysAgo(12), contractId: 'ct1' },
  { id: 'n2', userId: 'fl4', type: 'hire_request', title: 'Nova solicitação de contratação', body: 'Casa de Eventos Lumière quer te contratar. Confirme sua disponibilidade.', read: false, date: daysAgo(6), contractId: 'ct2' },
  { id: 'n3', userId: 'es2', type: 'contract_update', title: 'Freelancer confirmou disponibilidade', body: 'Rafael Costa confirmou. Realize o pagamento para liberar o contato.', read: false, date: daysAgo(5), contractId: 'ct2' },
  { id: 'n4', userId: 'admin1', type: 'payment', title: 'Taxa arrecadada', body: 'Taxa de intermediação de R$ 19,00 creditada (5%).', read: true, date: daysAgo(12), contractId: 'ct1' },
];

export const SEED_COUPONS = [
  { id: 'cp1', code: 'BEMVINDO10', discountPercentage: 10, isActive: true, createdAt: daysAgo(30) },
  { id: 'cp2', code: 'FREELA20', discountPercentage: 20, isActive: true, createdAt: daysAgo(15) },
  { id: 'cp3', code: 'VIPMAX15', discountPercentage: 15, isActive: true, createdAt: daysAgo(5) },
];

export const SEED_AUDIT_LOGS = [
  { id: 'al1', adminId: 'admin1', action: 'Sistema iniciado — dados de demonstração carregados', createdAt: daysAgo(120) },
];

export const initialData: AppData = {
  users: SEED_USERS,
  jobs: SEED_JOBS,
  contracts: SEED_CONTRACTS,
  walletTxs: SEED_WALLET_TXS,
  notifications: SEED_NOTIFICATIONS,
  reviews: [
    { id: 'rv1', fromId: 'es1', fromName: 'Bar do Zé', toId: 'fl1', rating: 5, comment: 'Tigrão salvou nosso domingo. Brasa no ponto!', date: daysAgo(12) },
    { id: 'rv2', fromId: 'fl1', fromName: 'Marcos "Tigrão" Araújo', toId: 'es1', rating: 5, comment: 'Estrutura impecável, pagamento no mesmo dia.', date: daysAgo(12) },
  ],
  coupons: SEED_COUPONS,
  adminAuditLogs: SEED_AUDIT_LOGS,
  config: { defaultFeePercent: 15.0 },
  paymentSettings: { activeProvider: 'asaas', configs: {} },
  currentUserId: null,
  vipPlans: VIP_PLANS,
  estVipPlans: EST_VIP_PLANS,
};
