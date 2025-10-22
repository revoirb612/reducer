// 스케줄 관리 모듈
class ScheduleManager {
    constructor() {
        this.currentTeacher = null;
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.timeSlots = this.loadTimeSlots();
        this.days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        this.dayNames = ['월', '화', '수', '목', '금'];
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
        if (this.currentTeacher) {
            this.renderScheduleGrid();
        }
        this.updateCalendar();
    }

    init() {
        this.bindEvents();
        this.loadTeachers();
        this.updateCalendar();
    }

    bindEvents() {
        // 교사 선택
        document.getElementById('schedule-teacher-select').addEventListener('change', (e) => {
            this.selectTeacher(e.target.value);
        });

        // 스케줄 수정 버튼
        document.getElementById('edit-schedule-btn').addEventListener('click', () => {
            this.showScheduleEditForm();
        });

        // 스케줄 저장
        document.getElementById('save-schedule-btn').addEventListener('click', () => {
            this.saveSchedule();
        });

        // 스케줄 취소
        document.getElementById('cancel-schedule-btn').addEventListener('click', () => {
            this.hideScheduleEditForm();
        });

        // 캘린더 네비게이션
        document.getElementById('prev-month-btn').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('next-month-btn').addEventListener('click', () => {
            this.nextMonth();
        });
    }

    loadTeachers() {
        const teachers = dataManager.getAllTeachers();
        const select = document.getElementById('schedule-teacher-select');
        
        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // 교사 옵션 추가
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} (${teacher.type})`;
            select.appendChild(option);
        });
    }

    selectTeacher(teacherId) {
        if (!teacherId) {
            this.currentTeacher = null;
            this.hideTeacherInfo();
            this.hideScheduleEditForm();
            document.getElementById('edit-schedule-btn').disabled = true;
            return;
        }

        this.currentTeacher = dataManager.getTeacher(teacherId);
        if (this.currentTeacher) {
            this.showTeacherInfo();
            document.getElementById('edit-schedule-btn').disabled = false;
        }
    }

    showTeacherInfo() {
        const teacher = this.currentTeacher;
        if (!teacher) return;

        document.getElementById('selected-teacher-name').textContent = teacher.name;
        document.getElementById('selected-teacher-type').textContent = teacher.type;
        document.getElementById('selected-teacher-type').className = `teacher-type-badge ${teacher.type}`;
        
        const gradeClass = teacher.class ? `${teacher.grade} ${teacher.class}` : teacher.grade;
        document.getElementById('selected-teacher-grade-class').textContent = gradeClass;

        if (teacher.subject) {
            document.getElementById('selected-teacher-subject').textContent = teacher.subject;
            document.getElementById('selected-teacher-subject-item').style.display = 'block';
        } else {
            document.getElementById('selected-teacher-subject-item').style.display = 'none';
        }

        document.getElementById('schedule-teacher-info').style.display = 'block';
    }

    hideTeacherInfo() {
        document.getElementById('schedule-teacher-info').style.display = 'none';
    }

    showScheduleEditForm() {
        if (!this.currentTeacher) return;

        document.getElementById('schedule-edit-form').style.display = 'block';
        this.renderScheduleGrid();
    }

    hideScheduleEditForm() {
        document.getElementById('schedule-edit-form').style.display = 'none';
    }

    renderScheduleGrid() {
        const container = document.getElementById('schedule-grid-body');
        container.innerHTML = '';

        this.timeSlots.forEach(time => {
            // 시간 셀
            const timeCell = document.createElement('div');
            timeCell.className = 'schedule-cell time-cell';
            timeCell.textContent = time;
            container.appendChild(timeCell);

            // 각 요일별 셀
            this.days.forEach(day => {
                const cell = document.createElement('div');
                cell.className = 'schedule-cell';
                cell.dataset.day = day;
                cell.dataset.time = time;

                const schedule = this.currentTeacher.schedule[day][time];
                this.updateScheduleCell(cell, schedule);

                // 클릭 이벤트
                cell.addEventListener('click', () => {
                    this.toggleScheduleCell(cell);
                });

                container.appendChild(cell);
            });
        });
    }

    updateScheduleCell(cell, schedule) {
        const { type, target, available } = schedule;
        
        // 기존 클래스 제거
        cell.classList.remove('available', 'teaching', 'unavailable', 'selected');
        
        // 상태에 따른 클래스 추가
        if (available) {
            cell.classList.add('available');
        } else if (type === '담임수업' || type === '전담수업') {
            cell.classList.add('teaching');
        } else {
            cell.classList.add('unavailable');
        }

        // 내용 설정
        if (type === '담임수업' || type === '전담수업') {
            cell.innerHTML = `<input type="text" value="${target || ''}" placeholder="학급 입력">`;
        } else if (type === '보결가능') {
            cell.innerHTML = '<span>보결가능</span>';
        } else {
            cell.innerHTML = '<span>보결불가</span>';
        }
    }

    toggleScheduleCell(cell) {
        const day = cell.dataset.day;
        const time = cell.dataset.time;
        const schedule = this.currentTeacher.schedule[day][time];

        // 상태 토글
        if (schedule.available) {
            // 보결 가능 → 수업 중
            schedule.available = false;
            schedule.type = '담임수업';
            schedule.target = '';
        } else if (schedule.type === '담임수업' || schedule.type === '전담수업') {
            // 수업 중 → 보결 불가
            schedule.available = false;
            schedule.type = '보결불가';
            schedule.target = null;
        } else {
            // 보결 불가 → 보결 가능
            schedule.available = true;
            schedule.type = '보결가능';
            schedule.target = null;
        }

        this.updateScheduleCell(cell, schedule);
    }

    saveSchedule() {
        if (!this.currentTeacher) return;

        try {
            // 입력된 학급 정보 저장
            const cells = document.querySelectorAll('.schedule-cell[data-day][data-time]');
            cells.forEach(cell => {
                const day = cell.dataset.day;
                const time = cell.dataset.time;
                const input = cell.querySelector('input');
                
                if (input) {
                    this.currentTeacher.schedule[day][time].target = input.value;
                }
            });

            // 데이터 저장
            dataManager.updateTeacher(this.currentTeacher.id, {
                schedule: this.currentTeacher.schedule
            });

            Utils.showNotification('스케줄이 저장되었습니다.', 'success');
            this.hideScheduleEditForm();
            this.updateCalendar();
        } catch (error) {
            console.error('Error saving schedule:', error);
            Utils.showNotification('스케줄 저장에 실패했습니다.', 'error');
        }
    }

    updateCalendar() {
        this.renderCalendar();
    }

    renderCalendar() {
        const container = document.getElementById('calendar-grid');
        const monthYear = document.getElementById('calendar-month-year');
        
        // 월/년 표시
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                           '7월', '8월', '9월', '10월', '11월', '12월'];
        monthYear.textContent = `${this.currentYear}년 ${monthNames[this.currentMonth]}`;

        // 캘린더 그리드 생성
        container.innerHTML = '';

        // 요일 헤더
        const dayHeaders = ['일', '월', '화', '수', '목', '금', '토'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            header.style.cssText = `
                background: #f8f9fa;
                padding: 0.5rem;
                text-align: center;
                font-weight: 600;
                border: 1px solid #e0e0e0;
            `;
            container.appendChild(header);
        });

        // 날짜 생성
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        const isCurrentMonth = this.currentMonth === today.getMonth() && 
                              this.currentYear === today.getFullYear();

        // 6주 표시
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + (week * 7) + day);

                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                
                if (date.getMonth() !== this.currentMonth) {
                    dayElement.classList.add('other-month');
                }
                
                if (isCurrentMonth && date.getDate() === today.getDate()) {
                    dayElement.classList.add('today');
                }

                dayElement.innerHTML = `
                    <div class="calendar-day-number">${date.getDate()}</div>
                    <div class="calendar-day-events">
                        ${this.getDayEvents(date)}
                    </div>
                `;

                container.appendChild(dayElement);
            }
        }
    }

    getDayEvents(date) {
        if (!this.currentTeacher) return '';

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getDay()];
        
        if (dayName === 'sunday' || dayName === 'saturday') {
            return '';
        }

        const daySchedule = this.currentTeacher.schedule[dayName];
        if (!daySchedule) return '';

        let eventCount = 0;
        let availableCount = 0;

        this.timeSlots.forEach(time => {
            const schedule = daySchedule[time];
            if (schedule) {
                if (schedule.type === '담임수업' || schedule.type === '전담수업') {
                    eventCount++;
                } else if (schedule.available) {
                    availableCount++;
                }
            }
        });

        if (eventCount > 0) {
            return `<div class="event-count">${eventCount}</div>`;
        } else if (availableCount > 0) {
            return '<div style="color: #28a745;">보결가능</div>';
        }

        return '';
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateCalendar();
    }

    // 교사 스케줄 조회
    getTeacherSchedule(teacherId) {
        const teacher = dataManager.getTeacher(teacherId);
        return teacher ? teacher.schedule : null;
    }

    // 특정 시간대 보결 가능 교사 조회
    getAvailableTeachers(day, time) {
        const teachers = dataManager.getAllTeachers();
        return teachers.filter(teacher => {
            const schedule = teacher.schedule[day][time];
            return schedule && schedule.available;
        });
    }

    // 스케줄 충돌 확인
    checkScheduleConflict(teacherId, day, time) {
        const teacher = dataManager.getTeacher(teacherId);
        if (!teacher) return false;

        const schedule = teacher.schedule[day][time];
        return schedule && !schedule.available;
    }
}

// 전역 스케줄 매니저 인스턴스
let scheduleManager;
