// src/audio/audio-decision-engine.js
import { AudioHistory } from './audio-history.js';
import { EVENT_TYPES } from '../core/event-types.js';

export const AudioDecisionEngine = {
    decide({ event, state, catalog, rules }) {
        const activeRules = rules || state.audio.scoringRules;
        const ranked = this.rank({ event, state, catalog, rules: activeRules });
        
        const chosen = ranked.find(r => r.eligible)?.asset ?? null;
        
        if (chosen) {
            const result = ranked.find(r => r.asset.id === chosen.id);
            console.log(`[AudioDecision] Chosen: ${chosen.id} for event ${event.type} (score: ${result.breakdown.total})`);
        } else {
            console.log(`[AudioDecision] No eligible asset for event ${event.type}`);
        }

        return chosen;
    },

    rank({ event, state, catalog, rules }) {
        const activeRules = rules || state.audio.scoringRules;
        const candidates = this.getCandidates(event, catalog);
        
        return candidates.map(asset => {
            const isEligible = this.isEligible(asset, event);
            const breakdown = this.calculateBreakdown(asset, event, state, activeRules);
            
            return {
                asset,
                eligible: isEligible,
                breakdown
            };
        }).sort((a, b) => {
            // Sort by eligibility first, then by total score
            if (a.eligible !== b.eligible) return b.eligible ? 1 : -1;
            return b.breakdown.total - a.breakdown.total;
        });
    },

    calculateBreakdown(asset, event, state, rules) {
        const reasons = [];
        let contextScore = 0;
        let recencyScore = 0;
        let intensityScore = 0;

        // Context Score
        const contextResults = this.scoreByContext(asset, event, state, rules);
        contextScore = contextResults.score;
        reasons.push(...contextResults.reasons);

        // Recency Score
        const recencyResults = this.scoreByRecency(asset, rules);
        recencyScore = recencyResults.score;
        reasons.push(...recencyResults.reasons);

        // Intensity Score
        const intensityResults = this.scoreByIntensity(asset, event, state, rules);
        intensityScore = intensityResults.score;
        reasons.push(...intensityResults.reasons);

        return {
            context: contextScore,
            recency: recencyScore,
            intensity: intensityScore,
            total: contextScore + recencyScore + intensityScore,
            reasons
        };
    },

    getCandidates(event, catalog) {
        return catalog.filter(asset => asset.enabled && asset.eventTypes.includes(event.type));
    },

    isEligible(asset, event) {
        if (AudioHistory.wasRecentlyPlayed(asset.id, asset.cooldownMs)) return false;
        return true;
    },

    scoreByContext(asset, event, state, rules) {
        let score = 0;
        const reasons = [];
        const r = rules.context;

        if (event.type === EVENT_TYPES.SCORE_MADE) {
            if (event.payload?.value === 3) {
                score += r.scoreMade.threePointBonus;
                reasons.push({ key: 'scoreMade.threePointBonus', value: r.scoreMade.threePointBonus, label: 'Cesta de 3 pontos' });
            }
            if (state.derived.clutch) {
                if (asset.tags.includes('clutch')) {
                    score += r.scoreMade.clutchTagBonus;
                    reasons.push({ key: 'scoreMade.clutchTagBonus', value: r.scoreMade.clutchTagBonus, label: 'Tag clutch em momento clutch' });
                }
            }
            if (state.derived.scoreDiff <= 6) {
                score += r.scoreMade.closeGameBonus;
                reasons.push({ key: 'scoreMade.closeGameBonus', value: r.scoreMade.closeGameBonus, label: 'Jogo equilibrado (diff <= 6)' });
            }
        }

        if (event.type === EVENT_TYPES.SHOT_MISSED) {
            if (asset.tags.includes('fun')) {
                score += r.shotMissed.funTagBonus;
                reasons.push({ key: 'shotMissed.funTagBonus', value: r.shotMissed.funTagBonus, label: 'Tag divertida para erro' });
            }
        }

        if (event.type === EVENT_TYPES.PERIOD_END) {
            if (asset.tags.includes('official')) {
                score += r.periodEnd.officialTagBonus;
                reasons.push({ key: 'periodEnd.officialTagBonus', value: r.periodEnd.officialTagBonus, label: 'Som oficial para fim de período' });
            }
        }

        if (event.type === EVENT_TYPES.GAME_END) {
            if (asset.tags.includes('official')) {
                score += r.gameEnd.officialTagBonus;
                reasons.push({ key: 'gameEnd.officialTagBonus', value: r.gameEnd.officialTagBonus, label: 'Som oficial para fim de jogo' });
            }
        }

        if (event.type === EVENT_TYPES.FOUL_PERSONAL) {
            if (event.payload?.isExclusion) {
                if (asset.tags.includes('official')) {
                    score += r.foulPersonal.exclusionOfficialBonus;
                    reasons.push({ key: 'foulPersonal.exclusionOfficialBonus', value: r.foulPersonal.exclusionOfficialBonus, label: 'Som oficial para exclusão' });
                }
            } else {
                score += r.foulPersonal.regularFoulPenalty;
                reasons.push({ key: 'foulPersonal.regularFoulPenalty', value: r.foulPersonal.regularFoulPenalty, label: 'Penalidade: Falta comum (silenciar)' });
            }
        }

        if (event.type === EVENT_TYPES.TIMEOUT) {
            if (asset.tags.includes('official')) {
                score += r.timeout.officialTagBonus;
                reasons.push({ key: 'timeout.officialTagBonus', value: r.timeout.officialTagBonus, label: 'Som oficial para timeout' });
            }
        }

        return { score, reasons };
    },

    scoreByRecency(asset, rules) {
        const r = rules.recency;
        const repeated = AudioHistory.getRecentRepeats(asset.id, r.recentWindow);
        
        if (repeated > 0) {
            const penalty = repeated * r.repeatPenaltyPerOccurrence;
            return {
                score: penalty,
                reasons: [{ key: 'recency.repeatPenalty', value: penalty, label: `Penalidade por repetição (${repeated}x)` }]
            };
        } else {
            return {
                score: r.noRepeatBonus,
                reasons: [{ key: 'recency.noRepeatBonus', value: r.noRepeatBonus, label: 'Bônus: Sem repetição recente' }]
            };
        }
    },

    scoreByIntensity(asset, event, state, rules) {
        const r = rules.intensity;
        let score = 0;
        const reasons = [];

        if (event.type === EVENT_TYPES.PERIOD_END || event.type === EVENT_TYPES.GAME_END) {
            if (asset.intensity >= 4) {
                score += r.highIntensityPeriodEndBonus;
                reasons.push({ key: 'intensity.highIntensityPeriodEndBonus', value: r.highIntensityPeriodEndBonus, label: 'Alta intensidade no final' });
            } else {
                score += r.lowIntensityPeriodEndPenalty;
                reasons.push({ key: 'intensity.lowIntensityPeriodEndPenalty', value: r.lowIntensityPeriodEndPenalty, label: 'Penalidade: Baixa intensidade no final' });
            }
            return { score, reasons };
        }
        
        if (state.derived.clutch) {
            if (asset.intensity >= 4) {
                score += r.highIntensityClutchBonus;
                reasons.push({ key: 'intensity.highIntensityClutchBonus', value: r.highIntensityClutchBonus, label: 'Alta intensidade em momento decisivo' });
            }
        } else if (asset.intensity === 3) {
            score += r.mediumIntensityDefaultBonus;
            reasons.push({ key: 'intensity.mediumIntensityDefaultBonus', value: r.mediumIntensityDefaultBonus, label: 'Preferência por intensidade média' });
        }
        
        return { score, reasons };
    }
};
