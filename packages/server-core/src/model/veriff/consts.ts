
export const veriffSuspiciousLabels: string[] = [
  'dob_differences_detected',
  'low_face_similarity_poor_document_image_sharpness',
  'low_face_similarity_poor_unknown_document_image_conditions',
  'low_face_similarity_document_face_not_clearly_visible',
  'low_face_similarity_image_quality_good',
  'possible_age_risk_young',
  'session_person_crosslinked_with_multiple_dobs',
  'session_person_crosslinked_with_multiple_names',
  'document_integration_level_crosslinked_with_suspicious_behaviour',
  'document_integration_level_crosslinked_with_multiple_declines',
  'document_integration_level_crosslinked_with_fraud',
  'document_integration_level_crosslinked_with_tampering',
  'document_holder_photo_crosslinked_with_multiple_dobs',
  'session_crosslinked_with_known_fraud',
  'session_crosslinked_with_person_and_document_photo_mismatch',
  'session_crosslinked_with_suspected_document_tampering',
  'session_crosslinked_with_suspicious_behaviour',
  'session_crosslinked_with_velocity_abuse',
  'session_face_related_to_a_session_with_potentially_different_data',
]

export const VERIFF_SUSPICIOUS_THRESHOLD = 0.05

export const VERIFF_ABUSE_TRESHOLD = 0.099

export const VERIFF_MISSED_RISK_LABEL = 'missed'

export const veriffUnsafeCateogries = ['person', 'document']
export const veriffAllCateogries = ['crosslinks', 'person', 'document']
