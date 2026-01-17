-- Admin Dashboard Migration
-- Extends the existing schema for comprehensive platform analytics

-- ============================================
-- EXTEND USERS TABLE
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS generations_limit INTEGER DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_generation_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS source VARCHAR(100); -- 'organic', 'referral', 'paid_ad', etc.

-- ============================================
-- GENERATIONS TABLE (Site Generations Log)
-- ============================================
CREATE TABLE IF NOT EXISTS generations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  site_name TEXT,
  industry TEXT,
  template_used TEXT,
  modules_selected JSONB DEFAULT '[]',
  pages_generated INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  generation_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed', 'partial'
  error_log JSONB DEFAULT '[]',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  download_url TEXT,
  deployed_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_industry ON generations(industry);

-- ============================================
-- EXTENDED API USAGE TABLE
-- ============================================
-- Add columns if they don't exist
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS generation_id INTEGER REFERENCES generations(id);
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS api_name TEXT; -- 'claude', 'openai', 'stripe', 'ebay'
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS operation_type TEXT; -- 'site_generation', 'page_generation', 'rebuild_analysis'
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS call_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS model_used TEXT;
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE;
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE api_usage ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_generation ON api_usage(generation_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(call_date);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_name ON api_usage(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_success ON api_usage(success);

-- ============================================
-- SYSTEM ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_alerts (
  id SERIAL PRIMARY KEY,
  alert_type TEXT NOT NULL, -- 'error_spike', 'cost_warning', 'no_signups', 'performance', 'security'
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT,
  metric_name TEXT, -- which metric triggered this
  metric_value DECIMAL(15,4),
  threshold_value DECIMAL(15,4),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON system_alerts(created_at DESC);

-- ============================================
-- ALERT RULES CONFIGURATION
-- ============================================
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL, -- 'error_rate', 'daily_cost', 'signup_gap', 'gen_time'
  operator TEXT NOT NULL, -- 'gt', 'lt', 'eq', 'gte', 'lte'
  threshold DECIMAL(15,4) NOT NULL,
  time_window_hours INTEGER DEFAULT 24,
  severity TEXT DEFAULT 'warning',
  enabled BOOLEAN DEFAULT TRUE,
  notification_channels JSONB DEFAULT '["dashboard"]', -- ["dashboard", "email", "slack"]
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default alert rules
INSERT INTO alert_rules (name, description, metric, operator, threshold, time_window_hours, severity) VALUES
  ('High Error Rate', 'Alert when generation failure rate exceeds 10%', 'error_rate', 'gt', 10, 24, 'critical'),
  ('No Signups', 'Alert when no new signups in 48 hours', 'signup_gap_hours', 'gt', 48, 48, 'warning'),
  ('Cost Exceeds Revenue', 'Alert when monthly API costs exceed MRR', 'cost_revenue_ratio', 'gt', 1, 720, 'critical'),
  ('Slow Generations', 'Alert when average generation time exceeds 120 seconds', 'avg_gen_time_seconds', 'gt', 120, 24, 'warning'),
  ('API Error Spike', 'Alert when API errors spike above 5 per hour', 'api_errors_hourly', 'gt', 5, 1, 'warning')
ON CONFLICT DO NOTHING;

-- ============================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  segment TEXT DEFAULT 'all', -- 'all', 'free', 'paid', 'churned', 'inactive'
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  recipients_count INTEGER DEFAULT 0,
  opens_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  unsubscribes_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- EMAIL SENDS TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_user ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);

-- ============================================
-- INDUSTRY ANALYTICS (Pre-aggregated)
-- ============================================
CREATE TABLE IF NOT EXISTS industry_stats (
  id SERIAL PRIMARY KEY,
  industry TEXT NOT NULL,
  month DATE NOT NULL, -- First day of month
  generation_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  popular_modules JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(industry, month)
);

CREATE INDEX IF NOT EXISTS idx_industry_stats_industry ON industry_stats(industry);
CREATE INDEX IF NOT EXISTS idx_industry_stats_month ON industry_stats(month DESC);

-- ============================================
-- MODULE ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS module_stats (
  id SERIAL PRIMARY KEY,
  module_name TEXT NOT NULL,
  month DATE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  in_successful_generations INTEGER DEFAULT 0,
  in_failed_generations INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER DEFAULT 0,
  popular_with_industries JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_name, month)
);

CREATE INDEX IF NOT EXISTS idx_module_stats_name ON module_stats(module_name);
CREATE INDEX IF NOT EXISTS idx_module_stats_month ON module_stats(month DESC);

-- ============================================
-- TEMPLATE ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS template_stats (
  id SERIAL PRIMARY KEY,
  template_name TEXT NOT NULL,
  month DATE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_name, month)
);

-- ============================================
-- REFERRAL CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_percent INTEGER DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  reward_type TEXT DEFAULT 'free_generation',
  reward_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  total_revenue_generated DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON referral_codes(is_active);

-- ============================================
-- PLATFORM CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platform_config (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default platform configs
INSERT INTO platform_config (key, value, description) VALUES
  ('free_tier_limits', '{"generations_per_month": 3, "pages_per_generation": 5}', 'Free tier limits'),
  ('power_tier_limits', '{"generations_per_month": 20, "pages_per_generation": 15}', 'Power tier limits'),
  ('dealer_tier_limits', '{"generations_per_month": 100, "pages_per_generation": 50}', 'Dealer tier limits'),
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode toggle'),
  ('signup_enabled', '{"enabled": true}', 'Enable/disable new signups'),
  ('default_model', '{"model": "claude-sonnet-4-20250514"}', 'Default AI model for generations'),
  ('cost_alerts', '{"daily_threshold": 50, "monthly_threshold": 500}', 'Cost alert thresholds')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DATA QUALITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS data_quality_log (
  id SERIAL PRIMARY KEY,
  check_type TEXT NOT NULL, -- 'orphaned_records', 'invalid_emails', 'duplicate_users', etc.
  records_found INTEGER DEFAULT 0,
  records_fixed INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  run_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SYSTEM HEALTH SNAPSHOTS
-- ============================================
CREATE TABLE IF NOT EXISTS system_health (
  id SERIAL PRIMARY KEY,
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  db_connections INTEGER,
  db_pool_size INTEGER,
  active_users INTEGER, -- Currently active in last 5 min
  api_requests_minute INTEGER,
  avg_response_time_ms INTEGER,
  error_count_minute INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_health_created ON system_health(created_at DESC);

-- ============================================
-- DAILY STATS (Pre-computed for fast queries)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  -- User metrics
  new_signups INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  churned_users INTEGER DEFAULT 0,
  banned_users INTEGER DEFAULT 0,
  -- Generation metrics
  generations_started INTEGER DEFAULT 0,
  generations_completed INTEGER DEFAULT 0,
  generations_failed INTEGER DEFAULT 0,
  pages_generated INTEGER DEFAULT 0,
  avg_generation_time_ms INTEGER DEFAULT 0,
  -- Cost metrics
  total_api_cost DECIMAL(10,6) DEFAULT 0,
  claude_cost DECIMAL(10,6) DEFAULT 0,
  openai_cost DECIMAL(10,6) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  -- Revenue metrics
  new_subscriptions INTEGER DEFAULT 0,
  cancelled_subscriptions INTEGER DEFAULT 0,
  revenue_today DECIMAL(10,2) DEFAULT 0,
  mrr_snapshot DECIMAL(10,2) DEFAULT 0,
  -- Computed metrics
  success_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_generation DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- ============================================
-- FUNCTION: Compute Daily Stats
-- ============================================
CREATE OR REPLACE FUNCTION compute_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (
    date,
    new_signups,
    generations_started,
    generations_completed,
    generations_failed,
    pages_generated,
    avg_generation_time_ms,
    total_api_cost,
    total_tokens,
    input_tokens,
    output_tokens,
    success_rate,
    cost_per_generation
  )
  SELECT
    target_date,
    (SELECT COUNT(*) FROM users WHERE DATE(created_at) = target_date),
    (SELECT COUNT(*) FROM generations WHERE DATE(created_at) = target_date),
    (SELECT COUNT(*) FROM generations WHERE DATE(created_at) = target_date AND status = 'completed'),
    (SELECT COUNT(*) FROM generations WHERE DATE(created_at) = target_date AND status = 'failed'),
    (SELECT COALESCE(SUM(pages_generated), 0) FROM generations WHERE DATE(created_at) = target_date),
    (SELECT COALESCE(AVG(generation_time_ms), 0) FROM generations WHERE DATE(created_at) = target_date AND status = 'completed'),
    (SELECT COALESCE(SUM(cost), 0) FROM api_usage WHERE call_date = target_date OR DATE(timestamp) = target_date),
    (SELECT COALESCE(SUM(tokens_used), 0) FROM api_usage WHERE call_date = target_date OR DATE(timestamp) = target_date),
    (SELECT COALESCE(SUM(input_tokens), 0) FROM api_usage WHERE call_date = target_date OR DATE(timestamp) = target_date),
    (SELECT COALESCE(SUM(output_tokens), 0) FROM api_usage WHERE call_date = target_date OR DATE(timestamp) = target_date),
    (SELECT CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100)
    END FROM generations WHERE DATE(created_at) = target_date),
    (SELECT CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE COALESCE(SUM(total_cost), 0) / NULLIF(COUNT(*), 0)
    END FROM generations WHERE DATE(created_at) = target_date)
  ON CONFLICT (date) DO UPDATE SET
    new_signups = EXCLUDED.new_signups,
    generations_started = EXCLUDED.generations_started,
    generations_completed = EXCLUDED.generations_completed,
    generations_failed = EXCLUDED.generations_failed,
    pages_generated = EXCLUDED.pages_generated,
    avg_generation_time_ms = EXCLUDED.avg_generation_time_ms,
    total_api_cost = EXCLUDED.total_api_cost,
    total_tokens = EXCLUDED.total_tokens,
    input_tokens = EXCLUDED.input_tokens,
    output_tokens = EXCLUDED.output_tokens,
    success_rate = EXCLUDED.success_rate,
    cost_per_generation = EXCLUDED.cost_per_generation,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Check Alert Rules
-- ============================================
CREATE OR REPLACE FUNCTION check_alert_rules()
RETURNS void AS $$
DECLARE
  rule RECORD;
  current_value DECIMAL(15,4);
  should_alert BOOLEAN;
BEGIN
  FOR rule IN SELECT * FROM alert_rules WHERE enabled = TRUE LOOP
    should_alert := FALSE;

    -- Calculate current metric value based on rule.metric
    CASE rule.metric
      WHEN 'error_rate' THEN
        SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE
          (COUNT(*) FILTER (WHERE status = 'failed')::DECIMAL / COUNT(*) * 100)
        END INTO current_value
        FROM generations
        WHERE created_at >= NOW() - (rule.time_window_hours || ' hours')::INTERVAL;

      WHEN 'signup_gap_hours' THEN
        SELECT EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))/3600 INTO current_value
        FROM users;

      WHEN 'avg_gen_time_seconds' THEN
        SELECT COALESCE(AVG(generation_time_ms), 0) / 1000 INTO current_value
        FROM generations
        WHERE created_at >= NOW() - (rule.time_window_hours || ' hours')::INTERVAL
        AND status = 'completed';

      WHEN 'api_errors_hourly' THEN
        SELECT COUNT(*) INTO current_value
        FROM api_usage
        WHERE success = FALSE
        AND (timestamp >= NOW() - (rule.time_window_hours || ' hours')::INTERVAL
             OR call_date >= CURRENT_DATE - rule.time_window_hours/24);
      ELSE
        current_value := 0;
    END CASE;

    -- Check if threshold exceeded
    CASE rule.operator
      WHEN 'gt' THEN should_alert := current_value > rule.threshold;
      WHEN 'gte' THEN should_alert := current_value >= rule.threshold;
      WHEN 'lt' THEN should_alert := current_value < rule.threshold;
      WHEN 'lte' THEN should_alert := current_value <= rule.threshold;
      WHEN 'eq' THEN should_alert := current_value = rule.threshold;
      ELSE should_alert := FALSE;
    END CASE;

    -- Create alert if threshold exceeded
    IF should_alert THEN
      INSERT INTO system_alerts (alert_type, severity, title, message, metric_name, metric_value, threshold_value)
      VALUES (
        rule.metric,
        rule.severity,
        rule.name,
        rule.description || '. Current value: ' || current_value || ', Threshold: ' || rule.threshold,
        rule.metric,
        current_value,
        rule.threshold
      );

      UPDATE alert_rules SET last_triggered_at = NOW() WHERE id = rule.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL, -- 'user_banned', 'tier_changed', 'user_deleted', 'config_updated'
  target_type TEXT, -- 'user', 'generation', 'config', 'campaign'
  target_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
