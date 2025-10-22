// 교과전담교사 중심 스케줄 관리 모듈
class SpecialistScheduleManager {
    constructor() {
        this.currentSpecialist = null;
        this.timeSlots = this.loadTimeSlots();
        this.contextMenu = null;
        this.contextMenuTarget = null;
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
        this.initContextMenu();
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

                // 클릭 이벤트 (컨텍스트 메뉴 표시)
                cell.addEventListener('click', (e) => {
                    // 입력 필드나 그 자식 요소를 클릭한 경우 메뉴를 표시하지 않음
                    if (e.target.classList.contains('class-input') || 
                        e.target.closest('.class-input-container') ||
                        e.target.closest('.specialist-classes')) {
                        return;
                    }
                    this.showContextMenu(e, cell);
                });

                // 우클릭 이벤트 (컨텍스트 메뉴)
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, cell);
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
                input.addEventListener('input', (e) => {
                    e.stopPropagation();
                    // 학급 입력이 변경될 때마다 담임교사 보결 가능 시간 업데이트
                    this.updateClassTeacherAvailability();
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
            
            // 동적으로 시간대 가져오기
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const timeSlots = dataManager.getTimeSlots();
            
            days.forEach(day => {
                timeSlots.forEach(time => {
                    // 해당 시간에 교과전담교사가 해당 학급에 수업하는지 확인
                    const hasSpecialistClass = specialists.some(specialist => {
                        const schedule = specialist.schedule?.[day]?.[time];
                        return schedule && schedule.type === '전담수업' && 
                               schedule.classes && schedule.classes.includes(targetClass);
                    });
                    
                    // 교과전담교사가 수업 중이면 담임교사는 보결 가능
                    if (hasSpecialistClass) {
                        classTeacher.schedule[day][time] = {
                            type: '보결가능',
                            target: null,
                            available: true
                        };
                    } else {
                        // 교과전담교사가 수업하지 않으면 담임교사는 담임수업 중
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

    // 컨텍스트 메뉴 초기화
    initContextMenu() {
        this.contextMenu = document.getElementById('schedule-context-menu');
        if (!this.contextMenu) return;

        // 컨텍스트 메뉴 아이템 클릭 이벤트
        this.contextMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (menuItem && this.contextMenuTarget) {
                const action = menuItem.dataset.action;
                this.handleContextMenuAction(action, this.contextMenuTarget);
                this.hideContextMenu();
            }
        });

        // 문서 클릭 시 컨텍스트 메뉴 숨기기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.specialist-cell')) {
                this.hideContextMenu();
            }
        });

        // ESC 키로 컨텍스트 메뉴 숨기기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContextMenu();
            }
        });
    }

    // 컨텍스트 메뉴 표시
    showContextMenu(event, cell) {
        if (!this.contextMenu) return;

        // 기존 컨텍스트 메뉴가 있다면 숨기기
        this.hideContextMenu();

        // 타겟 셀 저장
        this.contextMenuTarget = cell;

        // 셀에 활성화 스타일 추가
        cell.classList.add('context-menu-active');

        // 메뉴를 먼저 표시하여 크기를 계산할 수 있도록 함
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.visibility = 'hidden';

        // 메뉴 위치 계산
        const rect = cell.getBoundingClientRect();
        const menuRect = this.contextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // 기본 위치: 셀의 오른쪽 아래
        let left = rect.right + 10;
        let top = rect.top + scrollTop;

        // 화면 경계 확인 및 조정
        if (left + menuRect.width > viewportWidth + scrollLeft - 10) {
            // 오른쪽에 공간이 없으면 왼쪽에 표시
            left = rect.left - menuRect.width - 10;
        }
        
        if (left < scrollLeft + 10) {
            // 왼쪽에도 공간이 없으면 셀 중앙에 표시
            left = rect.left + rect.width / 2 - menuRect.width / 2;
        }

        if (top + menuRect.height > viewportHeight + scrollTop - 10) {
            // 아래쪽에 공간이 없으면 위쪽에 표시
            top = rect.bottom - menuRect.height + scrollTop - 10;
        }

        // 최종 위치 조정
        left = Math.max(scrollLeft + 10, Math.min(left, viewportWidth + scrollLeft - menuRect.width - 10));
        top = Math.max(scrollTop + 10, Math.min(top, viewportHeight + scrollTop - menuRect.height - 10));

        // 메뉴 위치 설정
        this.contextMenu.style.left = `${left}px`;
        this.contextMenu.style.top = `${top}px`;
        this.contextMenu.style.visibility = 'visible';

        // 현재 상태에 따라 메뉴 아이템 활성화/비활성화
        this.updateContextMenuItems(cell);
    }

    // 컨텍스트 메뉴 숨기기
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
        if (this.contextMenuTarget) {
            this.contextMenuTarget.classList.remove('context-menu-active');
            this.contextMenuTarget = null;
        }
    }

    // 컨텍스트 메뉴 아이템 상태 업데이트
    updateContextMenuItems(cell) {
        const day = cell.dataset.day;
        const time = cell.dataset.time;
        const schedule = this.currentSpecialist.schedule?.[day]?.[time];
        const currentType = schedule?.type || '보결가능';

        // 모든 메뉴 아이템 활성화
        this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';
        });

        // 현재 상태 표시 (선택된 상태로 표시)
        const currentItem = this.contextMenu.querySelector(`[data-action="${this.getActionFromType(currentType)}"]`);
        if (currentItem) {
            currentItem.style.background = '#e3f2fd';
            currentItem.style.color = '#1976d2';
        }
    }

    // 상태 타입을 액션으로 변환
    getActionFromType(type) {
        switch (type) {
            case '보결가능': return 'available';
            case '전담수업': return 'teaching';
            case '보결불가': return 'unavailable';
            default: return 'available';
        }
    }

    // 컨텍스트 메뉴 액션 처리
    handleContextMenuAction(action, cell) {
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

        // 액션에 따른 상태 설정
        switch (action) {
            case 'available':
                schedule.type = '보결가능';
                schedule.classes = [];
                break;
            case 'teaching':
                schedule.type = '전담수업';
                schedule.classes = [];
                break;
            case 'unavailable':
                schedule.type = '보결불가';
                schedule.classes = [];
                break;
        }

        // 셀 업데이트
        this.updateSpecialistScheduleCell(cell, schedule, '');
        
        // 전담수업 선택 시 입력 필드에 자동 포커스
        if (action === 'teaching') {
            setTimeout(() => {
                const input = cell.querySelector('.class-input');
                if (input) {
                    input.focus();
                    input.select(); // 기존 텍스트가 있다면 선택
                }
            }, 100);
        }
        
        // 시각적 피드백
        cell.classList.add('selected');
        setTimeout(() => {
            cell.classList.remove('selected');
        }, 200);
        
        // 교과전담교사 스케줄 변경 시 담임교사 보결 가능 시간 자동 업데이트
        this.updateClassTeacherAvailability();
    }
}

// 전역 교과전담교사 스케줄 매니저 인스턴스
let specialistScheduleManager;
