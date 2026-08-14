import { Candidate } from '../domain/Candidate';

export interface CandidateRepository {
    findByKey(candidateKey: string): Candidate;
    findAll(): Candidate[];
}