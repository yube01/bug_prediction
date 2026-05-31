export interface CommitFeatures {
  lines_added:         number
  lines_deleted:       number
  files_changed:       number
  churn_ratio:         number
  avg_complexity:      number
  num_methods:         number
  complexity_per_file: number
  test_files_changed:  number
  test_ratio:          number
  prior_bugs_author:   number
  commit_hour:         number
  day_of_week:         number
  is_weekend:          0 | 1
  is_night_commit:     0 | 1
  language_group:      'Python' | 'TypeScript'
  time_period:         '2018-2020' | '2021-2023' | '2024-2026'
}

export interface PredictionResponse {
  bug_probability:   number
  risk_level:        'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK'
  risk_icon:         string
  risk_score:        number
  recommendation:    string
  top_risk_factors:  string[]
}

export interface BatchResponse {
  total:       number
  high_risk:   number
  medium_risk: number
  low_risk:    number
  predictions: PredictionResponse[]
}

export interface HealthResponse {
  status:       'ok' | 'error'
  model_loaded: boolean
  version:      string
}

export interface ModelInfoResponse {
  model_type:      string
  training_data:   string
  test_auc:        number
  test_precision:  number
  test_recall:     number
  test_f1:         number
  top_predictor:   string
  features:        string[]
  languages:       string[]
  time_periods:    string[]
  risk_thresholds: { low: string; medium: string; high: string }
}