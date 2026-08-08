// ============================================================
// CATEGORIES — Full national catalog (Hyper-Comprehensive Edition)
// ============================================================
export const CATEGORIES: Category[] = [
  // ==========================================
  // 1. Alimentação e Gastronomia
  // ==========================================
  { id: 'cozinha', label: 'Cozinheiro(a) / Auxiliar de Cozinha', icon: 'ChefHat', color: '#f97316', macro: 'alimentacao' },
  { id: 'cozinheiro_executivo', label: 'Cozinheiro(a) Executivo / Chef de Cozinha', icon: 'ChefHat', color: '#c2410c', macro: 'alimentacao' },
  { id: 'sous_chef', label: 'Sous Chef / Coordenador de Cozinha', icon: 'ChefHat', color: '#ea580c', macro: 'alimentacao' },
  { id: 'cozinheiro_fria', label: 'Cozinheiro(a) de Cozinha Fria / Saladeria', icon: 'Salad', color: '#f97316', macro: 'alimentacao' },
  { id: 'garcom', label: 'Garçom / Garçonete', icon: 'Utensils', color: '#14b8a6', macro: 'alimentacao' },
  { id: 'garcom_vip', label: 'Garçom / Garçonete Bilíngue / Protocolo VIP', icon: 'Utensils', color: '#0d9488', macro: 'alimentacao' },
  { id: 'cumim', label: 'Cumim / Auxiliar de Salão', icon: 'Utensils', color: '#0f766e', macro: 'alimentacao' },
  { id: 'barista', label: 'Barista / Especialista em Cafés', icon: 'Coffee', color: '#a16207', macro: 'alimentacao' },
  { id: 'bartender', label: 'Bartender / Barman / Mixologista', icon: 'Wine', color: '#a855f7', macro: 'alimentacao' },
  { id: 'padeiro', label: 'Padeiro(a) Artesanal / Industrial', icon: 'Wheat', color: '#d4a373', macro: 'alimentacao' },
  { id: 'confeiteiro', label: 'Confeiteiro(a) / Cake Designer', icon: 'Cake', color: '#fb7185', macro: 'alimentacao' },
  { id: 'pizzaiolo', label: 'Pizzaiolo(a) / Forneiro', icon: 'Pizza', color: '#ef4444', macro: 'alimentacao' },
  { id: 'churrasqueiro', label: 'Churrasqueiro(a) / Mestre Braseiro', icon: 'Flame', color: '#ea580c', macro: 'alimentacao' },
  { id: 'acougueiro', label: 'Açougueiro(a) / Desossador(a)', icon: 'Beef', color: '#dc2626', macro: 'alimentacao' },
  { id: 'sushiman', label: 'Sushiman / Culinária Japonesa', icon: 'Fish', color: '#06b6d4', macro: 'alimentacao' },
  { id: 'atendente_lanchonete', label: 'Atendente de Lanchonete / Fast Food', icon: 'Sandwich', color: '#f97316', macro: 'alimentacao' },
  { id: 'passador_carnes', label: 'Passador de Carnes / Rodízio', icon: 'Beef', color: '#b91c1c', macro: 'alimentacao' },
  { id: 'sommelier', label: 'Sommelier / Especialista em Vinhos e Bebidas', icon: 'Wine', color: '#7c2d12', macro: 'alimentacao' },
  { id: 'mestre_cervejeiro', label: 'Mestre Cervejeiro / Auxiliar de Chopes', icon: 'Beer', color: '#d97706', macro: 'alimentacao' },
  { id: 'copeiro_restaurante', label: 'Copeiro(a) de Restaurante / Cozinha', icon: 'UtensilsCrossed', color: '#ea580c', macro: 'alimentacao' },
  { id: 'hostess', label: 'Host / Hostess / Recepção de Salão', icon: 'UserCheck', color: '#c2410c', macro: 'alimentacao' },
  { id: 'salgadeiro', label: 'Salgadeiro(a) / Produção de Massas', icon: 'Cookie', color: '#d97706', macro: 'alimentacao' },
  { id: 'gelateria', label: 'Sorveteiro(a) / Gelatier', icon: 'IceCream', color: '#ec4899', macro: 'alimentacao' },
  { id: 'chocolatier', label: 'Chocolatier / Especialista em Doces Finos', icon: 'Candy', color: '#78350f', macro: 'alimentacao' },

  // ==========================================
  // 2. Domésticos e Cuidados
  // ==========================================
  { id: 'baba', label: 'Babá / Cuidador(a) Infantil', icon: 'Baby', color: '#22c55e', macro: 'domesticos' },
  { id: 'baba_bilingue', label: 'Babá Bilíngue / Recém-Nascidos (Nursery Nurse)', icon: 'Baby', color: '#15803d', macro: 'domesticos' },
  { id: 'cuidador_idosos', label: 'Cuidador(a) de Idosos', icon: 'HeartHandshake', color: '#16a34a', macro: 'domesticos' },
  { id: 'cuidador_pcd', label: 'Cuidador(a) de Pessoas com Deficiência (PCD)', icon: 'Accessibility', color: '#047857', macro: 'domesticos' },
  { id: 'caseiro', label: 'Caseiro(a) / Casal de Caseiros', icon: 'Home', color: '#15803d', macro: 'domesticos' },
  { id: 'diarista', label: 'Diarista / Limpeza Residencial', icon: 'Sparkles', color: '#22c55e', macro: 'domesticos' },
  { id: 'faxineira_pesada', label: 'Faxineiro(a) Pós-Obra / Limpeza Pesada', icon: 'Hammer', color: '#16a34a', macro: 'domesticos' },
  { id: 'passadeiro', label: 'Passadeiro(a) de Roupas', icon: 'Shirt', color: '#65a30d', macro: 'domesticos' },
  { id: 'cozinheiro_domestico', label: 'Cozinheiro(a) Residencial Particular', icon: 'ChefHat', color: '#84cc16', macro: 'domesticos' },
  { id: 'jardineiro', label: 'Jardineiro(a) / Paisagista Residencial', icon: 'Trees', color: '#15803d', macro: 'domesticos' },
  { id: 'piscineiro', label: 'Piscineiro(a) / Tratamento de Água', icon: 'Waves', color: '#0891b2', macro: 'domesticos' },
  { id: 'pet_sitter', label: 'Pet Sitter / Passeador de Cães (Dog Walker)', icon: 'PawPrint', color: '#16a34a', macro: 'domesticos' },
  { id: 'governanta', label: 'Governanta Residencial (House Manager)', icon: 'ClipboardCheck', color: '#14532d', macro: 'domesticos' },
  { id: 'personal_organizer', label: 'Personal Organizer / Arrumador(a)', icon: 'LayoutGrid', color: '#15803d', macro: 'domesticos' },
  { id: 'lavadeira', label: 'Lavadeira / Lavador(a) de Roupas Finas', icon: 'Shirt', color: '#4ade80', macro: 'domesticos' },
  { id: 'motorista_particular', label: 'Motorista Particular / Familiar', icon: 'Car', color: '#0284c7', macro: 'domesticos' },

  // ==========================================
  // 3. Eventos, Entretenimento e Estética
  // ==========================================
  { id: 'promotor_eventos', label: 'Promotor(a) de Eventos / Feiras', icon: 'PartyPopper', color: '#ec4899', macro: 'eventos' },
  { id: 'recreador', label: 'Recreador(a) / Animador(a) Infantil', icon: 'PartyPopper', color: '#f472b6', macro: 'eventos' },
  { id: 'recepcionista', label: 'Recepcionista / Cerimonialista de Eventos', icon: 'ConciergeBell', color: '#f43f5e', macro: 'eventos' },
  { id: 'dj', label: 'DJ / Produtor Musical de Pista', icon: 'Music', color: '#8b5cf6', macro: 'eventos' },
  { id: 'sonoplasta', label: 'Sonoplasta / Técnico de Som de Eventos', icon: 'Volume2', color: '#7c3aed', macro: 'eventos' },
  { id: 'iluminador', label: 'Iluminador Cênico / Técnico de Luz', icon: 'Lightbulb', color: '#eab308', macro: 'eventos' },
  { id: 'fotografo', label: 'Fotógrafo(a) Profissional', icon: 'Camera', color: '#d946ef', macro: 'eventos' },
  { id: 'videomaker', label: 'Videomaker / Cinegrafista', icon: 'Video', color: '#c026d3', macro: 'eventos' },
  { id: 'montador_palco', label: 'Montador(a) de Palco / Roadie', icon: 'HardHat', color: '#f59e0b', macro: 'eventos' },
  { id: 'cabeleireiro', label: 'Cabeleireiro(a) / Colorista', icon: 'Scissors', color: '#be185d', macro: 'eventos' },
  { id: 'barbeiro', label: 'Barbeiro / Visagista', icon: 'Scissors', color: '#9f1239', macro: 'eventos' },
  { id: 'manicure', label: 'Manicure / Pedicure / Podóloga', icon: 'Hand', color: '#db2777', macro: 'eventos' },
  { id: 'maquiador', label: 'Maquiador(a) Profissional / Noivas', icon: 'Brush', color: '#e11d48', macro: 'eventos' },
  { id: 'produtor_executivo_eventos', label: 'Produtor(a) Executivo de Eventos', icon: 'ClipboardList', color: '#db2777', macro: 'eventos' },
  { id: 'valet_manobrista', label: 'Valet / Manobrista de Eventos', icon: 'Car', color: '#9d174d', macro: 'eventos' },
  { id: 'esteticista', label: 'Esteticista / Designer de Sobrancelhas', icon: 'Sparkles', color: '#f43f5e', macro: 'eventos' },
  { id: 'lash_designer', label: 'Lash Designer / Extensão de Cílios', icon: 'Eye', color: '#e11d48', macro: 'eventos' },
  { id: 'massagista_estetico', label: 'Massagista Estético(a) / Modeladora', icon: 'Heart', color: '#fb7185', macro: 'eventos' },
  { id: 'magico_animador', label: 'Mágico / Artista de Rua / Perna de Pau', icon: 'Sparkles', color: '#9333ea', macro: 'eventos' },
  { id: 'musico_banda', label: 'Músico(a) / Cantor(a) Solo / Banda de Baile', icon: 'Mic', color: '#7c3aed', macro: 'eventos' },

  // ==========================================
  // 4. Manutenção, Reformas e Emergências
  // ==========================================
  { id: 'montador_moveis', label: 'Montador(a) de Móveis', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'pintor', label: 'Pintor(a) Residencial e Comercial', icon: 'PaintRoller', color: '#ea580c', macro: 'manutencao' },
  { id: 'gesseiro', label: 'Gesseiro(a) / Instalador de Drywall', icon: 'Trowel', color: '#ca8a04', macro: 'manutencao' },
  { id: 'eletricista', label: 'Eletricista Residencial, Comercial e Predial', icon: 'Zap', color: '#eab308', macro: 'manutencao' },
  { id: 'encanador', label: 'Encanador(a) / Bombeiro Hidráulico', icon: 'Wrench', color: '#d97706', macro: 'manutencao' },
  { id: 'pedreiro', label: 'Pedreiro(a) / Azulejista / Ajudante', icon: 'Trowel', color: '#b45309', macro: 'manutencao' },
  { id: 'marceneiro', label: 'Marceneiro(a) / Projetados', icon: 'Hammer', color: '#92400e', macro: 'manutencao' },
  { id: 'serralheiro', label: 'Serralheiro(a) / Estruturas Metálicas', icon: 'Wrench', color: '#78350f', macro: 'manutencao' },
  { id: 'tecnico_ac', label: 'Técnico de Ar-Condicionado / Climatização', icon: 'Wind', color: '#0ea5e9', macro: 'manutencao' },
  { id: 'chaveiro', label: 'Chaveiro(a) Residencial e Automotivo', icon: 'Key', color: '#a16207', macro: 'manutencao' },
  { id: 'vidraceiro', label: 'Vidraceiro(a) / Esquadrias', icon: 'Square', color: '#0891b2', macro: 'manutencao' },
  { id: 'desentupidor', label: 'Desentupidor(a) Profissional / Hidrojato', icon: 'Waves', color: '#0d9488', macro: 'manutencao' },
  { id: 'engenheiro_civil', label: 'Engenheiro(a) Civil / Perito / Calculista', icon: 'Building', color: '#b45309', macro: 'manutencao' },
  { id: 'arquiteto', label: 'Arquiteto(a) / Urbanista / Interiores', icon: 'DraftingCompass', color: '#d97706', macro: 'manutencao' },
  { id: 'mestre_obras', label: 'Mestre de Obras / Apontador', icon: 'HardHat', color: '#78350f', macro: 'manutencao' },
  { id: 'impermeabilizador', label: 'Impermeabilizador(a) de Lajes e Piscinas', icon: 'Shield', color: '#0284c7', macro: 'manutencao' },
  { id: 'calheiro', label: 'Calheiro(a) / Instalação de Rufos', icon: 'Home', color: '#451a03', macro: 'manutencao' },
  { id: 'instalador_piso', label: 'Instalador(a) de Pisos Vinílicos, Laminados e Carpetes', icon: 'Layers', color: '#92400e', macro: 'manutencao' },
  { id: 'limpador_fachadas', label: 'Limpador(a) de Fachadas / Alpinista Predial', icon: 'Mountain', color: '#0369a1', macro: 'manutencao' },
  { id: 'tecnico_eletrodomesticos', label: 'Técnico de Conserto de Eletrodomésticos (Lavadoras/Geladeiras)', icon: 'Wrench', color: '#f59e0b', macro: 'manutencao' },
  { id: 'marmorista', label: 'Marmorista / Polidor(a) de Mármores e Granitos', icon: 'Square', color: '#78350f', macro: 'manutencao' },

  // ==========================================
  // 5. Varejo, Comércio e Atendimento
  // ==========================================
  { id: 'balconista', label: 'Balconista / Atendente de Loja', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'caixa', label: 'Operador(a) de Caixa / Frente de Loja', icon: 'Calculator', color: '#0d9488', macro: 'varejo' },
  { id: 'repositor', label: 'Repositor(a) de Mercadorias / Estoque', icon: 'PackageCheck', color: '#6d28d9', macro: 'varejo' },
  { id: 'panfleteiro', label: 'Panfleteiro(a) / Divulgador(a) de Rua', icon: 'Megaphone', color: '#2563eb', macro: 'varejo' },
  { id: 'fiscal_loja', label: 'Fiscal de Loja / Prevenção de Perdas', icon: 'ShieldCheck', color: '#1d4ed8', macro: 'varejo' },
  { id: 'inventariante', label: 'Inventariante / Auditor(a) de Estoque', icon: 'ClipboardList', color: '#1e40af', macro: 'varejo' },
  { id: 'promotor_vendas', label: 'Promotor(a) de Vendas / Merchandising', icon: 'TrendingUp', color: '#0284c7', macro: 'varejo' },
  { id: 'demonstrador', label: 'Demonstrador(a) de Produtos / Degustador(a)', icon: 'Store', color: '#0891b2', macro: 'varejo' },
  { id: 'empacotador', label: 'Empacotador(a) de Supermercado', icon: 'Package', color: '#7c3aed', macro: 'varejo' },
  { id: 'vendedor_temporario', label: 'Vendedor(a) Temporário(a) de Shopping', icon: 'UserCheck', color: '#2563eb', macro: 'varejo' },
  { id: 'atendente_telemarketing', label: 'Operador(a) de Telemarketing / Atendimento Receptivo', icon: 'Headphones', color: '#0891b2', macro: 'varejo' },
  { id: 'atendente_ecommerce', label: 'Atendente de E-commerce / Chat / Suporte Online', icon: 'MessageSquare', color: '#0284c7', macro: 'varejo' },

  // ==========================================
  // 6. Logística, Segurança e Serviços Gerais
  // ==========================================
  { id: 'motoboy', label: 'Motoboy / Entregador(a) com Moto', icon: 'Truck', color: '#eab308', macro: 'logistica' },
  { id: 'motorista_entregas', label: 'Motorista Entregador(a) de Carro / Van / Fiorino', icon: 'Car', color: '#3b82f6', macro: 'logistica' },
  { id: 'motorista_caminhao', label: 'Motorista de Caminhão (Toco, Truck, Carreta)', icon: 'Truck', color: '#1d4ed8', macro: 'logistica' },
  { id: 'carregador', label: 'Carregador / Chapa (Carga, Descarga e Mudanças)', icon: 'Package', color: '#6366f1', macro: 'logistica' },
  { id: 'seguranca', label: 'Segurança Privada / Guarda-Costas', icon: 'ShieldCheck', color: '#3b82f6', macro: 'logistica' },
  { id: 'vigilante_armado', label: 'Vigilante Armado / Escolta', icon: 'ShieldAlert', color: '#1e40af', macro: 'logistica' },
  { id: 'controlador_acesso', label: 'Controlador(a) de Acesso / Portaria', icon: 'DoorOpen', color: '#4f46e5', macro: 'logistica' },
  { id: 'portaria', label: 'Porteiro(a) / Vigia Noturno', icon: 'ConciergeBell', color: '#4338ca', macro: 'logistica' },
  { id: 'lavador_carros', label: 'Lavador(a) de Carros / Estética Automotiva', icon: 'Car', color: '#0ea5e9', macro: 'logistica' },
  { id: 'borracharia', label: 'Borrachiro(a) / Borracharia Móvel de Emergência', icon: 'Circle', color: '#1d4ed8', macro: 'logistica' },
  { id: 'mecanico_emergencia', label: 'Mecânico(a) de Emergência / Socorrista Automotivo', icon: 'Wrench', color: '#3730a3', macro: 'logistica' },
  { id: 'guincho', label: 'Operador(a) de Guincho / Reboque', icon: 'Truck', color: '#312e81', macro: 'logistica' },
  { id: 'auxiliar_logistica', label: 'Auxiliar de Logística / Expedição / Armazém', icon: 'Boxes', color: '#2563eb', macro: 'logistica' },
  { id: 'conferente_carga', label: 'Conferente de Carga e Notas Fiscais', icon: 'CheckSquare', color: '#1d4ed8', macro: 'logistica' },
  { id: 'operador_empilhadeira', label: 'Operador(a) de Empilhadeira Certificado(a)', icon: 'Truck', color: '#1e40af', macro: 'logistica' },
  { id: 'zelador', label: 'Zelador(a) Predial / Condomínios', icon: 'KeyRound', color: '#3b82f6', macro: 'logistica' },
  { id: 'auxiliar_limpeza_geral', label: 'Auxiliar de Limpeza Geral / Faxineiro(a) Comercial', icon: 'Sparkles', color: '#0284c7', macro: 'logistica' },

  // ==========================================
  // 7. Técnico, Saúde e Educação
  // ==========================================
  { id: 'ti', label: 'Suporte de TI / Infraestrutura / Redes', icon: 'Laptop', color: '#06b6d4', macro: 'tecnico' },
  { id: 'assistencia_tecnica', label: 'Assistência Técnica de Celulares, Tablets e Eletrônicos', icon: 'Smartphone', color: '#8b5cf6', macro: 'tecnico' },
  { id: 'enfermeiro', label: 'Enfermeiro(a) Particular / Home Care', icon: 'Stethoscope', color: '#7c3aed', macro: 'tecnico' },
  { id: 'tecnico_enfermagem', label: 'Técnico(a) em Enfermagem Plantonista', icon: 'Activity', color: '#6d28d9', macro: 'tecnico' },
  { id: 'fisioterapeuta', label: 'Fisioterapeuta Domiciliar / Ortopédico e Respiratório', icon: 'Activity', color: '#9333ea', macro: 'tecnico' },
  { id: 'massoterapeuta', label: 'Massoterapeuta / Terapeuta Holístico', icon: 'Hand', color: '#9333ea', macro: 'tecnico' },
  { id: 'acupunturista', label: 'Acupunturista / Quiropraxista', icon: 'Activity', color: '#7e22ce', macro: 'tecnico' },
  { id: 'personal_trainer', label: 'Personal Trainer / Educador(a) Físico', icon: 'Dumbbell', color: '#a855f7', macro: 'tecnico' },
  { id: 'professor_particular', label: 'Professor(a) Particular / Reforço Escolar / Idiomas', icon: 'GraduationCap', color: '#6d28d9', macro: 'tecnico' },
  { id: 'psicologo', label: 'Psicólogo(a) Clínico / Terapeuta', icon: 'HeartPulse', color: '#9333ea', macro: 'tecnico' },
  { id: 'fonoaudiologo', label: 'Fonoaudiólogo(a)', icon: 'Mic', color: '#6d28d9', macro: 'tecnico' },
  { id: 'nutricionista', label: 'Nutricionista Clínico / Esportivo Domiciliar', icon: 'Apple', color: '#059669', macro: 'tecnico' },
  { id: 'veterinario_homecare', label: 'Médico(a) Veterinário(a) Home Care / Pet', icon: 'Stethoscope', color: '#059669', macro: 'tecnico' },
  { id: 'tradutor_interpreter', label: 'Tradutor(a) / Intérprete Comercial e Juramentado', icon: 'Languages', color: '#4f46e5', macro: 'tecnico' },
  { id: 'programador_freelancer', label: 'Desenvolvedor(a) / Programador(a) Web e Apps', icon: 'Code', color: '#0891b2', macro: 'tecnico' },
  { id: 'designer_grafico', label: 'Designer Gráfico / UI/UX / Motion Designer', icon: 'Palette', color: '#7c3aed', macro: 'tecnico' },
  { id: 'social_media', label: 'Social Media / Gestor(a) de Tráfego Pago', icon: 'Share2', color: '#db2777', macro: 'tecnico' },
  { id: 'redactor_copywriter', label: 'Redator(a) / Copywriter / Revisor(a) de Texto', icon: 'FileText', color: '#2563eb', macro: 'tecnico' },
  { id: 'contador_freelancer', label: 'Contador(a) / Consultor(a) Fiscal e Tributário', icon: 'Calculator', color: '#0f766e', macro: 'tecnico' },
  { id: 'advogado_consultor', label: 'Advogado(a) Consultor(a) Freelancer', icon: 'Scale', color: '#1e3a8a', macro: 'tecnico' },
];
