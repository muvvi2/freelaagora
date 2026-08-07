-- Fix: set explicit search_path on calculate_contract_fees to prevent search_path injection
CREATE OR REPLACE FUNCTION public.calculate_contract_fees()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_fee_pct DECIMAL(4,2);
BEGIN
    SELECT vpe.intermediation_fee_percentage
    INTO v_fee_pct
    FROM establishment_profiles ep
    JOIN vip_plans_establishment vpe ON ep.vip_plan_id = vpe.id
    WHERE ep.user_id = NEW.establishment_id;

    NEW.platform_fee_percentage := COALESCE(v_fee_pct, 15.00);
    NEW.platform_fee_value := ROUND((NEW.total_freelancer_value * (NEW.platform_fee_percentage / 100)), 2);
    NEW.total_amount_paid := NEW.total_freelancer_value + NEW.platform_fee_value;
    RETURN NEW;
END;
$$;
