export interface QualificationSummary {
  by_date_start: string
  by_date_end: string
  fi_train_date: string
  fi_training_date_2: string
  bi_ref_date: string
  fi_3year_date: string
  fi_ref_date: string
}

export type QualificationSummaryPatch = Partial<QualificationSummary>
