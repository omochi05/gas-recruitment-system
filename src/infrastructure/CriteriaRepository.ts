import type { DepartmentCriteria } from '../domain/Criteria';

export interface CriteriaRepository {
    findByDepartment(
        departmentId: string,
    ): DepartmentCriteria;
    
    findAll(): DepartmentCriteria[];
}