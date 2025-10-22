// 메인 애플리케이션 로직
class App {
    constructor() {
        this.currentTab = 'teachers';
        this.editingTeacherId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTeachers();
        this.updateUI();
    }

    bindEvents() {
        // 탭 전환
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // 교사 추가 버튼
        document.getElementById('add-teacher-btn').addEventListener('click', () => {
            this.showTeacherForm();
        });

        // 교사 폼 취소
        document.getElementById('cancel-teacher-btn').addEventListener('click', () => {
            this.hideTeacherForm();
        });

        // 교사 폼 제출
        document.getElementById('teacher-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTeacherSubmit();
        });

        // 교사 유형 변경
        document.getElementById('teacher-type').addEventListener('change', (e) => {
            this.handleTeacherTypeChange(e.target.value);
        });

        // 교사 검색
        document.getElementById('teacher-search').addEventListener('input', (e) => {
            this.searchTeachers(e.target.value);
        });
    }

    switchTab(tab) {
        // 모든 탭 비활성화
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 탭 활성화
        document.getElementById(tab).classList.add('active');
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.currentTab = tab;
        this.updateUI();
    }

    updateUI() {
        switch (this.currentTab) {
            case 'teachers':
                this.loadTeachers();
                break;
            case 'schedule':
                this.loadSchedule();
                break;
            case 'substitute':
                this.loadSubstitute();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
        }
    }

    // 교사 관리 관련 메서드들
    showTeacherForm() {
        document.getElementById('teacher-form').style.display = 'block';
        document.getElementById('add-teacher-btn').style.display = 'none';
        this.resetTeacherForm();
    }

    hideTeacherForm() {
        document.getElementById('teacher-form').style.display = 'none';
        document.getElementById('add-teacher-btn').style.display = 'inline-block';
        this.resetTeacherForm();
        this.editingTeacherId = null;
    }

    resetTeacherForm() {
        document.getElementById('teacher-form-element').reset();
        document.getElementById('grade-group').style.display = 'block';
        document.getElementById('class-group').style.display = 'none';
        document.getElementById('subject-group').style.display = 'none';
    }

    handleTeacherTypeChange(type) {
        const gradeGroup = document.getElementById('grade-group');
        const classGroup = document.getElementById('class-group');
        const subjectGroup = document.getElementById('subject-group');
        
        if (type === '담임교사') {
            gradeGroup.style.display = 'block';
            classGroup.style.display = 'block';
            subjectGroup.style.display = 'none';
            document.getElementById('teacher-grade').required = true;
            document.getElementById('teacher-class').required = true;
            document.getElementById('teacher-subject').required = false;
        } else if (type === '교과전담교사') {
            gradeGroup.style.display = 'none';
            classGroup.style.display = 'none';
            subjectGroup.style.display = 'block';
            document.getElementById('teacher-grade').required = false;
            document.getElementById('teacher-class').required = false;
            document.getElementById('teacher-subject').required = true;
        } else {
            gradeGroup.style.display = 'block';
            classGroup.style.display = 'none';
            subjectGroup.style.display = 'none';
            document.getElementById('teacher-grade').required = true;
            document.getElementById('teacher-class').required = false;
            document.getElementById('teacher-subject').required = false;
        }
    }

    handleTeacherSubmit() {
        const formData = Utils.collectFormData(document.getElementById('teacher-form-element'));
        
        // 유효성 검사
        if (!this.validateTeacherForm(formData)) {
            return;
        }

        try {
            if (this.editingTeacherId) {
                // 교사 수정
                const updatedTeacher = dataManager.updateTeacher(this.editingTeacherId, formData);
                if (updatedTeacher) {
                    Utils.showNotification('교사 정보가 수정되었습니다.', 'success');
                    this.hideTeacherForm();
                    this.loadTeachers();
                } else {
                    Utils.showNotification('교사 정보 수정에 실패했습니다.', 'error');
                }
            } else {
                // 교사 추가
                const newTeacher = dataManager.addTeacher(formData);
                Utils.showNotification('교사가 추가되었습니다.', 'success');
                this.hideTeacherForm();
                this.loadTeachers();
            }
        } catch (error) {
            console.error('Error handling teacher submit:', error);
            Utils.showNotification('오류가 발생했습니다.', 'error');
        }
    }

    validateTeacherForm(data) {
        let isValid = true;
        
        // 이름 검사
        if (!data.name || data.name.trim().length < 2) {
            this.showFieldError('teacher-name', '교사명을 2자 이상 입력해주세요.');
            isValid = false;
        }

        // 교사 유형 검사
        if (!data.type) {
            this.showFieldError('teacher-type', '교사 유형을 선택해주세요.');
            isValid = false;
        }

        // 담임교사인 경우 학년과 반 검사
        if (data.type === '담임교사') {
            if (!data.grade) {
                this.showFieldError('teacher-grade', '학년을 선택해주세요.');
                isValid = false;
            }
            if (!data.class) {
                this.showFieldError('teacher-class', '반을 선택해주세요.');
                isValid = false;
            }
        }

        // 교과전담교사인 경우 과목 검사 (학년은 선택사항)
        if (data.type === '교과전담교사' && !data.subject) {
            this.showFieldError('teacher-subject', '담당 과목을 선택해주세요.');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('error');
        
        // 기존 에러 메시지 제거
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 새 에러 메시지 추가
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.8rem';
        errorDiv.style.marginTop = '0.25rem';
        field.parentNode.appendChild(errorDiv);
    }

    loadTeachers() {
        const teachers = dataManager.getAllTeachers();
        this.renderTeachersTable(teachers);
    }

    renderTeachersTable(teachers) {
        const container = document.getElementById('teachers-table');
        
        if (teachers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>등록된 교사가 없습니다</h3>
                    <p>교사 추가 버튼을 클릭하여 교사를 등록해주세요.</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="teachers-table">
                <thead>
                    <tr>
                        <th>교사명</th>
                        <th>유형</th>
                        <th>학년/반</th>
                        <th>과목</th>
                        <th>보결 횟수</th>
                        <th>등록일</th>
                        <th>액션</th>
                    </tr>
                </thead>
                <tbody>
                    ${teachers.map(teacher => `
                        <tr>
                            <td>${teacher.name}</td>
                            <td>
                                <span class="teacher-type-badge ${teacher.type}">
                                    ${teacher.type}
                                </span>
                            </td>
                            <td>${teacher.type === '담임교사' ? `${teacher.grade} ${teacher.class || ''}` : (teacher.grade || '-')}</td>
                            <td>${teacher.subject || '-'}</td>
                            <td>${teacher.substituteHistory.totalCount}회</td>
                            <td>${Utils.formatDate(teacher.createdAt)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-edit" onclick="app.editTeacher('${teacher.id}')">
                                        수정
                                    </button>
                                    <button class="btn-delete" onclick="app.deleteTeacher('${teacher.id}')">
                                        삭제
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tableHTML;
    }

    searchTeachers(query) {
        const teachers = dataManager.searchTeachers(query);
        this.renderTeachersTable(teachers);
    }

    editTeacher(teacherId) {
        const teacher = dataManager.getTeacher(teacherId);
        if (!teacher) return;

        this.editingTeacherId = teacherId;
        this.showTeacherForm();

        // 폼에 데이터 채우기
        document.getElementById('teacher-name').value = teacher.name;
        document.getElementById('teacher-type').value = teacher.type;
        document.getElementById('teacher-grade').value = teacher.grade;
        
        if (teacher.class) {
            document.getElementById('teacher-class').value = teacher.class;
        }
        if (teacher.subject) {
            document.getElementById('teacher-subject').value = teacher.subject;
        }

        // 교사 유형에 따른 필드 표시
        this.handleTeacherTypeChange(teacher.type);
    }

    async deleteTeacher(teacherId) {
        const teacher = dataManager.getTeacher(teacherId);
        if (!teacher) return;

        const confirmed = await Utils.confirm(`'${teacher.name}' 교사를 삭제하시겠습니까?`);
        if (confirmed) {
            const success = dataManager.deleteTeacher(teacherId);
            if (success) {
                Utils.showNotification('교사가 삭제되었습니다.', 'success');
                this.loadTeachers();
            } else {
                Utils.showNotification('교사 삭제에 실패했습니다.', 'error');
            }
        }
    }

    // 스케줄 관리 탭 로딩
    loadSchedule() {
        if (scheduleManager) {
            scheduleManager.loadTeachers();
            scheduleManager.updateCalendar();
        }
        if (specialistScheduleManager) {
            specialistScheduleManager.loadSpecialists();
        }
        this.bindScheduleTabEvents();
    }

    bindScheduleTabEvents() {
        // 스케줄 탭 전환
        document.querySelectorAll('.schedule-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const scheduleType = e.target.dataset.scheduleType;
                this.switchScheduleTab(scheduleType);
            });
        });
    }

    switchScheduleTab(type) {
        // 모든 탭 비활성화
        document.querySelectorAll('.schedule-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.schedule-type-content').forEach(content => {
            content.classList.remove('active');
        });

        // 선택된 탭 활성화
        document.querySelector(`[data-schedule-type="${type}"]`).classList.add('active');
        document.getElementById(`${type}-schedule`).classList.add('active');
    }

    loadSubstitute() {
        if (statisticsManager) {
            statisticsManager.loadSubstituteRecords();
        }
    }

    loadStatistics() {
        if (statisticsManager) {
            statisticsManager.loadStatistics();
        }
    }
}

// 애플리케이션 초기화
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    scheduleManager = new ScheduleManager();
    statisticsManager = new StatisticsManager();
    specialistScheduleManager = new SpecialistScheduleManager();
    timeSlotsManager = new TimeSlotsManager();
});
