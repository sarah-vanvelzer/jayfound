// Ranking weights: portfolio > puzzle > mentor
export const WEIGHTS = {
    portfolio: 0.6,
    puzzle: 0.3,
    mentor: 0.1,
};

export type Stage = {
    stage_type: "start" | "rough" | "final" | "lessons";
};

export type Project = {
    stages: Stage[];
};

export type PuzzleAttempt = {
    score: number;
};

export type MentorEndorsement = {
    mentor_name: string;
};

export type Profile = {
    projects: Project[];
    puzzle_attempts: PuzzleAttempt[];
    mentor_endorsements: MentorEndorsement[];
};

// Looks at every project stage, averages across all projects, & caps at 100
export function portfolioScore(profile: Profile): number {
    if (profile.projects.length === 0) return 0;

    const stageWeight: Record<Stage["stage_type"], number> = {
        start: 1,
        rough: 1,
        final: 1,
        lessons: 1.5 // reflection/lessons worth slightly more; reasoning signal
    };

    let totalStageScore = 0;
    for (const project of profile.projects) {
        for (const stage of project.stages) {
            totalStageScore += stageWeight[stage.stage_type];
        }
    }
    // Normalize average project depth
    // Capped so one giant project can't dominate
    const avgDepthPerProject = totalStageScore / profile.projects.length;
    const maxPossibleDepth = 1 + 1 + 1 + 1.5; // one of each stage type = fully staged project

    const normalized = avgDepthPerProject / maxPossibleDepth;

    return Math.round(Math.min(normalized, 1) * 1000) / 10; // score out of 100
}

// Averages all puzzle attempt scores
// If never touched arcade, returns 0 (not a penalty, just contributes nothing)
export function puzzleScore(profile: Profile): number {
    if (profile.puzzle_attempts.length === 0) return 0;

    const total = profile.puzzle_attempts.reduce(
        (sum, attempt) => sum + attempt.score,
        0
    );

    const average = total / profile.puzzle_attempts.length;

    return Math.min(average, 100); // safety cap at 100
}

export function mentorScore(profile: Profile): number {
    const count = profile.mentor_endorsements.length;
    if (count === 0) return 0;

    const pointsPerEndorsement = 25;
    const capped = Math.min(count, 4); // no extra credit beyond 4 endorsements

    return capped * pointsPerEndorsement; // max 100
}

export function rankScore(profile: Profile): number {
    const p = portfolioScore(profile);
    const q = puzzleScore(profile);
    const m = mentorScore(profile);

    const score = p * WEIGHTS.portfolio + q * WEIGHTS.puzzle + m * WEIGHTS.mentor;

    return Math.round(score * 10) / 10; // round to 1 decimal place
}