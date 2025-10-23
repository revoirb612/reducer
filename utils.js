// 유틸리티 함수들
class Utils {
    // 날짜 포맷팅
    static formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // 시간 포맷팅
    static formatTime(time) {
        return time;
    }

    // 날짜와 시간을 합쳐서 포맷팅
    static formatDateTime(date, time) {
        return `${this.formatDate(date)} ${time}`;
    }

    // 현재 날짜 가져오기
    static getCurrentDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    // 현재 시간 가져오기
    static getCurrentTime() {
        const now = new Date();
        return now.toTimeString().split(' ')[0].substring(0, 5);
    }

    // 날짜 유효성 검사
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // 이메일 유효성 검사
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 전화번호 유효성 검사
    static isValidPhone(phone) {
        const phoneRegex = /^[0-9-+\s()]+$/;
        return phoneRegex.test(phone) && phone.length >= 10;
    }

    // 문자열 정리 (공백 제거, 소문자 변환)
    static cleanString(str) {
        return str.trim().toLowerCase();
    }

    // 배열에서 중복 제거
    static removeDuplicates(array) {
        return [...new Set(array)];
    }

    // 객체 배열에서 특정 속성으로 중복 제거
    static removeDuplicatesByProperty(array, property) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[property];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }

    // 배열 정렬 (문자열)
    static sortByString(array, property, ascending = true) {
        return array.sort((a, b) => {
            const aVal = a[property].toLowerCase();
            const bVal = b[property].toLowerCase();
            return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }

    // 배열 정렬 (숫자)
    static sortByNumber(array, property, ascending = true) {
        return array.sort((a, b) => {
            return ascending ? a[property] - b[property] : b[property] - a[property];
        });
    }

    // 배열 정렬 (날짜)
    static sortByDate(array, property, ascending = true) {
        return array.sort((a, b) => {
            const aDate = new Date(a[property]);
            const bDate = new Date(b[property]);
            return ascending ? aDate - bDate : bDate - aDate;
        });
    }

    // 페이지네이션
    static paginate(array, page, pageSize) {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return {
            data: array.slice(startIndex, endIndex),
            total: array.length,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(array.length / pageSize)
        };
    }

    // 검색 (부분 일치)
    static search(array, query, properties) {
        if (!query) return array;
        
        const lowerQuery = query.toLowerCase();
        return array.filter(item => {
            return properties.some(prop => {
                const value = item[prop];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(lowerQuery);
                }
                return false;
            });
        });
    }

    // 필터링
    static filter(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (filterValue === null || filterValue === undefined || filterValue === '') {
                    return true;
                }
                
                if (typeof filterValue === 'string') {
                    return itemValue && itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                }
                
                return itemValue === filterValue;
            });
        });
    }

    // 통계 계산
    static calculateStats(array, property) {
        const values = array.map(item => item[property]).filter(val => typeof val === 'number');
        
        if (values.length === 0) {
            return { min: 0, max: 0, avg: 0, sum: 0, count: 0 };
        }
        
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return { min, max, avg, sum, count: values.length };
    }

    // 색상 생성 (교사 유형별)
    static getTypeColor(type) {
        const colors = {
            '담임교사': '#1976d2',
            '교과전담교사': '#7b1fa2'
        };
        return colors[type] || '#666';
    }

    // 아이콘 생성 (교사 유형별)
    static getTypeIcon(type) {
        const icons = {
            '담임교사': '👨‍🏫',
            '교과전담교사': '🎯'
        };
        return icons[type] || '👤';
    }

    // 알림 표시
    static showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification alert alert-${type}`;
        notification.textContent = message;
        
        // 스타일 적용
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // 확인 대화상자
    static async confirm(message) {
        return new Promise((resolve) => {
            const result = window.confirm(message);
            resolve(result);
        });
    }

    // 로딩 표시
    static showLoading(container) {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<div class="spinner"></div>';
        container.appendChild(loading);
    }

    // 로딩 숨기기
    static hideLoading(container) {
        const loading = container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }

    // 폼 데이터 수집
    static collectFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    // 폼 초기화
    static resetForm(form) {
        form.reset();
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.classList.remove('error');
        });
    }

    // 입력 유효성 검사
    static validateInput(input, rules) {
        const value = input.value.trim();
        const errors = [];
        
        if (rules.required && !value) {
            errors.push('필수 입력 항목입니다.');
        }
        
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`최소 ${rules.minLength}자 이상 입력해주세요.`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`최대 ${rules.maxLength}자까지 입력 가능합니다.`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push('올바른 형식이 아닙니다.');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // CSV 데이터 생성
    static generateCSV(data, headers) {
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => `"${row[header] || ''}"`).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }

    // CSV 다운로드
    static downloadCSV(data, headers, filename) {
        const csv = this.generateCSV(data, headers);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 기존 교사 데이터 기반 학년 옵션 생성
    static generateGradeOptions() {
        const teachers = dataManager.getAllTeachers();
        const existingGrades = [...new Set(teachers
            .filter(t => t.type === '담임교사' && t.grade)
            .map(t => t.grade)
        )];
        
        // 학년 순서대로 정렬 (1학년, 2학년, ...)
        return existingGrades.sort((a, b) => {
            const aNum = parseInt(a.replace('학년', ''));
            const bNum = parseInt(b.replace('학년', ''));
            return aNum - bNum;
        });
    }

    // 기존 교사 데이터 기반 반 옵션 생성
    static generateClassOptions() {
        const teachers = dataManager.getAllTeachers();
        const existingClasses = [...new Set(teachers
            .filter(t => t.type === '담임교사' && t.class)
            .map(t => t.class)
        )];
        
        // 반 순서대로 정렬 (1반, 2반, ...)
        return existingClasses.sort((a, b) => {
            const aNum = parseInt(a.replace('반', ''));
            const bNum = parseInt(b.replace('반', ''));
            return aNum - bNum;
        });
    }

    // select 요소에 옵션 동적 생성
    static populateSelectOptions(selectId, options, placeholder = '선택하세요') {
        const select = document.getElementById(selectId);
        if (!select) return;

        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // 새 옵션 추가
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }

    // 교사 등록 폼의 학년/반 옵션 업데이트
    static updateTeacherFormOptions() {
        const grades = this.generateGradeOptions();
        const classes = this.generateClassOptions();
        
        this.populateSelectOptions('teacher-grade', grades, '선택하세요');
        this.populateSelectOptions('teacher-class', classes, '선택하세요');
    }

    // 보결 요청 폼의 학년/반 옵션 업데이트
    static updateSubstituteFormOptions() {
        const grades = this.generateGradeOptions();
        const classes = this.generateClassOptions();
        
        this.populateSelectOptions('request-grade', grades, '학년 선택');
        this.populateSelectOptions('request-class', classes, '반 선택');
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
