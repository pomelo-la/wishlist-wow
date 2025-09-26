-- Seed data for Pomelo Wishlist
-- Run with: psql -d pomelo_wishlist -f migrations/002_seed_data.sql

-- Insert sample users
INSERT INTO users (id, email, name, role, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'creator@pomelo.com', 'Maria Rodriguez', 'creator', true),
    ('550e8400-e29b-41d4-a716-446655440002', 'reviewer@pomelo.com', 'Carlos Silva', 'reviewer', true),
    ('550e8400-e29b-41d4-a716-446655440003', 'itmanager@pomelo.com', 'Ana Martinez', 'it_manager', true),
    ('550e8400-e29b-41d4-a716-446655440004', 'owner@pomelo.com', 'Diego Lopez', 'owner', true),
    ('550e8400-e29b-41d4-a716-446655440005', 'admin@pomelo.com', 'Sofia Torres', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample initiatives
INSERT INTO initiatives (
    id, title, summary, creator_id, status, category, vertical, countries, client, client_type,
    description, economic_impact_type, economic_impact_note,
    improve_onboarding, reduce_friction, enhance_security, improve_performance, add_new_features,
    innovation_level, systemic_risk
) VALUES
    (
        '650e8400-e29b-41d4-a716-446655440001',
        'Sistema de Autenticación Biométrica',
        'Implementación de autenticación biométrica para mejorar la seguridad y reducir fricción en el proceso de login',
        '550e8400-e29b-41d4-a716-446655440001',
        'draft',
        'performance',
        'banking',
        ARRAY['brazil', 'mexico'],
        'Banco Digital XYZ',
        'top_issuer',
        'Desarrollo de un sistema de autenticación biométrica que permita a los usuarios acceder a su cuenta usando huella dactilar o reconocimiento facial, reduciendo la dependencia de contraseñas tradicionales.',
        'significant',
        'Se estima una reducción del 30% en llamadas al call center por problemas de acceso',
        true, true, true, false, true,
        'incremental',
        'medium'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440002',
        'Cumplimiento LGPD Brasil',
        'Implementación de controles y procesos para cumplir con la Ley General de Protección de Datos de Brasil',
        '550e8400-e29b-41d4-a716-446655440002',
        'in_review',
        'regulatory',
        'banking',
        ARRAY['brazil'],
        'Multiple Clients',
        'major',
        'Desarrollo de herramientas y procesos para garantizar el cumplimiento de LGPD, incluyendo gestión de consentimiento, derecho al olvido y reportes de compliance.',
        'moderate',
        'Evitar multas regulatorias que pueden alcanzar el 2% del revenue anual',
        false, false, true, false, false,
        'parity',
        'high'
    ),
    (
        '650e8400-e29b-41d4-a716-446655440003',
        'API Gateway para Retail',
        'Implementación de API Gateway para gestionar todas las integraciones con merchants retail',
        '550e8400-e29b-41d4-a716-446655440001',
        'in_estimation',
        'value_prop',
        'retail',
        ARRAY['mexico', 'colombia'],
        'RetailCorp',
        'medium',
        'Desarrollo de un API Gateway centralizado que permita a los merchants retail integrar sus sistemas de manera más eficiente, con mejor monitoring y control de rate limiting.',
        'significant',
        'Potencial incremento del 25% en el volumen de transacciones procesadas',
        false, true, false, true, true,
        'disruptive',
        'low'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample messages
INSERT INTO messages (id, initiative_id, author_id, author_role, content, tags) VALUES
    (
        '750e8400-e29b-41d4-a716-446655440001',
        '650e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        'reviewer',
        'Esta iniciativa parece muy prometedora. ¿Han considerado el impacto en dispositivos más antiguos que no soporten biometría?',
        ARRAY['technical', 'compatibility']
    ),
    (
        '750e8400-e29b-41d4-a716-446655440002',
        '650e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        'creator',
        'Buen punto. Contemplamos mantener la autenticación tradicional como fallback para dispositivos legacy.',
        ARRAY['response', 'technical']
    ),
    (
        '750e8400-e29b-41d4-a716-446655440003',
        '650e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
        'it_manager',
        'El compliance con LGPD requiere cambios significativos en nuestra arquitectura de datos. Estimamos 8-12 semanas de desarrollo.',
        ARRAY['estimation', 'technical']
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample suggestions
INSERT INTO suggestions (id, initiative_id, field, suggested_value, rationale, confidence, status) VALUES
    (
        '850e8400-e29b-41d4-a716-446655440001',
        '650e8400-e29b-41d4-a716-446655440001',
        'innovation_level',
        'disruptive',
        'La implementación de biometría en el sector financiero brasileño puede ser considerada disruptiva dado el bajo nivel de adopción actual',
        8,
        'pending'
    ),
    (
        '850e8400-e29b-41d4-a716-446655440002',
        '650e8400-e29b-41d4-a716-446655440002',
        'systemic_risk',
        'blocker',
        'El incumplimiento de LGPD puede resultar en multas que comprometan la operación, debe ser tratado como riesgo bloqueante',
        9,
        'pending'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_logs (id, initiative_id, user_id, action, field, old_value, new_value) VALUES
    (
        '950e8400-e29b-41d4-a716-446655440001',
        '650e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        'create',
        'initiative',
        NULL,
        'Initiative created'
    ),
    (
        '950e8400-e29b-41d4-a716-446655440002',
        '650e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440002',
        'status_change',
        'status',
        'draft',
        'in_review'
    )
ON CONFLICT (id) DO NOTHING;