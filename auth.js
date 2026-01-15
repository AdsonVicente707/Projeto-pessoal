export const userInfo = JSON.parse(localStorage.getItem('userInfo'));

export function checkAuth() {
    if (!userInfo || !userInfo.token) {
        localStorage.removeItem('userInfo');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

export const currentUser = userInfo ? {
    name: userInfo.name,
    avatar: userInfo.avatar || 'https://i.pravatar.cc/40?img=0',
    avatarPosX: userInfo.avatarPosX || 50,
    avatarPosY: userInfo.avatarPosY || 50,
    bannerUrl: userInfo.bannerUrl,
    _id: userInfo._id,
    role: userInfo.role || 'user'  // CRITICAL: Include role for admin access
} : null;

export function logout() {
    localStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}