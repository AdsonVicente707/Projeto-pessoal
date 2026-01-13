export const API_URL = 'http://localhost:5000/api';

export function getAuthHeaders() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo ? userInfo.token : ''}`
    };
}

export function getUploadHeaders() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return {
        'Authorization': `Bearer ${userInfo ? userInfo.token : ''}`
    };
}

export function handleApiError(response) {
    if (response.status === 401) {
        localStorage.removeItem('userInfo');
        window.location.href = 'login.html';
        throw new Error('Sessão expirada');
    }
    return response;
}