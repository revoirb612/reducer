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
        
        // 데이터 마이그레이션 실행
        dataManager.runDataMigration();
        
        // 동적 옵션 생성
        this.updateDynamicOptions();
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

        // 교사 일괄 추가 버튼
        document.getElementById('bulk-add-teachers-btn').addEventListener('click', () => {
            this.showBulkAddModal();
        });

        // 일괄 추가 모달 닫기
        document.getElementById('close-bulk-add-modal').addEventListener('click', () => {
            this.hideBulkAddModal();
        });

        document.getElementById('cancel-bulk-add-btn').addEventListener('click', () => {
            this.hideBulkAddModal();
        });

        // 일괄 추가 미리보기
        document.getElementById('preview-bulk-teachers-btn').addEventListener('click', () => {
            this.previewBulkTeachers();
        });

        // 일괄 추가 실행
        document.getElementById('save-bulk-teachers-btn').addEventListener('click', () => {
            this.saveBulkTeachers();
        });

        // 데이터 백업 버튼
        document.getElementById('backup-data-btn').addEventListener('click', () => {
            this.showBackupModal();
        });

        // 데이터 복원 버튼
        document.getElementById('restore-data-btn').addEventListener('click', () => {
            this.showRestoreModal();
        });

        // 백업 모달 이벤트
        document.getElementById('close-backup-modal').addEventListener('click', () => {
            this.hideBackupModal();
        });

        document.getElementById('cancel-backup-btn').addEventListener('click', () => {
            this.hideBackupModal();
        });

        document.getElementById('download-backup-btn').addEventListener('click', () => {
            this.downloadBackup();
        });

        // 복원 모달 이벤트
        document.getElementById('close-restore-modal').addEventListener('click', () => {
            this.hideRestoreModal();
        });

        document.getElementById('cancel-restore-btn').addEventListener('click', () => {
            this.hideRestoreModal();
        });

        document.getElementById('backup-file-input').addEventListener('change', (e) => {
            this.handleBackupFileSelect(e);
        });

        document.getElementById('confirm-restore-btn').addEventListener('click', () => {
            this.confirmRestore();
        });

        // 데이터 초기화 이벤트
        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.showClearDataModal();
        });

        document.getElementById('close-clear-data-modal').addEventListener('click', () => {
            this.hideClearDataModal();
        });

        document.getElementById('cancel-clear-btn').addEventListener('click', () => {
            this.hideClearDataModal();
        });

        document.getElementById('confirm-clear-text').addEventListener('input', (e) => {
            this.handleClearConfirmInput(e);
        });

        document.getElementById('confirm-clear-btn').addEventListener('click', () => {
            this.confirmClearData();
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
                    // 동적 옵션 업데이트
                    this.updateDynamicOptions();
                } else {
                    Utils.showNotification('교사 정보 수정에 실패했습니다.', 'error');
                }
            } else {
                // 교사 추가
                const newTeacher = dataManager.addTeacher(formData);
                Utils.showNotification('교사가 추가되었습니다.', 'success');
                this.hideTeacherForm();
                this.loadTeachers();
                // 동적 옵션 업데이트
                this.updateDynamicOptions();
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

    // 동적 옵션 업데이트
    updateDynamicOptions() {
        Utils.updateTeacherFormOptions();
        Utils.updateSubstituteFormOptions();
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

    // 스케줄 관리 탭 로딩 (교과전담교사 전용)
    loadSchedule() {
        if (specialistScheduleManager) {
            specialistScheduleManager.loadSpecialists();
        }
    }

    // 스케줄 탭 로직 제거됨 - 교과전담교사 전용으로 단순화

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

    // 교사 일괄 추가 관련 메서드들
    showBulkAddModal() {
        document.getElementById('bulk-add-modal').style.display = 'block';
        document.getElementById('bulk-teachers-input').value = '';
        document.getElementById('bulk-preview').style.display = 'none';
        document.getElementById('save-bulk-teachers-btn').disabled = true;
    }

    hideBulkAddModal() {
        document.getElementById('bulk-add-modal').style.display = 'none';
        document.getElementById('bulk-teachers-input').value = '';
        document.getElementById('bulk-preview').style.display = 'none';
        document.getElementById('save-bulk-teachers-btn').disabled = true;
    }

    previewBulkTeachers() {
        const inputText = document.getElementById('bulk-teachers-input').value.trim();
        if (!inputText) {
            Utils.showNotification('교사 정보를 입력해주세요.', 'error');
            return;
        }

        try {
            // 데이터 파싱
            const parseResult = dataManager.parseBulkTeachersData(inputText);
            
            if (parseResult.errors.length > 0) {
                this.showBulkPreviewErrors(parseResult.errors);
                return;
            }

            // 유효성 검사 및 미리보기 생성
            this.showBulkPreview(parseResult.teachers);
        } catch (error) {
            console.error('Error parsing bulk teachers data:', error);
            Utils.showNotification('데이터 파싱 중 오류가 발생했습니다.', 'error');
        }
    }

    showBulkPreview(teachersData) {
        const previewContainer = document.getElementById('bulk-preview-content');
        const preview = document.getElementById('bulk-preview');
        
        let validCount = 0;
        let invalidCount = 0;
        let previewHTML = '';

        teachersData.forEach((teacherData, index) => {
            const validation = dataManager.validateBulkTeacherData(teacherData);
            const isValid = validation.isValid;
            
            if (isValid) {
                validCount++;
            } else {
                invalidCount++;
            }

            previewHTML += `
                <div class="bulk-preview-item ${isValid ? 'valid' : 'invalid'}">
                    <div class="teacher-name">${teacherData.name}</div>
                    <div class="teacher-type ${teacherData.type}">${teacherData.type}</div>
                    <div class="teacher-details">
                        ${teacherData.type === '담임교사' 
                            ? `${teacherData.grade} ${teacherData.class}` 
                            : teacherData.subject
                        }
                        ${teacherData.type === '교과전담교사' && teacherData.grade 
                            ? ` (${teacherData.grade})` 
                            : ''
                        }
                    </div>
                    <div class="validation-status ${isValid ? 'valid' : 'invalid'}">
                        <div class="validation-icon ${isValid ? 'valid' : 'invalid'}">
                            ${isValid ? '✓' : '✗'}
                        </div>
                        ${isValid ? '유효' : validation.error}
                    </div>
                </div>
            `;
        });

        previewContainer.innerHTML = previewHTML + `
            <div class="bulk-preview-summary">
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">총 교사:</span>
                        <span class="stat-value">${teachersData.length}명</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">유효:</span>
                        <span class="stat-value valid">${validCount}명</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">오류:</span>
                        <span class="stat-value invalid">${invalidCount}명</span>
                    </div>
                </div>
            </div>
        `;

        preview.style.display = 'block';
        
        // 유효한 교사가 있을 때만 저장 버튼 활성화
        document.getElementById('save-bulk-teachers-btn').disabled = validCount === 0;
    }

    showBulkPreviewErrors(errors) {
        const previewContainer = document.getElementById('bulk-preview-content');
        const preview = document.getElementById('bulk-preview');
        
        let errorHTML = '<div class="bulk-preview-item invalid"><div class="validation-status invalid">파싱 오류가 발생했습니다:</div></div>';
        
        errors.forEach(error => {
            errorHTML += `
                <div class="bulk-preview-item invalid">
                    <div class="teacher-name">${error.line}번째 줄</div>
                    <div class="validation-status invalid">
                        <div class="validation-icon invalid">✗</div>
                        ${error.error}
                    </div>
                </div>
            `;
        });

        previewContainer.innerHTML = errorHTML;
        preview.style.display = 'block';
        document.getElementById('save-bulk-teachers-btn').disabled = true;
    }

    saveBulkTeachers() {
        const inputText = document.getElementById('bulk-teachers-input').value.trim();
        if (!inputText) {
            Utils.showNotification('교사 정보를 입력해주세요.', 'error');
            return;
        }

        try {
            // 데이터 파싱
            const parseResult = dataManager.parseBulkTeachersData(inputText);
            
            if (parseResult.errors.length > 0) {
                Utils.showNotification('파싱 오류가 있습니다. 미리보기를 먼저 확인해주세요.', 'error');
                return;
            }

            // 일괄 추가 실행
            const results = dataManager.bulkAddTeachers(parseResult.teachers);
            
            if (results.success.length > 0) {
                Utils.showNotification(`${results.success.length}명의 교사가 추가되었습니다.`, 'success');
                this.hideBulkAddModal();
                this.loadTeachers();
            }
            
            if (results.errors.length > 0) {
                Utils.showNotification(`${results.errors.length}명의 교사 추가에 실패했습니다.`, 'error');
            }
        } catch (error) {
            console.error('Error saving bulk teachers:', error);
            Utils.showNotification('교사 일괄 추가 중 오류가 발생했습니다.', 'error');
        }
    }

    // 데이터 백업 관련 메서드들
    showBackupModal() {
        document.getElementById('backup-modal').style.display = 'block';
    }

    hideBackupModal() {
        document.getElementById('backup-modal').style.display = 'none';
    }

    downloadBackup() {
        try {
            const filename = dataManager.exportAllData();
            Utils.showNotification(`백업 파일이 다운로드되었습니다: ${filename}`, 'success');
            this.hideBackupModal();
        } catch (error) {
            console.error('Error downloading backup:', error);
            Utils.showNotification('백업 파일 다운로드 중 오류가 발생했습니다.', 'error');
        }
    }

    showRestoreModal() {
        document.getElementById('restore-modal').style.display = 'block';
        document.getElementById('backup-file-input').value = '';
        document.getElementById('restore-preview').style.display = 'none';
        document.getElementById('confirm-restore-btn').disabled = true;
    }

    hideRestoreModal() {
        document.getElementById('restore-modal').style.display = 'none';
        document.getElementById('backup-file-input').value = '';
        document.getElementById('restore-preview').style.display = 'none';
        document.getElementById('confirm-restore-btn').disabled = true;
    }

    handleBackupFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            document.getElementById('restore-preview').style.display = 'none';
            document.getElementById('confirm-restore-btn').disabled = true;
            return;
        }

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            Utils.showNotification('JSON 파일을 선택해주세요.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                const preview = dataManager.generateBackupPreview(backupData);
                
                if (preview.valid) {
                    this.showRestorePreview(preview);
                    this.currentBackupData = backupData;
                    document.getElementById('confirm-restore-btn').disabled = false;
                } else {
                    Utils.showNotification(preview.message, 'error');
                    document.getElementById('restore-preview').style.display = 'none';
                    document.getElementById('confirm-restore-btn').disabled = true;
                }
            } catch (error) {
                Utils.showNotification('파일을 읽는 중 오류가 발생했습니다.', 'error');
                document.getElementById('restore-preview').style.display = 'none';
                document.getElementById('confirm-restore-btn').disabled = true;
            }
        };
        reader.readAsText(file);
    }

    showRestorePreview(preview) {
        const previewContent = document.getElementById('restore-preview-content');
        const previewDiv = document.getElementById('restore-preview');
        
        previewContent.innerHTML = `
            <div class="restore-preview-info">
                <div class="preview-item">
                    <strong>앱 이름:</strong> ${preview.appName}
                </div>
                <div class="preview-item">
                    <strong>버전:</strong> ${preview.version}
                </div>
                <div class="preview-item">
                    <strong>백업 일시:</strong> ${Utils.formatDate(preview.exportedAt)}
                </div>
                <div class="preview-item">
                    <strong>교사 수:</strong> ${preview.teachers}명
                </div>
                <div class="preview-item">
                    <strong>보결 기록:</strong> ${preview.substituteRecords}건
                </div>
                <div class="preview-item">
                    <strong>시간대 설정:</strong> ${preview.timeSlots}개
                </div>
            </div>
        `;
        
        previewDiv.style.display = 'block';
    }

    async confirmRestore() {
        if (!this.currentBackupData) {
            Utils.showNotification('복원할 데이터가 없습니다.', 'error');
            return;
        }

        const confirmed = await Utils.confirm(
            '현재 저장된 모든 데이터가 덮어쓰여집니다. 정말로 복원하시겠습니까?'
        );
        
        if (confirmed) {
            try {
                const result = dataManager.restoreFromBackup(this.currentBackupData);
                
                if (result.success) {
                    Utils.showNotification(result.message, 'success');
                    this.hideRestoreModal();
                    
                    // UI 새로고침
                    this.loadTeachers();
                    if (statisticsManager) {
                        statisticsManager.loadStatistics();
                    }
                    if (specialistScheduleManager) {
                        specialistScheduleManager.loadSpecialists();
                    }
                } else {
                    Utils.showNotification(result.message, 'error');
                }
            } catch (error) {
                console.error('Error restoring backup:', error);
                Utils.showNotification('데이터 복원 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 데이터 초기화 관련 메서드들
    showClearDataModal() {
        document.getElementById('clear-data-modal').style.display = 'block';
        document.getElementById('confirm-clear-text').value = '';
        document.getElementById('confirm-clear-btn').disabled = true;
    }

    hideClearDataModal() {
        document.getElementById('clear-data-modal').style.display = 'none';
        document.getElementById('confirm-clear-text').value = '';
        document.getElementById('confirm-clear-btn').disabled = true;
    }

    handleClearConfirmInput(event) {
        const confirmText = event.target.value;
        const confirmBtn = document.getElementById('confirm-clear-btn');
        
        if (confirmText === '초기화') {
            confirmBtn.disabled = false;
        } else {
            confirmBtn.disabled = true;
        }
    }

    async confirmClearData() {
        const confirmed = await Utils.confirm(
            '정말로 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!'
        );
        
        if (confirmed) {
            try {
                dataManager.clearAllData();
                Utils.showNotification('모든 데이터가 초기화되었습니다.', 'success');
                this.hideClearDataModal();
                
                // UI 새로고침
                this.loadTeachers();
                if (statisticsManager) {
                    statisticsManager.loadStatistics();
                }
                if (specialistScheduleManager) {
                    specialistScheduleManager.loadSpecialists();
                }
            } catch (error) {
                console.error('Error clearing data:', error);
                Utils.showNotification('데이터 초기화 중 오류가 발생했습니다.', 'error');
            }
        }
    }
}

// 애플리케이션 초기화
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    // scheduleManager 제거 - 담임교사 스케줄 관리 기능 제거됨
    statisticsManager = new StatisticsManager();
    specialistScheduleManager = new SpecialistScheduleManager();
    timeSlotsManager = new TimeSlotsManager();
    
    // 교과전담교사 목록 초기 로드
    specialistScheduleManager.loadSpecialists();
});
