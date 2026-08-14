import { Candidate } from "../domain/Candidate";

export interface AiCandidateData{
    education?: string; 
    careerSummary?: string;
    qualifications?:string;
    selfPr?:string;
    motivation?:string;
    technicalExperience?:string;
    teamExperience?:string;
}

export class AiDataPolicy {
    createSafeCandidate(candidate: Candidate): AiCandidateData {
        return {
            education: this.sanitize(candidate.education),
            careerSummary: this.sanitize(candidate.careerSummary),
            qualifications: this.sanitize(candidate.qualifications),
            selfPr: this.sanitize(candidate.selfPr),
            motivation: this.sanitize(candidate.motivation),
            technicalExperience: this.sanitize(candidate.technicalExperience),
            teamExperience: this.sanitize(candidate.teamExperience),
        };
    }

    validate(data: AiCandidateData): void {
        const serialized = JSON.stringify(data);

        const forbiddenPatterns = [
            /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/i,
            /\b0\d{1,4}-\d{1,4}-\d{3,4}\b/,
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(serialized)) {
                throw new Error(
                    "AIへ送信できない可能性のある個人情報を検出しました。"
                );
            }
        }
    }

    private sanitize(value?: string): string | undefined {
        if (!value) {
            return undefined;
        }

        return value.trim();
    }
}