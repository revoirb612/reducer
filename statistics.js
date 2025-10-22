// 보결 검색 및 통계 관리 모듈
class StatisticsManager {
    constructor() {
        this.currentSearchCriteria = null;
        this.currentSortBy = 'name';
        this.currentFilter = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSubstituteRecords();
        this.loadStatistics();
        this.setupDateInputs();
    }

    bindEvents() {
        // 보결 요청 폼 제출
        document.getElementById('substitute-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchAvailableTeachers();
        });

        // 정렬 변경
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.currentSortBy = e.target.value;
            this.renderAvailableTeachers();
        });

        // 보결 기록 필터
        document.getElementById('record-teacher-filter').addEventListener('change', (e) => {
            this.filterRecords();
        });

        document.getElementById('record-month-filter').addEventListener('change', (e) => {
            this.filterRecords();
        });

        // 보결 기록 추가
        document.getElementById('add-substitute-record-btn').addEventListener('click', () => {
            this.showAddRecordForm();
        });

        // 통계 필터
        document.getElementById('stats-teacher-filter').addEventListener('change', (e) => {
            this.currentFilter.teacher = e.target.value;
            this.loadTeacherStats();
        });

        document.getElementById('stats-period-filter').addEventListener('change', (e) => {
            this.currentFilter.period = e.target.value;
            this.loadTeacherStats();
        });

        document.getElementById('stats-sort').addEventListener('change', (e) => {
            this.currentFilter.sort = e.target.value;
            this.loadTeacherStats();
        });

        // 데이터 내보내기 기능은 제거됨 (백업/복원 기능으로 대체)
    }

    setupDateInputs() {
        // 오늘 날짜를 기본값으로 설정
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('request-date').value = today;
        
        // 시간대 옵션 동적 생성
        this.loadTimeSlotOptions();
    }

    loadTimeSlotOptions() {
        const timeSelect = document.getElementById('request-time');
        if (!timeSelect) return;

        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (timeSelect.children.length > 1) {
            timeSelect.removeChild(timeSelect.lastChild);
        }

        // 시간대 옵션 추가
        const timeSlots = dataManager.getTimeSlots();
        timeSlots.forEach((timeSlot, index) => {
            const option = document.createElement('option');
            option.value = timeSlot;
            option.textContent = timeSlot;
            timeSelect.appendChild(option);
        });
    }

    searchAvailableTeachers() {
        const formData = Utils.collectFormData(document.getElementById('substitute-request-form'));
        
        // 디버깅: 폼 데이터 확인
        console.log('폼 데이터:', formData);
        
        if (!this.validateSearchForm(formData)) {
            return;
        }

        this.currentSearchCriteria = formData;
        
        // 요일 계산
        const date = new Date(formData.date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getDay()];

        // 보결 가능 교사 검색
        const availableTeachers = this.getAvailableTeachers(dayName, formData.time);
        
        this.renderSearchCriteria(formData);
        this.renderAvailableTeachers(availableTeachers);
        
        document.getElementById('available-teachers').style.display = 'block';
    }

    validateSearchForm(data) {
        // 기존 에러 메시지 모두 제거
        this.clearAllFieldErrors();
        
        let isValid = true;
        
        if (!data.date) {
            this.showFieldError('request-date', '날짜를 선택해주세요.');
            isValid = false;
        }
        
        if (!data.time) {
            this.showFieldError('request-time', '시간을 선택해주세요.');
            isValid = false;
        }
        
        if (!data.grade) {
            this.showFieldError('request-grade', '학년을 선택해주세요.');
            isValid = false;
        }
        
        if (!data.class) {
            this.showFieldError('request-class', '반을 선택해주세요.');
            isValid = false;
        }
        
        return isValid;
    }

    clearAllFieldErrors() {
        const form = document.getElementById('substitute-request-form');
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
        
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
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

    getAvailableTeachers(day, time) {
        const teachers = dataManager.getAllTeachers();
        const availableTeachers = [];
        
        console.log('검색 조건:', { day, time });
        
        const homeroomTeachers = teachers.filter(teacher => teacher.type === '담임교사');
        const specialistTeachers = teachers.filter(teacher => teacher.type === '교과전담교사');
        
        console.log('교과전담교사 목록:', specialistTeachers.map(t => t.name));
        
        // 1. 교과전담교사 중 보결가능한 교사 찾기 (전담수업 중이 아닌 경우만)
        specialistTeachers.forEach(specialist => {
            const specialistSchedule = specialist.schedule?.[day]?.[time];
            console.log(`${specialist.name}의 ${day} ${time} 스케줄:`, specialistSchedule);
            
            if (specialistSchedule && specialistSchedule.available && specialistSchedule.type !== '전담수업') {
                availableTeachers.push(specialist);
                console.log(`${specialist.name} 추가됨 (교과전담교사 보결 가능)`);
            }
        });
        
        // 2. 교과전담교사가 전담수업을 하는 학급의 담임교사 찾기
        specialistTeachers.forEach(specialist => {
            const specialistSchedule = specialist.schedule?.[day]?.[time];
            
            if (specialistSchedule && specialistSchedule.type === '전담수업') {
                console.log(`${specialist.name}가 전담수업 중 - 학급:`, specialistSchedule.classes);
                
                // 전담수업을 하는 학급들 찾기
                const teachingClasses = specialistSchedule.classes || [];
                teachingClasses.forEach(className => {
                    console.log(`학급 ${className}의 담임교사 찾는 중...`);
                    
                    // 해당 학급의 담임교사 찾기
                    const homeroomTeacher = homeroomTeachers.find(ht => {
                        const grade = ht.grade?.replace('학년', '');
                        const classNum = ht.class?.replace('반', '');
                        const teacherClass = `${grade}-${classNum}`;
                        console.log(`비교: ${teacherClass} === ${className}`);
                        return teacherClass === className;
                    });
                    
                    if (homeroomTeacher && !availableTeachers.includes(homeroomTeacher)) {
                        availableTeachers.push(homeroomTeacher);
                        console.log(`${homeroomTeacher.name} 추가됨 (${specialist.name}의 전담수업으로 인한 보결 가능)`);
                    }
                });
            }
        });
        
        console.log('최종 보결 가능 교사:', availableTeachers.map(t => t.name));
        return availableTeachers;
    }

    renderSearchCriteria(criteria) {
        const criteriaText = `${criteria.date} ${criteria.time} ${criteria.grade} ${criteria.class}`;
        document.getElementById('search-criteria').textContent = criteriaText;
    }

    renderAvailableTeachers(teachers) {
        const container = document.getElementById('available-teachers-list');
        
        if (teachers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>보결 가능한 교사가 없습니다</h3>
                    <p>해당 시간에 보결 가능한 교사가 없습니다.</p>
                </div>
            `;
            return;
        }

        // 정렬
        const sortedTeachers = this.sortTeachers(teachers, this.currentSortBy);
        
        const teachersHTML = sortedTeachers.map(teacher => {
            // 보결 가능한 이유 설명
            let reasonText = '';
            if (teacher.type === '담임교사') {
                reasonText = '담임교사 - 보결 가능 시간';
            } else if (teacher.type === '교과전담교사') {
                reasonText = '교과전담교사 - 전담수업 중';
            }
            
            return `
                <div class="teacher-card">
                    <div class="teacher-card-header">
                        <div class="teacher-card-name">${teacher.name}</div>
                        <div class="teacher-card-type ${teacher.type}">${teacher.type}</div>
                    </div>
                    <div class="teacher-card-reason">
                        <span class="reason-text">${reasonText}</span>
                    </div>
                    <div class="teacher-card-stats">
                        <div class="stat-item">
                            <div class="stat-label">학년/반</div>
                            <div class="stat-value">${teacher.grade} ${teacher.class || ''}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">총 보결</div>
                            <div class="stat-value">${teacher.substituteHistory.totalCount}회</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">이번 달</div>
                            <div class="stat-value">${teacher.substituteHistory.thisMonth}회</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">지난 달</div>
                            <div class="stat-value">${teacher.substituteHistory.lastMonth}회</div>
                        </div>
                    </div>
                    <div class="teacher-card-actions">
                        <button class="btn btn-primary btn-sm" onclick="statisticsManager.selectTeacher('${teacher.id}')">
                            선택
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = teachersHTML;
    }

    sortTeachers(teachers, sortBy) {
        switch (sortBy) {
            case 'name':
                return Utils.sortByString(teachers, 'name');
            case 'substitute-count':
                return Utils.sortByNumber(teachers, 'substituteHistory.totalCount', false);
            case 'this-month':
                return Utils.sortByNumber(teachers, 'substituteHistory.thisMonth', false);
            default:
                return teachers;
        }
    }

    selectTeacher(teacherId) {
        const teacher = dataManager.getTeacher(teacherId);
        if (!teacher) return;

        // 보결 기록 추가
        if (this.currentSearchCriteria) {
            this.addSubstituteRecord(teacherId, this.currentSearchCriteria);
        }
    }

    addSubstituteRecord(teacherId, criteria) {
        const record = {
            teacherId: teacherId,
            date: criteria.date,
            time: criteria.time,
            class: `${criteria.grade} ${criteria.class}`,
            reason: '보결 요청'
        };

        try {
            dataManager.addSubstituteRecord(record);
            Utils.showNotification('보결 기록이 추가되었습니다.', 'success');
            this.loadSubstituteRecords();
            this.loadStatistics();
        } catch (error) {
            console.error('Error adding substitute record:', error);
            Utils.showNotification('보결 기록 추가에 실패했습니다.', 'error');
        }
    }

    loadSubstituteRecords() {
        const records = dataManager.getSubstituteRecords();
        this.renderSubstituteRecords(records);
        this.updateRecordFilters();
    }

    renderSubstituteRecords(records) {
        const container = document.getElementById('substitute-records-list');
        
        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>보결 기록이 없습니다</h3>
                    <p>아직 등록된 보결 기록이 없습니다.</p>
                </div>
            `;
            return;
        }

        const recordsHTML = records.map(record => {
            const teacher = dataManager.getTeacher(record.teacherId);
            const teacherName = teacher ? teacher.name : '알 수 없음';
            
            return `
                <div class="record-item">
                    <div class="record-info">
                        <div class="record-teacher">${teacherName}</div>
                        <div class="record-details">${record.class} - ${record.time}</div>
                        <div class="record-date">${Utils.formatDate(record.date)}</div>
                    </div>
                    <div class="record-actions">
                        <button class="btn btn-secondary btn-sm" onclick="statisticsManager.editRecord('${record.id}')">
                            수정
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="statisticsManager.deleteRecord('${record.id}')">
                            삭제
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = recordsHTML;
    }

    deleteRecord(recordId) {
        if (Utils.confirm('정말로 이 보결 기록을 삭제하시겠습니까?')) {
            try {
                dataManager.deleteSubstituteRecord(recordId);
                Utils.showNotification('보결 기록이 삭제되었습니다.', 'success');
                this.loadSubstituteRecords();
            } catch (error) {
                console.error('보결 기록 삭제 실패:', error);
                Utils.showNotification('보결 기록 삭제에 실패했습니다.', 'error');
            }
        }
    }

    editRecord(recordId) {
        const record = dataManager.substituteRecords.find(r => r.id === recordId);
        if (!record) {
            Utils.showNotification('보결 기록을 찾을 수 없습니다.', 'error');
            return;
        }

        // 수정 폼 표시
        this.showEditRecordForm(record);
    }

    showEditRecordForm(record) {
        // 기존 추가 폼 숨기기
        const addForm = document.getElementById('add-record-form');
        if (addForm) {
            addForm.style.display = 'none';
        }

        // 수정 폼 생성 또는 표시
        let editForm = document.getElementById('edit-record-form');
        if (!editForm) {
            editForm = this.createEditRecordForm();
            document.getElementById('substitute-records-list').parentNode.appendChild(editForm);
        }

        // 폼 옵션 로드
        this.loadEditRecordFormOptions();

        // 폼 데이터 채우기
        document.getElementById('edit-record-teacher').value = record.teacherId;
        document.getElementById('edit-record-date').value = record.date;
        document.getElementById('edit-record-time').value = record.time;
        document.getElementById('edit-record-class').value = record.class;
        document.getElementById('edit-record-reason').value = record.reason || '';

        editForm.style.display = 'block';
        editForm.scrollIntoView({ behavior: 'smooth' });
    }

    createEditRecordForm() {
        const form = document.createElement('div');
        form.id = 'edit-record-form';
        form.className = 'record-form';
        form.style.display = 'none';
        
        form.innerHTML = `
            <h3>보결 기록 수정</h3>
            <form id="edit-record-form-content">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-record-teacher">교사</label>
                        <select id="edit-record-teacher" required>
                            <option value="">교사 선택</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-record-date">날짜</label>
                        <input type="date" id="edit-record-date" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-record-time">시간</label>
                        <select id="edit-record-time" required>
                            <option value="">시간 선택</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-record-class">학급</label>
                        <input type="text" id="edit-record-class" placeholder="예: 1-1" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="edit-record-reason">사유</label>
                    <input type="text" id="edit-record-reason" placeholder="보결 사유 (선택사항)">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">수정</button>
                    <button type="button" class="btn btn-secondary" onclick="statisticsManager.cancelEditRecord()">취소</button>
                </div>
            </form>
        `;

        // 폼 제출 이벤트
        form.querySelector('#edit-record-form-content').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateRecord(record.id);
        });

        return form;
    }

    updateRecord(recordId) {
        const formData = Utils.collectFormData(document.getElementById('edit-record-form-content'));
        
        if (!this.validateRecordForm(formData)) {
            return;
        }

        try {
            dataManager.updateSubstituteRecord(recordId, formData);
            Utils.showNotification('보결 기록이 수정되었습니다.', 'success');
            this.cancelEditRecord();
            this.loadSubstituteRecords();
        } catch (error) {
            console.error('보결 기록 수정 실패:', error);
            Utils.showNotification('보결 기록 수정에 실패했습니다.', 'error');
        }
    }

    cancelEditRecord() {
        const editForm = document.getElementById('edit-record-form');
        if (editForm) {
            editForm.style.display = 'none';
        }
    }

    loadEditRecordFormOptions() {
        // 교사 옵션 로드
        const teacherSelect = document.getElementById('edit-record-teacher');
        if (teacherSelect) {
            teacherSelect.innerHTML = '<option value="">교사 선택</option>';
            const teachers = dataManager.getAllTeachers();
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
        }

        // 시간 옵션 로드
        const timeSelect = document.getElementById('edit-record-time');
        if (timeSelect) {
            timeSelect.innerHTML = '<option value="">시간 선택</option>';
            const timeSlots = dataManager.getTimeSlots();
            timeSlots.forEach((timeSlot, index) => {
                const option = document.createElement('option');
                option.value = timeSlot;
                option.textContent = timeSlot;
                timeSelect.appendChild(option);
            });
        }
    }

    updateRecordFilters() {
        const teachers = dataManager.getAllTeachers();
        const teacherFilter = document.getElementById('record-teacher-filter');
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (teacherFilter.children.length > 1) {
            teacherFilter.removeChild(teacherFilter.lastChild);
        }
        
        // 교사 옵션 추가
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherFilter.appendChild(option);
        });
    }

    filterRecords() {
        const teacherFilter = document.getElementById('record-teacher-filter').value;
        const monthFilter = document.getElementById('record-month-filter').value;
        
        let records = dataManager.getSubstituteRecords();
        
        if (teacherFilter) {
            records = records.filter(record => record.teacherId === teacherFilter);
        }
        
        if (monthFilter) {
            const now = new Date();
            const targetMonth = monthFilter === 'this-month' ? now.getMonth() : 
                              monthFilter === 'last-month' ? now.getMonth() - 1 : null;
            
            if (targetMonth !== null) {
                records = records.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate.getMonth() === targetMonth;
                });
            }
        }
        
        this.renderSubstituteRecords(records);
    }

    deleteRecord(recordId) {
        // 보결 기록 삭제 로직 (dataManager에 구현 필요)
        Utils.showNotification('보결 기록 삭제 기능은 추후 구현됩니다.', 'info');
    }

    loadStatistics() {
        this.loadOverviewStats();
        this.loadTeacherStats();
        this.loadMonthlyChart();
        this.loadPatternAnalysis();
    }

    loadOverviewStats() {
        const stats = dataManager.getStatistics();
        
        document.getElementById('total-teachers').textContent = stats.totalTeachers;
        document.getElementById('this-month-substitutes').textContent = stats.thisMonthSubstitutes;
        document.getElementById('total-substitutes').textContent = stats.totalSubstitutes;
        
        document.getElementById('teachers-breakdown').textContent = 
            `담임 ${stats.classTeachers}명, 교과전담 ${stats.subjectTeachers}명`;
        
        document.getElementById('monthly-change').textContent = 
            `이번 달 ${stats.thisMonthSubstitutes}회`;
        
        document.getElementById('substitute-trend').textContent = 
            `총 ${stats.totalSubstitutes}회`;
    }

    loadTeacherStats() {
        const teachers = dataManager.getAllTeachers();
        let filteredTeachers = [...teachers];
        
        // 필터 적용
        if (this.currentFilter.teacher) {
            filteredTeachers = filteredTeachers.filter(t => t.id === this.currentFilter.teacher);
        }
        
        // 정렬
        const sortBy = this.currentFilter.sort || 'substitute-count';
        filteredTeachers = this.sortTeachers(filteredTeachers, sortBy);
        
        this.renderTeacherStats(filteredTeachers);
        this.updateStatsFilters();
    }

    renderTeacherStats(teachers) {
        const container = document.getElementById('teacher-stats-list');
        
        const statsHTML = teachers.map(teacher => `
            <div class="teacher-stat-item">
                <div class="teacher-stat-info">
                    <div class="teacher-stat-name">${teacher.name}</div>
                    <div class="teacher-stat-details">
                        ${teacher.type} | ${teacher.grade} ${teacher.class || ''} ${teacher.subject || ''}
                    </div>
                </div>
                <div class="teacher-stat-stats">
                    <div class="teacher-stat-stat">
                        <div class="teacher-stat-stat-label">총 보결</div>
                        <div class="teacher-stat-stat-value">${teacher.substituteHistory.totalCount}회</div>
                    </div>
                    <div class="teacher-stat-stat">
                        <div class="teacher-stat-stat-label">이번 달</div>
                        <div class="teacher-stat-stat-value">${teacher.substituteHistory.thisMonth}회</div>
                    </div>
                    <div class="teacher-stat-stat">
                        <div class="teacher-stat-stat-label">지난 달</div>
                        <div class="teacher-stat-stat-value">${teacher.substituteHistory.lastMonth}회</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = statsHTML;
    }

    updateStatsFilters() {
        const teachers = dataManager.getAllTeachers();
        const teacherFilter = document.getElementById('stats-teacher-filter');
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (teacherFilter.children.length > 1) {
            teacherFilter.removeChild(teacherFilter.lastChild);
        }
        
        // 교사 옵션 추가
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            teacherFilter.appendChild(option);
        });
    }

    loadMonthlyChart() {
        const records = dataManager.getSubstituteRecords();
        const monthlyData = this.calculateMonthlyData(records);
        this.renderMonthlyChart(monthlyData);
    }

    calculateMonthlyData(records) {
        const monthlyCounts = {};
        
        records.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        });
        
        return monthlyCounts;
    }

    renderMonthlyChart(data) {
        const container = document.getElementById('monthly-chart');
        
        if (Object.keys(data).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>데이터가 없습니다</h3>
                    <p>월별 보결 데이터가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        const maxCount = Math.max(...Object.values(data));
        const chartHTML = Object.entries(data)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => {
                const height = (count / maxCount) * 200;
                return `
                    <div class="chart-bar" style="height: ${height}px;">
                        <span>${count}</span>
                        <div class="chart-label">${month}</div>
                    </div>
                `;
            }).join('');
        
        container.innerHTML = chartHTML;
    }

    loadPatternAnalysis() {
        const records = dataManager.getSubstituteRecords();
        const teachers = dataManager.getAllTeachers();
        
        // 가장 많이 보결한 교사
        const teacherCounts = {};
        records.forEach(record => {
            teacherCounts[record.teacherId] = (teacherCounts[record.teacherId] || 0) + 1;
        });
        
        const topTeachers = Object.entries(teacherCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([teacherId, count]) => {
                const teacher = teachers.find(t => t.id === teacherId);
                return { name: teacher ? teacher.name : '알 수 없음', count };
            });
        
        // 보결이 많은 시간대
        const timeCounts = {};
        records.forEach(record => {
            timeCounts[record.time] = (timeCounts[record.time] || 0) + 1;
        });
        
        const busyTimes = Object.entries(timeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        // 보결이 많은 요일
        const dayCounts = {};
        records.forEach(record => {
            const date = new Date(record.date);
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayName = dayNames[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });
        
        const busyDays = Object.entries(dayCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        this.renderPatternAnalysis(topTeachers, busyTimes, busyDays);
    }

    renderPatternAnalysis(topTeachers, busyTimes, busyDays) {
        // 가장 많이 보결한 교사
        const topTeachersHTML = topTeachers.map(teacher => `
            <div class="pattern-item">
                <span class="pattern-item-name">${teacher.name}</span>
                <span class="pattern-item-count">${teacher.count}회</span>
            </div>
        `).join('');
        document.getElementById('top-substitute-teachers').innerHTML = topTeachersHTML;
        
        // 보결이 많은 시간대
        const busyTimesHTML = busyTimes.map(([time, count]) => `
            <div class="pattern-item">
                <span class="pattern-item-name">${time}</span>
                <span class="pattern-item-count">${count}회</span>
            </div>
        `).join('');
        document.getElementById('busy-time-slots').innerHTML = busyTimesHTML;
        
        // 보결이 많은 요일
        const busyDaysHTML = busyDays.map(([day, count]) => `
            <div class="pattern-item">
                <span class="pattern-item-name">${day}요일</span>
                <span class="pattern-item-count">${count}회</span>
            </div>
        `).join('');
        document.getElementById('busy-days').innerHTML = busyDaysHTML;
    }

    // 데이터 내보내기 메서드들은 제거됨 (백업/복원 기능으로 대체)

    showAddRecordForm() {
        // 보결 기록 추가 폼 표시 (추후 구현)
        Utils.showNotification('보결 기록 추가 폼은 추후 구현됩니다.', 'info');
    }
}

// 전역 통계 매니저 인스턴스
let statisticsManager;
