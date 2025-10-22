// 교과전담교사 중심 스케줄 관리 모듈
class SpecialistScheduleManager {
    constructor() {
        this.currentSpecialist = null;
        this.timeSlots = this.loadTimeSlots();
        this.init();
    }

    loadTimeSlots() {
        const stored = localStorage.getItem('timeSlots');
        return stored ? JSON.parse(stored) : [
            '09:00-09:40', '10:00-10:40', '11:00-11:40', '12:00-12:40',
            '13:00-13:40', '14:00-14:40', '15:00-15:40'
        ];
    }

    updateTimeSlots(newTimeSlots) {
        this.timeSlots = newTimeSlots;
        if (this.currentSpecialist) {
            this.renderSpecialistScheduleGrid();
        }
    }

    init() {
        this.bindEvents();
        this.loadSpecialists();
    }

    bindEvents() {
        // 교과전담교사 선택
        const specialistSelect = document.getElementById('specialist-select');
        if (specialistSelect) {
            specialistSelect.addEventListener('change', (e) => {
                this.selectSpecialist(e.target.value);
            });
        }

        // 스케줄 수정 버튼
        const editBtn = document.getElementById('edit-specialist-schedule-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.showSpecialistScheduleForm();
            });
        }

        // 스케줄 저장
        const saveBtn = document.getElementById('save-specialist-schedule-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSpecialistSchedule();
            });
        }

        // 스케줄 취소
        const cancelBtn = document.getElementById('cancel-specialist-schedule-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideSpecialistScheduleForm();
            });
        }
    }

    loadSpecialists() {
        const specialists = dataManager.getTeachersByType('교과전담교사');
        const select = document.getElementById('specialist-select');
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // 교과전담교사 옵션 추가
        specialists.forEach(specialist => {
            const option = document.createElement('option');
            option.value = specialist.id;
            option.textContent = `${specialist.name} (${specialist.subject})`;
            select.appendChild(option);
        });
    }

    selectSpecialist(specialistId) {
        if (!specialistId) {
            this.currentSpecialist = null;
            this.hideSpecialistInfo();
            this.hideSpecialistScheduleForm();
            document.getElementById('edit-specialist-schedule-btn').disabled = true;
            return;
        }

        this.currentSpecialist = dataManager.getTeacher(specialistId);
        if (this.currentSpecialist) {
            // 스케줄 데이터 초기화 (없는 경우)
            if (!this.currentSpecialist.schedule) {
                this.currentSpecialist.schedule = dataManager.createEmptySchedule();
            }
            this.showSpecialistInfo();
            document.getElementById('edit-specialist-schedule-btn').disabled = false;
        }
    }

    showSpecialistInfo() {
        const specialist = this.currentSpecialist;
        if (!specialist) return;

        document.getElementById('selected-specialist-name').textContent = specialist.name;
        document.getElementById('selected-specialist-subject').textContent = specialist.subject;
        
        document.getElementById('specialist-info').style.display = 'block';
    }

    hideSpecialistInfo() {
        document.getElementById('specialist-info').style.display = 'none';
    }

    showSpecialistScheduleForm() {
        if (!this.currentSpecialist) return;

        document.getElementById('specialist-schedule-form').style.display = 'block';
        this.renderSpecialistScheduleGrid();
    }

    hideSpecialistScheduleForm() {
        document.getElementById('specialist-schedule-form').style.display = 'none';
    }

    renderSpecialistScheduleGrid() {
        const container = document.getElementById('specialist-schedule-grid-body');
        container.innerHTML = '';

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const dayNames = ['월', '화', '수', '목', '금'];

        this.timeSlots.forEach(time => {
            // 시간 셀
            const timeCell = document.createElement('div');
            timeCell.className = 'schedule-cell time-cell';
            timeCell.textContent = time;
            container.appendChild(timeCell);

            // 각 요일별 셀
            days.forEach((day, dayIndex) => {
                const cell = document.createElement('div');
                cell.className = 'schedule-cell specialist-cell';
                cell.dataset.day = day;
                cell.dataset.time = time;

                // 스케줄 데이터 안전하게 가져오기
                const schedule = this.currentSpecialist.schedule?.[day]?.[time];
                this.updateSpecialistScheduleCell(cell, schedule, dayNames[dayIndex]);

                // 클릭 이벤트 (입력 필드가 아닌 경우에만)
                cell.addEventListener('click', (e) => {
                    // 입력 필드나 그 자식 요소를 클릭한 경우 토글하지 않음
                    if (e.target.classList.contains('class-input') || 
                        e.target.closest('.class-input-container') ||
                        e.target.closest('.specialist-classes')) {
                        return;
                    }
                    this.toggleSpecialistScheduleCell(cell);
                });

                container.appendChild(cell);
            });
        });
    }

    updateSpecialistScheduleCell(cell, schedule, dayName) {
        // schedule이 undefined인 경우 기본값 설정
        if (!schedule) {
            schedule = { type: '보결가능', classes: [] };
        }
        
        const { type, classes = [] } = schedule;
        
        // 기존 클래스 제거
        cell.classList.remove('available', 'teaching', 'unavailable', 'selected');
        
        // 상태에 따른 클래스 추가
        if (type === '전담수업') {
            cell.classList.add('teaching');
            cell.innerHTML = `
                <div class="specialist-classes">
                    <div class="class-input-container">
                        <input type="text" value="${classes.join(', ') || ''}" placeholder="학급 입력 (예: 1-1, 1-2, 1-3)" class="class-input">
                    </div>
                </div>
            `;
            
            // 입력 필드에 이벤트 리스너 추가
            const input = cell.querySelector('.class-input');
            if (input) {
                input.addEventListener('click', (e) => {
                    e.stopPropagation(); // 이벤트 전파 방지
                });
                input.addEventListener('focus', (e) => {
                    e.stopPropagation();
                });
            }
        } else if (type === '보결가능') {
            cell.classList.add('available');
            cell.innerHTML = '<span>보결가능</span>';
        } else {
            cell.classList.add('unavailable');
            cell.innerHTML = '<span>보결불가</span>';
        }
    }

    toggleSpecialistScheduleCell(cell) {
        const day = cell.dataset.day;
        const time = cell.dataset.time;
        
        // 스케줄 데이터 안전하게 초기화
        if (!this.currentSpecialist.schedule) {
            this.currentSpecialist.schedule = {};
        }
        if (!this.currentSpecialist.schedule[day]) {
            this.currentSpecialist.schedule[day] = {};
        }
        if (!this.currentSpecialist.schedule[day][time]) {
            this.currentSpecialist.schedule[day][time] = { type: '보결가능', classes: [] };
        }
        
        const schedule = this.currentSpecialist.schedule[day][time];

        // 상태 토글: 보결가능 → 전담수업 → 보결불가 → 보결가능
        if (schedule.type === '보결가능') {
            schedule.type = '전담수업';
            schedule.classes = [];
        } else if (schedule.type === '전담수업') {
            schedule.type = '보결불가';
            schedule.classes = [];
        } else {
            schedule.type = '보결가능';
            schedule.classes = [];
        }

        this.updateSpecialistScheduleCell(cell, schedule, '');
        
        // 시각적 피드백
        cell.classList.add('selected');
        setTimeout(() => {
            cell.classList.remove('selected');
        }, 200);
    }

    saveSpecialistSchedule() {
        if (!this.currentSpecialist) return;

        try {
            // 입력된 학급 정보 저장
            const cells = document.querySelectorAll('.specialist-cell[data-day][data-time]');
            cells.forEach(cell => {
                const day = cell.dataset.day;
                const time = cell.dataset.time;
                const input = cell.querySelector('.class-input');
                
                if (input && this.currentSpecialist.schedule[day] && this.currentSpecialist.schedule[day][time]) {
                    // 클래스 정보를 배열로 저장
                    const classText = input.value.trim();
                    this.currentSpecialist.schedule[day][time].classes = classText ? 
                        classText.split(',').map(c => c.trim()).filter(c => c) : [];
                }
            });

            // 데이터 저장
            dataManager.updateTeacher(this.currentSpecialist.id, {
                schedule: this.currentSpecialist.schedule
            });

            Utils.showNotification('교과전담교사 스케줄이 저장되었습니다.', 'success');
            this.hideSpecialistScheduleForm();
            
            // 담임교사 보결 가능 시간 자동 업데이트
            this.updateClassTeacherAvailability();
        } catch (error) {
            console.error('Error saving specialist schedule:', error);
            Utils.showNotification('스케줄 저장에 실패했습니다.', 'error');
        }
    }

    // 담임교사 보결 가능 시간 자동 업데이트
    updateClassTeacherAvailability() {
        const classTeachers = dataManager.getTeachersByType('담임교사');
        const specialists = dataManager.getTeachersByType('교과전담교사');
        
        classTeachers.forEach(classTeacher => {
            const grade = classTeacher.grade;
            const classNum = classTeacher.class;
            const targetClass = `${grade.charAt(0)}-${classNum.charAt(0)}`;
            
            // 모든 요일과 시간에 대해 확인
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const timeSlots = [
                '09:00-09:40', '10:00-10:40', '11:00-11:40', '12:00-12:40',
                '13:00-13:40', '14:00-14:40', '15:00-15:40'
            ];
            
            days.forEach(day => {
                timeSlots.forEach(time => {
                    // 해당 시간에 교과전담교사가 해당 학급에 수업하는지 확인
                    const hasSpecialistClass = specialists.some(specialist => {
                        const schedule = specialist.schedule[day][time];
                        return schedule && schedule.type === '전담수업' && 
                               schedule.target && schedule.target.includes(targetClass);
                    });
                    
                    // 교과전담교사가 수업 중이면 담임교사는 보결 가능
                    if (hasSpecialistClass) {
                        classTeacher.schedule[day][time] = {
                            type: '보결가능',
                            target: null,
                            available: true
                        };
                    } else {
                        // 교과전담교사가 수업하지 않으면 담임교사는 수업 중
                        classTeacher.schedule[day][time] = {
                            type: '담임수업',
                            target: targetClass,
                            available: false
                        };
                    }
                });
            });
            
            // 담임교사 스케줄 저장
            dataManager.updateTeacher(classTeacher.id, {
                schedule: classTeacher.schedule
            });
        });
        
        Utils.showNotification('담임교사 보결 가능 시간이 자동으로 업데이트되었습니다.', 'success');
    }

    // 특정 시간대 보결 가능 담임교사 조회
    getAvailableClassTeachers(day, time, targetClass) {
        const classTeachers = dataManager.getTeachersByType('담임교사');
        return classTeachers.filter(teacher => {
            const schedule = teacher.schedule[day][time];
            return schedule && schedule.available;
        });
    }
}

// 전역 교과전담교사 스케줄 매니저 인스턴스
let specialistScheduleManager;
