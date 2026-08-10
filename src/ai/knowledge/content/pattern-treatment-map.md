# Pattern Treatment Map — Pattern → Treatment-Principle Associations

**Pattern Treatment Map · Content Sprint · Authoring (v1).** Status:
**PROPOSED — PENDING REVIEW.** This is authored knowledge content for the
`patternTreatmentMap` relationship interface: the diagnosis→strategy relationship layer. Each
entry is a single reference **association** linking a diagnostic pattern identity (owned by
`diagnosisPatternCatalog`) to a treatment-principle identity (owned by
`formulaDefinitionCatalog`). It is not yet wired to the loader/registry/contract (a later
step).

**Entry model (per Doc 52 / representation Doc 54):** one association per line —
`- **<Pattern>** — <Treatment Principle>`. Both sides are references to canonical identities;
neither is restated or defined here.

**Association semantics:** an entry communicates only *"these two concepts are associated"*.
It does NOT communicate recommendation, ranking, priority, confidence, certainty, preferred
or best treatment, or deterministic routing. Relationships are many-to-many; cardinality
implies nothing about preference. The corpus contains no meaning, rationale, rankings,
weights, probabilities, formulas, herbs, diagnosis criteria, treatment guidance, workflow
logic, or decision procedures.

## Pattern → treatment-principle associations

- **Excess Heat** — Clear Heat
- **Excess Heat** — Clear Heat and Drain Fire
- **Excess Cold** — Warm the Interior
- **Deficiency Heat** — Clear Deficiency Heat
- **Deficiency Heat** — Nourish Yin
- **Deficiency Cold** — Tonify Yang
- **Deficiency Cold** — Warm the Interior
- **Qi Deficiency** — Tonify Qi
- **Qi Stagnation** — Regulate Qi
- **Qi Sinking** — Raise the Yang
- **Qi Sinking** — Tonify Qi
- **Qi Counterflow** — Direct Rebellious Qi Downward
- **Blood Deficiency** — Tonify Blood
- **Blood Stasis** — Invigorate the Blood and Dispel Stasis
- **Blood Heat** — Clear Heat and Cool the Blood
- **Blood Heat** — Cool the Blood and Stop Bleeding
- **Blood Cold** — Warm the Channels and Dispel Cold
- **Qi and Blood Deficiency** — Tonify Qi and Blood
- **Yin Deficiency** — Nourish Yin
- **Yang Deficiency** — Tonify Yang
- **Yin Collapse** — Nourish Yin
- **Yang Collapse** — Rescue Devastated Yang
- **Body Fluid Deficiency** — Generate Fluids and Moisten Dryness
- **Dampness** — Transform Dampness
- **Dampness** — Dry Dampness
- **Damp-Heat** — Clear Damp-Heat
- **Cold-Dampness** — Warm and Transform Water-Dampness
- **Cold-Dampness** — Dry Dampness
- **Phlegm-Dampness** — Dry Dampness and Transform Phlegm
- **Phlegm-Heat** — Clear Heat and Transform Phlegm
- **Phlegm-Fluids** — Warm and Transform Water-Dampness
- **Phlegm-Fluids** — Transform Phlegm
- **Water Retention** — Promote Urination and Drain Dampness
- **Water Retention** — Drive Out Water
- **Wind-Cold Invasion** — Release Wind-Cold
- **Wind-Heat Invasion** — Release Wind-Heat
- **Wind-Dampness Obstruction** — Dispel Wind-Dampness
- **Summerheat Invasion** — Clear Summerheat
- **Dryness Invasion** — Moisten the Lung
- **Dryness Invasion** — Generate Fluids and Moisten Dryness
- **Wind-Water** — Release the Exterior
- **Wind-Water** — Promote Urination and Drain Dampness
- **Lesser Yang Pattern** — Harmonize the Lesser Yang
- **Heat Entering the Nutritive Level** — Clear Heat and Cool the Blood
- **Heat Entering the Blood Level** — Clear Heat and Cool the Blood
- **Liver Wind** — Extinguish Internal Wind
- **Liver Wind** — Calm the Liver and Extinguish Wind
- **Liver Wind** — Nourish Yin and Extinguish Wind
- **Lung Qi Deficiency** — Tonify Qi
- **Lung Qi Deficiency** — Tonify the Lung
- **Lung Yin Deficiency** — Nourish Yin
- **Lung Yin Deficiency** — Moisten the Lung
- **Lung Heat** — Clear Heat
- **Lung Dryness** — Moisten the Lung
- **Phlegm-Damp Obstructing the Lung** — Dry Dampness and Transform Phlegm
- **Phlegm-Damp Obstructing the Lung** — Stop Cough and Calm Wheezing
- **Phlegm-Heat Obstructing the Lung** — Clear Heat and Transform Phlegm
- **Phlegm-Heat Obstructing the Lung** — Stop Cough and Calm Wheezing
- **Heart Qi Deficiency** — Tonify Qi
- **Heart Qi Deficiency** — Nourish the Heart and Calm the Spirit
- **Heart Yang Deficiency** — Tonify Yang
- **Heart Yang Deficiency** — Warm the Interior
- **Heart Blood Deficiency** — Tonify Blood
- **Heart Blood Deficiency** — Nourish the Heart and Calm the Spirit
- **Heart Yin Deficiency** — Nourish Yin
- **Heart Yin Deficiency** — Nourish the Heart and Calm the Spirit
- **Heart Fire Blazing** — Clear Heat and Drain Fire
- **Heart Blood Stasis** — Invigorate the Blood and Dispel Stasis
- **Phlegm Misting the Heart** — Transform Phlegm
- **Phlegm Misting the Heart** — Open the Orifices
- **Phlegm-Fire Harassing the Heart** — Clear Heat and Transform Phlegm
- **Phlegm-Fire Harassing the Heart** — Settle and Calm the Spirit
- **Spleen Qi Deficiency** — Strengthen the Spleen
- **Spleen Qi Deficiency** — Tonify Qi
- **Spleen Yang Deficiency** — Warm the Middle and Dispel Cold
- **Spleen Yang Deficiency** — Tonify Yang
- **Spleen Qi Sinking** — Raise the Yang
- **Spleen Failing to Control Blood** — Strengthen the Spleen
- **Spleen Failing to Control Blood** — Stop Bleeding
- **Cold-Dampness Encumbering the Spleen** — Strengthen the Spleen and Transform Dampness
- **Cold-Dampness Encumbering the Spleen** — Warm and Transform Water-Dampness
- **Liver Qi Stagnation** — Spread the Liver and Regulate Qi
- **Liver Blood Deficiency** — Tonify Blood
- **Liver Yin Deficiency** — Nourish Yin
- **Liver Fire Blazing** — Clear Heat and Drain Fire
- **Liver Yang Rising** — Calm the Liver and Extinguish Wind
- **Liver Yang Rising** — Nourish Yin
- **Cold Stagnation in the Liver Channel** — Warm the Channels and Dispel Cold
- **Cold Stagnation in the Liver Channel** — Regulate Qi
- **Damp-Heat in the Liver and Gallbladder** — Clear Damp-Heat
- **Liver-Spleen Disharmony** — Harmonize the Liver and Spleen
- **Liver-Stomach Disharmony** — Spread the Liver and Regulate Qi
- **Liver-Stomach Disharmony** — Harmonize the Stomach
- **Kidney Yang Deficiency** — Tonify Yang
- **Kidney Yang Deficiency** — Tonify the Kidney
- **Kidney Yin Deficiency** — Nourish Yin
- **Kidney Yin Deficiency** — Tonify the Kidney
- **Kidney Qi Deficiency** — Tonify the Kidney
- **Kidney Qi Deficiency** — Secure Essence
- **Kidney Essence Deficiency** — Tonify the Kidney
- **Kidney Failing to Grasp Qi** — Tonify the Kidney
- **Kidney Yang Deficiency with Water Overflow** — Warm and Transform Water-Dampness
- **Kidney Yang Deficiency with Water Overflow** — Promote Urination and Drain Dampness
- **Stomach Qi Deficiency** — Tonify Qi
- **Stomach Qi Deficiency** — Harmonize the Stomach
- **Stomach Yin Deficiency** — Nourish Yin
- **Stomach Yin Deficiency** — Generate Fluids and Moisten Dryness
- **Stomach Fire** — Clear Heat and Drain Fire
- **Stomach Cold** — Warm the Middle and Dispel Cold
- **Stomach Qi Counterflow** — Direct Rebellious Qi Downward
- **Stomach Qi Counterflow** — Harmonize the Stomach
- **Food Stagnation** — Reduce Food Stagnation
- **Damp-Heat in the Large Intestine** — Clear Damp-Heat
- **Intestinal Dryness** — Moisten the Intestines and Unblock the Bowels
- **Heat Accumulation in the Intestines** — Purge Heat Accumulation
- **Damp-Heat in the Bladder** — Clear Damp-Heat
- **Damp-Heat in the Bladder** — Promote Urination and Drain Dampness
- **Heart and Spleen Deficiency** — Tonify Qi and Blood
- **Heart and Spleen Deficiency** — Nourish the Heart and Calm the Spirit
- **Heart and Kidney Disharmony** — Nourish Yin
- **Heart and Kidney Disharmony** — Nourish the Heart and Calm the Spirit
- **Liver and Kidney Yin Deficiency** — Nourish Yin
- **Liver and Kidney Yin Deficiency** — Tonify the Kidney
- **Lung and Kidney Yin Deficiency** — Nourish Yin
- **Lung and Kidney Yin Deficiency** — Moisten the Lung
- **Spleen and Kidney Yang Deficiency** — Tonify Yang
- **Spleen and Kidney Yang Deficiency** — Warm the Middle and Dispel Cold
- **Lung and Spleen Qi Deficiency** — Tonify Qi
- **Lung and Spleen Qi Deficiency** — Strengthen the Spleen
