// 데이터 관리 모듈
class DataManager {
    constructor() {
        this.teachers = this.loadTeachers();
        this.substituteRecords = this.loadSubstituteRecords();
    }

    // 교사 데이터 로드
    loadTeachers() {
        const stored = localStorage.getItem('teachers');
        return stored ? JSON.parse(stored) : [];
    }

    // 교사 데이터 저장
    saveTeachers() {
        localStorage.setItem('teachers', JSON.stringify(this.teachers));
    }

    // 보결 기록 로드
    loadSubstituteRecords() {
        const stored = localStorage.getItem('substituteRecords');
        return stored ? JSON.parse(stored) : [];
    }

    // 보결 기록 저장
    saveSubstituteRecords() {
        localStorage.setItem('substituteRecords', JSON.stringify(this.substituteRecords));
    }

    // 교사 추가
    addTeacher(teacherData) {
        const teacher = {
            id: this.generateId(),
            name: teacherData.name,
            type: teacherData.type,
            grade: teacherData.grade,
            class: teacherData.class || null,
            subject: teacherData.subject || null,
            schedule: teacherData.type === '교과전담교사' ? this.createEmptySchedule() : null,
            substituteHistory: {
                totalCount: 0,
                thisMonth: 0,
                lastMonth: 0,
                records: []
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.teachers.push(teacher);
        this.saveTeachers();
        return teacher;
    }

    // 교사 수정
    updateTeacher(id, teacherData) {
        const index = this.teachers.findIndex(teacher => teacher.id === id);
        if (index !== -1) {
            this.teachers[index] = {
                ...this.teachers[index],
                ...teacherData,
                updatedAt: new Date().toISOString()
            };
            this.saveTeachers();
            return this.teachers[index];
        }
        return null;
    }

    // 교사 삭제
    deleteTeacher(id) {
        const index = this.teachers.findIndex(teacher => teacher.id === id);
        if (index !== -1) {
            this.teachers.splice(index, 1);
            this.saveTeachers();
            return true;
        }
        return false;
    }

    // 교사 조회
    getTeacher(id) {
        return this.teachers.find(teacher => teacher.id === id);
    }

    // 모든 교사 조회
    getAllTeachers() {
        return this.teachers;
    }

    // 교사 검색
    searchTeachers(query) {
        if (!query) return this.teachers;
        
        const lowerQuery = query.toLowerCase();
        return this.teachers.filter(teacher => 
            teacher.name.toLowerCase().includes(lowerQuery) ||
            teacher.type.toLowerCase().includes(lowerQuery) ||
            teacher.grade.toLowerCase().includes(lowerQuery)
        );
    }

    // 교사 유형별 조회
    getTeachersByType(type) {
        return this.teachers.filter(teacher => teacher.type === type);
    }

    // 빈 스케줄 생성 (교과전담교사만)
    createEmptySchedule(teacherType = '교과전담교사') {
        const schedule = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const timeSlots = this.getTimeSlots();

        days.forEach(day => {
            schedule[day] = {};
            timeSlots.forEach(time => {
                // 교과전담교사는 기본적으로 보결가능
                schedule[day][time] = {
                    type: '보결가능',
                    target: null,
                    available: true
                };
            });
        });

        return schedule;
    }

    // ID 생성
    generateId() {
        return 'T' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 보결 기록 추가
    addSubstituteRecord(record) {
        const substituteRecord = {
            id: this.generateId(),
            teacherId: record.teacherId,
            date: record.date,
            time: record.time,
            class: record.class,
            reason: record.reason,
            createdAt: new Date().toISOString()
        };

        this.substituteRecords.push(substituteRecord);
        
        // 교사의 보결 기록 업데이트
        const teacher = this.getTeacher(record.teacherId);
        if (teacher) {
            teacher.substituteHistory.totalCount++;
            teacher.substituteHistory.thisMonth++;
            teacher.substituteHistory.records.push({
                date: record.date,
                time: record.time,
                class: record.class
            });
            this.saveTeachers();
        }

        this.saveSubstituteRecords();
        return substituteRecord;
    }

    // 보결 기록 삭제
    deleteSubstituteRecord(recordId) {
        const recordIndex = this.substituteRecords.findIndex(record => record.id === recordId);
        if (recordIndex === -1) {
            throw new Error('보결 기록을 찾을 수 없습니다.');
        }
        
        const record = this.substituteRecords[recordIndex];
        
        // 교사의 보결 기록에서도 제거
        const teacher = this.getTeacher(record.teacherId);
        if (teacher) {
            teacher.substituteHistory.totalCount = Math.max(0, teacher.substituteHistory.totalCount - 1);
            teacher.substituteHistory.thisMonth = Math.max(0, teacher.substituteHistory.thisMonth - 1);
            
            // 해당 기록을 교사 기록에서도 제거
            teacher.substituteHistory.records = teacher.substituteHistory.records.filter(r => 
                !(r.date === record.date && r.time === record.time && r.class === record.class)
            );
            this.saveTeachers();
        }
        
        this.substituteRecords.splice(recordIndex, 1);
        this.saveSubstituteRecords();
        return true;
    }

    // 보결 기록 수정
    updateSubstituteRecord(recordId, updatedData) {
        const recordIndex = this.substituteRecords.findIndex(record => record.id === recordId);
        if (recordIndex === -1) {
            throw new Error('보결 기록을 찾을 수 없습니다.');
        }

        const oldRecord = this.substituteRecords[recordIndex];
        const oldTeacher = this.getTeacher(oldRecord.teacherId);
        
        // 기존 교사의 보결 기록에서 제거
        if (oldTeacher) {
            oldTeacher.substituteHistory.totalCount = Math.max(0, oldTeacher.substituteHistory.totalCount - 1);
            oldTeacher.substituteHistory.thisMonth = Math.max(0, oldTeacher.substituteHistory.thisMonth - 1);
            
            oldTeacher.substituteHistory.records = oldTeacher.substituteHistory.records.filter(r => 
                !(r.date === oldRecord.date && r.time === oldRecord.time && r.class === oldRecord.class)
            );
        }

        // 새 교사의 보결 기록에 추가
        const newTeacher = this.getTeacher(updatedData.teacherId);
        if (newTeacher) {
            newTeacher.substituteHistory.totalCount++;
            newTeacher.substituteHistory.thisMonth++;
            newTeacher.substituteHistory.records.push({
                date: updatedData.date,
                time: updatedData.time,
                class: updatedData.class
            });
        }

        // 기록 업데이트
        this.substituteRecords[recordIndex] = {
            ...oldRecord,
            teacherId: updatedData.teacherId,
            date: updatedData.date,
            time: updatedData.time,
            class: updatedData.class,
            reason: updatedData.reason || '',
            updatedAt: new Date().toISOString()
        };

        this.saveSubstituteRecords();
        this.saveTeachers();
        return this.substituteRecords[recordIndex];
    }

    // 보결 기록 조회
    getSubstituteRecords(teacherId = null) {
        if (teacherId) {
            return this.substituteRecords.filter(record => record.teacherId === teacherId);
        }
        return this.substituteRecords;
    }

    // 통계 데이터 생성
    getStatistics() {
        const totalTeachers = this.teachers.length;
        const classTeachers = this.teachers.filter(t => t.type === '담임교사').length;
        const subjectTeachers = this.teachers.filter(t => t.type === '교과전담교사').length;
        
        const totalSubstitutes = this.substituteRecords.length;
        const thisMonthSubstitutes = this.substituteRecords.filter(record => {
            const recordDate = new Date(record.date);
            const now = new Date();
            return recordDate.getMonth() === now.getMonth() && 
                   recordDate.getFullYear() === now.getFullYear();
        }).length;

        return {
            totalTeachers,
            classTeachers,
            subjectTeachers,
            totalSubstitutes,
            thisMonthSubstitutes
        };
    }

    // 데이터 내보내기
    exportData() {
        return {
            teachers: this.teachers,
            substituteRecords: this.substituteRecords,
            exportedAt: new Date().toISOString()
        };
    }

    // 데이터 가져오기
    importData(data) {
        if (data.teachers) {
            this.teachers = data.teachers;
            this.saveTeachers();
        }
        if (data.substituteRecords) {
            this.substituteRecords = data.substituteRecords;
            this.saveSubstituteRecords();
        }
    }

    // 교사 일괄 추가
    bulkAddTeachers(teachersData) {
        const results = {
            success: [],
            errors: [],
            total: teachersData.length
        };

        teachersData.forEach((teacherData, index) => {
            try {
                // 유효성 검사
                const validation = this.validateBulkTeacherData(teacherData);
                if (!validation.isValid) {
                    results.errors.push({
                        index: index + 1,
                        data: teacherData,
                        error: validation.error
                    });
                    return;
                }

                // 교사 추가
                const teacher = this.addTeacher(teacherData);
                results.success.push(teacher);
            } catch (error) {
                results.errors.push({
                    index: index + 1,
                    data: teacherData,
                    error: error.message
                });
            }
        });

        return results;
    }

    // 일괄 추가 데이터 유효성 검사
    validateBulkTeacherData(teacherData) {
        // 이름 검사
        if (!teacherData.name || teacherData.name.trim().length < 2) {
            return {
                isValid: false,
                error: '교사명을 2자 이상 입력해주세요.'
            };
        }

        // 교사 유형 검사
        if (!teacherData.type || !['담임교사', '교과전담교사'].includes(teacherData.type)) {
            return {
                isValid: false,
                error: '교사 유형을 올바르게 입력해주세요. (담임교사 또는 교과전담교사)'
            };
        }

        // 담임교사인 경우 학년과 반 검사
        if (teacherData.type === '담임교사') {
            if (!teacherData.grade || !teacherData.grade.includes('학년')) {
                return {
                    isValid: false,
                    error: '담임교사는 학년을 올바르게 입력해주세요. (예: 3학년)'
                };
            }
            if (!teacherData.class || !teacherData.class.includes('반')) {
                return {
                    isValid: false,
                    error: '담임교사는 반을 올바르게 입력해주세요. (예: 2반)'
                };
            }
        }

        // 교과전담교사인 경우 과목 검사
        if (teacherData.type === '교과전담교사' && !teacherData.subject) {
            return {
                isValid: false,
                error: '교과전담교사는 담당 과목을 입력해주세요.'
            };
        }

        // 중복 이름 검사
        const existingTeacher = this.teachers.find(t => t.name === teacherData.name.trim());
        if (existingTeacher) {
            return {
                isValid: false,
                error: '이미 존재하는 교사명입니다.'
            };
        }

        return { isValid: true };
    }

    // 일괄 추가 데이터 파싱
    parseBulkTeachersData(inputText) {
        const lines = inputText.split('\n').filter(line => line.trim());
        const teachers = [];
        const errors = [];

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            const parts = trimmedLine.split(',').map(part => part.trim());
            
            if (parts.length < 2) {
                errors.push({
                    line: index + 1,
                    error: '형식이 올바르지 않습니다. 최소 2개의 필드가 필요합니다.'
                });
                return;
            }

            const teacherData = {
                name: parts[0],
                type: parts[1]
            };

            if (teacherData.type === '담임교사') {
                if (parts.length < 4) {
                    errors.push({
                        line: index + 1,
                        error: '담임교사는 학년과 반 정보가 필요합니다.'
                    });
                    return;
                }
                teacherData.grade = parts[2];
                teacherData.class = parts[3];
            } else if (teacherData.type === '교과전담교사') {
                if (parts.length < 3) {
                    errors.push({
                        line: index + 1,
                        error: '교과전담교사는 담당 과목 정보가 필요합니다.'
                    });
                    return;
                }
                teacherData.subject = parts[2];
                // 교과전담교사는 학년 정보가 있을 수 있음 (선택사항)
                if (parts.length > 3) {
                    teacherData.grade = parts[3];
                }
            } else {
                errors.push({
                    line: index + 1,
                    error: '교사 유형이 올바르지 않습니다. (담임교사 또는 교과전담교사)'
                });
                return;
            }

            teachers.push(teacherData);
        });

        return { teachers, errors };
    }

    // 데이터 초기화
    clearAllData() {
        this.teachers = [];
        this.substituteRecords = [];
        this.saveTeachers();
        this.saveSubstituteRecords();
    }

    // 시간대 조회
    getTimeSlots() {
        const stored = localStorage.getItem('timeSlots');
        return stored ? JSON.parse(stored) : [
            '09:00-09:40', '10:00-10:40', '11:00-11:40', '12:00-12:40',
            '13:00-13:40', '14:00-14:40', '15:00-15:40'
        ];
    }

    // 기존 담임교사 스케줄 제거 (담임교사는 스케줄을 가지지 않음)
    migrateClassTeacherSchedules() {
        const classTeachers = this.getTeachersByType('담임교사');
        let migratedCount = 0;

        classTeachers.forEach(teacher => {
            // 담임교사가 스케줄을 가지고 있다면 제거
            if (teacher.schedule) {
                this.updateTeacher(teacher.id, {
                    schedule: null
                });
                migratedCount++;
            }
        });

        if (migratedCount > 0) {
            Utils.showNotification(`${migratedCount}명의 담임교사 스케줄이 제거되었습니다. 담임교사는 교과전담교사의 전담수업 시간에만 자동으로 보결가능합니다.`, 'success');
        }

        return migratedCount;
    }

    // 데이터 마이그레이션 실행
    runDataMigration() {
        const migrationKey = 'schedule_migration_v2';
        const hasMigrated = localStorage.getItem(migrationKey);
        
        if (!hasMigrated) {
            const migratedCount = this.migrateClassTeacherSchedules();
            if (migratedCount > 0) {
                localStorage.setItem(migrationKey, 'true');
                console.log(`데이터 마이그레이션 완료: ${migratedCount}명의 담임교사 스케줄 업데이트`);
            }
        }
    }
}

// 전역 데이터 매니저 인스턴스
const dataManager = new DataManager();
