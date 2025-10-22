// 시간대 설정 관리 모듈
class TimeSlotsManager {
    constructor() {
        this.defaultTimeSlots = [
            '09:00-09:40', '09:50-10:30', '10:40-11:20', 
            '11:30-12:10', '12:20-13:00', '14:00-14:40'
        ];
        this.currentTimeSlots = this.loadTimeSlots();
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 시간대 설정 버튼
        const editTimeSlotsBtn = document.getElementById('edit-time-slots-btn');
        if (editTimeSlotsBtn) {
            editTimeSlotsBtn.addEventListener('click', () => {
                this.showTimeSlotsModal();
            });
        }

        // 모달 닫기
        const closeModal = document.getElementById('close-time-slots-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideTimeSlotsModal();
            });
        }

        // 시간대 추가
        const addTimeSlotBtn = document.getElementById('add-time-slot-btn');
        if (addTimeSlotBtn) {
            addTimeSlotBtn.addEventListener('click', () => {
                this.addTimeSlot();
            });
        }

        // 시간대 삭제
        const removeTimeSlotBtn = document.getElementById('remove-time-slot-btn');
        if (removeTimeSlotBtn) {
            removeTimeSlotBtn.addEventListener('click', () => {
                this.removeTimeSlot();
            });
        }

        // 저장
        const saveTimeSlotsBtn = document.getElementById('save-time-slots-btn');
        if (saveTimeSlotsBtn) {
            saveTimeSlotsBtn.addEventListener('click', () => {
                this.saveTimeSlots();
            });
        }

        // 취소
        const cancelTimeSlotsBtn = document.getElementById('cancel-time-slots-btn');
        if (cancelTimeSlotsBtn) {
            cancelTimeSlotsBtn.addEventListener('click', () => {
                this.hideTimeSlotsModal();
            });
        }

        // 모달 외부 클릭 시 닫기
        const modal = document.getElementById('time-slots-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideTimeSlotsModal();
                }
            });
        }
    }

    loadTimeSlots() {
        const stored = localStorage.getItem('timeSlots');
        return stored ? JSON.parse(stored) : [...this.defaultTimeSlots];
    }

    saveTimeSlots() {
        localStorage.setItem('timeSlots', JSON.stringify(this.currentTimeSlots));
        this.hideTimeSlotsModal();
        
        // 모든 스케줄 매니저에 시간대 업데이트 알림
        this.updateAllScheduleManagers();
        
        Utils.showNotification('시간대가 저장되었습니다.', 'success');
    }

    updateAllScheduleManagers() {
        // 스케줄 매니저들에 시간대 업데이트 알림
        if (typeof scheduleManager !== 'undefined' && scheduleManager) {
            scheduleManager.updateTimeSlots(this.currentTimeSlots);
        }
        if (typeof specialistScheduleManager !== 'undefined' && specialistScheduleManager) {
            specialistScheduleManager.updateTimeSlots(this.currentTimeSlots);
        }
    }

    showTimeSlotsModal() {
        const modal = document.getElementById('time-slots-modal');
        if (modal) {
            modal.style.display = 'block';
            this.renderTimeSlots();
        }
    }

    hideTimeSlotsModal() {
        const modal = document.getElementById('time-slots-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    renderTimeSlots() {
        const container = document.getElementById('time-slots-container');
        if (!container) return;

        container.innerHTML = '';

        this.currentTimeSlots.forEach((timeSlot, index) => {
            const timeSlotItem = document.createElement('div');
            timeSlotItem.className = 'time-slot-item';
            timeSlotItem.innerHTML = `
                <span class="time-slot-label">${index + 1}교시:</span>
                <input type="text" value="${timeSlot}" placeholder="예: 09:00-09:40" class="time-slot-input" data-index="${index}">
                <span class="time-slot-format">(시작시간-종료시간)</span>
            `;
            container.appendChild(timeSlotItem);
        });
    }

    addTimeSlot() {
        const newTimeSlot = '00:00-00:00';
        this.currentTimeSlots.push(newTimeSlot);
        this.renderTimeSlots();
    }

    removeTimeSlot() {
        if (this.currentTimeSlots.length > 1) {
            this.currentTimeSlots.pop();
            this.renderTimeSlots();
        } else {
            Utils.showNotification('최소 1개의 시간대는 유지해야 합니다.', 'error');
        }
    }

    saveTimeSlots() {
        // 입력된 시간대 수집
        const inputs = document.querySelectorAll('.time-slot-input');
        const newTimeSlots = [];
        
        let isValid = true;
        inputs.forEach((input, index) => {
            const value = input.value.trim();
            if (value) {
                // 시간 형식 검증
                if (this.validateTimeFormat(value)) {
                    newTimeSlots.push(value);
                } else {
                    this.showInputError(input, '올바른 시간 형식이 아닙니다. (예: 09:00-09:40)');
                    isValid = false;
                }
            } else {
                this.showInputError(input, '시간을 입력해주세요.');
                isValid = false;
            }
        });

        if (isValid) {
            this.currentTimeSlots = newTimeSlots;
            localStorage.setItem('timeSlots', JSON.stringify(this.currentTimeSlots));
            this.hideTimeSlotsModal();
            
            // 모든 스케줄 매니저에 시간대 업데이트 알림
            this.updateAllScheduleManagers();
            
            Utils.showNotification('시간대가 저장되었습니다.', 'success');
        }
    }

    validateTimeFormat(timeString) {
        // HH:MM-HH:MM 형식 검증
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }

    showInputError(input, message) {
        input.classList.add('error');
        
        // 기존 에러 메시지 제거
        const existingError = input.parentNode.querySelector('.error-message');
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
        input.parentNode.appendChild(errorDiv);
    }

    getCurrentTimeSlots() {
        return this.currentTimeSlots;
    }

    resetToDefault() {
        this.currentTimeSlots = [...this.defaultTimeSlots];
        localStorage.setItem('timeSlots', JSON.stringify(this.currentTimeSlots));
        this.updateAllScheduleManagers();
        Utils.showNotification('시간대가 기본값으로 초기화되었습니다.', 'success');
    }
}

// 전역 시간대 매니저 인스턴스
let timeSlotsManager;
