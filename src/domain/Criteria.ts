export interface EvaluationCriterion{
    id: string;
    name: string;
    description: string;
    weight: number;
}

export interface DepartmentCriteria{
    departmentId: string;
    departmentName: string;
    criteria: EvaluationCriterion[];
}