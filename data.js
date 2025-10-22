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
            schedule: this.createEmptySchedule(),
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

    // 빈 스케줄 생성
    createEmptySchedule() {
        const schedule = {};
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const timeSlots = this.getTimeSlots();

        days.forEach(day => {
            schedule[day] = {};
            timeSlots.forEach(time => {
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
}

// 전역 데이터 매니저 인스턴스
const dataManager = new DataManager();
